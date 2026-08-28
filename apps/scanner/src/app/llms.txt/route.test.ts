import { describe, expect, it, vi, afterEach } from 'vitest';
import { LEGACY_SCANNER_HOST, MARKETING_HOST, SCANNER_HOST } from '@/lib/host-routing';

/**
 * ADR 0028 Shipment 2 — /llms.txt is served on every host without a
 * redirect (it classifies as unknown, so `targetHostForRedirect` returns
 * null). The legacy scanner host must therefore produce the scanner body,
 * not the marketing one, or an answer engine that asked the scanner gets
 * a map of the marketing site.
 */
const headersMock = vi.fn();
vi.mock('next/headers', () => ({ headers: () => headersMock() }));

function withHost(host: string): void {
  headersMock.mockResolvedValue({
    get: (k: string) => (k === 'x-forwarded-host' ? host : null),
  });
}

afterEach(() => vi.resetModules());

async function bodyFor(host: string): Promise<string> {
  withHost(host);
  const { GET } = await import('./route');
  return (await GET()).text();
}

describe('/llms.txt per host', () => {
  it('serves the same body on the legacy host as on the canonical one', async () => {
    const canonical = await bodyFor(SCANNER_HOST);
    const legacy = await bodyFor(LEGACY_SCANNER_HOST);
    expect(legacy).toBe(canonical);
  });

  it('does not serve the marketing body on the legacy host', async () => {
    const marketing = await bodyFor(MARKETING_HOST);
    const legacy = await bodyFor(LEGACY_SCANNER_HOST);
    expect(legacy).not.toBe(marketing);
  });
});
