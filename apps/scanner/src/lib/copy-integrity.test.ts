import { describe, expect, it } from 'vitest';
import {
  BANNED_JARGON,
  REVENUE_LEDE_DISCLOSURE,
  SUPPRESSION_LEDE_SUBHEAD,
  issueCodeToFounderSpeak,
  pillarExplanationCustomerFacing,
  pillarLabelCustomerFacing,
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

// The FounderSpeak rule (copy.ts, above issueCodeToFounderSpeak) caps a
// title at 8 words and a consequence at 20, and forbids claims about what
// an AI agent does. These strings ship in the report email body — the
// evidence rows are built from score.issues.slice(0, 3) with NO severity
// filter, so any entry here can reach a merchant, medium ones included.
// Nothing enforced the rule until a review found a 22-word consequence and
// thirteen agent-behaviour claims still in the table.
const BANNED_IN_CONSEQUENCE: readonly string[] = [
  'pillar',
  'score',
  'ceiling',
  // Retired positioning: we cannot cite a source for agent behaviour.
  'agent',
  'invisible',
];

function words(text: string): number {
  return text.trim().split(/\s+/).length;
}

describe('issueCodeToFounderSpeak conforms to the FounderSpeak rule', () => {
  const entries = Object.entries(issueCodeToFounderSpeak);

  it('covers every entry (guard is not vacuous)', () => {
    expect(entries.length).toBeGreaterThan(10);
  });

  it.each(entries)('%s: title is ≤ 8 words', (_code, speak) => {
    expect(words(speak.title)).toBeLessThanOrEqual(8);
  });

  it.each(entries)('%s: consequence is ≤ 20 words', (_code, speak) => {
    expect(words(speak.consequence)).toBeLessThanOrEqual(20);
  });

  it.each(entries)('%s: consequence claims no agent behaviour', (_code, speak) => {
    const lower = speak.consequence.toLowerCase();
    const hits = BANNED_IN_CONSEQUENCE.filter((term) => lower.includes(term));
    expect(hits).toEqual([]);
  });
});

// The seven dimension names + definitions render in the results grid
// (Results.tsx), on /score/[shop], AND in the report email — they are not
// an internal label set. Two labels ("Agent Checkout Readiness", "AI Agent
// Access") and five definitions asserted agent behaviour until 2026-09-10.
// The label rule above pillarLabelCustomerFacing caps a label at 4 words
// and bans BANNED_JARGON; the definitions inherit the FounderSpeak ban on
// agent-behaviour claims because they ship in the same email body.
describe('pillar labels + definitions claim no agent behaviour', () => {
  const labels = Object.entries(pillarLabelCustomerFacing);
  const explanations = Object.entries(pillarExplanationCustomerFacing);

  it('covers all seven pillars (guard is not vacuous)', () => {
    expect(labels).toHaveLength(7);
    expect(explanations).toHaveLength(7);
  });

  it.each(labels)('%s: label is ≤ 4 words', (_pillar, label) => {
    expect(words(label)).toBeLessThanOrEqual(4);
  });

  it.each(labels)('%s: label names no agent behaviour', (_pillar, label) => {
    const lower = label.toLowerCase();
    expect(BANNED_IN_CONSEQUENCE.filter((t) => lower.includes(t))).toEqual([]);
  });

  it.each(labels)('%s: label uses no banned jargon', (_pillar, label) => {
    const lower = label.toLowerCase();
    expect(BANNED_JARGON.filter((t) => lower.includes(t.toLowerCase()))).toEqual(
      [],
    );
  });

  it.each(explanations)(
    '%s: definition claims no agent behaviour',
    (_pillar, explanation) => {
      const lower = explanation.toLowerCase();
      expect(BANNED_IN_CONSEQUENCE.filter((t) => lower.includes(t))).toEqual([]);
    },
  );

  it.each(explanations)('%s: definition is one line, ≤ 20 words', (_p, text) => {
    expect(text).not.toContain('\n');
    expect(words(text)).toBeLessThanOrEqual(20);
  });
});
