import type { Pillar, Vertical } from './schema'

/**
 * System + user prompt builders for audit-assist v0.
 *
 * Voice rule: terse, evidence-first, British, no marketing language, no
 * hedging adverbs. Confidence-score discipline: 0.95+ for findings backed
 * by clear catalog evidence; 0.6–0.85 for inference; below 0.6 for
 * hypothesis. Never invent metrics — if the data doesn't support a claim,
 * mark the field as a TBD operator-todo string instead of fabricating.
 *
 * The discipline encoded here is the ingestion-engine verification-UX
 * prototype tell. Same shape transfers when the engine ships: structured
 * output + per-field confidence + TBD-instead-of-fabricate.
 *
 * Drift trigger: if the system prompt grows past 100 lines, force a
 * prompt-eval before extending. Long prompts go brittle fast.
 */

export interface PillarSummaryInput {
  pillar: Pillar
  score: number
  rating: 'A' | 'B' | 'C' | 'D' | 'F'
  /** Short evidence string from packages/scoring — e.g. "23 of 80 missing barcode". */
  issuesSummary: string
}

export interface ScanSummaryInput {
  /** The merchant's overall score (0–100) from the deterministic scan. */
  overallScore: number
  /** A–F grade derived from overallScore. */
  grade: string
  /** Total product count (or estimate) — informs scope language. */
  productCount: number
  /** Per-pillar summary, in canonical PILLARS order. */
  pillars: PillarSummaryInput[]
}

export interface BuildUserPromptInput {
  shop: string
  vertical: Vertical
  bandLabel: string // e.g., "Band 2 (1,501–5,000 SKUs)"
  scan: ScanSummaryInput
  /** Pre-built pipe-delimited catalog sample from `summariseProductsForLLM`. */
  catalogSampleText: string
  /** Number of products in the sample (the slice the LLM saw). */
  sampleSize: number
  /** True when the merchant has more products than the sample reflects. */
  truncated: boolean
}

export function buildSystemPrompt(): string {
  return [
    'You are Flintmere\'s senior audit drafter. You receive a merchant\'s',
    'deterministic catalog scan and a sample of their public catalog. You',
    'produce a structured findings document the operator will review,',
    'edit, and send to the merchant.',
    '',
    'Voice. Terse. Evidence-first. British. No marketing language. No',
    'hedging adverbs ("very", "really", "quite"). Cite specific product',
    'titles by quoting them inline when grounding a finding.',
    '',
    'Confidence discipline.',
    '  - 0.95+ for findings backed by clear catalog evidence (you can',
    '    point at specific products in the sample).',
    '  - 0.6–0.85 for inference (the deterministic scan supports it but',
    '    the catalog sample doesn\'t directly show it).',
    '  - below 0.6 for hypothesis (informed guess; flag for operator).',
    '',
    'Never invent metrics. If the data does not support a claim, mark the',
    'gap as a TBD string in `operatorTodos` rather than fabricating.',
    '',
    'Output format. Strict JSON conforming to the supplied schema. No',
    'prose outside the schema. No preamble. No code fences. No comments.',
    '',
    'Cardinality (the schema enforces this — match it):',
    '  - exactly 7 pillarFindings, one per supplied pillar slug.',
    '  - exactly 5 topPriorities, ranked 1 (highest) to 5 (lowest).',
    '',
    'Two-beat lede on `executiveSummary.headline`. Lead with a',
    'deterministic anchor (a number or a count). Demote any range or',
    'estimate to the body. Example shape: "40 of 42 products are missing',
    'data Google Shopping looks for." Wrong shape: "Roughly 40 to 50 of',
    'your products may be missing data."',
    '',
    'Voice example (acceptable):',
    '  "23 products lack a structured allergen field. Three of these',
    '   reference allergens in the body copy only — readable to humans,',
    '   invisible to feed validators."',
    '',
    'Voice example (banned shape — do not write):',
    '  "We\'re really excited to share that your store has a great',
    '   opportunity to optimise its data!" (marketing language, hedging,',
    '   no evidence cited)',
  ].join('\n')
}

export function buildUserPrompt(input: BuildUserPromptInput): string {
  const lines: string[] = []
  lines.push(`Shop: ${input.shop}`)
  lines.push(`Vertical: ${input.vertical}`)
  lines.push(`Audit band: ${input.bandLabel}`)
  lines.push('')
  lines.push('## Deterministic scan summary')
  lines.push(
    `Overall score: ${input.scan.overallScore}/100 (grade ${input.scan.grade})`,
  )
  lines.push(`Total products scanned: ${input.scan.productCount}`)
  lines.push('')
  lines.push('Per-pillar:')
  for (const pillar of input.scan.pillars) {
    lines.push(
      `  - ${pillar.pillar}: ${pillar.score}/100 (${pillar.rating}) — ${pillar.issuesSummary}`,
    )
  }
  lines.push('')
  lines.push(
    `## Catalog sample (${input.sampleSize} of ${input.scan.productCount} products${input.truncated ? '; merchant has more' : ''})`,
  )
  lines.push(
    'Format per line: title | vendor | type | tags | variants | price-range | images | barcode | alt-text',
  )
  lines.push('')
  lines.push(input.catalogSampleText)
  lines.push('')
  lines.push('---')
  lines.push(
    'Produce the structured findings document. Conform exactly to the',
  )
  lines.push('supplied schema. Begin output now.')
  return lines.join('\n')
}
