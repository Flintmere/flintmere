import type { CatalogInput, ProductInput } from '@flintmere/scoring';
import { assertPublicHost, isPrivateHostLiteral, SsrfBlockedError } from './ssrf';

/**
 * Fetches and normalises a public Shopify store's catalog from /products.json.
 * Returns the catalog shape packages/scoring consumes.
 *
 * Hard ceiling: 55 seconds. The public promise is "60 seconds to a score."
 */

export class ShopifyFetchError extends Error {
  constructor(
    public readonly code:
      | 'invalid-url'
      | 'unreachable'
      | 'not-shopify'
      | 'timeout'
      | 'empty-catalog'
      | 'fetch-failed',
    message: string,
  ) {
    super(message);
    this.name = 'ShopifyFetchError';
  }
}

export interface FetchOptions {
  /** Hard timeout for the whole fetch pipeline. Default 55s. */
  timeoutMs?: number;
  /** Max product pages to request. Each page returns up to 250. Default 4 (1,000 products). */
  maxPages?: number;
  /** Sampling fraction when catalog is large (0..1). Default 1. */
  sampleFraction?: number;
}

/**
 * Wrapped catalog result with sampling-honesty metadata. Per BUSINESS.md:19
 * council ruling 2026-04-27: never display the sampled-product count as if
 * it were the merchant's actual total. UI uses `truncated` + `actualProductCount`
 * to render "Sampled N of M products" rather than a misleading "N products".
 *
 * The cap is intentional (kindness contract on merchant Shopify CDN per
 * #38 Data intake veto). Fix is honesty, not capacity.
 */
export interface FetchedCatalog {
  catalog: CatalogInput;
  /** True when the fetch hit the per-scan page cap and there are likely more products. */
  truncated: boolean;
  /**
   * Merchant's true product count as reported by /products/count.json — null
   * when the endpoint is blocked, returns non-numeric, or fails. UI renders
   * "an estimated N+" fallback when null.
   */
  actualProductCount: number | null;
}

const DEFAULT_OPTIONS: Required<FetchOptions> = {
  timeoutMs: 55_000,
  maxPages: 4,
  sampleFraction: 1,
};

export function normaliseDomain(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new ShopifyFetchError('invalid-url', 'empty url');

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new ShopifyFetchError('invalid-url', `cannot parse: ${raw}`);
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new ShopifyFetchError('invalid-url', `bad protocol: ${url.protocol}`);
  }

  const host = url.hostname.toLowerCase();
  if (!host) {
    throw new ShopifyFetchError('invalid-url', `bad host: ${host}`);
  }

  // Literal-only check at parse time — full DNS-resolved check runs in
  // fetchCatalog so we don't pay a lookup on hosts that fail trivially.
  if (isPrivateHostLiteral(host)) {
    throw new ShopifyFetchError('invalid-url', `private host: ${host}`);
  }

  return host;
}

export async function fetchCatalog(
  rawUrl: string,
  options: FetchOptions = {},
): Promise<FetchedCatalog> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const domain = normaliseDomain(rawUrl);

  // DNS-resolved SSRF gate. Catches names that resolve to private space
  // (`internal.example` → 10.x). Surfaced as `invalid-url` so the user sees
  // the same "check the URL" hint as other parse failures — we don't want to
  // tell a probing actor that we resolve their host before fetching.
  try {
    await assertPublicHost(domain);
  } catch (err) {
    if (err instanceof SsrfBlockedError) {
      throw new ShopifyFetchError('invalid-url', err.message);
    }
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const products: ProductInput[] = [];
    let lastPageWasFull = false;

    for (let page = 1; page <= opts.maxPages; page += 1) {
      const pageUrl = `https://${domain}/products.json?limit=250&page=${page}`;
      const res = await fetch(pageUrl, {
        signal: controller.signal,
        headers: {
          'user-agent': 'Flintmere-Scanner/0.1 (+https://flintmere.com/bot)',
          accept: 'application/json',
        },
      });

      if (res.status === 404) {
        throw new ShopifyFetchError(
          'not-shopify',
          `404 on /products.json — not a public Shopify store`,
        );
      }
      if (!res.ok) {
        throw new ShopifyFetchError(
          'fetch-failed',
          `${res.status} on ${pageUrl}`,
        );
      }

      const body = (await res.json()) as { products?: ShopifyRawProduct[] };
      const rawProducts = body.products ?? [];
      if (rawProducts.length === 0) {
        lastPageWasFull = false;
        break;
      }

      for (const raw of rawProducts) {
        products.push(toProductInput(raw));
      }

      lastPageWasFull = rawProducts.length === 250;
      if (!lastPageWasFull) break;
    }

    if (products.length === 0) {
      throw new ShopifyFetchError(
        'empty-catalog',
        `no products found at ${domain}`,
      );
    }

    // Truncation suspect when we exhausted the page budget AND the final
    // page came back full. May be a false positive on an exact-1000 catalog
    // (rare); the actualProductCount fetch confirms or refutes.
    const provisionalTruncated =
      products.length >= opts.maxPages * 250 && lastPageWasFull;

    const actualProductCount = await fetchProductCount(domain, controller.signal);

    // Refine: if actualProductCount is known and equals products.length, the
    // catalog isn't truncated — false-positive caught.
    const truncated =
      provisionalTruncated &&
      (actualProductCount === null || actualProductCount > products.length);

    return {
      catalog: {
        shopDomain: domain,
        products,
        scoredAt: new Date().toISOString(),
      },
      truncated,
      actualProductCount,
    };
  } catch (err) {
    if (err instanceof ShopifyFetchError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ShopifyFetchError('timeout', `${opts.timeoutMs}ms exceeded`);
    }
    throw new ShopifyFetchError(
      'unreachable',
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches the merchant's TRUE product count via the public
 * /products/count.json endpoint. Returns null when the endpoint is blocked,
 * times out, or the response is malformed. Most Shopify stores expose this;
 * some Plus stores behind bot management return 401/403, hang, or rate-limit
 * — null fall-back is intentional and the UI degrades gracefully to "1,000+".
 *
 * Hard 5s timeout on this single request — far shorter than the parent
 * pipeline timeout — because product-count is a nice-to-have, not load-bearing
 * for the scan itself. We'd rather emit `actualProductCount: null` after 5s
 * than hold up the whole scan response.
 */
async function fetchProductCount(
  domain: string,
  parentSignal: AbortSignal,
): Promise<number | null> {
  const localController = new AbortController();
  const localTimer = setTimeout(() => localController.abort(), 5_000);
  // Forward parent abort to local — keeps both budgets honoured.
  const onParentAbort = () => localController.abort();
  parentSignal.addEventListener('abort', onParentAbort, { once: true });
  try {
    const res = await fetch(`https://${domain}/products/count.json`, {
      signal: localController.signal,
      headers: {
        'user-agent': 'Flintmere-Scanner/0.1 (+https://flintmere.com/bot)',
        accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { count?: unknown };
    return typeof body.count === 'number' && body.count >= 0 ? body.count : null;
  } catch {
    return null;
  } finally {
    clearTimeout(localTimer);
    parentSignal.removeEventListener('abort', onParentAbort);
  }
}

function toProductInput(raw: ShopifyRawProduct): ProductInput {
  return {
    id: String(raw.id),
    handle: raw.handle,
    title: raw.title,
    bodyHtml: raw.body_html ?? null,
    vendor: raw.vendor ?? null,
    productType: raw.product_type ?? null,
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.tags === 'string'
        ? raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    publishedAt: raw.published_at ?? null,
    variants: (raw.variants ?? []).map((v) => ({
      id: String(v.id),
      sku: v.sku ?? null,
      barcode: v.barcode ?? null,
      price: String(v.price ?? '0.00'),
      compareAtPrice: v.compare_at_price ? String(v.compare_at_price) : null,
      inventoryQuantity: typeof v.inventory_quantity === 'number' ? v.inventory_quantity : null,
      inventoryPolicy: v.inventory_policy === 'continue' ? 'continue' : 'deny',
      available: v.available,
    })),
    images: (raw.images ?? []).map((img) => ({
      id: img.id ? String(img.id) : undefined,
      src: img.src,
      altText: img.alt ?? null,
      width: img.width ?? null,
      height: img.height ?? null,
    })),
  };
}

// Private-host detection now lives in `./ssrf.ts` and covers IPv6 ULA /
// link-local, CGNAT 100.64/10, IPv4-mapped IPv6, multicast, and DNS
// pre-resolution. The previous local helper missed all of those.

// ---- Shopify /products.json raw shape (subset) ----
interface ShopifyRawProduct {
  id: number | string;
  handle: string;
  title: string;
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  tags: string | string[];
  published_at: string | null;
  variants?: ShopifyRawVariant[];
  images?: ShopifyRawImage[];
}

interface ShopifyRawVariant {
  id: number | string;
  sku: string | null;
  barcode: string | null;
  price: string | number;
  compare_at_price: string | number | null;
  inventory_quantity: number | null;
  inventory_policy: string;
  available: boolean;
}

interface ShopifyRawImage {
  id: number | string | null;
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}
