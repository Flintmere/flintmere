import { describe, expect, it } from 'vitest'
import { AuditDraftSchema, PILLARS, type AuditDraft } from './schema'

/**
 * Canonical valid fixture — used as the baseline that every "should
 * reject X" test mutates from. Hand-crafted to satisfy every cardinality
 * + range constraint in `AuditDraftSchema`. Update when the schema
 * changes.
 */
function validFixture(): AuditDraft {
  return {
    meta: {
      shop: 'bluetokyo.co.uk',
      vertical: 'food',
      bandSlug: 'band-1',
      generatedAt: '2026-05-06T18:00:00.000Z',
      model: 'gemini-2.5-pro',
      latencyMs: 18420,
    },
    executiveSummary: {
      headline:
        'Forty of forty-two products are missing data Google Shopping looks for.',
      body: 'Roughly £4.2k–£11.8k of annual demand is at risk while these stay suppressed. The catalog reads as well-curated for a human shopper but lacks the structured signals search and AI assistants resolve against.',
      confidence: 0.88,
    },
    pillarFindings: PILLARS.map((pillar, i) => ({
      pillar,
      score: 60 + i,
      rating: (['A', 'B', 'C', 'D', 'F'] as const)[i % 5]!,
      observations:
        'Observed across the sampled products. Cited evidence: titles inspected directly.',
      actionableFixes: [
        {
          title: 'Populate missing identifiers',
          detail: 'Add GTINs from supplier sheets where available.',
          effort: 'medium',
          impact: 'high',
          confidence: 0.9,
        },
      ],
      confidence: 0.85,
    })),
    topPriorities: [1, 2, 3, 4, 5].map((rank) => ({
      rank,
      title: `Priority ${rank}`,
      rationale: 'Cited evidence: this matters because…',
      pillarRef: 'identifiers',
      confidence: 0.8,
    })),
    estimatedRevenueImpact: {
      available: true,
      summary: 'Modelled from public catalog signals.',
      confidence: 0.7,
    },
    operatorTodos: ['Confirm GTIN policy with supplier on three SKUs.'],
  }
}

describe('AuditDraftSchema', () => {
  it('parses the canonical valid fixture', () => {
    const result = AuditDraftSchema.safeParse(validFixture())
    expect(result.success).toBe(true)
  })

  it('exposes exactly seven pillar slugs in the canonical order', () => {
    expect(PILLARS).toEqual([
      'identifiers',
      'titles',
      'consistency',
      'crawlability',
      'attributes',
      'mapping',
      'checkout-eligibility',
    ])
  })
})

describe('AuditDraftSchema cardinality (fail-loud on drift)', () => {
  it('rejects six pillarFindings (length 7 strict)', () => {
    const draft = validFixture()
    draft.pillarFindings = draft.pillarFindings.slice(0, 6)
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects eight pillarFindings (length 7 strict)', () => {
    const draft = validFixture()
    draft.pillarFindings = [
      ...draft.pillarFindings,
      draft.pillarFindings[0]!,
    ]
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects four topPriorities (length 5 strict)', () => {
    const draft = validFixture()
    draft.topPriorities = draft.topPriorities.slice(0, 4)
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects six topPriorities (length 5 strict)', () => {
    const draft = validFixture()
    draft.topPriorities = [...draft.topPriorities, draft.topPriorities[0]!]
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects more than five actionableFixes on a pillar', () => {
    const draft = validFixture()
    const fix = draft.pillarFindings[0]!.actionableFixes[0]!
    draft.pillarFindings[0]!.actionableFixes = [fix, fix, fix, fix, fix, fix]
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('accepts zero actionableFixes (top-marks pillar)', () => {
    const draft = validFixture()
    draft.pillarFindings[0]!.actionableFixes = []
    expect(AuditDraftSchema.safeParse(draft).success).toBe(true)
  })

  it('accepts an empty operatorTodos array (clean draft)', () => {
    const draft = validFixture()
    draft.operatorTodos = []
    expect(AuditDraftSchema.safeParse(draft).success).toBe(true)
  })
})

describe('AuditDraftSchema confidence ranges', () => {
  it('rejects confidence above 1', () => {
    const draft = validFixture()
    draft.executiveSummary.confidence = 1.01
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects confidence below 0', () => {
    const draft = validFixture()
    draft.pillarFindings[0]!.confidence = -0.01
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('makes estimatedRevenueImpact.confidence optional', () => {
    const draft = validFixture()
    delete (draft.estimatedRevenueImpact as { confidence?: number })
      .confidence
    expect(AuditDraftSchema.safeParse(draft).success).toBe(true)
  })
})

describe('AuditDraftSchema canonical types (drift guards)', () => {
  it('rejects the brief-drift `B1` band slug (canonical is band-1)', () => {
    const draft = validFixture()
    ;(draft.meta as { bandSlug: string }).bandSlug = 'B1'
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects an unknown pillar slug', () => {
    const draft = validFixture()
    ;(draft.pillarFindings[0] as { pillar: string }).pillar = 'made-up-pillar'
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects a non-ISO generatedAt', () => {
    const draft = validFixture()
    draft.meta.generatedAt = '2026-05-06 18:00:00'
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects model values other than gemini-2.5-pro', () => {
    const draft = validFixture()
    ;(draft.meta as { model: string }).model = 'gemini-2.5-flash'
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })

  it('rejects shop values with uppercase or invalid hostname chars', () => {
    const draft = validFixture()
    draft.meta.shop = 'BlueTokyo.co.uk'
    expect(AuditDraftSchema.safeParse(draft).success).toBe(false)
  })
})
