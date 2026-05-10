import { NextResponse, type NextRequest } from 'next/server';
import {
  rewritePathForHost,
  targetHostForRedirect,
} from './lib/host-routing';

/**
 * Host-routing + Content-Security-Policy middleware.
 *
 * Two responsibilities, intentionally co-located so a single response
 * carries both decisions (host-aware rewrites and the per-request CSP
 * with a unique nonce). Splitting them would mean one middleware has
 * to re-derive the other's response shape — fragile.
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
 * CSP — added 2026-05-10 after the first attempt (PR #10, reverted as
 * 2933814) broke the homepage. The bug was setting CSP only on the
 * response header; Next.js's auto-nonce extraction reads CSP from the
 * REQUEST header during SSR — without it on the request side, Next's
 * framework scripts shipped without nonce attributes and the strict
 * script-src blocked them. Per Vercel's canonical example, CSP must
 * be set on BOTH request and response headers.
 *
 * Shipped as `Content-Security-Policy-Report-Only` for safe rollout —
 * browser observes violations in DevTools but does not block. After
 * an observation window with zero unexpected violations, flip the
 * header name to `Content-Security-Policy` to enforce. The nonce flow
 * is identical in both modes; only enforcement differs.
 *
 * `'strict-dynamic'` propagates nonce-trust to scripts loaded by
 * nonce'd scripts (Plausible loader, Turnstile loader, Stripe.js
 * loader all become transitively trusted via nonce'd Next runtime →
 * <Script>-rendered loader → external resource). Removes the need to
 * enumerate every external script domain in script-src; connect-src
 * and frame-src still need explicit allowlists since strict-dynamic
 * doesn't extend to those directives.
 *
 * Redirects (cross-host 301 + RSC 204 noop) skip CSP — empty body,
 * nothing for an injected script to act against, browser follows to
 * the target host which sets its own CSP.
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

  // CSP nonce + new request headers, threaded through both rewrite and
  // pass paths. The same nonce appears on:
  //   request headers  — x-nonce (server components read via headers())
  //                    — Content-Security-Policy (Next reads to extract
  //                      nonce, attaches to framework scripts during SSR)
  //   response headers — Content-Security-Policy-Report-Only (browser
  //                      observes; flip to Content-Security-Policy to
  //                      enforce after observation window)
  const nonce = generateCspNonce();
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Setting CSP on the REQUEST is the load-bearing line. Next.js
  // extracts the nonce from this header during SSR and attaches it to
  // every framework script it emits. Without this, no internal scripts
  // have nonce attributes and strict CSP blocks them — the failure
  // mode that broke PR #10 on first deploy.
  requestHeaders.set('Content-Security-Policy', csp);

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
    rewriteResponse.headers.set('Content-Security-Policy-Report-Only', csp);
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
  passResponse.headers.set('Content-Security-Policy-Report-Only', csp);
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
 * spec. Edge-runtime compatible (Web Crypto + btoa, not Node Buffer
 * or randomBytes).
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
 * `'strict-dynamic'` is the structural choice: it propagates trust
 * from nonce'd scripts (Next.js framework scripts + nonce'd <Script>
 * components) to anything those scripts load. Plausible's loader,
 * Turnstile's loader, and Stripe.js's loader are all loaded by
 * Next-rendered components — they inherit trust transitively without
 * needing explicit https:// allowlists in script-src.
 *
 * connect-src and frame-src still need explicit allowlists — those
 * directives don't honour strict-dynamic.
 *
 * style-src 'unsafe-inline' is a documented concession — Tailwind +
 * styled-jsx + JSX `style={{...}}` props all emit inline styles;
 * nonce-based style-src would need every callsite updated. Tighten
 * via hash-based or move to CSS modules in a follow-up.
 *
 * frame-ancestors 'none' enforces non-embeddability per security-
 * posture.md §CSP. Shopify-app embedding lives in apps/shopify-app
 * (not gated here).
 */
function buildCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
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
