import { z } from 'zod';

// ---- Input shapes ----

export const VariantInputSchema = z.object({
  id: z.string(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  price: z.string(),
  compareAtPrice: z.string().nullable().optional(),
  inventoryQuantity: z.number().int().nullable().optional(),
  inventoryPolicy: z.enum(['deny', 'continue']).optional(),
  available: z.boolean().optional(),
});

export const ProductImageSchema = z.object({
  id: z.string().optional(),
  src: z.string().url(),
  altText: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
});

export const ProductInputSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  bodyHtml: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  productType: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  publishedAt: z.string().nullable().optional(),
  variants: z.array(VariantInputSchema).min(1),
  images: z.array(ProductImageSchema).default([]),
  brandMetafield: z.string().nullable().optional(),
  mpnMetafield: z.string().nullable().optional(),
});

export const CatalogInputSchema = z.object({
  shopDomain: z.string(),
  products: z.array(ProductInputSchema),
  scoredAt: z.string().optional(),
});

export type VariantInput = z.infer<typeof VariantInputSchema>;
export type ProductInput = z.infer<typeof ProductInputSchema>;
export type CatalogInput = z.infer<typeof CatalogInputSchema>;

// ---- Result shapes ----

export type PillarId =
  | 'identifiers'
  | 'attributes'
  | 'titles'
  | 'mapping'
  | 'consistency'
  | 'checkout-eligibility'
  | 'crawlability';

// Weights sum to 100. Crawlability dropped from 15 → 5 on 2026-04-26 after
// claim-review found the public weights summing to 110% (load-bearing
// factual error on a diagnostic-positioning page). Strategic intent — see
// Task #7 grill-requirement (methodology reweight) — is to de-emphasise the
// llms.txt-adjacent signal (90-day log study: 0.1% of AI bot traffic) and
// reallocate freed weight to review-density + inventory-freshness pillars.
// This 15 → 5 step is the interim factual-correctness fix; the proper
// restructure follows the methodology grill.
export const PILLAR_WEIGHTS: Readonly<Record<PillarId, number>> = Object.freeze({
  identifiers: 20,
  attributes: 20,
  titles: 15,
  mapping: 15,
  consistency: 15,
  'checkout-eligibility': 10,
  crawlability: 5,
});

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Issue {
  pillar: PillarId;
  code: string;
  severity: Severity;
  title: string;
  description: string;
  affectedCount: number;
  affectedProductIds: string[];
  revenueImpactScore: number;
  /**
   * Up to N example products affected by this issue, populated by
   * `enrichIssuesWithExamples()` after scoring runs. Optional because
   * the scoring pillars themselves emit ids only — example titles +
   * handles are looked up against the catalog by the post-processor.
   * UI surfaces these as the per-issue mirror-recognition beat
   * ("affecting Almond Butter, Coffee Grinder, Snack Bar").
   * Empty array for site-level issues with no per-product attribution
   * (e.g. robots.txt blocking).
   */
  affectedProductExamples?: Array<{ title: string; handle: string }>;
}

export interface PillarResult {
  pillar: PillarId;
  weight: number;
  score: number;
  maxScore: number;
  locked: boolean;
  lockedReason?: string;
  issues: Issue[];
}

export interface CompositeScore {
  shopDomain: string;
  scoredAt: string;
  productCount: number;
  variantCount: number;
  score: number;
  gtinlessCeiling: number;
  fullCeiling: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  pillars: PillarResult[];
  issues: Issue[];
}

export interface CrawlabilityInput {
  robotsTxt: string | null;
  llmsTxt: string | null;
  sitemapXml: string | null;
}

export interface ScoreOptions {
  locked?: readonly PillarId[];
  crawlability?: CrawlabilityInput;
  adminContext?: AdminContextInput;
}

// ---- Admin-context input (Shopify Admin GraphQL pull) ----
// Side-channel data that unlocks the three pillars locked under
// `requires-install` on a public scan: structured attributes, GMC
// mapping, and checkout eligibility. Shape mirrors what
// `apps/scanner/src/lib/shopify-admin-fetcher.ts#AdminFetchedCatalog`
// produces — Maps keyed by the same numeric product id `ProductInput.id`
// uses, plus a shop-level checkout-context bag.
//
// When `adminContext` is absent on `ScoreOptions`, the three pillars
// stay locked with `lockedReason: 'requires-install'`. When present,
// they grade the data — even if the data shows complete absence
// (no metafields, no GMC categories, etc.) — because that absence is
// the honest, scoreable signal the audit is meant to surface.
export interface AdminMetafield {
  namespace: string;
  key: string;
  type: string;
  value: string;
}

export interface AdminCheckoutContext {
  requiresCustomerAccount: boolean | null;
  customerAccountsVersion: string | null;
}

export interface AdminContextInput {
  metafieldsByProduct: Map<string, AdminMetafield[]>;
  googleProductCategoryByProduct: Map<string, string | null>;
  checkoutContext: AdminCheckoutContext;
}

// ---- Suppression-estimate (dead-inventory wedge) ----
// Per v2 strategic report §7: a probabilistic estimate of how many
// products in the catalog are likely suppressed in Google Shopping today,
// expressed as a low/high RANGE — not a point estimate. Computed from
// existing per-product signals (no new fetches, no LLM, no OAuth).
export interface SuppressionEstimate {
  /** Lower bound of likely-suppressed product count (stricter probabilities). */
  low: number;
  /** Upper bound of likely-suppressed product count (looser probabilities). */
  high: number;
  /**
   * Deterministic count of products carrying ≥1 suppression signal — the
   * union over the three per-signal counts. Anchors the lede with a
   * reproducible number ahead of the probability-banded `low/high` range,
   * so the headline reads as data not as a guess. Optional for backward
   * compatibility with scoreJson rows persisted before this field shipped.
   */
  productsWithAnySignal?: number;
  /** Per-signal counts driving the estimate (transparency, not aggregation maths). */
  signals: {
    missingGtin: number;
    ambiguousAllergen: number;
    missingGmcCategory: number;
  };
}

// ---- AOV inference (wedge finish arc) ----
export interface AovEstimate {
  /** Lower bound: median minus band-half (floored at £1). */
  low: number;
  /** Upper bound: median plus band-half. */
  high: number;
  /** Median variant price — the anchor signal. */
  medianPrice: number;
  /** Confidence reflects sample size and price spread. */
  confidence: 'high' | 'medium' | 'low';
}

export interface RevenueEstimate {
  /** Lower bound of annual demand at risk (£, integer). */
  low: number;
  /** Upper bound of annual demand at risk (£, integer). */
  high: number;
  /** The AovEstimate that generated this band. */
  aovEstimate: AovEstimate;
}

// ---- Catalog summary ("What we read" preamble) ----
// A vertical-correct projection over the catalog the scanner actually
// observed. Surfaces verbatim merchant strings (productType first,
// vendor fallback) so the disclosure copy can mirror the merchant's own
// taxonomy back to them — proves we read the catalog without imposing
// a taxonomy of our own. See `catalog-summary.ts` for the rationale arc.
export interface CatalogSummary {
  /** Total products observed in the public catalog. */
  totalProducts: number;
  /**
   * Top categories by count, descending; capped at 4.
   * Empty when the catalog has zero products.
   */
  topCategories: Array<{ label: string; count: number }>;
  /**
   * Which signal sourced the labels — drives copy framing in the UI.
   *  - `product-type`: at least one product had a non-empty productType.
   *  - `vendor`: no productType anywhere; vendor strings exist.
   *  - `generic`: neither signal; falls back to "products".
   */
  source: 'product-type' | 'vendor' | 'generic';
}
