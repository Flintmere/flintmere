import { NextResponse, type NextRequest } from 'next/server';
import {
  rewritePathForHost,
  targetHostForRedirect,
} from './src/lib/host-routing';

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
  const forwardedHost = request.headers.get('x-forwarded-host');
  const directHost = request.headers.get('host');
  const requestHost = (forwardedHost ?? directHost ?? '').toLowerCase();

  if (!requestHost) return NextResponse.next();

  // Cross-host 301 takes precedence — no point rewriting if we're about
  // to redirect away.
  const target = targetHostForRedirect(requestHost, request.nextUrl.pathname);
  if (target) {
    const redirectUrl = new URL(request.nextUrl.toString());
    redirectUrl.host = target;
    redirectUrl.protocol = 'https:';
    redirectUrl.port = '';
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Same-host rewrite — currently only standards.flintmere.com/ → /standards.
  const rewriteTo = rewritePathForHost(
    requestHost,
    request.nextUrl.pathname,
  );
  if (rewriteTo) {
    const url = request.nextUrl.clone();
    url.pathname = rewriteTo;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
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
