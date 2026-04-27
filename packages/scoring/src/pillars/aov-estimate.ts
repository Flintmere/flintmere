// AOV inference module — the wedge-finish arc.
//
// Composes with `estimateSuppression` to produce a revenue band — the £X
// figure the v2 strategic report §7 hero specifies. Pure deterministic
// code over already-loaded catalog data; no new fetches, no LLM, no OAuth.
//
// Design contract (operator-signed-off 2026-04-27, see
// `context/requirements/2026-04-27-aov-inference.md` §Defaults):
//
//   - Anchor signal: median variant price across the catalog (Q-A).
//   - Cart-size multiplier: none — band absorbs the missing multiplier (Q-B).
//   - Frequency multiplier: NO defensible public per-SKU monthly turn
//     source exists. Per architect's Option 3 invocation, we multiply by
//     ANNUAL_SCALAR (12) and frame the output as "annual demand at risk"
//     rather than monthly revenue (Q-C).
//   - Band derivation: outer-compound with a hard floor of ±30% width (Q-D).
//   - Vertical scope: food-first. Beauty + apparel return null at v1 (Q1.1).
//
// The frequency framing is the load-bearing copy choice: the engine does
// NOT pretend to know per-SKU monthly purchase rates. It surfaces an
// annualised-demand range, and the lede copy must say "annual" not
// "monthly."

import type {
  AovEstimate,
  CatalogInput,
  ProductInput,
  RevenueEstimate,
  SuppressionEstimate,
} from '../types.js';
import { FOOD_HINT_KEYWORDS } from './suppression-estimate.js';

// ---- Constants ----

const MIN_VARIANT_SAMPLE = 3;
const AOV_BAND_FLOOR_RATIO = 0.30;
const FOOD_THRESHOLD = 0.40;

// Months in a year, used to scale a per-month suppression count up to an
// annual demand figure. NOT a turn rate — see Q-C in the requirement: no
// defensible public per-SKU monthly purchase frequency exists, so the
// engine annualises and the copy reads "annual demand at risk." If a
// future calibration yields a real per-SKU turn rate, this constant
// becomes a real frequency multiplier and the copy seam updates.
const ANNUAL_SCALAR = 12;

// ---- Vertical detection ----

function looksFoodPositive(product: ProductInput): boolean {
  // Re-implemented inline to avoid coupling to suppression-estimate's
  // private `looksLikeFood` helper. Keyword set is shared.
  const haystack = [
    product.productType ?? '',
    ...(product.tags ?? []),
    product.title ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return FOOD_HINT_KEYWORDS.some((kw) => haystack.includes(kw));
}

function detectVertical(catalog: CatalogInput): 'food' | null {
  const total = catalog.products.length;
  if (total === 0) return null;
  let foodPositive = 0;
  for (const product of catalog.products) {
    if (looksFoodPositive(product)) foodPositive++;
  }
  return foodPositive / total >= FOOD_THRESHOLD ? 'food' : null;
}

// ---- AOV computation ----

interface AovComputed {
  aov: AovEstimate;
  /** Total variant sample contributing to the median. */
  sampleSize: number;
}

function computeAov(catalog: CatalogInput): AovComputed | null {
  const prices: number[] = [];
  for (const product of catalog.products) {
    for (const variant of product.variants) {
      const parsed = parseFloat(variant.price);
      if (Number.isFinite(parsed) && parsed > 0) {
        prices.push(parsed);
      }
    }
  }
  if (prices.length < MIN_VARIANT_SAMPLE) return null;

  prices.sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)]!;
  const min = prices[0]!;
  const max = prices[prices.length - 1]!;

  // Confidence rule: 50+ prices AND tight spread = high; 10+ = medium;
  // otherwise low. The "tight spread" guard prevents a single luxury
  // outlier in a 50-SKU catalog from being mislabelled as high-confidence.
  let confidence: 'high' | 'medium' | 'low';
  if (prices.length >= 50 && max / min < 10) {
    confidence = 'high';
  } else if (prices.length >= 10) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const halfWidth = Math.max(median * AOV_BAND_FLOOR_RATIO, 1);
  const low = Math.max(1, Math.floor(median - halfWidth));
  const high = Math.ceil(median + halfWidth);

  return {
    aov: {
      low,
      high,
      medianPrice: median,
      confidence,
    },
    sampleSize: prices.length,
  };
}

// ---- Revenue band composition ----

function composeRevenue(
  aov: AovEstimate,
  suppression: SuppressionEstimate,
): RevenueEstimate | null {
  if (suppression.high === 0) return null;

  // Outer-compound: low × low × scalar; high × high × scalar. Widest-honest
  // expression of compounded uncertainty per Q-D.
  let revLow = suppression.low * aov.low * ANNUAL_SCALAR;
  let revHigh = suppression.high * aov.high * ANNUAL_SCALAR;

  // Hard floor on band width: ±30% around the midpoint, even when inputs
  // are tight. Prevents false-precision narrow bands per Q-D.
  const mid = (revLow + revHigh) / 2;
  const minHalfWidth = mid * AOV_BAND_FLOOR_RATIO;
  if (revHigh - revLow < minHalfWidth * 2) {
    revLow = Math.floor(mid - minHalfWidth);
    revHigh = Math.ceil(mid + minHalfWidth);
  }

  revLow = Math.max(0, revLow);

  return {
    low: Math.floor(revLow),
    high: Math.ceil(revHigh),
    aovEstimate: aov,
  };
}

// ---- Public entry point ----

/**
 * Estimate AOV from a catalog and compose it with a suppression estimate
 * to produce an annual-demand-at-risk band.
 *
 * Returns `null` when:
 *   - the catalog is non-food (food-first at v1, see Q1.1), OR
 *   - the priced-variant sample is below MIN_VARIANT_SAMPLE.
 *
 * When `suppression.high === 0`, returns `aovEstimate` non-null but
 * `revenueEstimate` null — the AOV signal is real but there's no
 * suppression to multiply against.
 */
export function estimateAov(
  catalog: CatalogInput,
  suppression: SuppressionEstimate,
): { aovEstimate: AovEstimate; revenueEstimate: RevenueEstimate | null } | null {
  if (detectVertical(catalog) !== 'food') return null;

  const computed = computeAov(catalog);
  if (computed === null) return null;

  const revenueEstimate = composeRevenue(computed.aov, suppression);

  return {
    aovEstimate: computed.aov,
    revenueEstimate,
  };
}
