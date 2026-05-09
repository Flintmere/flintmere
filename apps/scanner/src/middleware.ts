import { NextResponse, type NextRequest } from 'next/server';
import {
  rewritePathForHost,
  targetHostForRedirect,
} from './lib/host-routing';

/**
 * Host-routing + Content-Security-Policy middleware.
 *
 * Two responsibilities, intentionally co-located so a single response
 * carries both decisions (host-aware rewrites and a per-request CSP
 * with a unique nonce). Splitting them into two middlewares would mean
 * one has to re-derive the other's response shape — fragile.
 *
 * Host routing — C1 architecture (council-ratified 2026-05-03, extended
 * to three hosts 2026-05-03). One Next.js app serves three hosts:
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
 *
 * CSP — added 2026-05-09 pre-launch security audit P0-2. Every
 * pass-through and rewrite response carries a strict policy with a
 * per-request nonce. The nonce is also propagated via the `x-nonce`
 * request header so server components (root layout) can read it via
 * `headers()` and pass to inline `<Script>` tags. Next.js internal
 * hydration scripts pick up the same nonce automatically.
 *
 * Allowlist — explicit rather than `'strict-dynamic'` for first
 * deployment. Easier to debug violations (the offending URL is named
 * in the console) and forces every external resource to be intentional.
 * Tighten to strict-dynamic in a follow-up once the allowlist has
 * stabilised against real traffic.
 *
 * Redirect responses (cross-host 301 + RSC 204 noop) skip CSP — they
 * have no body for an injected script to execute against, and the
 * browser will follow the redirect to the target host where the new
 * response sets its own CSP.
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
    // RSC prefetch carve-out — the App Router prefetches `<Link>` targets
    // by issuing `fetch(href + '?_rsc=...', { headers: { RSC: '1' } })`
    // on hover/visibility. On a cross-host link, that fetch hits THIS
    // redirect, browser tries to follow cross-origin without CORS
    // headers, fails preflight, console fills with errors, and Next.js
    // falls back to full nav anyway. Return 204 No Content so the
    // prefetch silently no-ops — the user-initiated click still gets
    // the 301 (no RSC headers on real navigations) and lands on the
    // correct host. Caught 2026-05-05 via Lighthouse mobile audit.
    const isRscPrefetch =
      request.headers.get('rsc') === '1' ||
      request.headers.get('next-router-prefetch') === '1' ||
      request.nextUrl.searchParams.has('_rsc');
    if (isRscPrefetch) {
      const noContent = new NextResponse(null, { status: 204 });
      annotateHostDiagnostics(noContent, {
        forwardedHost,
        directHost,
        urlHost,
        detected: requestHost,
        decision: `rsc-noop:${target}`,
      });
      return noContent;
    }
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

  // CSP nonce + new request headers, threaded through both rewrite
  // and pass paths. The same nonce appears in: (a) the request's
  // x-nonce header (so server components can read via headers()),
  // (b) the response's Content-Security-Policy header.
  const nonce = generateCspNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  const csp = buildCsp(nonce);

  // Same-host rewrite — currently only standards.flintmere.com/ → /standards.
  const rewriteTo = rewritePathForHost(
    requestHost,
    request.nextUrl.pathname,
  );
  if (rewriteTo) {
    const url = request.nextUrl.clone();
    url.pathname = rewriteTo;
    const rewriteResponse = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    rewriteResponse.headers.set('Content-Security-Policy', csp);
    annotateHostDiagnostics(rewriteResponse, {
      forwardedHost,
      directHost,
      urlHost,
      detected: requestHost,
      decision: `rewrite:${rewriteTo}`,
    });
    return rewriteResponse;
  }

  const passResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  passResponse.headers.set('Content-Security-Policy', csp);
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
 * Cryptographically random CSP nonce. 16 bytes (128 bits) of entropy
 * encoded base64 — well above the 64-bit floor recommended by the CSP
 * spec. Edge-runtime compatible (uses Web Crypto + btoa, not Node
 * Buffer or randomBytes).
 */
function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Build the per-request Content-Security-Policy header value.
 *
 * Allowlist rationale (audit-time inventory of every external resource
 * the app loads):
 *   - script-src: self for Next chunks; nonce for the Plausible inline
 *     init at layout.tsx; plausible.io for the Plausible loader;
 *     challenges.cloudflare.com for Turnstile; js.stripe.com for
 *     Stripe.js (loaded by @stripe/stripe-js on /audit/checkout).
 *   - connect-src: same external endpoints + Sentry's EU ingest
 *     (events tunneled through /monitoring but the SDK still resolves
 *     the public DSN at construction time).
 *   - frame-src: Turnstile challenge iframe + Stripe Element iframe +
 *     Stripe 3DS challenge (hooks.stripe.com).
 *   - style-src 'unsafe-inline': Tailwind + Next.js generate inline
 *     styles aggressively. Without this, every styled-jsx and
 *     css-in-js component breaks. Documented concession; tighten via
 *     hash-based style-src in a follow-up if/when the codebase moves
 *     fully to CSS modules.
 *   - frame-ancestors 'none': scanner + marketing are not embeddable
 *     (security-posture.md §CSP). Shopify-app embedding posture lives
 *     in apps/shopify-app — out of scope here.
 *   - upgrade-insecure-requests: nudges any stray http:// URL to https.
 */
function buildCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://plausible.io https://challenges.cloudflare.com https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://plausible.io https://challenges.cloudflare.com https://api.stripe.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io",
    "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];
  return directives.join('; ');
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
