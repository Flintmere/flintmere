import { describe, expect, it, vi, afterEach } from 'vitest';

// Route tests for GET /badge/[shop]. The 404 paths (invalid segment +
// non-consented scan) are the load-bearing security tests — they never reach
// `next/og`, so they run fast and deterministically. The happy path stubs
// `next/og` so we assert status + headers without running satori in vitest.

describe('badge [shop] route', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/db');
    vi.doUnmock('next/og');
  });

  async function callGet(shop: string) {
    const { GET } = await import('./route');
    return GET(new Request(`https://flintmere.com/badge/${shop}`), {
      params: Promise.resolve({ shop }),
    });
  }

  it('404s an invalid domain segment without touching the DB', async () => {
    vi.resetModules();
    const findFirst = vi.fn();
    vi.doMock('@/lib/db', () => ({ prisma: { scan: { findFirst } } }));

    const res = await callGet('../secrets');

    expect(res.status).toBe(404);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('404s a domain with no published, consented scan — and the query carries the consent gate', async () => {
    vi.resetModules();
    const findFirst = vi.fn().mockResolvedValue(null);
    vi.doMock('@/lib/db', () => ({ prisma: { scan: { findFirst } } }));

    const res = await callGet('not-published.com');

    expect(res.status).toBe(404);
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          normalisedDomain: 'not-published.com',
          publishPublicPage: true,
          status: 'complete',
        }),
      }),
    );
  });

  it('renders a cacheable PNG for a published, consented scan', async () => {
    vi.resetModules();
    const findFirst = vi.fn().mockResolvedValue({ score: 72, grade: 'B' });
    vi.doMock('@/lib/db', () => ({ prisma: { scan: { findFirst } } }));
    vi.doMock('next/og', () => ({
      ImageResponse: class extends Response {
        constructor(_el: unknown, opts?: { headers?: Record<string, string> }) {
          super('png', {
            status: 200,
            headers: { 'content-type': 'image/png', ...(opts?.headers ?? {}) },
          });
        }
      },
    }));

    const res = await callGet('allbirds.com');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toContain('max-age=3600');
  });
});
