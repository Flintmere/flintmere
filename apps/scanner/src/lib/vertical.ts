/**
 * Vertical IDs + per-surface vertical lists.
 *
 * URL contract: ?vertical=food|beauty|apparel|bundle (default = food).
 * - Homepage uses 3 verticals (food, beauty, apparel) — no `bundle`.
 * - /pricing uses 4 verticals (food, beauty, apparel, bundle) — `bundle`
 *   per ADR 0016 (Food + Beauty bundle £159 single / £499 agency).
 *
 * URL state coupling lives in per-app code (apps/scanner/src/lib/use-vertical.ts)
 * because next/navigation is App-Router-specific; packages/ui stays
 * routing-framework-agnostic per Phase B plan.
 */

import type { Vertical } from '@flintmere/ui';

export type HomepageVerticalId = 'food' | 'beauty' | 'apparel';
export type PricingVerticalId = HomepageVerticalId | 'bundle';

const HOMEPAGE_IDS: readonly HomepageVerticalId[] = ['food', 'beauty', 'apparel'];
const PRICING_IDS: readonly PricingVerticalId[] = ['food', 'beauty', 'apparel', 'bundle'];

/**
 * Coerce an unknown URL param into a homepage vertical id; falls back to
 * "food" (the default per ADR 0015 spearhead vertical) for unknown / missing.
 */
export function parseHomepageVertical(raw: string | null | undefined): HomepageVerticalId {
  if (raw && (HOMEPAGE_IDS as readonly string[]).includes(raw)) {
    return raw as HomepageVerticalId;
  }
  return 'food';
}

/**
 * Coerce an unknown URL param into a pricing vertical id; falls back to
 * "food" for unknown / missing.
 */
export function parsePricingVertical(raw: string | null | undefined): PricingVerticalId {
  if (raw && (PRICING_IDS as readonly string[]).includes(raw)) {
    return raw as PricingVerticalId;
  }
  return 'food';
}

/**
 * Homepage 3-card list — copy direction per
 * context/design/specs/2026-04-26-homepage-food-first.md §Section 3.
 * Final wording = Copy Council pass; Phase B ships placeholders.
 */
export const HOMEPAGE_VERTICALS: ReadonlyArray<Vertical> = [
  {
    id: 'food',
    label: 'Food + drink.',
    eyebrow: 'FOOD + DRINK',
    subline: 'FSA Big-14 + ISO + PDO + certifications. Spearhead vertical.',
  },
  {
    id: 'beauty',
    label: 'Beauty.',
    eyebrow: 'BEAUTY',
    subline: 'Standard in development. Free scan available.',
  },
  {
    id: 'apparel',
    label: 'Apparel.',
    eyebrow: 'APPAREL',
    subline: 'Standard in development. Free scan available.',
  },
];

/**
 * Pricing 4-card list — copy direction per
 * context/design/specs/2026-04-26-pricing-food-first.md §Section 3.
 * Final wording = Copy Council pass; Phase B ships placeholders.
 */
export const PRICING_VERTICALS: ReadonlyArray<Vertical> = [
  {
    id: 'food',
    label: 'Food + drink.',
    eyebrow: 'FOOD + DRINK',
    subline: 'Single store £99/mo · agency £349/mo. Spearhead vertical.',
  },
  {
    id: 'beauty',
    label: 'Beauty.',
    eyebrow: 'BEAUTY',
    subline: 'Standard in development. Talk to the Flintmere team.',
  },
  {
    id: 'apparel',
    label: 'Apparel.',
    eyebrow: 'APPAREL',
    subline: 'Standard in development. Talk to the Flintmere team.',
  },
  {
    id: 'bundle',
    label: 'Food + Beauty.',
    eyebrow: 'BUNDLE',
    subline: 'Single £159/mo · agency £499/mo. Per ADR 0016.',
  },
];

/**
 * Per-vertical content for the homepage picker-driven content block (§Section 4
 * of the homepage spec). Final copy = Copy Council pass; placeholders only.
 */
export interface HomepageVerticalContent {
  eyebrow: string;
  heading: string;
  bullets: readonly string[];
  ctaLabel: string;
  ctaHref: string;
}

export const HOMEPAGE_VERTICAL_CONTENT: Record<HomepageVerticalId, HomepageVerticalContent> = {
  food: {
    eyebrow: 'WHAT CHANGES FOR FOOD',
    heading: 'Food + drink. The spearhead vertical.',
    bullets: [
      'FSA Big-14 allergens encoded as structured Shopify metafields, not free-text in product descriptions',
      'Country-of-origin to ISO 3166-1; certifications (PDO / PGI / organic / kosher / halal) as controlled vocabulary, not as ingredient-list noise',
      'Standard published at standards.flintmere.com/food/v1 — half-yearly cadence + AI-assisted diff log between publications',
    ],
    ctaLabel: 'See food catalog readiness →',
    ctaHref: '/for/food-and-drink',
  },
  beauty: {
    eyebrow: 'WHAT CHANGES FOR BEAUTY',
    heading: 'Beauty. Standard in development.',
    bullets: [
      'INCI ingredient names + PAO + skin-type as structured fields',
      'Standard in development — beauty cadence not yet committed',
      "Run a free scan now; we'll publish your gaps against the food canonical example",
    ],
    ctaLabel: 'See beauty catalog readiness →',
    ctaHref: '/for/beauty',
  },
  apparel: {
    eyebrow: 'WHAT CHANGES FOR APPAREL',
    heading: 'Apparel. Standard in development.',
    bullets: [
      'Materials, care, country-of-origin, sizing as structured fields',
      'Standard in development — apparel cadence not yet committed',
      "Run a free scan now; we'll publish your gaps against the food canonical example",
    ],
    ctaLabel: 'See apparel catalog readiness →',
    ctaHref: '/for/apparel',
  },
};
