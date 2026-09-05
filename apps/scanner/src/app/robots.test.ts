import { describe, expect, it, vi, afterEach } from 'vitest';
import { LEGACY_SCANNER_HOST, MARKETING_HOST, SCANNER_HOST } from '@/lib/host-routing';

/**
 * ADR 0028 Shipment 2 — the legacy scanner host still serves robots.txt.
 *
 * `/robots.txt` is host-agnostic, so it is never redirected: a crawler
 * hitting the legacy host gets a real response from this route. Before the
 * cutover the scanner branch was selected by `host === SCANNER_HOST`, which
 * the legacy host no longer satisfies — it would have fallen through to the
 * marketing rules and stopped disallowing the raw score endpoint.
 */
const headersMock = vi.fn();
vi.mock('next/headers', () => ({ headers: () => headersMock() }));

function withHost(host: string): void {
  headersMock.mockResolvedValue({
    get: (k: string) => (k === 'x-forwarded-host' ? host : null),
  });
}

afterEach(() => vi.resetModules());

describe('robots.txt per host', () => {
  it('disallows the raw score endpoint on the canonical scanner host', async () => {
    withHost(SCANNER_HOST);
    const { default: robots } = await import('./robots');
    const r = await robots();
    const first = (r.rules as Array<{ disallow?: string[] }>)[0];
    expect(first?.disallow).toContain('/score/*/raw');
  });

  it('applies the same scanner rules on the legacy host', async () => {
    withHost(LEGACY_SCANNER_HOST);
    const { default: robots } = await import('./robots');
    const r = await robots();
    const first = (r.rules as Array<{ disallow?: string[] }>)[0];
    expect(first?.disallow).toContain('/score/*/raw');
  });

  it('points the legacy host at the canonical sitemap and canonical host', async () => {
    withHost(LEGACY_SCANNER_HOST);
    const { default: robots } = await import('./robots');
    const r = await robots();
    // Advertising the legacy host here would ask crawlers to treat it as
    // canonical, working against the change of address.
    expect(r.sitemap).toBe(`https://${SCANNER_HOST}/sitemap.xml`);
    expect(r.host).toBe(`https://${SCANNER_HOST}`);
  });

  it('leaves the marketing host on marketing rules', async () => {
    withHost(MARKETING_HOST);
    const { default: robots } = await import('./robots');
    const r = await robots();
    const first = (r.rules as Array<{ disallow?: string[] }>)[0];
    expect(first?.disallow).not.toContain('/score/*/raw');
    expect(r.sitemap).toBe(`https://${MARKETING_HOST}/sitemap.xml`);
  });
});
