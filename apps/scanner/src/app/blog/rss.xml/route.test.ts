import { describe, expect, it } from 'vitest';
import { GET } from './route';

// Regression guard for ADR 0028 Shipment 2 Task A1 — HOST used to be its
// own literal ('audit.flintmere.com'); it now reads from SCANNER_HOST.
// This assertion stays a literal (per the shipment-2 plan: tests keep
// literal hosts, they are not allowed to import the constant they are
// meant to be checking against).
describe('GET /blog/rss.xml', () => {
  it('emits the feed self-link on the scanner host', async () => {
    const res = GET();
    const body = await res.text();
    expect(body).toContain('https://audit.flintmere.com/blog/rss.xml');
    expect(body).toContain('<link>https://audit.flintmere.com/blog</link>');
  });
});
