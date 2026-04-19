import type { CatalogInput, ProductInput } from '@flintmere/scoring';

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
  if (!host || host === 'localhost' || host.endsWith('.local')) {
    throw new ShopifyFetchError('invalid-url', `bad host: ${host}`);
  }

  if (isPrivateHost(host)) {
    throw new ShopifyFetchError('invalid-url', `private host: ${host}`);
  }

  return host;
}

export async function fetchCatalog(
  rawUrl: string,
  options: FetchOptions = {},
): Promise<CatalogInput> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const domain = normaliseDomain(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const products: ProductInput[] = [];

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
      if (rawProducts.length === 0) break;

      for (const raw of rawProducts) {
        products.push(toProductInput(raw));
      }

      if (rawProducts.length < 250) break;
    }

    if (products.length === 0) {
      throw new ShopifyFetchError(
        'empty-catalog',
        `no products found at ${domain}`,
      );
    }

    return {
      shopDomain: domain,
      products,
      scoredAt: new Date().toISOString(),
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

function isPrivateHost(host: string): boolean {
  if (host === '127.0.0.1' || host === '::1') return true;
  if (host.startsWith('10.')) return true;
  if (host.startsWith('192.168.')) return true;
  const match = /^172\.(\d+)\./.exec(host);
  if (match) {
    const octet = Number(match[1]);
    if (octet >= 16 && octet <= 31) return true;
  }
  return false;
}

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
