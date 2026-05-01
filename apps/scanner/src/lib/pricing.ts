// Single source of truth for pricing tiers.
//
// Three-axis structure per ADR 0020 (per-channel pricing axis): vertical
// standard licensed (ADR 0016) × distribution mode (ADR 0016) × outbound
// channel surface area (ADR 0020). Magnitudes for forward tiers are
// WTP-pending — the willingness-to-pay study (target 30+ food-merchant
// responses, May–June 2026) calibrates `basePlatform` and
// `perChannelMultiplier`. Until that amendment lands, forward tiers
// carry `null` magnitudes and are not advertised publicly with prices.
//
// Two cohorts in TIERS:
//
//   Grandfathered  ('growth' / 'scale' / 'agency' / 'plus')
//                  legacyPrice populated from the previous volume ladder
//                  (£79 / £249 / £499 / from-£1,200-on-enquiry). Rendered
//                  on /billing only for in-flight subscriptions; not
//                  advertised to new sign-ups.
//
//   Forward        ('food-single' / 'food-agency' /
//                   'food-beauty-bundle-single' /
//                   'food-beauty-bundle-agency' / 'concierge-monthly')
//                  Structural metadata + copy ship now; magnitudes land
//                  in the post-WTP amendment to ADR 0020 (~June 2026).
//
// Free survives unchanged per ADR 0016 — basePlatform = 0 (known
// magnitude), tireKicker funnel.
//
// The Concierge one-off audit (£97, Stripe PaymentIntent at
// `api/concierge/checkout/route.ts:50`) is NOT a tier — it's a separate
// one-off product. The `concierge-monthly` retainer tier is the
// recurring counterpart per ADR 0016 §Launch ladder.
//
// The /pricing page rebuild (Day 5 of the 30-day plan, ADR 0020 §UI
// behaviour) hides forward tiers with magnitudes-pending posture and a
// "Pricing finalising — May–June 2026" page header. Day 4 (this file)
// is the data shape change only.

export type TierSlug =
  // Free + grandfathered (volume axis, retired for new sign-ups).
  | 'free'
  | 'growth'
  | 'scale'
  | 'agency'
  | 'plus'
  // Forward (vertical × distribution × per-channel axis, ADR 0020).
  | 'food-single'
  | 'food-agency'
  | 'food-beauty-bundle-single'
  | 'food-beauty-bundle-agency'
  | 'concierge-monthly'

export type TierVertical = 'food' | 'beauty' | 'apparel' | 'bundle' | 'all' | null

export type TierCTAKind = 'link' | 'waitlist' | 'mailto'

export interface TierCTA {
  kind: TierCTAKind
  label: string
  href?: string
  note?: string
}

/**
 * Magnitudes captured for grandfathered tiers only. Renders on
 * `/billing` for in-flight subscriptions; not advertised publicly.
 */
export interface LegacyPrice {
  amount: number
  unit: string
}

export interface Tier {
  slug: TierSlug
  name: string
  /** ADR 0016 axis 1. `null` for free + grandfathered (no vertical). */
  vertical: TierVertical
  /**
   * Base platform fee per month, before per-channel multipliers.
   * `null` while WTP-pending (forward tiers, ADR 0020). `0` for Free.
   */
  basePlatform: number | null
  /**
   * Additional £/mo per outbound channel above the base platform.
   * `null` while WTP-pending. `0` for tiers without per-channel pricing
   * (e.g. concierge retainer).
   */
  perChannelMultiplier: number | null
  /**
   * Bundle uplift when a second vertical is added on top of the base.
   * `null` for non-bundle tiers and while WTP-pending on bundle tiers.
   */
  verticalBundleAdditions: { secondVertical: number } | null
  /** ADR 0017 — Plus + private-beta tiers. Hidden from self-serve flows. */
  betaGated: boolean
  /** Set on grandfathered tiers only. */
  legacyPrice?: LegacyPrice
  scope: string
  blurb: string
  features: string[]
  /** Highlights the tier card. UI-only; magnitude-agnostic. */
  featured?: boolean
  cta: TierCTA
}

const SALES_EMAIL = 'john@flintmere.com'

function mailtoLink(subject: string): string {
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`
}

const WAITLIST_CTA: TierCTA = {
  kind: 'waitlist',
  label: 'Join the waitlist + tell us what you’d pay →',
  note: 'Pricing finalising — May–June 2026.',
}

export const TIERS: Tier[] = [
  // ── Free ────────────────────────────────────────────────────────────
  {
    slug: 'free',
    name: 'Free',
    vertical: null,
    basePlatform: 0,
    perChannelMultiplier: 0,
    verticalBundleAdditions: null,
    betaGated: false,
    scope: 'Tire-kickers, audit-only users',
    blurb:
      'Scorecard, read-only. One refresh per 30 days. For anyone who wants to see where they stand.',
    features: [
      'Scorecard, read-only',
      'One refresh per 30 days',
      'Summary score only, no issue-by-issue breakdown',
      'No auto-fixes',
      'No drift alerts',
    ],
    cta: {
      kind: 'link',
      label: 'Run the free scan →',
      href: '/scan',
    },
  },

  // ── Grandfathered (volume axis, retired for new sign-ups) ───────────
  {
    slug: 'growth',
    name: 'Growth',
    vertical: null,
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: false,
    legacyPrice: { amount: 79, unit: '/mo' },
    scope: 'SMB, <500 SKUs (legacy — grandfathered)',
    blurb:
      'Under 500 SKUs. Auto-fixes included by default, monthly re-scan, LLM enrichments for catalogs up to 500 SKUs/month.',
    featured: true,
    features: [
      'Unlimited audits',
      'Safe (Tier 1) auto-fixes — included',
      'Monthly automated re-scan',
      'LLM enrichments included for catalogs up to 500 SKUs/month',
      'Weekly drift alerts',
    ],
    cta: {
      kind: 'mailto',
      label: 'Existing customer billing →',
      href: mailtoLink('Flintmere Growth — billing query'),
      note: 'In-flight subscriptions only. New sign-ups: see the food vertical ladder.',
    },
  },
  {
    slug: 'scale',
    name: 'Scale',
    vertical: null,
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: false,
    legacyPrice: { amount: 249, unit: '/mo' },
    scope: 'Mid-market, 500–5,000 SKUs (legacy — grandfathered)',
    blurb:
      '500–5,000 SKUs. Competitor benchmarking, full-catalog LLM enrichments monthly, bulk-sync SLA.',
    features: [
      'Everything in Growth',
      'Competitor benchmarking',
      'LLM enrichments included for catalogs up to 5,000 SKUs/month',
      'Daily drift alerts',
      'Priority support',
      'Bulk sync SLA: 1K products within 2h',
    ],
    cta: {
      kind: 'mailto',
      label: 'Existing customer billing →',
      href: mailtoLink('Flintmere Scale — billing query'),
      note: 'In-flight subscriptions only. New sign-ups: see the food vertical ladder.',
    },
  },
  {
    slug: 'agency',
    name: 'Agency',
    vertical: null,
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: false,
    legacyPrice: { amount: 499, unit: '/mo' },
    scope: '5–50 client stores (legacy — grandfathered)',
    blurb:
      '25 client store seats, white-label reports, API access. The tier that runs most of the revenue.',
    features: [
      '25 client store seats',
      'White-label reports',
      'API access',
      'Per-client benchmarking',
      'Agency dashboard',
    ],
    cta: {
      kind: 'mailto',
      label: 'Existing customer billing →',
      href: mailtoLink('Flintmere Agency — billing query'),
      note: 'In-flight subscriptions only. New agency sign-ups: see the food agency ladder.',
    },
  },
  {
    slug: 'plus',
    name: 'Plus',
    vertical: null,
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: true,
    legacyPrice: { amount: 1200, unit: '/mo (from)' },
    scope: 'Shopify Plus, 10,000+ SKUs (private beta per ADR 0017)',
    blurb:
      'Shopify Plus, 10,000+ SKUs. Custom attribute templates, dedicated support, monthly strategy call. Anchor-only price; verified pricing returns when the embedded food build ships.',
    features: [
      'Custom attribute templates per vertical',
      'Dedicated support channel',
      'Monthly strategy call',
      'Per-contract SLAs',
      '50K SKU support',
    ],
    cta: {
      kind: 'mailto',
      label: 'Talk to the team →',
      href: mailtoLink('Flintmere Plus — enquiry'),
      note: 'Private beta. From £1,200/mo on enquiry. We reply within two working days.',
    },
  },

  // ── Forward (vertical × distribution × per-channel, ADR 0020) ──────
  {
    slug: 'food-single',
    name: 'Food — single store',
    vertical: 'food',
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: false,
    scope: 'A single Shopify food store',
    blurb:
      'The food regulatory standard, applied to your catalog. Per-channel pricing — pay for the channels you actually sell on.',
    features: [
      'Food regulatory standard, half-yearly cadence',
      'Allergen + ingredient + country-of-origin extraction',
      'Per-channel spec coverage (pay for what you use)',
      'Monthly drift re-scan',
      'GS1 UK barcode path',
    ],
    cta: WAITLIST_CTA,
  },
  {
    slug: 'food-agency',
    name: 'Food — agency',
    vertical: 'food',
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: false,
    scope: 'Agencies running 5+ food client stores',
    blurb:
      'Five client food stores included; per-store pricing thereafter. White-label reports, agency dashboard, per-client benchmarking.',
    features: [
      '5 food client stores included',
      'White-label reports',
      'Agency dashboard with cross-client score views',
      'API access',
      'Per-client benchmarking against the food cohort',
    ],
    cta: WAITLIST_CTA,
  },
  {
    slug: 'food-beauty-bundle-single',
    name: 'Food + Beauty — single store',
    vertical: 'bundle',
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: true, // beauty cadence not yet committed (ADR 0018)
    scope: 'Stores selling both food and beauty SKUs',
    blurb:
      'Two regulatory standards, one Shopify install. Bundle pricing — second vertical at a discount.',
    features: [
      'Food + Beauty regulatory standards',
      'Per-vertical extraction + verification flows',
      'Per-channel spec coverage (food + beauty)',
      'Monthly drift re-scan',
    ],
    cta: WAITLIST_CTA,
  },
  {
    slug: 'food-beauty-bundle-agency',
    name: 'Food + Beauty — agency',
    vertical: 'bundle',
    basePlatform: null,
    perChannelMultiplier: null,
    verticalBundleAdditions: null,
    betaGated: true, // beauty cadence not yet committed (ADR 0018)
    scope: 'Agencies running food + beauty client stores',
    blurb:
      'Two-vertical agency tier. Five client stores included across the bundle; per-store pricing thereafter.',
    features: [
      '5 client stores included (food + beauty mix)',
      'White-label reports',
      'Agency dashboard',
      'API access',
      'Per-vertical benchmarking',
    ],
    cta: WAITLIST_CTA,
  },
  {
    slug: 'concierge-monthly',
    name: 'Concierge retainer',
    vertical: 'food',
    basePlatform: null,
    perChannelMultiplier: 0, // retainer = single bundled service, not per-channel
    verticalBundleAdditions: null,
    betaGated: false,
    scope: 'Hands-on monthly service for one food store',
    blurb:
      'A continuous version of the £97 audit — monthly read of new SKUs, drift watch, ad-hoc letter responses to channel rejections.',
    features: [
      'Monthly read of new + changed SKUs',
      'Per-product fix CSV refreshed monthly',
      'Channel-rejection letter response within 2 working days',
      '30-day fix sequence updated each month',
      'Direct line to the team',
    ],
    cta: WAITLIST_CTA,
  },
]

/**
 * Returns true when a tier has displayable magnitude metadata —
 * either a known `basePlatform` (Free, post-WTP forward tiers) or
 * a `legacyPrice` (grandfathered).
 *
 * Surfaces that render only "live" pricing (the homepage tier strip,
 * marketing-page price cards) gate on this. The `/pricing` page in the
 * magnitudes-pending window renders forward tiers explicitly with
 * waitlist CTAs and bypasses this helper for the magnitudes-pending
 * cohort.
 */
export function tierIsRenderable(tier: Tier): boolean {
  return tier.basePlatform !== null || tier.legacyPrice !== undefined
}

export function tierBySlug(slug: TierSlug): Tier | undefined {
  return TIERS.find((t) => t.slug === slug)
}
