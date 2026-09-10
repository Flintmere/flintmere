import { describe, expect, it } from 'vitest';
import { scanScopeLine } from './copy';

// Phase 4 of the strengthening plan — regression guard for the 2026-05-05
// vertical-blind disclosure bug (commit 6cbce20). Disclosure-tier copy
// (the trust-anchor captions that ship on EVERY scan, regardless of
// merchant vertical) must not enumerate signal types specific to one
// vertical. A merchant scanning an apparel store should never see the
// word "allergen" in the disclosure.
//
// Scope note (2026-09-10, ADR 0030): this guard originally covered
// REVENUE_LEDE_DISCLOSURE, SUPPRESSION_LEDE_SUBHEAD and
// sampledRevenueDisclosure(). All three left with the suppression wedge.
// The guard itself is unrelated to that retirement — it exists for a
// cross-vertical leak bug — so it is repointed at `scanScopeLine`, the
// disclosure-tier copy that survives, rather than deleted alongside the
// wedge. Re-add cases here whenever new always-on disclosure copy ships.

const VERTICAL_SPECIFIC_TERMS: readonly string[] = [
  // food-specific signal names
  'allergen',
  'gluten',
  'lactose',
  'ingredient',
  'shelf life',
  // apparel-specific signal names
  'sizing',
  'fabric',
  'colourway',
  // beauty-specific signal names
  'shade',
  'spf',
];

function findVerticalLeak(text: string): string[] {
  const lower = text.toLowerCase();
  return VERTICAL_SPECIFIC_TERMS.filter((term) => lower.includes(term));
}

describe('copy.ts cross-vertical disclosure guard', () => {
  it('scanScopeLine() names no vertical-specific signal type — untruncated', () => {
    const out = scanScopeLine({
      sampledCount: 250,
      actualProductCount: 250,
      truncated: false,
    });
    expect(findVerticalLeak(out)).toEqual([]);
  });

  it('scanScopeLine() names no vertical-specific signal type — truncated with known total', () => {
    const out = scanScopeLine({
      sampledCount: 250,
      actualProductCount: 1_000,
      truncated: true,
    });
    expect(findVerticalLeak(out)).toEqual([]);
  });

  it('scanScopeLine() names no vertical-specific signal type — truncated, total unknown', () => {
    const out = scanScopeLine({
      sampledCount: 1_000,
      actualProductCount: null,
      truncated: true,
    });
    expect(findVerticalLeak(out)).toEqual([]);
  });
});
