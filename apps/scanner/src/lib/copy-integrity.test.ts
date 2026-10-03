import { readFileSync, readdirSync } from 'node:fs';
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

// Every issue code packages/scoring can emit needs an entry in
// issueCodeToFounderSpeak, or the scanner falls through to the raw
// `issue.description` (Results.tsx and report-email.ts both spell that
// fallback `?? issue.description`). Nothing enforced that, and eight codes
// have no entry — all eight carry the retired agent-behaviour language the
// FounderSpeak rule above exists to keep away from merchants.
//
// They are LATENT, not live: all three owning pillars (mapping, attributes,
// checkout-eligibility) are install-gated, and no production caller passes
// an admin context, so none of the eight can reach a merchant today. The
// moment one does — an admin context, or a pillar ungated — its raw
// description ships. Rewriting those eight strings is its own PR; this
// guard exists so a NINTH cannot be added silently.
//
// The code set is read out of the scoring source rather than hand-listed:
// a hand-list drifts exactly the way the eight below did.
const SCORING_SRC = new URL(
  '../../../../packages/scoring/src',
  import.meta.url,
).pathname;

function emittedIssueCodes(): string[] {
  const files = readdirSync(SCORING_SRC, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.ts'))
    .map((f) => `${SCORING_SRC}/${f}`);
  const codes = new Set<string>();
  for (const file of files) {
    for (const m of readFileSync(file, 'utf8').matchAll(/\bcode: '([a-z0-9-]+)'/g)) {
      codes.add(m[1]!);
    }
  }
  return [...codes].sort();
}

// The eight known gaps, as of 2026-09-11. Shrink this list — never grow it.
// Adding a code here is adding a merchant-facing string nobody wrote.
const FOUNDER_SPEAK_GAPS: readonly string[] = [
  // mapping.ts
  'missing-gmc-category',
  'gmc-too-shallow',
  'no-standard-taxonomy',
  // attributes.ts
  'missing-structured-attributes',
  'low-attribute-depth',
  // checkout.ts
  'legacy-customer-accounts',
  'missing-inventory-signals',
  'incoherent-pricing',
];

describe('issueCodeToFounderSpeak covers every code the scorer emits', () => {
  const emitted = emittedIssueCodes();

  it('reads the scoring source at all (guard is not vacuous)', () => {
    expect(emitted.length).toBeGreaterThan(20);
    expect(emitted).toContain('missing-gtin');
  });

  it('has an entry for every emitted code except the documented gaps', () => {
    const uncovered = emitted.filter(
      (code) =>
        !(code in issueCodeToFounderSpeak) &&
        !FOUNDER_SPEAK_GAPS.includes(code),
    );
    expect(uncovered).toEqual([]);
  });

  it('keeps the gap list honest — every entry is still emitted and still uncovered', () => {
    // Fails when someone writes one of the eight strings without deleting
    // its line here, and when a pillar stops emitting a code on the list.
    const stale = FOUNDER_SPEAK_GAPS.filter(
      (code) => code in issueCodeToFounderSpeak || !emitted.includes(code),
    );
    expect(stale).toEqual([]);
  });
});
