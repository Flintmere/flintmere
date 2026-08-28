import { bandPriceLine } from '@/lib/audit-pricing';
import { SCANNER_HOST } from '@/lib/host-routing';
import type { OgCardContent } from './og-card';

// Per-route OG card content. Copy is canon-traced (flintmere.com/methodology +
// /catalog-letter page + memory/VOICE.md). Bracket tokens are extractable
// nouns/numbers only — never verbs or articles (Noor #8 / VOICE bracket
// rule). The Catalog Letter price is pulled from audit-pricing
// (bandPriceLine), never hardcoded, so it can never drift from the source
// of truth. /pricing bakes NO number — the subscription ladder is
// WTP-pending (ADR 0016).

/** £197 Catalog Letter — amber product register, share-series continuity with /scan. */
export function letterCard(): OgCardContent {
  const price = bandPriceLine('band-1'); // '£197'
  return {
    variant: 'amber',
    eyebrowSuffix: 'The Catalog Letter',
    fontSize: 88,
    lines: [
      [{ text: 'A human reads' }],
      [{ text: 'the catalog. From ' }, { bracket: price }, { text: '.' }],
    ],
    footerUrl: `${SCANNER_HOST}/catalog-letter`,
    alt: `Flintmere Catalog Letter — a human-read catalog letter from ${price}.`,
  };
}

/** Public catalog standard — paper/editorial authority register. */
export function standardsCard(): OgCardContent {
  return {
    variant: 'paper',
    eyebrowSuffix: 'Catalog standard',
    fontSize: 84,
    lines: [
      [{ text: 'The public ' }, { bracket: 'standard' }, { text: ' for' }],
      [{ text: 'AI-readable food catalogs.' }],
    ],
    footerUrl: 'standards.flintmere.com',
    alt: 'Flintmere — the public standard for AI-readable food catalogs.',
  };
}

/** Pricing — paper register, deliberately no baked figure (ladder in transition). */
export function pricingCard(): OgCardContent {
  return {
    variant: 'paper',
    eyebrowSuffix: 'Pricing',
    fontSize: 108,
    lines: [
      [{ text: 'Start ' }, { bracket: 'free' }, { text: '.' }],
      [{ text: "Upgrade when you're ready." }],
    ],
    footerUrl: 'flintmere.com/pricing',
    alt: "Flintmere pricing — start free, upgrade when you're ready.",
  };
}

/** Methodology — paper register, mirrors the "what we measure / what we don't" frame. */
export function methodologyCard(): OgCardContent {
  return {
    variant: 'paper',
    eyebrowSuffix: 'Methodology',
    fontSize: 88,
    lines: [
      [{ bracket: 'Seven' }, { text: ' pillars.' }],
      [{ text: 'What we measure.' }],
      [{ text: "What we don't." }],
    ],
    footerUrl: 'flintmere.com/methodology',
    alt: "Flintmere methodology — seven pillars scoring food catalog data, what we measure and what we don't.",
  };
}

/** All nav-route cards — used by the content test suite. */
export const OG_CARDS = [letterCard, standardsCard, pricingCard, methodologyCard];
