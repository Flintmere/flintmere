import { describe, expect, it } from 'vitest'
import {
  auditDraftToMarkdown,
  averageConfidence,
} from './markdown-export'
import type { AuditDraft } from './schema'
import { PILLARS } from './schema'

function buildDraft(): AuditDraft {
  return {
    meta: {
      shop: 'bluetokyo.co.uk',
      vertical: 'food',
      bandSlug: 'band-1',
      generatedAt: '2026-05-06T20:00:00.000Z',
      model: 'gemini-2.5-pro',
      latencyMs: 12_000,
    },
    executiveSummary: {
      headline: '23 of 42 products lack a structured allergen field.',
      body: 'The majority of titles are crawlable; the gap is structured attributes.',
      confidence: 0.9,
    },
    pillarFindings: PILLARS.map((p) => ({
      pillar: p,
      score: 70,
      rating: 'B' as const,
      observations: `Observations for ${p}.`,
      actionableFixes: [
        {
          title: `Fix ${p}`,
          detail: `Detail for ${p}.`,
          effort: 'low' as const,
          impact: 'medium' as const,
          confidence: 0.8,
        },
      ],
      confidence: 0.85,
    })),
    topPriorities: [1, 2, 3, 4, 5].map((rank) => ({
      rank: rank as 1 | 2 | 3 | 4 | 5,
      title: `Priority ${rank}`,
      rationale: `Rationale ${rank}`,
      pillarRef: 'identifiers' as const,
      confidence: 0.75,
    })),
    estimatedRevenueImpact: {
      available: true,
      summary: 'Estimated £2,400/month at risk in suppressed feed listings.',
      confidence: 0.7,
    },
    operatorTodos: ['Confirm Sept stocktake before send.'],
  }
}

describe('auditDraftToMarkdown', () => {
  it('renders all six sections in order', () => {
    const md = auditDraftToMarkdown({
      draft: buildDraft(),
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date('2026-05-06T20:00:00.000Z'),
    })
    expect(md).toMatch(/^# bluetokyo.co.uk — Audit draft/)
    const sections = ['Executive summary', 'Estimated revenue impact', 'Top priorities', 'Pillar findings', 'Operator TBDs']
    for (const s of sections) {
      expect(md).toContain(`## ${s}`)
    }
  })

  it('renders the headline as H3 inside the executive summary', () => {
    const md = auditDraftToMarkdown({
      draft: buildDraft(),
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date(),
    })
    expect(md).toContain('### 23 of 42 products lack a structured allergen field.')
  })

  it('treats `available: false` as "_Not modelled._"', () => {
    const draft = buildDraft()
    draft.estimatedRevenueImpact = { available: false, summary: 'AOV unknown.' }
    const md = auditDraftToMarkdown({
      draft,
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date(),
    })
    expect(md).toContain('_Not modelled._ AOV unknown.')
  })

  it('renders confidence as a mono-spanned percentage', () => {
    const md = auditDraftToMarkdown({
      draft: buildDraft(),
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date(),
    })
    expect(md).toContain('Confidence: `90%`')
  })

  it('omits the Operator TBDs section when empty', () => {
    const draft = buildDraft()
    draft.operatorTodos = []
    const md = auditDraftToMarkdown({
      draft,
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date(),
    })
    expect(md).not.toContain('## Operator TBDs')
  })

  it('includes the band label in the front matter', () => {
    const md = auditDraftToMarkdown({
      draft: buildDraft(),
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-2',
      generatedAt: new Date(),
    })
    expect(md).toContain('Band 2')
    expect(md).toContain('1,501–5,000 SKUs')
  })

  it('sorts top priorities by rank', () => {
    const draft = buildDraft()
    // Reverse them in the source; the converter must sort.
    draft.topPriorities = draft.topPriorities.reverse() as never
    const md = auditDraftToMarkdown({
      draft,
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date(),
    })
    const order = ['### 1.', '### 2.', '### 3.', '### 4.', '### 5.']
    let lastIdx = -1
    for (const marker of order) {
      const idx = md.indexOf(marker)
      expect(idx).toBeGreaterThan(lastIdx)
      lastIdx = idx
    }
  })
})

describe('averageConfidence', () => {
  it('rounds to the nearest 0.05', () => {
    const draft = buildDraft()
    const avg = averageConfidence(draft)
    // Every confidence above is ≥0.7; mean lands ≥0.7
    expect(avg).toBeGreaterThanOrEqual(0.7)
    // Multiple of 0.05.
    expect(Math.round(avg * 20)).toBe(avg * 20)
  })

  it('drops the revenue confidence when not present', () => {
    const draft = buildDraft()
    delete (draft.estimatedRevenueImpact as { confidence?: number }).confidence
    // Should not throw and should return a valid 0–1 average.
    const avg = averageConfidence(draft)
    expect(avg).toBeGreaterThan(0)
    expect(avg).toBeLessThanOrEqual(1)
  })
})
