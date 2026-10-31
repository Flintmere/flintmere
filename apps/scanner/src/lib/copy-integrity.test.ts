import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BANNED_JARGON,
  issueCodeToFounderSpeak,
  pillarExplanationCustomerFacing,
  pillarLabelCustomerFacing,
} from './copy';
// scanScopeLine moved out of copy.ts into its own module on main (#114);
// the suppression-wedge exports this file used to guard left with ADR 0030.
import { scanScopeLine } from './copy-scan-scope';

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

// Regression guard — AI-agent MECHANISM claims in customer-facing source.
//
// ADR 0029 premise 1 grades "what an AI agent does with your catalog"
// Unmeasurable, and memory/VOICE.md §AI-agent outcome claims bans asserting
// it. The claim kept coming back in new places: #112 and #121 cleared the
// surfaces ADR 0030 §Affects listed, #122 cleared the ones the 2026-09-09
// spec §4.2 listed, and FIVE more survived both — including
// `score/[shop]/page.tsx`'s bottom CTA, which neither list named, and
// `research/BodyTop.tsx:228`, which §4.2 did name and an audit keyed on the
// wrong search terms still missed.
//
// A list of line numbers cannot catch the next one. This can.
//
// Deliberately NARROW: it matches the specific banned constructions, not
// every sentence containing "agent". Describing what OUR crawler reads
// ("FlintmereBot reads the JSON-LD block"), naming the Crawlability pillar,
// or stating that a field is machine-readable are all legitimate and must
// keep passing — a guard that fires on those gets disabled, and then guards
// nothing.
describe('no AI-agent mechanism claims in customer-facing copy', () => {
  const BANNED_CLAIM_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
    [/checks?\s+(an?\s+)?AI\s+shopping\s+agents?\s+(runs?|uses?)/i, 'asserts agents run our checks'],
    [/AI\s+shopping\s+agents?\s+(run|use)\b/i, 'asserts what AI shopping agents run or use'],
    [/agents?\s+run\s+constantly/i, 'unevidenced frequency claim about agents'],
    [/before\s+(it|they)\s+recommends?\b/i, 'asserts an agent recommendation gate'],
    [/skips?\s+your\s+entire\s+catalog/i, 'unmeasurable exclusion outcome'],
    [/invisible\s+to\s+(every\s+)?(AI|GPT|agent)/i, 'retired "invisible" claim (ADR 0029 §5)'],
  ];

  // Customer-facing only. Admin console, API internals and tests are out of
  // scope — they are not read by a merchant.
  // src/lib joined on 2026-10-31: methodology-data.ts lives here, ships
  // straight onto flintmere.com/methodology, and was carrying "the agents
  // that aren't allowed to crawl your store can't recommend your products"
  // the whole time this guard was green.
  const ROOTS = ['src/app', 'src/components', 'src/lib'];
  const EXCLUDE = /(\.test\.|\/admin\/|\/api\/|__tests__)/;

  function customerFacingFiles(): string[] {
    const out: string[] = [];
    for (const root of ROOTS) {
      for (const f of readdirSync(root, { recursive: true, encoding: 'utf8' })) {
        const p = `${root}/${f}`;
        if (!/\.tsx?$/.test(p) || EXCLUDE.test(p)) continue;
        out.push(p);
      }
    }
    return out;
  }

  it('finds files to check (guards against a silently empty sweep)', () => {
    expect(customerFacingFiles().length).toBeGreaterThan(50);
  });

  it.each(BANNED_CLAIM_PATTERNS.map(([re, why]) => ({ re, why })))(
    'no customer-facing file $why',
    ({ re }) => {
      const hits: string[] = [];
      for (const file of customerFacingFiles()) {
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            // Comments are not customer-facing, and several of them quote a
            // retired claim precisely to record why it went. Guarding those
            // would force us to stop documenting our own corrections.
            const t = line.trim();
            if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
            if (re.test(line)) hits.push(`${file}:${i + 1} ${t.slice(0, 100)}`);
          });
      }
      expect(hits).toEqual([]);
    },
  );
});
