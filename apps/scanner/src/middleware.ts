import { NextResponse, type NextRequest } from 'next/server';
import {
  rewritePathForHost,
  targetHostForRedirect,
} from './lib/host-routing';

/**
 * Host-routing middleware — implements the C1 architecture
 * (council-ratified 2026-05-03, extended to three hosts 2026-05-03).
 * One Next.js app serves three hosts:
 *
 *   GET https://audit.flintmere.com/pricing  → 301 https://flintmere.com/pricing
 *   GET https://flintmere.com/scan           → 301 https://audit.flintmere.com/scan
 *   GET https://standards.flintmere.com/     → rewrite → /standards (internal)
 *
 * Routes classified as 'both' (APIs, assets, metadata files) and 'unknown'
 * routes are passed through. Local dev (`localhost:*`) and Coolify preview
 * URLs are also passed through — single-origin convenience.
 *
 * Cross-host 301 90-day window: 2026-05-03 → 2026-08-03. After that,
 * evaluate via Plausible whether to flip cross-host requests to 404.
 *
 * Reads the `x-forwarded-host` header before falling back to `host` —
 * Coolify's Traefik sets the forwarded header; the underlying `host`
 * inside the container is the internal service name.
 */
export function middleware(request: NextRequest): NextResponse {
  // Three fallbacks in priority order. Coolify/Traefik should set
  // `x-forwarded-host` to the originally-requested public host; that
  // is the canonical signal. Direct `host` is the container-internal
  // service name when behind a proxy, but in some Coolify configs it
  // mirrors the public host. `nextUrl.hostname` is Next's parsed URL
  // hostname — useful as a last resort if both headers are mangled.
  // Empirical bug 2026-05-03: standards.flintmere.com/ rendered the
  // marketing homepage in production, suggesting at least one of the
  // header signals was not arriving as expected for the third host.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const directHost = request.headers.get('host');
  const urlHost = request.nextUrl.hostname;
  const requestHost = (forwardedHost ?? directHost ?? urlHost ?? '').toLowerCase();

  if (!requestHost) return NextResponse.next();

  // Cross-host 301 takes precedence — no point rewriting if we're about
  // to redirect away.
  const target = targetHostForRedirect(requestHost, request.nextUrl.pathname);
  if (target) {
    const redirectUrl = new URL(request.nextUrl.toString());
    redirectUrl.host = target;
    redirectUrl.protocol = 'https:';
    redirectUrl.port = '';
    const redirectResponse = NextResponse.redirect(redirectUrl, 301);
    annotateHostDiagnostics(redirectResponse, {
      forwardedHost,
      directHost,
      urlHost,
      detected: requestHost,
      decision: `redirect:${target}`,
    });
    return redirectResponse;
  }

  // Same-host rewrite — currently only standards.flintmere.com/ → /standards.
  const rewriteTo = rewritePathForHost(
    requestHost,
    request.nextUrl.pathname,
  );
  if (rewriteTo) {
    const url = request.nextUrl.clone();
    url.pathname = rewriteTo;
    const rewriteResponse = NextResponse.rewrite(url);
    annotateHostDiagnostics(rewriteResponse, {
      forwardedHost,
      directHost,
      urlHost,
      detected: requestHost,
      decision: `rewrite:${rewriteTo}`,
    });
    return rewriteResponse;
  }

  const passResponse = NextResponse.next();
  annotateHostDiagnostics(passResponse, {
    forwardedHost,
    directHost,
    urlHost,
    detected: requestHost,
    decision: 'pass',
  });
  return passResponse;
}

/**
 * Adds diagnostic headers so the operator can `curl -I` against any
 * surface and see exactly what the middleware saw. Cheap insurance
 * for any future host-routing bug — header noise is a non-issue,
 * blind production debugging is. Strip after the C1 routing has
 * settled (track via incident-history.md).
 */
function annotateHostDiagnostics(
  response: NextResponse,
  diag: {
    forwardedHost: string | null;
    directHost: string | null;
    urlHost: string | null;
    detected: string;
    decision: string;
  },
): void {
  response.headers.set('x-flintmere-host-fwd', diag.forwardedHost ?? '');
  response.headers.set('x-flintmere-host-direct', diag.directHost ?? '');
  response.headers.set('x-flintmere-host-url', diag.urlHost ?? '');
  response.headers.set('x-flintmere-host-detected', diag.detected);
  response.headers.set('x-flintmere-host-decision', diag.decision);
}

/**
 * Matcher — run middleware on everything except Next internal asset
 * paths. The `host-routing.ts` classifier still treats `/api`, `/_next`,
 * etc. as 'both' (no redirect), but excluding them at the matcher level
 * skips the function call entirely on the hot path.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|opengraph-image|api/healthz).*)',
  ],
};
