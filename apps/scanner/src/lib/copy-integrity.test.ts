import { describe, expect, it } from 'vitest';
import {
  REVENUE_LEDE_DISCLOSURE,
  SUPPRESSION_LEDE_SUBHEAD,
  sampledRevenueDisclosure,
} from './copy';

// Phase 4 of the strengthening plan — regression guard for the 2026-05-05
// vertical-blind disclosure bug (commit 6cbce20). Disclosure-tier copy
// (the trust-anchor captions that ship on EVERY scan, regardless of
// merchant vertical) must not enumerate signal types specific to one
// vertical. A merchant scanning an apparel store should never see the
// word "allergen" in the disclosure.
//
// Scope: this guard targets the cross-vertical disclosure constants /
// functions only. Signal-specific copy (`suppressionLede`,
// `suppressionSignalLine`) is allowed to mention vertical-specific
// terms because it's only rendered when the matching signal fires
// upstream; the engine, not the copy, gates vertical exposure.

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
  it('REVENUE_LEDE_DISCLOSURE names no vertical-specific signal type', () => {
    expect(findVerticalLeak(REVENUE_LEDE_DISCLOSURE)).toEqual([]);
  });

  it('SUPPRESSION_LEDE_SUBHEAD names no vertical-specific signal type', () => {
    expect(findVerticalLeak(SUPPRESSION_LEDE_SUBHEAD)).toEqual([]);
  });

  it('sampledRevenueDisclosure() output names no vertical-specific signal type — small sample', () => {
    const out = sampledRevenueDisclosure({
      sampledCount: 250,
      actualProductCount: 1_000,
    });
    expect(findVerticalLeak(out)).toEqual([]);
  });

  it('sampledRevenueDisclosure() output names no vertical-specific signal type — null actual count', () => {
    const out = sampledRevenueDisclosure({
      sampledCount: 1_000,
      actualProductCount: null,
    });
    expect(findVerticalLeak(out)).toEqual([]);
  });
});
