import { PILLARS, VERTICALS } from './schema'

/**
 * Vertex / Gemini `responseSchema` — JSON-schema mirror of `AuditDraftSchema`.
 *
 * Hand-written rather than auto-generated. Two reasons: the JSON-schema
 * shape Gemini accepts is a subset of OpenAPI 3 (no `oneOf` / `anyOf`,
 * limited `pattern` support, no zod-specific features) so a one-shot
 * conversion would either bring extras Gemini rejects or strip the
 * cardinality / range constraints that drive structured-output quality.
 * And — keeping the JSON schema visible alongside the zod schema lets
 * us tune the prompt-side cardinality discipline (`length(7)` etc.) by
 * reading both files side by side.
 *
 * Drift hazard: when `AuditDraftSchema` changes, this file MUST change
 * with it. The schema unit test (`schema.test.ts`) catches drift on the
 * zod side; an integration test in step 4 catches drift on the Vertex
 * side. Until then, hand-discipline.
 */

const confidence = {
  type: 'number',
  minimum: 0,
  maximum: 1,
}

const stringMax = (max: number) => ({ type: 'string', maxLength: max })

const pillarEnum = { type: 'string', enum: [...PILLARS] }

const ratingEnum = { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] }

const effortImpactEnum = {
  type: 'string',
  enum: ['low', 'medium', 'high'],
}

const actionableFix = {
  type: 'object',
  properties: {
    title: stringMax(120),
    detail: stringMax(600),
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
    score: { type: 'number', minimum: 0, maximum: 100 },
    rating: ratingEnum,
    observations: stringMax(1500),
    actionableFixes: {
      type: 'array',
      items: actionableFix,
      minItems: 0,
      maxItems: 5,
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
    rank: { type: 'integer', minimum: 1, maximum: 5 },
    title: stringMax(120),
    rationale: stringMax(400),
    pillarRef: pillarEnum,
    confidence,
  },
  required: ['rank', 'title', 'rationale', 'pillarRef', 'confidence'],
}

const executiveSummary = {
  type: 'object',
  properties: {
    headline: stringMax(180),
    body: stringMax(900),
    confidence,
  },
  required: ['headline', 'body', 'confidence'],
}

const estimatedRevenueImpact = {
  type: 'object',
  properties: {
    available: { type: 'boolean' },
    summary: stringMax(600),
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
    latencyMs: { type: 'integer', minimum: 0 },
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
      minItems: 7,
      maxItems: 7,
    },
    topPriorities: {
      type: 'array',
      items: topPriority,
      minItems: 5,
      maxItems: 5,
    },
    estimatedRevenueImpact,
    operatorTodos: {
      type: 'array',
      items: stringMax(280),
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
