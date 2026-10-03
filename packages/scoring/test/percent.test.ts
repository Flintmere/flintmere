import { describe, expect, it } from 'vitest';
import { pillarPercent } from '../src/utils/percent.js';

// `maxScore` is not always 100: `scoreIdentifiers` drops the 75 barcode
// points out of the denominator when the barcode pass read too little to
// speak (pillars/identifiers.ts). Four display sites printed `score`
// directly, so a store perfect on its 25 assessable points was shown
// "25%" while `computeComposite` credited it 100% — up to 75 points of
// disagreement about one scan, across two Flintmere surfaces. This suite
// is the unit-level half of that guard; Results.test.ts, report-email.test.ts
// and app/score/[shop]/page.test.ts cover the display sites.
describe('pillarPercent', () => {
  it('renormalises against maxScore, not 100', () => {
    expect(pillarPercent({ score: 20, maxScore: 25 })).toBe(80);
  });

  it('reports a full assessable pillar as 100, not as its raw score', () => {
    expect(pillarPercent({ score: 25, maxScore: 25 })).toBe(100);
  });

  it('is the identity (rounded) on the ordinary 100-point denominator', () => {
    expect(pillarPercent({ score: 48, maxScore: 100 })).toBe(48);
    expect(pillarPercent({ score: 0, maxScore: 100 })).toBe(0);
    expect(pillarPercent({ score: 100, maxScore: 100 })).toBe(100);
  });

  it('rounds to the nearest whole percent', () => {
    // 44.33 / 100 — the live identifiers score from the 2026-09-10 gate scan.
    expect(pillarPercent({ score: 44.33, maxScore: 100 })).toBe(44);
    expect(pillarPercent({ score: 12.5, maxScore: 25 })).toBe(50);
    expect(pillarPercent({ score: 2, maxScore: 3 })).toBe(67);
  });

  it('returns 0 rather than Infinity or NaN when nothing was assessable', () => {
    // The guard that matters: a division here would render "Infinity%" or
    // "NaN%" to a merchant, and `width: NaN%` is an invalid CSS declaration
    // the browser drops — the bar would silently render full-width.
    expect(pillarPercent({ score: 0, maxScore: 0 })).toBe(0);
    expect(pillarPercent({ score: 10, maxScore: 0 })).toBe(0);
    expect(pillarPercent({ score: 10, maxScore: Number.NaN })).toBe(0);
    expect(pillarPercent({ score: 10, maxScore: -5 })).toBe(0);
  });
});
