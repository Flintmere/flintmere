// Structured-output schema for audit-assist v0.
//
// This is the contract Gemini 2.5 Pro on Vertex (Gemini Enterprise) must
// produce, and the contract operator-edits must continue to satisfy on
// PATCH. Every field has a confidence score (0–1); every field that the
// LLM cannot ground in evidence must be reported as a TBD string in
// `operatorTodos` rather than fabricated. That discipline is the
// ingestion-engine verification-UX prototype — when the engine ships,
// merchants verify the same per-field confidence pattern. Any change
// here should ask "would this transfer cleanly to the eventual
// ingestion engine?"
//
// Cardinality on `pillarFindings` (length 7) and `topPriorities` (length
// 5) is intentionally strict. Vertex's structured-output mode honours
// min/max items; a strict `length` lets a 6-or-8-pillar drift fail loud
// at parse time instead of leaking through to the operator UI.
//
// `bandSlug` mirrors the canonical `AuditBandSlug` from
// `lib/audit-pricing.ts`. The brief drafted `B1 | B2 | B3`; the canonical
// slug is `band-1 | band-2 | band-3`. One source of truth.

import { z } from 'zod'

/** The seven Flintmere catalog-quality pillars. */
export const PILLARS = [
  'identifiers',
  'titles',
  'consistency',
  'crawlability',
  'attributes',
  'mapping',
  'checkout-eligibility',
] as const
export type Pillar = (typeof PILLARS)[number]

/** Verticals the audit-draft surface accepts. `other` is the catch-all. */
export const VERTICALS = [
  'food',
  'beauty',
  'apparel',
  'home',
  'electronics',
  'other',
] as const
export type Vertical = (typeof VERTICALS)[number]

/**
 * Confidence — 0–1. LLM grounding discipline:
 *   - 0.95+ for findings backed by clear catalog evidence
 *   - 0.6–0.85 for inference
 *   - below 0.6 for hypothesis (operator should review hard)
 */
const ConfidenceSchema = z.number().min(0).max(1)

/** Canonical band slug. Matches `lib/audit-pricing.ts` `AuditBandSlug`. */
const BandSlugSchema = z.enum(['band-1', 'band-2', 'band-3'])

const ActionableFixSchema = z.object({
  title: z.string().max(120),
  detail: z.string().max(600),
  effort: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  confidence: ConfidenceSchema,
})

const PillarFindingSchema = z.object({
  pillar: z.enum(PILLARS),
  score: z.number().min(0).max(100),
  rating: z.enum(['A', 'B', 'C', 'D', 'F']),
  observations: z.string().max(1500),
  // 0–5 fixes: zero is acceptable for a top-marks pillar; 5 is the cap so
  // the deliverable doesn't sprawl. Operator can add more on edit.
  actionableFixes: z.array(ActionableFixSchema).min(0).max(5),
  confidence: ConfidenceSchema,
})

const TopPrioritySchema = z.object({
  rank: z.number().int().min(1).max(5),
  title: z.string().max(120),
  rationale: z.string().max(400),
  pillarRef: z.enum(PILLARS),
  confidence: ConfidenceSchema,
})

const ExecutiveSummarySchema = z.object({
  // headline = single sentence, deterministic-anchor first per the
  // two-beat lede shape (memory: probability_range_in_headline_reads_as_guess).
  headline: z.string().max(180),
  // body = 1–2 paragraphs.
  body: z.string().max(900),
  confidence: ConfidenceSchema,
})

const RevenueImpactSchema = z.object({
  available: z.boolean(),
  summary: z.string().max(600),
  // confidence omitted when `available: false` — the LLM should flag
  // "couldn't model" via the summary string + `available: false`.
  confidence: ConfidenceSchema.optional(),
})

const MetaSchema = z.object({
  shop: z.string().regex(/^[a-z0-9.-]+$/),
  vertical: z.enum(VERTICALS),
  bandSlug: BandSlugSchema,
  generatedAt: z.string().datetime(),
  model: z.literal('gemini-2.5-pro'),
  latencyMs: z.number().int().nonnegative(),
})

export const AuditDraftSchema = z.object({
  meta: MetaSchema,
  executiveSummary: ExecutiveSummarySchema,
  // Exactly seven pillars, in any order — the route handler resolves
  // ordering for the UI. `length(7)` here means a 6-or-8-pillar drift
  // surfaces as a parse failure, not a silently-truncated UI.
  pillarFindings: z.array(PillarFindingSchema).length(7),
  // Exactly five priorities. Same fail-loud reasoning.
  topPriorities: z.array(TopPrioritySchema).length(5),
  estimatedRevenueImpact: RevenueImpactSchema,
  // The TBD slots — every place the LLM declined to fabricate. Empty
  // array allowed (clean draft, nothing to flag).
  operatorTodos: z.array(z.string().max(280)),
})

export type AuditDraft = z.infer<typeof AuditDraftSchema>
export type PillarFinding = z.infer<typeof PillarFindingSchema>
export type ActionableFix = z.infer<typeof ActionableFixSchema>
export type TopPriority = z.infer<typeof TopPrioritySchema>
export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>
export type RevenueImpact = z.infer<typeof RevenueImpactSchema>
export type AuditDraftMeta = z.infer<typeof MetaSchema>
