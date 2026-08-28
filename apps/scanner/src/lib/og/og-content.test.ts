import { describe, it, expect } from 'vitest';
import { bandPriceLine } from '@/lib/audit-pricing';
import { letterCard, pricingCard, OG_CARDS } from './og-content';
import type { ClaimSegment } from './og-card';

const isBracket = (s: ClaimSegment): s is { bracket: string } => 'bracket' in s;

describe('og card content', () => {
  it('letter card pulls its price from the audit-pricing source of truth', () => {
    const card = letterCard();
    const brackets = card.lines.flat().filter(isBracket);
    expect(brackets.some((b) => b.bracket === bandPriceLine('band-1'))).toBe(true);
    expect(card.eyebrowSuffix).toBe('The Catalog Letter');
    const textSegments = card.lines
      .flat()
      .filter((s): s is { text: string } => 'text' in s)
      .map((s) => s.text);
    expect(textSegments).toEqual(['A human reads', 'the catalog. From ', '.']);
    expect(card.footerUrl).toBe('catalog.flintmere.com/catalog-letter');
  });

  it('every card carries at least one non-empty bracket token', () => {
    for (const card of OG_CARDS) {
      const brackets = card().lines.flat().filter(isBracket);
      expect(brackets.length).toBeGreaterThanOrEqual(1);
      for (const b of brackets) expect(b.bracket.trim().length).toBeGreaterThan(0);
    }
  });

  it('every card has meaningful alt text distinct from its eyebrow', () => {
    for (const card of OG_CARDS) {
      const c = card();
      expect(c.alt.trim().length).toBeGreaterThan(10);
      expect(c.alt).not.toBe(c.eyebrowSuffix);
    }
  });

  it('pricing card bakes no currency figure (subscription ladder in transition)', () => {
    expect(JSON.stringify(pricingCard())).not.toMatch(/£\s?\d/);
  });
});
