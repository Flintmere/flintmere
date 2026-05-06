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
 * the Plausible event, rounded to 0.05 to keep cardinality low.
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
