import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Regression guard for the cross-host RSC-prefetch error family.
//
// MerchantCenterSection renders on flintmere.com (marketing host) and links to
// /catalog-letter/connect, which is a SCANNER route — on the marketing host it 301s
// cross-origin to audit.flintmere.com. A same-origin-relative
// `<Link href="/catalog-letter/connect">` makes Next attempt an RSC prefetch when the
// section scrolls into view; the cross-origin 301 cannot be consumed as a flight
// payload, so Next logs "Failed to fetch RSC payload for .../catalog-letter/connect.
// Falling back to browser navigation." on EVERY homepage load
// (vercel/next.js#53813 — this is NOT deployment skew; it does not self-heal).
//
// Found 2026-06-23 while chasing the RSC-prefetch console-error chip. The bulk
// of the observed errors were transient deployment skew (a six-deploy burst),
// but this one was a real persistent regression: the component used a raw
// relative Link, the exact mistake `crossHostHref` exists to prevent (the rest
// of the site — SiteHeader/SiteFooter — uses absolute cross-host URLs).
//
// Invariant: cross-host links from a marketing surface must emit ABSOLUTE URLs
// (via crossHostHref or the SCAN_URL-style constants), which Next does not
// RSC-prefetch. Same-host links (e.g. /privacy) stay relative — they prefetch
// fine. Source-level invariant test: cross-origin prefetch is not observable in
// jsdom; behavioural verification is the live RSC probe in the PR notes.

describe('MerchantCenterSection cross-host links (RSC prefetch regression)', () => {
  const source = readFileSync(join(__dirname, 'MerchantCenterSection.tsx'), 'utf8');

  it('uses no relative <Link href> to a cross-host scanner route', () => {
    // A relative href to a scanner route 301s cross-origin -> failed RSC prefetch.
    expect(source).not.toMatch(/href="\/catalog-letter/);
    expect(source).not.toMatch(/href="\/scan/);
  });

  it('emits the connect link as an absolute cross-host URL via crossHostHref', () => {
    expect(source).toMatch(/crossHostHref\(['"]\/catalog-letter\/connect['"]\)/);
  });
});
