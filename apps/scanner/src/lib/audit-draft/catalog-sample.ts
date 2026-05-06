import type { ProductInput } from '@flintmere/scoring'
import {
  fetchCatalog,
  ShopifyFetchError,
  type FetchedCatalog,
} from '../shopify-fetcher'

/**
 * Builds the catalog sample the audit-assist LLM consumes.
 *
 * Reuses the existing `fetchCatalog` pipeline (SSRF-protected, /products.json
 * → ProductInput[]) with a single-page cap — 250 products max from Shopify's
 * public endpoint, then we slice the first 50 for the LLM context. The full
 * fetcher's hard 55-second timeout still applies; the LLM call's structured-
 * output budget assumes a sample of this size.
 *
 * Why a fixed 50: token budget on Gemini 2.5 Pro caps cleanly at ~5–8K input
 * for a 50-product pipe-delimited summary plus the system prompt + scan
 * summary. Larger samples don't improve draft quality enough to justify the
 * latency + cost. Phase 2 widens to stratified sampling across product
 * categories.
 */

const SAMPLE_SIZE = 50

export class CatalogSampleError extends Error {
  constructor(
    public readonly code: 'invalid-url' | 'unreachable' | 'empty' | 'fetch-failed',
    message: string,
  ) {
    super(message)
    this.name = 'CatalogSampleError'
  }
}

export interface CatalogSample {
  /** Normalised hostname — feeds AuditDraft.meta.shop. */
  shop: string
  /** Up to 50 products. Caller pipes through `summariseProductsForLLM`. */
  products: ProductInput[]
  /** Merchant's true total, when /products/count.json returned a number. */
  totalProductCount: number | null
  /** True when the merchant has more products than the sample reflects. */
  truncated: boolean
}

export async function getCatalogSampleForDraft(
  rawUrl: string,
): Promise<CatalogSample> {
  let fetched: FetchedCatalog
  try {
    fetched = await fetchCatalog(rawUrl, { maxPages: 1 })
  } catch (err) {
    if (err instanceof ShopifyFetchError) {
      throw new CatalogSampleError(
        err.code === 'empty-catalog' ? 'empty' : 'fetch-failed',
        err.message,
      )
    }
    throw new CatalogSampleError(
      'fetch-failed',
      err instanceof Error ? err.message : String(err),
    )
  }

  if (fetched.catalog.products.length === 0) {
    throw new CatalogSampleError('empty', 'no products returned')
  }

  const sample = fetched.catalog.products.slice(0, SAMPLE_SIZE)
  // The single-page maxPages:1 may itself truncate; Shopify's /products.json
  // returns up to 250 per page. `truncated` should reflect "merchant has
  // more than we showed the LLM," which is true if either fetcher
  // truncated OR the page itself was larger than SAMPLE_SIZE.
  const truncated =
    fetched.truncated ||
    fetched.catalog.products.length > SAMPLE_SIZE ||
    (fetched.actualProductCount !== null &&
      fetched.actualProductCount > SAMPLE_SIZE)

  return {
    shop: fetched.catalog.shopDomain,
    products: sample,
    totalProductCount: fetched.actualProductCount,
    truncated,
  }
}

/**
 * Compact pipe-delimited summary the LLM consumes. ~70–90 tokens per
 * product on Gemini's tokeniser. Each line: title | vendor | type |
 * tags | variants | price-range | has-images | barcode-presence | alt-
 * text-presence. Newline-separated. The LLM grounds product references
 * in this set; observations that cite specific titles must use one of
 * these.
 */
export function summariseProductsForLLM(products: ProductInput[]): string {
  return products.map(summariseProduct).join('\n')
}

function summariseProduct(p: ProductInput): string {
  const variants = p.variants.length
  const prices = p.variants.map((v) => Number(v.price)).filter((n) => !isNaN(n))
  const priceRange = prices.length
    ? prices.length === 1
      ? `£${prices[0]!.toFixed(2)}`
      : `£${Math.min(...prices).toFixed(2)}–£${Math.max(...prices).toFixed(2)}`
    : '—'
  const hasImages = p.images.length > 0 ? 'images:y' : 'images:n'
  const hasBarcode = p.variants.some((v) => v.barcode && v.barcode.trim())
    ? 'barcode:y'
    : 'barcode:n'
  const hasAltText = p.images.some((i) => i.altText && i.altText.trim())
    ? 'alt:y'
    : 'alt:n'
  const tagSummary = p.tags.length
    ? p.tags.slice(0, 5).join(',')
    : '—'
  const safeTitle = p.title.replaceAll('|', '/').slice(0, 120)
  return [
    safeTitle,
    p.vendor ?? '—',
    p.productType ?? '—',
    tagSummary,
    `${variants}v`,
    priceRange,
    hasImages,
    hasBarcode,
    hasAltText,
  ].join(' | ')
}
