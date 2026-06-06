// Audit draft → markdown. Operator clicks "Copy as markdown" in the
// DraftViewer; the result is paste-ready into Notion / Linear / an
// email's body. Output is opinionated: H1 = shop + band, H2 per
// section, mono code spans for confidence percentages, plain bullet
// lists for arrays.
//
// Why an explicit converter and not a generic JSON-stringify: the
// audit deliverable's voice is in the prose body, not the schema
// shape. The converter discards meta/telemetry and elevates the prose
// fields to top-level. The shape stays stable when the schema gains
// or drops fields — only this file changes.

import type {
  AuditDraft,
  PillarFinding,
  TopPriority,
} from './schema'
import { bandBySlug } from '../audit-pricing'
import { gs1UkBarcodePathSection } from '../concierge-deliverable'

export interface MarkdownExportInput {
  draft: AuditDraft
  shop: string
  bandSlug: 'band-1' | 'band-2' | 'band-3'
  generatedAt: Date
}

export function auditDraftToMarkdown(input: MarkdownExportInput): string {
  const band = bandBySlug(input.bandSlug)
  const lines: string[] = []

  lines.push(`# ${input.shop} — Audit draft`)
  lines.push('')
  lines.push(
    [
      `**Band**: ${band ? `${band.label} (${band.skuRangeLabel})` : input.bandSlug}`,
      `**Vertical**: ${input.draft.meta.vertical}`,
      `**Generated**: ${input.generatedAt.toISOString()}`,
      `**Model**: ${input.draft.meta.model}`,
    ].join('  \n'),
  )
  lines.push('')

  // Executive summary.
  lines.push('## Executive summary')
  lines.push('')
  lines.push(`### ${input.draft.executiveSummary.headline}`)
  lines.push('')
  lines.push(input.draft.executiveSummary.body)
  lines.push('')
  lines.push(
    `_Confidence: ${pct(input.draft.executiveSummary.confidence)}_`,
  )
  lines.push('')

  // Estimated revenue impact.
  lines.push('## Estimated revenue impact')
  lines.push('')
  if (input.draft.estimatedRevenueImpact.available) {
    lines.push(input.draft.estimatedRevenueImpact.summary)
    if (input.draft.estimatedRevenueImpact.confidence !== undefined) {
      lines.push('')
      lines.push(
        `_Confidence: ${pct(input.draft.estimatedRevenueImpact.confidence)}_`,
      )
    }
  } else {
    lines.push(`_Not modelled._ ${input.draft.estimatedRevenueImpact.summary}`)
  }
  lines.push('')

  // Top priorities.
  lines.push('## Top priorities')
  lines.push('')
  for (const p of [...input.draft.topPriorities].sort(
    (a, b) => a.rank - b.rank,
  )) {
    lines.push(...renderPriority(p))
  }

  // Pillars.
  lines.push('## Pillar findings')
  lines.push('')
  for (const finding of input.draft.pillarFindings) {
    lines.push(...renderPillar(finding))
  }

  // 30-day fix sequence — phases the top priorities into actionable
  // calendar windows. Renders from the same topPriorities the audit
  // letter already lists; this surface formats them as a plan, not a
  // ranked list. Derivation is deterministic; operator may edit ordering
  // during the calibration pass if a structural fix should lead.
  lines.push(...renderThirtyDayPlan(input.draft))

  // GS1 UK barcode path — templated section per
  // concierge-deliverable.ts. UK default for the launch cohort; the
  // operator pivots manually for non-UK merchants (placeholder rendered).
  lines.push(gs1UkBarcodePathSection({ jurisdiction: 'GB' }))
  lines.push('')

  // Operator TBDs.
  if (input.draft.operatorTodos.length > 0) {
    lines.push('## Operator TBDs')
    lines.push('')
    for (const todo of input.draft.operatorTodos) {
      lines.push(`- ${todo}`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

/**
 * 30-day fix sequence — phases the ranked topPriorities into Day 1 /
 * Week 1 / Week 2 / Week 3-4 windows. The mapping is deterministic
 * but the operator may re-order during the calibration pass if a
 * structural fix should lead — schema §A item 16 of the audit-edit-pass
 * schema already permits this.
 *
 * Phase mapping:
 *   - Day 1   — priority rank 1 (highest impact, most fixes unblocked)
 *   - Week 1  — priority ranks 2–3
 *   - Week 2  — priority ranks 4–5
 *   - Week 3-4 — operator-todos / structural cleanup
 */
function renderThirtyDayPlan(draft: AuditDraft): string[] {
  const lines: string[] = []
  lines.push('## 30-day fix sequence')
  lines.push('')
  lines.push(
    'Phased calendar for the top priorities above. Sequenced by impact,',
  )
  lines.push('not by ease — fix the priorities that unblock the most products')
  lines.push('first; let the rest cascade.')
  lines.push('')

  const ranked = [...draft.topPriorities].sort((a, b) => a.rank - b.rank)
  const day1 = ranked.find((p) => p.rank === 1)
  const week1 = ranked.filter((p) => p.rank === 2 || p.rank === 3)
  const week2 = ranked.filter((p) => p.rank === 4 || p.rank === 5)

  lines.push('### Day 1')
  lines.push('')
  if (day1) {
    lines.push(`- **${day1.title}** — ${day1.rationale}`)
  } else {
    lines.push('- _No rank-1 priority surfaced — operator review._')
  }
  lines.push('')

  lines.push('### Week 1')
  lines.push('')
  if (week1.length > 0) {
    for (const p of week1) {
      lines.push(`- **${p.title}** — ${p.rationale}`)
    }
  } else {
    lines.push('- _No rank 2–3 priorities — operator review._')
  }
  lines.push('')

  lines.push('### Week 2')
  lines.push('')
  if (week2.length > 0) {
    for (const p of week2) {
      lines.push(`- **${p.title}** — ${p.rationale}`)
    }
  } else {
    lines.push('- _No rank 4–5 priorities — operator review._')
  }
  lines.push('')

  lines.push('### Week 3-4')
  lines.push('')
  if (draft.operatorTodos.length > 0) {
    lines.push(
      'Structural cleanup and the operator-flagged TBDs above. Re-run the',
    )
    lines.push('free scan at the end of week 4 to verify score movement before')
    lines.push('the included day-30 re-scan.')
  } else {
    lines.push(
      'Re-run the free scan at the end of week 4 to verify score movement',
    )
    lines.push('before the included day-30 re-scan.')
  }
  lines.push('')

  return lines
}

function renderPriority(p: TopPriority): string[] {
  const lines: string[] = []
  lines.push(`### ${p.rank}. ${p.title}`)
  lines.push('')
  lines.push(p.rationale)
  lines.push('')
  lines.push(`_Pillar: \`${p.pillarRef}\` · Confidence: ${pct(p.confidence)}_`)
  lines.push('')
  return lines
}

function renderPillar(finding: PillarFinding): string[] {
  const lines: string[] = []
  lines.push(
    `### ${titleCasePillar(finding.pillar)} — ${finding.score}/100 (${finding.rating})`,
  )
  lines.push('')
  lines.push(finding.observations)
  lines.push('')
  if (finding.actionableFixes.length > 0) {
    lines.push('**Actionable fixes**')
    lines.push('')
    for (const fix of finding.actionableFixes) {
      lines.push(
        `- **${fix.title}** _(effort: ${fix.effort} · impact: ${fix.impact} · ${pct(fix.confidence)})_`,
      )
      lines.push(`  ${indent(fix.detail)}`)
    }
    lines.push('')
  }
  lines.push(`_Confidence: ${pct(finding.confidence)}_`)
  lines.push('')
  return lines
}

function pct(n: number): string {
  return `\`${Math.round(n * 100)}%\``
}

function indent(text: string): string {
  return text.split('\n').join('\n  ')
}

function titleCasePillar(pillar: string): string {
  // 'checkout-eligibility' → 'Checkout eligibility'; 'titles' → 'Titles'.
  return pillar
    .split('-')
    .map((part, i) =>
      i === 0
        ? part.charAt(0).toUpperCase() + part.slice(1)
        : part,
    )
    .join(' ')
}

/**
 * Mean confidence across every confidence field in the draft. Used by
 * the PostHog event, rounded to 0.05 to keep cardinality low.
 */
export function averageConfidence(draft: AuditDraft): number {
  const values: number[] = [
    draft.executiveSummary.confidence,
    ...draft.pillarFindings.map((p) => p.confidence),
    ...draft.pillarFindings.flatMap((p) =>
      p.actionableFixes.map((f) => f.confidence),
    ),
    ...draft.topPriorities.map((p) => p.confidence),
    ...(draft.estimatedRevenueImpact.confidence !== undefined
      ? [draft.estimatedRevenueImpact.confidence]
      : []),
  ]
  if (values.length === 0) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return Math.round(mean * 20) / 20 // round to 0.05
}
