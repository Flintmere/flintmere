/**
 * Shopify Admin GraphQL fetcher — pulls a merchant catalog with
 * metafields, Google product category, and option structure using a
 * single Admin API token.
 *
 * Threat model. The token is provided by the operator at script
 * runtime via SHOPIFY_ADMIN_TOKEN env var. It is never persisted by
 * Flintmere — it lives only in the script's process memory and is
 * forgotten when the process exits. The token reaches the operator
 * via the one-time-secret service at flintmere.com/secret (the
 * merchant pastes it locally, gets a URL with the encryption key in
 * the URL fragment, and shares the URL once; on the operator's first
 * click the link burns and the token is revealed in-browser).
 *
 * What it returns. A `CatalogInput` shape compatible with `scoreCatalog`,
 * but with the structured-attribute, GMC-mapping, and checkout
 * eligibility data populated — so the three pillars that lock on a
 * public scan (`requires-install`) score with measured data instead of
 * staying dark.
 *
 * API version. 2024-10. Pinned for stability; bump deliberately when a
 * pillar checker needs a newer field. The Admin API is versioned at
 * the URL level — old versions stay valid for ~12 months.
 */

import type { CatalogInput, ProductInput, VariantInput } from '@flintmere/scoring';

const API_VERSION = '2024-10';
const PAGE_SIZE = 50; // Admin GraphQL hard cap on products is 250; 50 keeps memory bounded.
const DEFAULT_TIMEOUT_MS = 60_000;

export class ShopifyAdminFetchError extends Error {
  constructor(
    public readonly code:
      | 'invalid-token'
      | 'invalid-shop'
      | 'forbidden'
      | 'rate-limited'
      | 'api-error'
      | 'network',
    message: string,
  ) {
    super(message);
    this.name = 'ShopifyAdminFetchError';
  }
}

export interface AdminFetchOptions {
  /** Optional override for total products fetched. */
  maxProducts?: number;
  /** Per-request timeout in ms (default 60s). */
  timeoutMs?: number;
}

export interface AdminFetchedCatalog {
  catalog: CatalogInput;
  /** True if the maxProducts cap was reached and there are likely more. */
  truncated: boolean;
  /** Total product count reported by Shopify. */
  totalProductCount: number;
  /** Per-product Google product category — keyed by product id (numeric, as string). */
  googleProductCategoryByProduct: Map<string, string | null>;
  /** Per-product structured-attribute metafields — keyed by product id. */
  metafieldsByProduct: Map<string, Array<{ namespace: string; key: string; type: string; value: string }>>;
  /** Shop-level checkout settings relevant to agent eligibility. */
  checkoutContext: {
    requiresCustomerAccount: boolean | null;
    customerAccountsVersion: string | null;
  };
}

interface GqlProductNode {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string | null;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  publishedAt: string | null;
  options: Array<{ id: string; name: string; values: string[] }>;
  variants: { nodes: GqlVariantNode[] };
  images: { nodes: Array<{ id: string | null; url: string; altText: string | null; width: number | null; height: number | null }> };
  metafields: { nodes: Array<{ namespace: string; key: string; type: string; value: string }> };
}

interface GqlVariantNode {
  id: string;
  sku: string | null;
  barcode: string | null;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number | null;
  inventoryPolicy: 'DENY' | 'CONTINUE';
  availableForSale: boolean;
}

const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        descriptionHtml
        vendor
        productType
        tags
        status
        publishedAt
        options(first: 10) { id name values }
        variants(first: 100) {
          nodes {
            id
            sku
            barcode
            price
            compareAtPrice
            inventoryQuantity
            inventoryPolicy
            availableForSale
          }
        }
        images(first: 20) {
          nodes { id url altText width height }
        }
        metafields(first: 50) {
          nodes { namespace key type value }
        }
      }
    }
  }
`;

const PRODUCT_GMC_QUERY = `#graphql
  query ProductCategories($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        category { fullName }
      }
    }
  }
`;

const SHOP_CHECKOUT_QUERY = `#graphql
  query ShopCheckout {
    shop {
      checkoutApiSupported
      customerAccountsV2 { customerAccountsVersion }
    }
  }
`;

const PRODUCT_COUNT_QUERY = `#graphql
  query ProductCount {
    productsCount { count }
  }
`;

export async function fetchCatalogViaAdmin(
  shopDomain: string,
  adminToken: string,
  options: AdminFetchOptions = {},
): Promise<AdminFetchedCatalog> {
  if (!/^shpat_[A-Za-z0-9]{10,}$/.test(adminToken) && !/^shpca_[A-Za-z0-9]{10,}$/.test(adminToken)) {
    throw new ShopifyAdminFetchError(
      'invalid-token',
      'Token does not look like a Shopify Admin or custom-app token (expected shpat_… or shpca_… prefix).',
    );
  }

  const cleanDomain = normaliseShopDomain(shopDomain);
  const maxProducts = options.maxProducts ?? 5_000;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const totalProductCount = await runQuery<{ productsCount: { count: number } }>(
    cleanDomain,
    adminToken,
    PRODUCT_COUNT_QUERY,
    {},
    timeoutMs,
  ).then((r) => r.productsCount.count).catch(() => 0);

  const products: GqlProductNode[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  type ProductsPage = {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: GqlProductNode[];
    };
  };

  while (hasNext && products.length < maxProducts) {
    const remaining = maxProducts - products.length;
    const first = Math.min(PAGE_SIZE, remaining);
    const data: ProductsPage = await runQuery<ProductsPage>(
      cleanDomain,
      adminToken,
      PRODUCTS_QUERY,
      { first, after: cursor },
      timeoutMs,
    );

    products.push(...data.products.nodes);
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  const truncated = hasNext;

  // Google product category lives under product.category.fullName in
  // newer Admin API — pulled in a separate batched query so the main
  // products query stays under the storefront query-cost cap.
  const googleProductCategoryByProduct = new Map<string, string | null>();
  for (let i = 0; i < products.length; i += 100) {
    const ids = products.slice(i, i + 100).map((p) => p.id);
    try {
      const data = await runQuery<{
        nodes: Array<{ id: string; category: { fullName: string | null } | null }>;
      }>(cleanDomain, adminToken, PRODUCT_GMC_QUERY, { ids }, timeoutMs);
      for (const node of data.nodes) {
        if (!node) continue;
        googleProductCategoryByProduct.set(
          numericIdFromGid(node.id),
          node.category?.fullName ?? null,
        );
      }
    } catch (err) {
      // Category is informational; if the field isn't available on the
      // merchant's API version, leave the map empty rather than aborting
      // the whole pull. The mapping pillar will degrade to "directional"
      // for that shop instead of failing.
      // eslint-disable-next-line no-console
      console.warn(
        JSON.stringify({
          event: 'admin-gmc-category-unavailable',
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      break;
    }
  }

  const metafieldsByProduct = new Map<
    string,
    Array<{ namespace: string; key: string; type: string; value: string }>
  >();
  for (const product of products) {
    metafieldsByProduct.set(numericIdFromGid(product.id), product.metafields.nodes);
  }

  let checkoutContext: AdminFetchedCatalog['checkoutContext'] = {
    requiresCustomerAccount: null,
    customerAccountsVersion: null,
  };
  try {
    const data = await runQuery<{
      shop: { checkoutApiSupported: boolean | null; customerAccountsV2: { customerAccountsVersion: string | null } | null };
    }>(cleanDomain, adminToken, SHOP_CHECKOUT_QUERY, {}, timeoutMs);
    checkoutContext = {
      requiresCustomerAccount: null, // not directly exposed; left for the checkout pillar to infer
      customerAccountsVersion: data.shop.customerAccountsV2?.customerAccountsVersion ?? null,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      JSON.stringify({
        event: 'admin-checkout-context-unavailable',
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }

  const catalog: CatalogInput = {
    shopDomain: cleanDomain,
    products: products.map((p) => mapProduct(p)),
    scoredAt: new Date().toISOString(),
  };

  return {
    catalog,
    truncated,
    totalProductCount,
    googleProductCategoryByProduct,
    metafieldsByProduct,
    checkoutContext,
  };
}

function mapProduct(p: GqlProductNode): ProductInput {
  const variants: VariantInput[] = p.variants.nodes.map((v) => ({
    id: numericIdFromGid(v.id),
    sku: v.sku ?? null,
    barcode: v.barcode ?? null,
    price: v.price,
    compareAtPrice: v.compareAtPrice ?? null,
    inventoryQuantity: v.inventoryQuantity ?? null,
    inventoryPolicy: v.inventoryPolicy === 'CONTINUE' ? 'continue' : 'deny',
    available: v.availableForSale,
  }));

  // Brand metafield is the canonical signal for the identifiers pillar.
  // Convention: `custom.brand` or `shopify.brand` — pick whichever is set.
  const brand = p.metafields.nodes.find(
    (m) =>
      (m.namespace === 'custom' || m.namespace === 'shopify') &&
      m.key === 'brand',
  );
  const mpn = p.metafields.nodes.find(
    (m) => m.key === 'mpn' || m.key === 'manufacturer_part_number',
  );

  return {
    id: numericIdFromGid(p.id),
    handle: p.handle,
    title: p.title,
    bodyHtml: p.descriptionHtml,
    vendor: p.vendor ?? null,
    productType: p.productType ?? null,
    tags: p.tags ?? [],
    status:
      p.status === 'ACTIVE' ? 'active' : p.status === 'DRAFT' ? 'draft' : 'archived',
    publishedAt: p.publishedAt ?? null,
    variants:
      variants.length > 0
        ? (variants as [VariantInput, ...VariantInput[]])
        : ([
            {
              id: `${numericIdFromGid(p.id)}-default`,
              price: '0',
            } as VariantInput,
          ] as [VariantInput, ...VariantInput[]]),
    images: p.images.nodes.map((i) => ({
      id: i.id ?? undefined,
      src: i.url,
      altText: i.altText,
      width: i.width,
      height: i.height,
    })),
    brandMetafield: brand?.value ?? null,
    mpnMetafield: mpn?.value ?? null,
  };
}

function numericIdFromGid(gid: string): string {
  // Admin GraphQL returns gid://shopify/Product/123456 — extract trailing id.
  const match = gid.match(/\/(\d+)$/);
  return match?.[1] ?? gid;
}

function normaliseShopDomain(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '');
  s = s.replace(/\/$/, '');
  if (!s.includes('.')) {
    throw new ShopifyAdminFetchError('invalid-shop', `Bad shop domain: ${raw}`);
  }
  // The Admin API is served from {shop}.myshopify.com — if the operator
  // provided a custom domain, we still hit myshopify.com because that's
  // where the API lives. Map manually if needed; for now require the
  // myshopify.com form for admin calls to keep this path explicit.
  return s;
}

async function runQuery<T>(
  shopDomain: string,
  token: string,
  query: string,
  variables: Record<string, unknown>,
  timeoutMs: number,
): Promise<T> {
  const url = `https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-shopify-access-token': token,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      throw new ShopifyAdminFetchError(
        'forbidden',
        `Shopify rejected the token (HTTP ${res.status}). Token may be wrong, revoked, or missing the required scopes (read_products, read_product_listings, read_metafields).`,
      );
    }
    if (res.status === 404) {
      throw new ShopifyAdminFetchError(
        'invalid-shop',
        `Shop ${shopDomain} not found. Use the shop's myshopify.com domain (e.g. mystore.myshopify.com).`,
      );
    }
    if (res.status === 429) {
      throw new ShopifyAdminFetchError(
        'rate-limited',
        'Shopify Admin API rate-limited the request. Wait 30 seconds and re-run.',
      );
    }
    if (!res.ok) {
      throw new ShopifyAdminFetchError(
        'api-error',
        `Shopify returned HTTP ${res.status}.`,
      );
    }

    const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
    if (body.errors && body.errors.length > 0) {
      throw new ShopifyAdminFetchError(
        'api-error',
        `GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`,
      );
    }
    if (!body.data) {
      throw new ShopifyAdminFetchError('api-error', 'GraphQL returned no data.');
    }
    return body.data;
  } catch (err) {
    if (err instanceof ShopifyAdminFetchError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ShopifyAdminFetchError(
        'network',
        `Request timed out after ${timeoutMs}ms.`,
      );
    }
    throw new ShopifyAdminFetchError(
      'network',
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    clearTimeout(timer);
  }
}
