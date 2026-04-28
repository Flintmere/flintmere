// Suppression-estimate module — the dead-inventory wedge.
//
// Computes a likely-suppression count for a Shopify catalog from the same
// signals the rest of the scoring engine consumes (no new fetches, no LLM,
// no external calls). Output is a RANGE — `{ low, high }` — per the v2
// strategic report (2026-04-26) §7 honesty discipline:
//
//     "estimated suppression count with a 30–60 range, not a point estimate"
//
// The range is the honest expression of the model's uncertainty. Per
// product, three deterministic signals drive the probability of being
// suppressed in Google Shopping (and by extension, demoted in agent
// shopping surfaces that share GMC-style requirements):
//
//   1. missing GTIN (any variant has no barcode)
//   2. ambiguous allergen text (food-vertical product with no allergen
//      marker in the description body)
//   3. missing GMC category (productType empty — best public proxy for the
//      google_product_category metafield not being set)
//
// Per the brief (v2 §7): products with all three signals are estimated
// suppressed, two ≈ 60% probability, one ≈ 25%, zero clear. We express
// each band as a low/high pair so the catalog-level aggregate is itself a
// range, not a point.
//
// This is a Phase 1 estimate. Phase 2 will replace the probabilistic model
// with verified counts via Google Merchant Center OAuth (separate ADR).

import type { CatalogInput, ProductInput, SuppressionEstimate } from '../types.js';
import { isValidGtin } from '../utils/gtin.js';
import { stripHtml } from '../utils/text.js';
import { NON_FOOD_VERTICAL_KEYWORDS } from './aov-estimate.js';

// ---- Per-product probability bands ----
// Probability that a product carrying N signals is suppressed in GMC.
// Each band has a low/high so the catalog-level aggregate is a range
// reflecting the model's uncertainty, not a false-precision point.
const PROBABILITY_BANDS: Readonly<Record<0 | 1 | 2 | 3, { low: number; high: number }>> = Object.freeze({
  0: { low: 0, high: 0 },
  1: { low: 0.15, high: 0.35 },
  2: { low: 0.45, high: 0.7 },
  3: { low: 0.85, high: 1 },
});

// ---- Food-vertical heuristic ----
// We only flag ambiguous allergen text on products that look like food.
// A coffee grinder shouldn't trip the allergen check.
export const FOOD_HINT_KEYWORDS = [
  'food',
  'drink',
  'beverage',
  'grocery',
  'snack',
  'snacks',
  'bakery',
  'bread',
  'cake',
  'biscuit',
  'cookie',
  'chocolate',
  'sweet',
  'confection',
  'sauce',
  'condiment',
  'spice',
  'seasoning',
  'pasta',
  'noodle',
  'rice',
  'grain',
  'cereal',
  'breakfast',
  'meal',
  'ready meal',
  'soup',
  'dairy',
  'cheese',
  'yogurt',
  'yoghurt',
  'butter',
  'milk',
  'meat',
  'beef',
  'pork',
  'chicken',
  'lamb',
  'fish',
  'seafood',
  'vegan',
  'vegetarian',
  'organic',
  'gluten free',
  'gluten-free',
  'tea',
  'coffee bean',
  'coffee ground',
  'wine',
  'beer',
  'spirit',
  'kombucha',
  'juice',
  'smoothie',
  'oil',
  'vinegar',
  'honey',
  'jam',
  'preserve',
  'protein bar',
  'energy bar',
  'supplement',
  'nutrition',
] as const;

// FSA Big-14 allergen keywords + common allergen-statement markers.
// If a food-plausible product mentions ANY of these in its description,
// we treat the allergen disclosure as present (or at least not absent).
// This is a conservative test — we'd rather miss flagging an ambiguous
// product than over-flag a clear one.
const ALLERGEN_MARKERS = [
  'contains:',
  'contains ',
  'allergen',
  'allergens',
  'may contain',
  'free from',
  'free-from',
  'gluten',
  'wheat',
  'rye',
  'barley',
  'oats',
  'spelt',
  'kamut',
  'crustacean',
  'crustaceans',
  'egg',
  'eggs',
  'fish',
  'peanut',
  'peanuts',
  'soy',
  'soya',
  'soybean',
  'milk',
  'dairy',
  'lactose',
  'nuts',
  'tree nut',
  'almond',
  'hazelnut',
  'walnut',
  'cashew',
  'pecan',
  'pistachio',
  'macadamia',
  'brazil nut',
  'celery',
  'mustard',
  'sesame',
  'sulphite',
  'sulfite',
  'sulphur dioxide',
  'sulfur dioxide',
  'lupin',
  'molluscs',
  'mollusc',
] as const;

interface ProductSignals {
  missingGtin: boolean;
  ambiguousAllergen: boolean;
  missingGmcCategory: boolean;
}

function productHaystack(product: ProductInput): string {
  return [
    product.productType ?? '',
    ...(product.tags ?? []),
    product.title ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

function looksLikeFood(product: ProductInput): boolean {
  return FOOD_HINT_KEYWORDS.some((kw) => productHaystack(product).includes(kw));
}

/**
 * Catalog-wide non-food veto — mirrors the AOV engine's apparel/beauty/hardware
 * pre-pass (aov-estimate.ts §detectVertical). When ANY product on the catalog
 * carries a non-food vertical signal (shoe, knit, skincare, hardware,
 * electronics, etc.), the suppression engine refuses to apply the allergen
 * check across the catalog. Reason: false-positive surface confirmed live
 * 2026-04-28 — allbirds.com flagged 998 of 1,000 "food products with no
 * allergen statement" because shoe colour names like "milk" and "almond"
 * trip FOOD_HINT_KEYWORDS. Catalog-wide veto is the right honest behaviour
 * — better to under-flag than mis-flag. Mixed catalogs (a deli that sells
 * branded merch) trip the veto and the food products fall back to a
 * 1-signal (missing-GTIN) suppression band rather than a 2-signal band.
 */
function catalogIsApparelOrBeauty(input: CatalogInput): boolean {
  for (const product of input.products) {
    const haystack = productHaystack(product);
    if (NON_FOOD_VERTICAL_KEYWORDS.some((kw) => haystack.includes(kw))) {
      return true;
    }
  }
  return false;
}

function descriptionMentionsAllergen(product: ProductInput): boolean {
  const plain = stripHtml(product.bodyHtml ?? '').toLowerCase();
  if (!plain) return false;
  return ALLERGEN_MARKERS.some((marker) => plain.includes(marker));
}

function extractSignals(
  product: ProductInput,
  catalogIsNonFood: boolean,
): ProductSignals {
  // Signal 1 — missing GTIN: any variant lacks a non-empty barcode.
  // We use "missing" rather than "invalid checksum" here — the strict
  // checksum signal is what `identifiers` already grades. Suppression
  // estimate uses the broader "the product has no GTIN at all" signal,
  // which is what GMC actually rejects on.
  const missingGtin = product.variants.some(
    (v) => !v.barcode || v.barcode.trim().length === 0,
  );

  // Signal 2 — ambiguous allergen text: only meaningful on food-plausible
  // products in food catalogs. A non-food product cannot have an ambiguous
  // allergen claim because no allergen claim is expected. Catalog-wide
  // apparel/beauty/hardware veto short-circuits this even when individual
  // product names happen to hit FOOD_HINT_KEYWORDS (shoe colour names like
  // "milk", "almond" — see catalogIsApparelOrBeauty doc).
  const isFood = !catalogIsNonFood && looksLikeFood(product);
  const ambiguousAllergen = isFood && !descriptionMentionsAllergen(product);

  // Signal 3 — missing GMC category: best public proxy is the absence of
  // productType. The full GMC `google_product_category` lives in a
  // metafield we cannot read without OAuth, but Shopify merchants who
  // have populated productType have universally also populated the GMC
  // category (or are using Shopify's auto-mapping which derives from it).
  const missingGmcCategory =
    !product.productType || product.productType.trim().length === 0;

  return { missingGtin, ambiguousAllergen, missingGmcCategory };
}

function signalCount(signals: ProductSignals): 0 | 1 | 2 | 3 {
  let n = 0;
  if (signals.missingGtin) n++;
  if (signals.ambiguousAllergen) n++;
  if (signals.missingGmcCategory) n++;
  return n as 0 | 1 | 2 | 3;
}

/**
 * Estimate the count of products in a catalog that are likely suppressed
 * in Google Shopping today, expressed as a low/high range.
 *
 * Range semantics: `low` uses the stricter probability bound, `high` uses
 * the looser bound. The range is the honest expression of model
 * uncertainty per v2 §7 — never a point estimate.
 *
 * Both bounds are floored at 0 and capped at the catalog product count.
 * The signals breakdown reports per-product counts of each input signal
 * for downstream transparency (e.g. surfaced on the scan results page).
 */
export function estimateSuppression(input: CatalogInput): SuppressionEstimate {
  const productCount = input.products.length;

  if (productCount === 0) {
    return {
      low: 0,
      high: 0,
      signals: {
        missingGtin: 0,
        ambiguousAllergen: 0,
        missingGmcCategory: 0,
      },
    };
  }

  // Catalog-wide non-food veto — gates the per-product allergen check so
  // apparel/beauty/hardware catalogs don't get inflated by products whose
  // colour or material names happen to hit FOOD_HINT_KEYWORDS.
  const catalogIsNonFood = catalogIsApparelOrBeauty(input);

  let lowSum = 0;
  let highSum = 0;
  let missingGtinCount = 0;
  let ambiguousAllergenCount = 0;
  let missingGmcCategoryCount = 0;

  for (const product of input.products) {
    const signals = extractSignals(product, catalogIsNonFood);
    if (signals.missingGtin) missingGtinCount++;
    if (signals.ambiguousAllergen) ambiguousAllergenCount++;
    if (signals.missingGmcCategory) missingGmcCategoryCount++;

    const band = PROBABILITY_BANDS[signalCount(signals)];
    lowSum += band.low;
    highSum += band.high;
  }

  // Cap at productCount, floor at 0. Round low DOWN and high UP so the
  // range is the conservative-on-low, generous-on-high reading the v2
  // report calls for.
  const low = Math.max(0, Math.min(productCount, Math.floor(lowSum)));
  const high = Math.max(low, Math.min(productCount, Math.ceil(highSum)));

  return {
    low,
    high,
    signals: {
      missingGtin: missingGtinCount,
      ambiguousAllergen: ambiguousAllergenCount,
      missingGmcCategory: missingGmcCategoryCount,
    },
  };
}

// Re-export the GTIN validator so future Phase-2 expansion (verifying
// checksum-as-suppression-signal) has a single import point. Currently
// unused but keeps the import surface stable.
export { isValidGtin };
