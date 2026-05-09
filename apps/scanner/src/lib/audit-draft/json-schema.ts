import { PILLARS, VERTICALS } from './schema'

/**
 * Vertex / Gemini `responseSchema` — JSON-schema mirror of `AuditDraftSchema`.
 *
 * Hand-written rather than auto-generated. Two reasons: the JSON-schema
 * shape Gemini accepts is a subset of OpenAPI 3 (no `oneOf` / `anyOf`,
 * limited `pattern` support, no zod-specific features) so a one-shot
 * conversion would either bring extras Gemini rejects or strip the
 * cardinality / range constraints. And — keeping the JSON schema visible
 * alongside the zod schema lets us tune the prompt-side cardinality
 * discipline (`length(7)` etc.) by reading both files side by side.
 *
 * Drift hazard: when `AuditDraftSchema` changes, this file MUST change
 * with it. The schema unit test (`schema.test.ts`) catches drift on the
 * zod side; the live audit-draft smoke catches drift on the Vertex side.
 *
 * State-explosion discipline (caught 2026-05-09): Vertex compiles
 * `responseSchema` into a finite-state automaton and rejects schemas
 * that exceed an internal state budget. With 7 fixed pillarFindings ×
 * 5 fixed actionableFixes per pillar × multiple `maxLength` strings
 * and `minimum/maximum` numbers per item, ours blew the budget and
 * Vertex 400'd with INVALID_ARGUMENT "too many states for serving".
 *
 * What's safe to keep: `type`, `enum`, `required`, `properties`, `items`.
 * What we strip: `maxLength`, `minimum`, `maximum`, `minItems`, `maxItems`.
 *
 * Quality enforcement after the strip:
 *   - Prompt enforces cardinality verbally ("exactly 7 pillarFindings",
 *     "exactly 5 topPriorities", per-string length guidance).
 *   - zod schema in `schema.ts` validates Vertex's output AFTER receipt
 *     and rejects out-of-bound values; `draftAudit` then runs a one-shot
 *     repair attempt with the failure path inlined into the prompt.
 *
 * Net: same final guarantees, smaller FSA.
 */

const confidence = { type: 'number' }

const stringNoMax = { type: 'string' }

const pillarEnum = { type: 'string', enum: [...PILLARS] }

const ratingEnum = { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] }

const effortImpactEnum = {
  type: 'string',
  enum: ['low', 'medium', 'high'],
}

const actionableFix = {
  type: 'object',
  properties: {
    title: stringNoMax,
    detail: stringNoMax,
    effort: effortImpactEnum,
    impact: effortImpactEnum,
    confidence,
  },
  required: ['title', 'detail', 'effort', 'impact', 'confidence'],
}

const pillarFinding = {
  type: 'object',
  properties: {
    pillar: pillarEnum,
    score: { type: 'number' },
    rating: ratingEnum,
    observations: stringNoMax,
    actionableFixes: {
      type: 'array',
      items: actionableFix,
    },
    confidence,
  },
  required: [
    'pillar',
    'score',
    'rating',
    'observations',
    'actionableFixes',
    'confidence',
  ],
}

const topPriority = {
  type: 'object',
  properties: {
    rank: { type: 'integer' },
    title: stringNoMax,
    rationale: stringNoMax,
    pillarRef: pillarEnum,
    confidence,
  },
  required: ['rank', 'title', 'rationale', 'pillarRef', 'confidence'],
}

const executiveSummary = {
  type: 'object',
  properties: {
    headline: stringNoMax,
    body: stringNoMax,
    confidence,
  },
  required: ['headline', 'body', 'confidence'],
}

const estimatedRevenueImpact = {
  type: 'object',
  properties: {
    available: { type: 'boolean' },
    summary: stringNoMax,
    confidence,
  },
  required: ['available', 'summary'],
}

const meta = {
  type: 'object',
  properties: {
    shop: { type: 'string' },
    vertical: { type: 'string', enum: [...VERTICALS] },
    bandSlug: { type: 'string', enum: ['band-1', 'band-2', 'band-3'] },
    generatedAt: { type: 'string' },
    model: { type: 'string', enum: ['gemini-2.5-pro'] },
    latencyMs: { type: 'integer' },
  },
  required: [
    'shop',
    'vertical',
    'bandSlug',
    'generatedAt',
    'model',
    'latencyMs',
  ],
}

export const AUDIT_DRAFT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    meta,
    executiveSummary,
    pillarFindings: {
      type: 'array',
      items: pillarFinding,
    },
    topPriorities: {
      type: 'array',
      items: topPriority,
    },
    estimatedRevenueImpact,
    operatorTodos: {
      type: 'array',
      items: stringNoMax,
    },
  },
  required: [
    'meta',
    'executiveSummary',
    'pillarFindings',
    'topPriorities',
    'estimatedRevenueImpact',
    'operatorTodos',
  ],
} as const
