import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Results } from './Results';
import type { ScanResult } from './types';

/**
 * Regression guard for the renormalisation bug: the "What we checked" grid
 * printed `p.score` raw, both as the label percentage and as the bar width.
 * Every pillar carried `maxScore: 100` until `scoreIdentifiers` started
 * dropping the 75 barcode points out of its denominator when the barcode
 * pass read too little to speak — from then on a store that was perfect on
 * its 25 assessable points rendered "Product IDs · 25%" with a 25%-full bar,
 * while `computeComposite` and /score/[shop] both credited it 100%.
 *
 * Rendered rather than inspected: the bar width is a style value, not a text
 * node, and it was the half that a label-only assertion would have missed.
 * `useLiveSample`'s effect does not run under `renderToStaticMarkup`, so no
 * fetch is issued (same approach as app/bot/components/Passport.test.ts).
 */
function makeResult(
  pillars: ScanResult['pillars'] = [
    { pillar: 'identifiers', score: 20, maxScore: 25, locked: false },
  ],
): ScanResult {
  return {
    id: 'scan_1',
    shopDomain: 'meridian-coffee.myshopify.com',
    score: 64,
    grade: 'C',
    gtinlessCeiling: 82,
    productCount: 412,
    pillars,
    issues: [],
  };
}

describe('Results — pillar percentages', () => {
  it('renders a renormalised percentage, not the raw score, when barcodes were not assessable', () => {
    const html = renderToStaticMarkup(
      createElement(Results, { result: makeResult() }),
    );
    expect(html).toContain('Product IDs');
    expect(html).toContain('80%');
    expect(html).not.toContain('20%');
  });

  it('renders the bar width from the same renormalised percentage', () => {
    const html = renderToStaticMarkup(
      createElement(Results, { result: makeResult() }),
    );
    expect(html).toContain('width:80%');
    expect(html).not.toContain('width:20%');
  });

  it('leaves an ordinary 100-point pillar unchanged', () => {
    const html = renderToStaticMarkup(
      createElement(
        Results,
        {
          result: makeResult([
            { pillar: 'titles', score: 71, maxScore: 100, locked: false },
          ]),
        },
      ),
    );
    expect(html).toContain('71%');
    expect(html).toContain('width:71%');
  });

  it('renders 0%, not NaN% or a full bar, when nothing was assessable', () => {
    const html = renderToStaticMarkup(
      createElement(
        Results,
        {
          result: makeResult([
            { pillar: 'identifiers', score: 0, maxScore: 0, locked: false },
          ]),
        },
      ),
    );
    expect(html).toContain('width:0%');
    expect(html).not.toContain('NaN');
  });
});
