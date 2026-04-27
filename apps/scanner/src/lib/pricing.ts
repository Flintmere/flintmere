// Single source of truth for pricing tiers.
//
// Both /pricing and the homepage /#pricing strip read from this list so
// the two surfaces can never drift. If you change a price, a blurb, a
// feature line, or a CTA, change it here and both surfaces update.
//
// Price ladder (2026-04-26 revision — operator-confirmed restructure
// post-Agentic-Storefronts; spec at
// context/requirements/2026-04-26-pricing-restructure.md):
//   Free       £0         Scanner only, no signup.
//   Growth    £79/mo     SMB, <500 SKUs. Auto-fixes + monthly re-scan included.
//   Scale    £249/mo     Mid-market, 500–5,000 SKUs. Competitor benchmarking.
//   Agency   £499/mo     5–50 client stores. Unchanged — economic engine.
//   Plus     £1,500+/mo  Shopify Plus, 10,000+ SKUs. Replaces Enterprise.
//
// Plus tier rename (Enterprise → Plus) lands 2026-04-26: aligns with
// Shopify's own "Plus" tier and is more honest at this price point.
//
// CTA wiring is PARKED until ADR 0009 (Billing API shape) lands.
// We keep CTA metadata here so the data is council-approved and ready
// to wire the moment the billing rail is decided — do not render these
// in UI yet. See task #52 (parked, blocked by #55).

export type TierSlug = 'free' | 'growth' | 'scale' | 'agency' | 'plus'

export type TierCTAKind = 'link' | 'waitlist' | 'mailto'

export interface TierCTA {
  kind: TierCTAKind
  label: string
  href?: string // for 'link' and 'mailto'
  note?: string // small supporting line under the CTA
}

export interface Tier {
  slug: TierSlug
  name: string
  price: string
  unit?: string
  scope: string
  /** Short one-line pitch used on the homepage strip. */
  blurb: string
  /** Full feature list used on /pricing. */
  features: string[]
  /** Highlights the tier card on /pricing and /#pricing. */
  featured?: boolean
  /** PARKED — do not render until ADR 0009 lands. See task #52. */
  cta: TierCTA
}

// The canonical sales email. Routes to John. Keep in sync with
// DNS/Resend routing — if the alias moves, update it here in one place.
const SALES_EMAIL = 'john@flintmere.com'

function mailtoLink(subject: string): string {
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`
}

export const TIERS: Tier[] = [
  {
    slug: 'free',
    name: 'Free',
    price: '£0',
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
  {
    slug: 'growth',
    name: 'Growth',
    price: '£79',
    unit: '/mo',
    scope: 'SMB, <500 SKUs',
    blurb:
      'Under 500 SKUs. Auto-fixes included by default, monthly re-scan, LLM enrichments for catalogs up to 500 SKUs/month. 14-day trial.',
    featured: true,
    features: [
      'Unlimited audits',
      'Safe (Tier 1) auto-fixes — included',
      'Monthly automated re-scan',
      'LLM enrichments included for catalogs up to 500 SKUs/month',
      'Weekly drift alerts',
      '14-day trial',
    ],
    cta: {
      kind: 'waitlist',
      label: 'Join the waitlist →',
      note: 'Billing through Shopify. We email you when the Shopify app opens.',
    },
  },
  {
    slug: 'scale',
    name: 'Scale',
    price: '£249',
    unit: '/mo',
    scope: 'Mid-market, 500–5,000 SKUs',
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
      kind: 'waitlist',
      label: 'Join the waitlist →',
      note: 'Billing through Shopify. We email you when the Shopify app opens.',
    },
  },
  {
    slug: 'agency',
    name: 'Agency',
    price: '£499',
    unit: '/mo',
    scope: '5–50 client stores',
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
      label: 'Talk to the team →',
      href: mailtoLink('Flintmere Agency plan — enquiry'),
      note: 'Agencies get a call. We reply within two working days.',
    },
  },
  {
    slug: 'plus',
    name: 'Plus',
    price: '£1,500+',
    unit: '/mo',
    scope: 'Shopify Plus, 10,000+ SKUs',
    blurb:
      'Shopify Plus, 10,000+ SKUs. Custom attribute templates, dedicated support, monthly strategy call. Talk to us before buying a £2k/mo discovery platform — Plus is the diagnostic layer beneath it.',
    features: [
      'Everything in Scale',
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
      note: 'From £1,500/mo. Direct-invoice via Stripe. We reply within two working days.',
    },
  },
]

export function tierBySlug(slug: TierSlug): Tier | undefined {
  return TIERS.find((t) => t.slug === slug)
}
