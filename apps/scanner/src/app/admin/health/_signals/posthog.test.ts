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
    expect(r.data).toMatchObject({ audit: 7, marketing: 3 });
  });
});
