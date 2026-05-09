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
  it('renders all seven canonical sections in order', () => {
    const md = auditDraftToMarkdown({
      draft: buildDraft(),
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date('2026-05-06T20:00:00.000Z'),
    })
    expect(md).toMatch(/^# bluetokyo.co.uk — Audit draft/)
    // Seven sections per the 2026-05-09 deliverable spec — exec summary
    // → revenue impact → top priorities → pillar findings → 30-day plan
    // → GS1 UK barcode path → operator TBDs. Order is enforced (the
    // 30-day plan must follow pillar findings; GS1 section closes
    // before the operator TBDs).
    const sections = [
      'Executive summary',
      'Estimated revenue impact',
      'Top priorities',
      'Pillar findings',
      '30-day fix sequence',
      'GS1 UK barcode path',
      'Operator TBDs',
    ]
    let lastIdx = -1
    for (const s of sections) {
      const idx = md.indexOf(`## ${s}`)
      expect(idx, `section "${s}" missing or out of order`).toBeGreaterThan(lastIdx)
      lastIdx = idx
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

  it('phases priorities into the canonical 30-day plan windows', () => {
    const md = auditDraftToMarkdown({
      draft: buildDraft(),
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date(),
    })
    // Day 1 → priority 1; Week 1 → priorities 2-3; Week 2 → priorities
    // 4-5; Week 3-4 → operator-todos / structural cleanup. Matches the
    // spec's phase mapping.
    const day1Idx = md.indexOf('### Day 1')
    const week1Idx = md.indexOf('### Week 1')
    const week2Idx = md.indexOf('### Week 2')
    const week34Idx = md.indexOf('### Week 3-4')
    expect(day1Idx).toBeGreaterThan(0)
    expect(week1Idx).toBeGreaterThan(day1Idx)
    expect(week2Idx).toBeGreaterThan(week1Idx)
    expect(week34Idx).toBeGreaterThan(week2Idx)

    // Day 1 carries priority 1; Week 1 carries priorities 2 + 3.
    const day1Block = md.slice(day1Idx, week1Idx)
    const week1Block = md.slice(week1Idx, week2Idx)
    expect(day1Block).toContain('Priority 1')
    expect(week1Block).toContain('Priority 2')
    expect(week1Block).toContain('Priority 3')
  })

  it('includes the GS1 UK barcode path section with non-affiliation note', () => {
    const md = auditDraftToMarkdown({
      draft: buildDraft(),
      shop: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      generatedAt: new Date(),
    })
    expect(md).toContain('## GS1 UK barcode path')
    expect(md).toContain('GS1 UK Ltd')
    // Non-affiliation disclaimer is canon per ADR 0022 + concierge-deliverable.ts.
    expect(md).toContain('Flintmere is not affiliated with GS1.')
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
