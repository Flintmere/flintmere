/**
 * Single source of truth for the concierge catalog letter deliverable copy.
 *
 * Every customer-facing surface that describes what the catalog letter
 * ships MUST render from this module. The three reference surfaces:
 *   - apps/scanner/src/app/catalog-letter/page.tsx — deliverables list
 *     (rendered via CONCIERGE_DELIVERABLE_LIST in copy.ts, which re-exports
 *     from here)
 *   - apps/scanner/src/lib/concierge-email.ts — post-purchase Resend
 *     body (renders the email-deliverable line from here)
 *   - apps/scanner/src/lib/audit-draft/markdown-export.ts — operator
 *     catalog-letter markdown (30-day plan + GS1 path sections render
 *     from here)
 *
 * History: this module was introduced 2026-05-09 after the
 * deliverable-canon-alignment review caught a contradiction between
 * `2026-05-09-revenue-sprint-197-deliverable-spec.md` (single
 * markdown body) and the three customer-facing surfaces (five-item
 * deliverable). The fix was making the three surfaces canonical and
 * aligning the spec; this module enforces parity going forward.
 *
 * Per the 2026-05-09 canon-protection binding, edits to this file MUST
 * run canon-audit and trace to the deliverable-truth surfaces above.
 *
 * Council ratification: #1 Editor (voice), #4 Engineering (SSOT), #5
 * Product (deliverable shape), #36 Conversion (page-promise parity),
 * #37 Consumer psychology (band differentiation legibility).
 */

import { bandBySlug, type AuditBandSlug } from './audit-pricing'

export interface ConciergeDeliverableItem {
  title: string
  body: string
}

/**
 * The five canonical deliverable items, keyed by band. Order is
 * preserved across all bands — sequenced for objection handling
 * (letter, CSV, plan, GS1, re-scan).
 *
 * The CSV row carries the band-specific worst-N count. Catalog-letter
 * scope branches Band 3 → representative-sample wording.
 */
export function conciergeDeliverableItems(
  slug: AuditBandSlug,
): ConciergeDeliverableItem[] {
  const band = bandBySlug(slug)
  const worstN = band?.deliverable.fullyDraftedFixCount ?? 10
  const isSample = band?.deliverable.auditScope === 'representative-sample'

  const letterBody = isSample
    ? 'We read a representative sample across your catalog variant patterns and the structural data model, then write a 1,500-word letter pointing at specific products by name with annotated screenshots. Not a generic template — a catalog letter about your store.'
    : 'We read your store product by product, then write a 1,500-word letter pointing at specific products by name with annotated screenshots. Not a generic template — a catalog letter about your store.'

  const csvBody = isSample
    ? `Every sampled product that has a problem, which problem, and the fix. For the worst ${worstN} offenders, we draft the full replacement text — title, description, metafield values — ready to paste into Shopify.`
    : `Every product that has a problem, which problem, and the fix. For the worst ${worstN} offenders, we draft the full replacement text — title, description, metafield values — ready to paste into Shopify.`

  return [
    {
      title: 'A 1,500-word letter',
      body: letterBody,
    },
    {
      title: 'A per-product fix CSV',
      body: csvBody,
    },
    {
      title: 'A 30-day fix sequence',
      body:
        'A one-page plan: what to do Day 1, Week 1, Week 2, Week 3-4 — ranked by how many products each fix unblocks first.',
    },
    {
      title: 'A GS1 UK barcode path',
      body:
        'The right GS1 office for where your business is registered, what to buy, and how to import the codes into Shopify without breaking your theme.',
    },
    {
      title: 'A 30-day re-scan',
      body:
        'Included. The scanner re-runs on day 30 and emails you a progress report, so you know whether the fixes moved the score.',
    },
  ]
}

/**
 * The post-purchase Resend body's deliverable line. Renders the
 * canonical five items as a single prose sentence so the email reads
 * as a confirmation, not a checklist. Branches on band scope (sample
 * vs full) per the catalog-letter rule.
 */
export function conciergeEmailDeliverableLine(slug: AuditBandSlug): string {
  const band = bandBySlug(slug)
  const worstN = band?.deliverable.fullyDraftedFixCount ?? 10
  const isSample = band?.deliverable.auditScope === 'representative-sample'
  if (isSample) {
    return `you get a written catalog letter, a per-product fix CSV (with the worst ${worstN} products drafted for you), a 30-day fix sequence, and the right GS1 UK barcode path. We read a representative sample across your catalog patterns plus the structural data model. No video, no call — just the data.`
  }
  return `you get a written catalog letter, a per-product fix CSV (with the worst ${worstN} products drafted for you), a 30-day fix sequence, and the right GS1 UK barcode path. No video, no call — just the data.`
}

/**
 * One-line summary for non-list surfaces (in-page summary, social
 * sharing, ops notification email body). Composed from the same
 * canonical items as the structured list and email-line.
 */
export function conciergeDeliverableSummary(slug: AuditBandSlug): string {
  const band = bandBySlug(slug)
  const worstN = band?.deliverable.fullyDraftedFixCount ?? 10
  const isSample = band?.deliverable.auditScope === 'representative-sample'
  const scopeLine = isSample
    ? 'We read a representative sample across your catalog'
    : 'We read every product'
  return `${scopeLine}, write a detailed catalog letter pointing at exactly what to fix, and send a per-product CSV with the worst ${worstN} products already drafted for you. A 30-day re-scan is included. Delivered within three working days.`
}

/**
 * The GS1 UK barcode-path section, rendered as markdown for the
 * operator catalog-letter export. UK default for Flintmere's launch
 * cohort (UK food merchants); non-UK merchants get an
 * `[OPERATOR_VERIFY]` placeholder so the operator pivots manually.
 *
 * Per `feedback_no_mailto_links_anywhere.md` — no mailto: links.
 * Non-affiliation note kept terminal per ADR 0022 §brand notes.
 */
export function gs1UkBarcodePathSection(opts: {
  /** ISO country code or 'unknown'. Defaults to 'GB' for the launch cohort. */
  jurisdiction?: 'GB' | 'unknown'
}): string {
  const jurisdiction = opts.jurisdiction ?? 'GB'

  if (jurisdiction !== 'GB') {
    return [
      '## GS1 barcode path',
      '',
      '`[OPERATOR_VERIFY: GS1 jurisdiction for this merchant]` — the GS1',
      "national member organisation depends on where the merchant's",
      'company is registered (GS1 US for the United States, GS1 EU member',
      "states by country, GS1 UK for the UK). Replace this section with the",
      "merchant's correct GS1 office, application URL, and pricing band.",
      '',
      'Flintmere is not affiliated with GS1.',
    ].join('\n')
  }

  return [
    '## GS1 UK barcode path',
    '',
    'Get product barcodes from GS1 UK Ltd, the UK arm of the global GS1',
    'standards body. Apply for a Company Prefix at gs1uk.org — the prefix',
    'gives a numeric range under the merchant\'s control, and the annual',
    'fee scales with turnover band. From the prefix, generate GTIN-13',
    'barcodes for each variant — one per SKU, never re-used.',
    '',
    'In Shopify, the GTIN goes on the variant\'s "Barcode (ISBN, UPC, GTIN,',
    'etc.)" field — not as a tag, not as a metafield. The Shopify products',
    'CSV import header is "Variant Barcode".',
    '',
    'For catalogs growing fast, mint GTINs in a spreadsheet using GS1\'s',
    'allocation rules (Company Prefix + variable-length item reference +',
    'check digit), then bulk-import via the products CSV.',
    '',
    'Flintmere is not affiliated with GS1.',
  ].join('\n')
}
