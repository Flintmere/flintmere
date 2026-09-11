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
  /**
   * How many products to read barcodes for, via /products/{handle}.js.
   * /products.json carries no `barcode` key at all, so without this pass
   * every GTIN check scores zero on every store. 0 disables the pass.
   *
   * Sampled rather than exhaustive: the pass is sequential (one request in
   * flight, ~180ms observed), so 50 products costs ~9s of the 55s budget.
   * Reading 1,000 would cost ~3 minutes and put unpaced load on a
   * merchant's CDN. The sampled count is stated in the UI, never implied
   * to be the whole catalog.
   */
  barcodeSampleSize?: number;
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
  /**
   * How many products we actually read a barcode field for. Optional so
   * existing mocks of this module keep type-checking.
   *
   * Absent is NOT zero. `run-scan.ts` normalises absent to `null`, and the
   * two are load-bearing apart downstream: `copy-scan-scope.ts` renders 0
   * as "barcodes not read" and null as nothing at all, because nobody
   * looked and there is nothing to report. A consumer that defaults absent
   * to 0 collapses "never tried" onto "tried and found none" — the exact
   * conflation this tri-state exists to prevent.
   */
  barcodesRead?: number;
}

const DEFAULT_OPTIONS: Required<FetchOptions> = {
  timeoutMs: 55_000,
  maxPages: 4,
  barcodeSampleSize: 50,
};

/**
 * Wall-clock ceiling for the barcode pass alone, inside the 55s pipeline.
 * This is only a real ceiling because every request inside the pass is
 * itself bounded by `BARCODE_REQUEST_TIMEOUT_MS` (mirroring
 * `fetchProductCount`'s local-controller pattern) — the deadline check
 * between requests can be overrun by at most one in-flight request's
 * timeout, never by an unbounded stall.
 */
const BARCODE_BUDGET_MS = 20_000;

/**
 * Per-request ceiling for a single /products/{handle}.js fetch, forwarding
 * the parent pipeline abort — same pattern as `fetchProductCount`. Without
 * this, `BARCODE_BUDGET_MS` is checked only between requests, so one
 * stalled request could run until the 55s pipeline abort fires instead of
 * the 20s barcode budget.
 */
const BARCODE_REQUEST_TIMEOUT_MS = 5_000;

/**
 * How many consecutive non-404 failures (429, 5xx, malformed body, network
 * error) the pass tolerates before concluding the endpoint is struggling
 * and giving up on the rest of the storefront. A 404 is a per-handle miss
 * — it never counts here. Kept small: the kindness contract means a
 * struggling host sees at most a handful of probes, not the full sample,
 * and the ceiling applies whether or not a product has already been read.
 */
const BARCODE_FAILURE_CEILING = 3;

/** One literal, three call sites. */
const SCANNER_UA = 'Flintmere-Scanner/0.1 (+https://flintmere.com/bot)';

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
          'user-agent': SCANNER_UA,
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

    // Barcodes come from a different endpoint than the catalog. Runs after
    // the count fetch so the count — load-bearing for sampling honesty —
    // is never starved by this budget.
    const barcodesRead = await readBarcodes(
      domain,
      products,
      opts.barcodeSampleSize,
      controller.signal,
    );

    return {
      catalog: {
        shopDomain: domain,
        products,
        scoredAt: new Date().toISOString(),
      },
      truncated,
      actualProductCount,
      barcodesRead,
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
        'user-agent': SCANNER_UA,
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

/**
 * Outcome of reading one product's .js document.
 * - `ok`: usable JSON with a variants array — may still share no variant
 *   ids with the product that requested it (a redirected/stale handle).
 * - `miss`: 404 — this handle doesn't exist any more. A per-handle fact,
 *   not evidence the endpoint itself is struggling.
 * - `blocked`: any other non-2xx status, an unparsable body, or a network
 *   error — the kind of failure that suggests the endpoint (or the host)
 *   is the problem, not this one handle.
 */
type BarcodeFetchOutcome =
  | { kind: 'ok'; barcodes: Map<string, string | null> }
  | { kind: 'miss' }
  | { kind: 'blocked' };

/**
 * Second pass: reads `barcode` for the first `sampleSize` products from
 * /products/{handle}.js and writes it onto the already-built variants.
 *
 * Why a second pass at all: /products.json has never carried a `barcode`
 * key. `toProductInput` read `v.barcode ?? null` from a field that was
 * never in the response, so every public scan reported 100% missing GTIN.
 *
 * Mutates `products` in place. `.slice` below copies only up to
 * `sampleSize` references (a small array of pointers) — not a deep copy of
 * the products, and not a copy of the whole catalog.
 * Returns how many products were successfully read.
 */
async function readBarcodes(
  domain: string,
  products: ProductInput[],
  sampleSize: number,
  signal: AbortSignal,
): Promise<number> {
  for (const product of products) {
    product.barcodeRead = false;
  }
  if (sampleSize <= 0) return 0;

  const deadline = Date.now() + BARCODE_BUDGET_MS;
  let read = 0;
  let consecutiveFailures = 0;

  for (const product of products.slice(0, sampleSize)) {
    if (signal.aborted || Date.now() > deadline) break;

    const outcome = await fetchVariantBarcodes(domain, product.handle, signal);

    if (outcome.kind === 'miss') {
      // Per-handle fact (the product is gone/renamed) — no signal about
      // the endpoint's health, so it never counts towards the ceiling.
      continue;
    }

    if (outcome.kind === 'blocked') {
      consecutiveFailures += 1;
      if (consecutiveFailures >= BARCODE_FAILURE_CEILING) break;
      continue;
    }

    // outcome.kind === 'ok'. A doc that shares none of this product's
    // variant ids (e.g. a handle that now redirects elsewhere) is not a
    // genuine read of THIS product — don't claim we checked it, and let it
    // count towards the same failure ceiling as any other failed read. A
    // partial match is still a successful read (a variant added between
    // the two fetches is expected drift, not a mismatch).
    const anyMatch = product.variants.some((variant) =>
      outcome.barcodes.has(variant.id),
    );
    if (!anyMatch) {
      consecutiveFailures += 1;
      if (consecutiveFailures >= BARCODE_FAILURE_CEILING) break;
      continue;
    }

    for (const variant of product.variants) {
      variant.barcode = outcome.barcodes.get(variant.id) ?? null;
    }
    product.barcodeRead = true;
    read += 1;
    consecutiveFailures = 0;
  }

  return read;
}

/**
 * Reads one product's .js document. Bounded by its own local abort
 * controller (`BARCODE_REQUEST_TIMEOUT_MS`), forwarding the parent signal —
 * same pattern as `fetchProductCount` — so a single stalled request cannot
 * itself exceed the barcode pass's budget. Never throws: a barcode we
 * could not read is a smaller problem than a scan that fails outright.
 */
async function fetchVariantBarcodes(
  domain: string,
  handle: string,
  parentSignal: AbortSignal,
): Promise<BarcodeFetchOutcome> {
  const localController = new AbortController();
  const localTimer = setTimeout(
    () => localController.abort(),
    BARCODE_REQUEST_TIMEOUT_MS,
  );
  const onParentAbort = () => localController.abort();
  parentSignal.addEventListener('abort', onParentAbort, { once: true });

  try {
    const res = await fetch(
      `https://${domain}/products/${encodeURIComponent(handle)}.js`,
      {
        signal: localController.signal,
        headers: { 'user-agent': SCANNER_UA, accept: 'application/json' },
      },
    );
    if (res.status === 404) return { kind: 'miss' };
    if (!res.ok) return { kind: 'blocked' };

    const body = (await res.json()) as {
      variants?: Array<{ id: number | string; barcode?: string | null }>;
    };
    if (!Array.isArray(body.variants)) return { kind: 'blocked' };

    return {
      kind: 'ok',
      barcodes: new Map(
        body.variants.map((v) => [String(v.id), v.barcode ?? null] as const),
      ),
    };
  } catch {
    return { kind: 'blocked' };
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
