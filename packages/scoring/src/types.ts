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
}
