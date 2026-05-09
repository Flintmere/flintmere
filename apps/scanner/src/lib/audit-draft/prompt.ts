import type { Pillar, Vertical } from './schema'
import {
  citationsForVertical,
  formatCitationsForPrompt,
} from './regulatory-citations'

/**
 * System + user prompt builders for audit-assist v1.1.
 *
 * Voice rule: terse, evidence-first, British, declarative + load-bearing-
 * claim-per-paragraph + occasionally aphoristic (per `flintmere.com/
 * methodology` reference voice). No marketing language. No hedging
 * adverbs. Confidence-score discipline: 0.95+ for findings backed by
 * clear catalog evidence; 0.6–0.85 for inference; below 0.6 for
 * hypothesis. Never invent metrics — if the data doesn't support a
 * claim, mark the field as a TBD operator-todo string instead of
 * fabricating.
 *
 * Regulation citations: only from the curated `regulatory-citations.ts`
 * playbook (per v2.1 audit-engine delta + canon-source-register §A10).
 * Anything outside the playbook → `[OPERATOR_VERIFY: regulation
 * reference for <topic>]`.
 *
 * Install-gated handling: free-scan audits cover four of seven pillars
 * (55% of the composite score). The prompt enforces a partial-coverage
 * caveat in the executive summary, placeholder copy for the three
 * install-gated pillars, and no priorities written for pillars without
 * data — closes the highest-impact hallucination hole the v1 prompt
 * left open.
 *
 * The discipline encoded here is the ingestion-engine verification-UX
 * prototype tell. Same shape transfers when the engine ships: structured
 * output + per-field confidence + TBD-instead-of-fabricate.
 *
 * Drift trigger: if the system prompt grows past 200 lines, force a
 * prompt-eval before extending. Long prompts go brittle fast.
 *
 * Canon-protected file (CLAUDE.md §Binding 2026-05-09). Edits MUST run
 * canon-audit first. Source-of-truth canon is `flintmere.com/methodology`.
 */

/** Public pillar slugs (free-scan covers these). */
const PUBLIC_PILLARS = new Set<string>([
  'identifiers',
  'titles',
  'consistency',
  'crawlability',
])

/** Install-gated pillar slugs (require Shopify app). */
const INSTALL_GATED_PILLARS = new Set<string>([
  'attributes',
  'mapping',
  'checkout-eligibility',
])

/**
 * Canonical pillar metadata per `flintmere.com/methodology`. Names
 * MUST match the methodology page + scanner UI exactly.
 */
const PILLAR_DISPLAY: Record<
  string,
  { name: string; weight: number; gated: 'public' | 'install-gated' }
> = {
  identifiers: { name: 'Identifiers', weight: 20, gated: 'public' },
  attributes: { name: 'Attributes', weight: 20, gated: 'install-gated' },
  titles: { name: 'Titles', weight: 15, gated: 'public' },
  mapping: { name: 'Mapping', weight: 15, gated: 'install-gated' },
  consistency: { name: 'Consistency', weight: 15, gated: 'public' },
  'checkout-eligibility': {
    name: 'Checkout eligibility',
    weight: 10,
    gated: 'install-gated',
  },
  crawlability: { name: 'Crawlability', weight: 5, gated: 'public' },
}

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
  /**
   * Scan coverage type — drives partial-coverage handling per the v2.1
   * audit-engine delta.
   *
   *   - 'public' (default): free-scan audit; only the four public
   *     pillars (Identifiers, Titles, Consistency, Crawlability) carry
   *     data. Install-gated pillars get the placeholder line in the
   *     pillar findings; no priorities written for pillars without data.
   *   - 'install_full': merchant has installed the Shopify app and all
   *     seven pillars are scored. No partial-coverage caveat.
   */
  scanType?: 'public' | 'install_full'
}

export function buildSystemPrompt(
  vertical: Vertical = 'food',
  scanType: 'public' | 'install_full' = 'public',
): string {
  const citations = citationsForVertical(vertical)
  const citationBlock = formatCitationsForPrompt(citations)

  const isPublic = scanType === 'public'

  return [
    'You are Flintmere\'s senior audit drafter. You receive a merchant\'s',
    'deterministic catalog scan and a sample of their public catalog. You',
    'produce a structured findings document the operator will review,',
    'edit, and send to the merchant.',
    '',
    '# Canonical reference data',
    '',
    'The seven pillars, in order, with weights, per flintmere.com/methodology:',
    '',
    '  01. Identifiers          20%   public',
    '  02. Attributes           20%   install-gated',
    '  03. Titles               15%   public',
    '  04. Mapping              15%   install-gated',
    '  05. Consistency          15%   public',
    '  06. Checkout eligibility 10%   install-gated',
    '  07. Crawlability          5%   public',
    '',
    'Composite: 100. Public-source pillars: 55%. Install-gated: 45%.',
    '',
    'When you reference a pillar in prose, use its canonical name exactly:',
    '"Identifiers", "Attributes", "Titles", "Mapping", "Consistency",',
    '"Checkout eligibility", "Crawlability". Do not paraphrase ("the GTIN',
    'pillar", "the category-mapping pillar"). The names match what the',
    'merchant sees in the scanner UI and on flintmere.com/methodology.',
    '',
    'When citing the standard or methodology, link to:',
    '  - flintmere.com/methodology (live, citable)',
    '  - standards.flintmere.com/food/v1 (target Q3 2026; do NOT cite as',
    '    live before then; if you would cite a clause of the food catalog',
    '    standard, write [OPERATOR_VERIFY: standard clause once v1',
    '    publishes] instead)',
    '',
    '# Voice',
    '',
    'Declarative. One load-bearing claim per paragraph. Aphoristic where',
    'natural, never forced. Terse. Evidence-first. British. No marketing',
    'language. No hedging adverbs ("very", "really", "quite"). Cite',
    'specific product titles by quoting them inline when grounding a',
    'finding. The reference voice is flintmere.com/methodology.',
    '',
    'Examples of the right register:',
    '  - "Products without GTINs lose impressions before they lose ad budget."',
    '  - "An audit that ranks well but cannot complete checkout has ranked',
    '     itself broke."',
    '  - "The fix here is one feed-app rule, not 80 manual edits."',
    '  - "Fail one, lose the sale."',
    '',
    'Counter-examples that read too soft for the brand (do not write):',
    '  - "It might be worth considering whether..."   (hedged, low conviction)',
    '  - "We hope this is helpful..."                 (apologetic)',
    '  - "Some merchants find that..."                (vague)',
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
    '',
    '# Confidence discipline',
    '',
    '  - 0.95+ for findings backed by clear catalog evidence (you can',
    '    point at specific products in the sample).',
    '  - 0.6–0.85 for inference (the deterministic scan supports it but',
    '    the catalog sample doesn\'t directly show it).',
    '  - below 0.6 for hypothesis (informed guess; flag for operator).',
    '',
    'Never invent metrics. If the data does not support a claim, mark the',
    'gap as a TBD string in `operatorTodos` rather than fabricating.',
    '',
    '# Regulation citations',
    '',
    'Cite regulations confidently from the allowed-citations register',
    'below. Citation moat is load-bearing per the published methodology.',
    'Use the canonical short form and link to the source URL on first',
    'reference per audit. NEVER cite a regulation, clause, schedule, or',
    'article that is NOT in the register — if you would write such a',
    'citation, write [OPERATOR_VERIFY: regulation reference for <topic>]',
    'instead.',
    '',
    citationBlock,
    '',
    '# Output format',
    '',
    'Strict JSON conforming to the supplied schema. No prose outside the',
    'schema. No preamble. No code fences. No comments.',
    '',
    '# Cardinality',
    '',
    '  - exactly 7 pillarFindings, one per supplied pillar slug.',
    '  - exactly 5 topPriorities, ranked 1 (highest) to 5 (lowest).',
    '',
    isPublic
      ? buildPublicScanCoverageBlock()
      : '# Coverage\n\nAll seven pillars are scored. Treat normally per the rest of the rules.',
    '',
    '# Two-beat lede',
    '',
    'On `executiveSummary.headline`: lead with a deterministic anchor (a',
    'number or a count). Demote any range or estimate to the body. Example',
    'shape: "40 of 42 products are missing data Google Shopping looks',
    'for." Wrong shape: "Roughly 40 to 50 of your products may be missing',
    'data."',
  ].join('\n')
}

/**
 * The partial-coverage instruction block injected into the system prompt
 * when scanType === 'public'. Closes the install-gated hallucination
 * hole per the v2.1 audit-engine delta correction #4.
 */
function buildPublicScanCoverageBlock(): string {
  return [
    '# Coverage (free-scan audit — partial)',
    '',
    'This is a free-scan audit. Data is available for FOUR of the seven',
    'pillars only:',
    '  - public (data present): Identifiers, Titles, Consistency, Crawlability',
    '  - install-gated (NO data this scan): Attributes, Mapping, Checkout',
    '    eligibility',
    '',
    'Three rules apply:',
    '',
    '1. Open `executiveSummary.body` with the partial-coverage caveat:',
    '   "This is a free-scan audit covering four of the seven pillars',
    '   (55% of the composite score)."',
    '',
    '2. For each install-gated pillar (Attributes, Mapping, Checkout',
    '   eligibility), the `pillarFindings` entry must:',
    '     - set `summary` to exactly: "This pillar requires the Shopify',
    '       app to be installed; not measured in this scan."',
    '     - set `confidence` to 1.0 (this is a known-truth statement, not',
    '       an inference)',
    '     - set `findings` to a single-element array containing one',
    '       sentence on what the pillar measures (e.g., for Attributes:',
    '       "measures whether structured product attributes — material,',
    '       allergens, nutrition fields — are present and complete on',
    '       each SKU.")',
    '     - DO NOT infer any specific findings, counts, or numbers for',
    '       these pillars from the public-pillar data.',
    '',
    '3. `topPriorities` must be drawn ONLY from the four public pillars.',
    '   Do not write priorities for pillars where you have no data, even',
    '   if you can guess what they would say. The fifth priority slot may',
    '   be a structural recommendation ("install the Shopify app to score',
    '   the install-gated 45% and re-issue the audit").',
    '',
    '4. Append exactly this string to `operatorTodos`: "If the merchant',
    '   installs the Shopify app, re-score for the install-gated 45% and',
    '   re-issue."',
  ].join('\n')
}

export function buildUserPrompt(input: BuildUserPromptInput): string {
  const scanType = input.scanType ?? 'public'
  const lines: string[] = []
  lines.push(`Shop: ${input.shop}`)
  lines.push(`Vertical: ${input.vertical}`)
  lines.push(`Audit band: ${input.bandLabel}`)
  lines.push(`Scan type: ${scanType}`)
  lines.push('')
  lines.push('## Deterministic scan summary')
  lines.push(
    `Overall score: ${input.scan.overallScore}/100 (grade ${input.scan.grade})`,
  )
  lines.push(`Total products scanned: ${input.scan.productCount}`)
  lines.push('')
  lines.push('Per-pillar:')
  for (const pillar of input.scan.pillars) {
    const meta = PILLAR_DISPLAY[pillar.pillar]
    const displayName = meta?.name ?? pillar.pillar
    const gatedTag = meta?.gated === 'install-gated' ? ' [install-gated]' : ''
    const dataTag =
      scanType === 'public' && INSTALL_GATED_PILLARS.has(pillar.pillar)
        ? ' [no data this scan]'
        : ''
    lines.push(
      `  - ${displayName} (${meta?.weight ?? '?'}%)${gatedTag}${dataTag}: ${pillar.score}/100 (${pillar.rating}) — ${pillar.issuesSummary}`,
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
