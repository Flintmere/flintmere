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
    subline:
      'Allergens, origin, certifications — written so Google Shopping, Amazon Fresh, Ocado and Deliveroo accept them.',
  },
  {
    id: 'beauty',
    label: 'Beauty.',
    eyebrow: 'BEAUTY',
    subline:
      'Ingredients, shelf life and skin type — readable by Google Shopping and the AI shopping agents.',
  },
  {
    id: 'apparel',
    label: 'Apparel.',
    eyebrow: 'APPAREL',
    subline:
      'Materials, care, sizing and origin — readable by Google Shopping and the AI shopping agents.',
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
    heading: 'Food + drink. Built for the channels you sell on.',
    bullets: [
      'Allergens get a structured field instead of a sentence in the description — so an agent filtering "dairy-free" can trust your structured data.',
      'Country of origin and certifications (organic, kosher, halal, PDO) get fixed values instead of free text — so Google Shopping doesn’t reject the listing.',
      'Every change to the [ standard ] will be published, dated and version-controlled — so you’ll be able to prove what your data meant the day a buyer saw it.',
    ],
    ctaLabel: 'See food catalog readiness →',
    ctaHref: '/for/food-and-drink',
  },
  beauty: {
    eyebrow: 'WHAT CHANGES FOR BEAUTY',
    heading: 'Beauty. Standard arriving after food lands.',
    bullets: [
      'Ingredient names go in a structured INCI field — so agents filtering "fragrance-free" or "no parabens" can trust your listing.',
      'Shelf life (PAO), volume and skin type get fixed values instead of buried in product copy — so listings stay valid as they age.',
      'Run a free scan now. You get the same [ scorecard ] as food merchants — the catalog standard arrives once food is shipped.',
    ],
    ctaLabel: 'See beauty catalog readiness →',
    ctaHref: '/for/beauty',
  },
  apparel: {
    eyebrow: 'WHAT CHANGES FOR APPAREL',
    heading: 'Apparel. Standard arriving after food lands.',
    bullets: [
      'Materials, care, sizing and origin get structured fields — so Google Shopping accepts UK and EU listings at the same time.',
      'Country of origin uses fixed codes instead of free text — so the same product works for GB and EU sales without re-keying.',
      'Run a free scan now. You get the same [ scorecard ] as food merchants — the catalog standard arrives once food is shipped.',
    ],
    ctaLabel: 'See apparel catalog readiness →',
    ctaHref: '/for/apparel',
  },
};
