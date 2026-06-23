import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

/**
 * Middleware host-routing + RSC-prefetch carve-out tests.
 *
 * The carve-out (decision `rsc-noop:<target>`) must return 204 for a
 * cross-host App Router RSC prefetch so the prefetch silently no-ops
 * instead of 301-ing cross-origin (which fails CORS and spams DevTools
 * with "Failed to fetch RSC payload" — vercel/next.js#53813).
 *
 * Root cause of the dead branch (fixed 2026-06-23): Next.js's web
 * middleware adapter strips every signal the original carve-out keyed on
 * BEFORE `middleware()` runs —
 *   - FLIGHT_HEADERS (`rsc`, `next-router-prefetch`, …) are deleted from
 *     the request headers (adapter.js `if (!isEdgeRendering)` block), and
 *   - the `_rsc` cache-busting query param is removed by
 *     `stripInternalSearchParams`.
 * The one RSC signal that survives to middleware is the `next-url`
 * header (NOT in FLIGHT_HEADERS), so detection now keys on that.
 *
 * These run in the `node` vitest env; we construct the NextRequest by
 * hand, so we model the POST-adapter shape the middleware actually sees.
 */

function req(
  url: string,
  headers: Record<string, string>,
  method = 'GET',
): NextRequest {
  return new NextRequest(url, { method, headers });
}

describe('middleware — cross-host RSC-prefetch carve-out', () => {
  // The regression: a cross-host RSC prefetch as middleware ACTUALLY sees
  // it — `rsc` / `next-router-prefetch` / `?_rsc` already stripped by the
  // adapter, only `next-url` surviving. Before the fix this fell through
  // to the 301 (the live bug verified 2026-06-23). It must return 204.
  it('returns 204 rsc-noop for a post-adapter cross-host prefetch (next-url only)', () => {
    const res = middleware(
      req('http://localhost/scan', {
        'x-forwarded-host': 'flintmere.com',
        'next-url': '/',
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('x-flintmere-host-decision')).toBe(
      'rsc-noop:audit.flintmere.com',
    );
  });

  // Defensive: if a runtime/proxy ever leaves the RSC header in place
  // (e.g. a non-stripping edge), the carve-out must still fire.
  it('returns 204 rsc-noop when the rsc header survives', () => {
    const res = middleware(
      req('http://localhost/scan?_rsc=zz', {
        'x-forwarded-host': 'flintmere.com',
        rsc: '1',
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('x-flintmere-host-decision')).toBe(
      'rsc-noop:audit.flintmere.com',
    );
  });

  // Guard against over-triggering: a genuine top-level navigation carries
  // none of the RSC signals (no `next-url`), so it must still 301.
  it('301s a real cross-host navigation (no RSC signals)', () => {
    const res = middleware(
      req('http://localhost/scan', { 'x-forwarded-host': 'flintmere.com' }),
    );
    expect(res.status).toBe(301);
    expect(res.headers.get('x-flintmere-host-decision')).toBe(
      'redirect:audit.flintmere.com',
    );
  });

  // The sibling cross-origin carve-out (Origin present) shares the same
  // dead-signal root cause and is fixed the same way.
  it('returns 204 + CORS for a cross-origin RSC prefetch GET (next-url only)', () => {
    const res = middleware(
      req('http://localhost/scan', {
        'x-forwarded-host': 'audit.flintmere.com',
        origin: 'https://flintmere.com',
        'next-url': '/',
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'https://flintmere.com',
    );
  });

  // The OPTIONS preflight branch is unrelated to RSC signals and must be
  // untouched by the fix.
  it('answers the cross-origin OPTIONS preflight with 204 + CORS', () => {
    const res = middleware(
      req(
        'http://localhost/scan',
        {
          'x-forwarded-host': 'audit.flintmere.com',
          origin: 'https://flintmere.com',
        },
        'OPTIONS',
      ),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, HEAD');
  });
});
