// Single source of truth for pricing tiers.
//
// Both /pricing and the homepage /#pricing strip read from this list so
// the two surfaces can never drift. If you change a price, a blurb, a
// feature line, or a CTA, change it here and both surfaces update.
//
// Price ladder (2026-04 revision — see commit history):
//   Free       £0       Scanner only, no signup.
//   Growth    £59/mo   SMB, <500 SKUs.
//   Scale    £159/mo   Mid-market, 500–5,000 SKUs.
//   Agency   £499/mo   5–50 client stores.
//   Enterprise £599+   Shopify Plus, 10,000+ SKUs.
//
// CTA wiring is PARKED until ADR 0009 (Billing API shape) lands.
// We keep CTA metadata here so the data is council-approved and ready
// to wire the moment the billing rail is decided — do not render these
// in UI yet. See task #52 (parked, blocked by #55).

export type TierSlug = 'free' | 'growth' | 'scale' | 'agency' | 'enterprise'

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
    price: '£59',
    unit: '/mo',
    scope: 'SMB, <500 SKUs',
    blurb:
      'Under 500 SKUs. Unlimited audits, safe auto-fixes, LLM enrichments for catalogs up to 500 SKUs/month. First month £29 for scanner users.',
    featured: true,
    features: [
      'Unlimited audits',
      'Safe (Tier 1) auto-fixes',
      'LLM enrichments included for catalogs up to 500 SKUs/month',
      'Weekly drift alerts',
      'First month £29 for scanner users',
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
    price: '£159',
    unit: '/mo',
    scope: 'Mid-market, 500–5,000 SKUs',
    blurb:
      '500–5,000 SKUs. LLM enrichments for your full catalog monthly, competitor benchmarking, bulk-sync SLA.',
    features: [
      'Everything in Growth',
      'LLM enrichments included for catalogs up to 5,000 SKUs/month',
      'Competitor benchmarking',
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
      label: 'Talk to John →',
      href: mailtoLink('Flintmere Agency plan — enquiry'),
      note: 'Agencies get a call. John replies within two working days.',
    },
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: '£599+',
    unit: '/mo',
    scope: 'Shopify Plus, 10,000+ SKUs',
    blurb:
      'Shopify Plus, 10,000+ SKUs. Custom attribute templates, dedicated support, monthly strategy call. Contact sales.',
    features: [
      'Custom attribute templates per vertical',
      'Dedicated support channel',
      'Monthly strategy call',
      'Per-contract SLAs',
      'Contact sales',
    ],
    cta: {
      kind: 'mailto',
      label: 'Talk to John →',
      href: mailtoLink('Flintmere Enterprise — enquiry'),
      note: 'Direct-invoice via Stripe. John usually replies within two working days.',
    },
  },
]

export function tierBySlug(slug: TierSlug): Tier | undefined {
  return TIERS.find((t) => t.slug === slug)
}
