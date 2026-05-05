// Catalog-summary projection — the "What we read" preamble feed.
//
// Pure projection over a CatalogInput that names what the scanner actually
// observed in the merchant's public products. Surfaces verbatim merchant
// strings (productType first, vendor as fallback) so the disclosure layer
// can mirror the merchant's own taxonomy back to them.
//
// Why this exists: the scoring engine is vertical-aware (allergens fire
// only on food products) but the disclosure copy used to enumerate
// food-specific signals on every catalog. Operator caught this 2026-05-05
// scanning allbirds.com — apparel catalog, allergen language. Trust-killer
// for any non-food merchant testing the public scanner. The fix is two-
// layered: (1) genericised disclosure copy (shipped 6cbce20), and (2)
// this preamble that says "we read N products across [actual category
// strings from your store]" — vertical-correct by construction.
//
// No banned-jargon, no taxonomy imposition. The merchant's own product_type
// values are the source of truth.

import type { CatalogInput, CatalogSummary } from './types.js';

const MAX_TOP_CATEGORIES = 4;

interface CountedLabel {
  /** Lower-cased grouping key — case-insensitive merge prevents "Coffee" + "coffee" duplicates. */
  key: string;
  /** First-encountered casing — preserves merchant intent on display. */
  display: string;
  count: number;
}

function tally(values: Iterable<string | null | undefined>): CountedLabel[] {
  const map = new Map<string, CountedLabel>();
  for (const raw of values) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { key, display: trimmed, count: 1 });
    }
  }
  // Stable sort: count descending, then alpha for tie-break so the same
  // input always produces the same output (fixture-friendly).
  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Summarise a catalog for the "What we read" preamble.
 *
 * Three-rung fallback ladder:
 *
 *   1. `product-type` — at least one product carries a non-empty
 *      `productType`. Top categories are the most-common verbatim
 *      productType strings, capped at 4. (Most catalogs land here.)
 *   2. `vendor` — no productType signal anywhere, but vendor strings
 *      exist. Top categories are the most-common vendor names.
 *      (Brand-collective and aggregator stores land here.)
 *   3. `generic` — neither signal present. Single entry with label
 *      "products" and the full catalog count. (Rare — usually a
 *      misconfigured store.)
 *
 * The shape stays uniform across rungs so the UI renders the same
 * markup. The `source` field tells the copy layer which framing to use.
 */
export function summarizeCatalog(catalog: CatalogInput): CatalogSummary {
  const totalProducts = catalog.products.length;

  if (totalProducts === 0) {
    return { totalProducts: 0, topCategories: [], source: 'generic' };
  }

  const byProductType = tally(catalog.products.map((p) => p.productType));
  if (byProductType.length > 0) {
    return {
      totalProducts,
      topCategories: byProductType.slice(0, MAX_TOP_CATEGORIES).map((c) => ({
        label: c.display,
        count: c.count,
      })),
      source: 'product-type',
    };
  }

  const byVendor = tally(catalog.products.map((p) => p.vendor));
  if (byVendor.length > 0) {
    return {
      totalProducts,
      topCategories: byVendor.slice(0, MAX_TOP_CATEGORIES).map((c) => ({
        label: c.display,
        count: c.count,
      })),
      source: 'vendor',
    };
  }

  return {
    totalProducts,
    topCategories: [{ label: 'products', count: totalProducts }],
    source: 'generic',
  };
}
