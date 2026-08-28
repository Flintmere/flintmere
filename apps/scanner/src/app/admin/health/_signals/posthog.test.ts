import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchPosthogViews } from './posthog';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('fetchPosthogViews', () => {
  it('returns unknown when env is missing', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '');
    vi.stubEnv('POSTHOG_PROJECT_ID', '');
    const r = await fetchPosthogViews();
    expect(r.status).toBe('unknown');
  });

  it('sums both scanner hosts through the cutover transition', async () => {
    // ADR 0028 Shipment 2 B2 — traffic splits across catalog. and audit.
    // after cutover. Bucketing on one host alone would read as a collapse.
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phx_test');
    vi.stubEnv('POSTHOG_PROJECT_ID', '12345');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              ['catalog.flintmere.com', 5],
              ['audit.flintmere.com', 2],
              ['flintmere.com', 3],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const r = await fetchPosthogViews();
    expect(r.status).toBe('ok');
    expect(r.data).toMatchObject({ scanner: 7, marketing: 3 });
  });

  it('stays ok when all scanner traffic has moved off the legacy host', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phx_test');
    vi.stubEnv('POSTHOG_PROJECT_ID', '12345');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              ['catalog.flintmere.com', 9],
              ['flintmere.com', 3],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const r = await fetchPosthogViews();
    expect(r.status).toBe('ok');
    expect(r.data).toMatchObject({ scanner: 9, marketing: 3 });
  });

  it('aggregates pageviews by host', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phx_test');
    vi.stubEnv('POSTHOG_PROJECT_ID', '12345');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              ['audit.flintmere.com', 7],
              ['flintmere.com', 3],
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const r = await fetchPosthogViews();
    expect(r.status).toBe('ok');
    expect(r.data).toMatchObject({ scanner: 7, marketing: 3 });
  });
});
