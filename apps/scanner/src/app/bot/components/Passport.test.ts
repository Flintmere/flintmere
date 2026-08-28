import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Passport } from './Passport';

// Regression guard for ADR 0028 Shipment 2 Task A1. Passport carries the
// scanner host TWICE — once in the `USER_AGENT` constant (aria-label) and
// once as separate display JSX (the visible "+URL" text) — both now read
// from SCANNER_HOST rather than their own literal. Assertion stays a
// literal host on purpose (per the shipment-2 plan).
describe('Passport (bot UA display)', () => {
  it('renders the published bot UA on the scanner host, in both the label and the visible text', () => {
    const html = renderToStaticMarkup(Passport());
    expect(html).toContain('FlintmereBot/1.0 (+https://audit.flintmere.com/bot)');
    expect(html).toContain('https://audit.flintmere.com/bot');
  });
});
