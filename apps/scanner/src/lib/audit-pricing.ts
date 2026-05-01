// Single source of truth for the Concierge-audit band ladder.
//
// Per ADR 0022 (2026-05-01) — three-band SKU-based ladder for the
// Concierge audit. £97 flat floor retired; new floor £197.
//
// Phase 1a (this file) is groundwork: data structure + helpers, no
// behaviour change. Phase 1b atomically flips the API + page + webhook
// + email in one commit, importing from this module. No magnitudes are
// hardcoded outside this file once the cascade lands.
//
// Band 3 (5,001+ SKUs) routes to bespoke quoting (enquiry inbox), not
// direct Stripe checkout. The ladder is sales-attested at checkout —
// the merchant declares their band; Flintmere does not gate by API-
// verifying SKU count before payment (per ADR 0022 §Customer self-
// attestation). Mis-attestation is caught operationally within one
// working day of payment.

export type AuditBandSlug = 'band-1' | 'band-2' | 'band-3'

export interface AuditBand {
  slug: AuditBandSlug
  /** "Band 1", "Band 2", "Band 3" — display label. */
  label: string
  /** "Up to 1,500 SKUs" / "1,501–5,000 SKUs" / "5,001+ SKUs" — display range. */
  skuRangeLabel: string
  /** Inclusive lower SKU bound. */
  skuLowerBound: number
  /** Inclusive upper SKU bound; `null` for unbounded Band 3. */
  skuUpperBound: number | null
  /**
   * Stripe-charge amount in pence. `null` for Band 3 — bespoke
   * quoting routes to enquiry inbox, not direct checkout.
   */
  pricePence: number | null
  /** Display string ("£197" / "£397" / "From £597 — bespoke quote"). */
  priceDisplay: string
  /** Operator-time estimate per audit. */
  hoursEstimate: string
  /** Deliverable shape. */
  deliverable: {
    auditScope: 'full' | 'representative-sample'
    /**
     * Number of products for which the audit drafts the full
     * replacement title + description + metafield values, ready to
     * paste into Shopify.
     */
    fullyDraftedFixCount: number
  }
  /** True for Band 3 — routes to bespoke quoting flow, not Stripe checkout. */
  isBespoke: boolean
}

export const AUDIT_BANDS: AuditBand[] = [
  {
    slug: 'band-1',
    label: 'Band 1',
    skuRangeLabel: 'Up to 1,500 SKUs',
    skuLowerBound: 0,
    skuUpperBound: 1500,
    pricePence: 19700,
    priceDisplay: '£197',
    hoursEstimate: '3–5 hours',
    deliverable: {
      auditScope: 'full',
      fullyDraftedFixCount: 10,
    },
    isBespoke: false,
  },
  {
    slug: 'band-2',
    label: 'Band 2',
    skuRangeLabel: '1,501–5,000 SKUs',
    skuLowerBound: 1501,
    skuUpperBound: 5000,
    pricePence: 39700,
    priceDisplay: '£397',
    hoursEstimate: '5–7 hours',
    deliverable: {
      auditScope: 'full',
      fullyDraftedFixCount: 25,
    },
    isBespoke: false,
  },
  {
    slug: 'band-3',
    label: 'Band 3',
    skuRangeLabel: '5,001+ SKUs',
    skuLowerBound: 5001,
    skuUpperBound: null,
    pricePence: null,
    priceDisplay: 'From £597 — bespoke quote',
    hoursEstimate: '7+ hours',
    deliverable: {
      auditScope: 'representative-sample',
      fullyDraftedFixCount: 25,
    },
    isBespoke: true,
  },
]

/**
 * The team inbox used by the bespoke-quote flow. Routes to the team
 * (not the founder personally) per BUSINESS.md:19 — customer-facing
 * surfaces use the team-orientated framing. Distinct from the
 * SALES_EMAIL constant in `lib/pricing.ts`, which routes Agency /
 * Enterprise / Plus sales conversations to the founder.
 */
export const AUDIT_BESPOKE_ENQUIRY_EMAIL = 'hello@flintmere.com'

/**
 * The audit-band slug used as Stripe PaymentIntent metadata key. Lives
 * on the Charge under `metadata.audit_band`. Surfaced as a constant so
 * the API, webhook, and any reporting query reference the same key.
 */
export const STRIPE_BAND_METADATA_KEY = 'audit_band'

export function bandBySlug(slug: AuditBandSlug): AuditBand | undefined {
  return AUDIT_BANDS.find((b) => b.slug === slug)
}

/**
 * Returns the band a given SKU count falls into. Used as a recommended-
 * band hint on the /audit page when scan data is available — never as a
 * hard gate (per ADR 0022 §Customer self-attestation, the merchant
 * declares their band; Flintmere does not API-verify before payment).
 *
 * Negative SKU counts coerce to Band 1 (defensive — the recommendation
 * surface should never throw on bad input).
 */
export function bandForSkuCount(skuCount: number): AuditBand {
  const matched = AUDIT_BANDS.find(
    (band) =>
      skuCount >= band.skuLowerBound &&
      (band.skuUpperBound === null || skuCount <= band.skuUpperBound),
  )
  // AUDIT_BANDS is non-empty by construction; the fallback covers the
  // negative-input branch where no upper-bounded band matches.
  return matched ?? AUDIT_BANDS[0]!
}

/**
 * Renders the canonical price line for a band, used in marketing copy
 * and email templates. Standardises "£197" / "£397" / "From £597 —
 * bespoke quote" so no surface drifts from the ADR-ratified strings.
 */
export function bandPriceLine(slug: AuditBandSlug): string {
  return bandBySlug(slug)?.priceDisplay ?? '—'
}
