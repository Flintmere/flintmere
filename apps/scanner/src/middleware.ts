import { NextResponse, type NextRequest } from 'next/server';
import {
  rewritePathForHost,
  targetHostForRedirect,
} from './lib/host-routing';

/**
 * Host-routing + Content-Security-Policy middleware.
 *
 * Two responsibilities, intentionally co-located so a single response
 * carries both decisions (host-aware rewrites and the per-response CSP).
 * Splitting them would mean one middleware has to re-derive the other's
 * response shape — fragile.
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
 * evaluate via PostHog whether to flip cross-host requests to 404.
 *
 * CSP — allowlist mode (rewritten 2026-05-11 after PageSpeed surfaced
 * false-positive violations on force-static pages). The previous attempt
 * used per-request nonces + `'strict-dynamic'`; that flow can't work for
 * `export const dynamic = 'force-static'` pages because middleware
 * doesn't run at build time, so the prerendered HTML ships <script>
 * tags with no nonce attributes. At request time the fresh per-request
 * nonce in the CSP matches nothing in the body, every chunk reports a
 * violation, and DevTools fills with noise.
 *
 * Allowlist trade-off: we lose the nonce-based defence against inline-
 * XSS in exchange for a CSP that actually matches what we serve. The
 * residual XSS surface is constrained by zod everywhere we accept user
 * input + ServerComponents-only rendering of dynamic strings + the
 * other defence-in-depth layers (Turnstile, honeypot, rate-limit,
 * idempotent unique indexes).
 *
 * `upgrade-insecure-requests` is intentionally omitted — the directive
 * is ignored when delivered in a report-only policy (PageSpeed warning
 * 2026-05-11) AND we serve nothing over plain HTTP; Coolify already
 * redirects 80→443 at the edge.
 *
 * Enforced (not Report-Only) — the directives now match reality, no
 * observation window needed. Flip back to Report-Only by renaming the
 * header if real-world violations appear post-deploy.
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

  // Cross-origin RSC-prefetch handling (added 2026-05-11 after the CSP
  // cross-subdomain fix in #36 exposed the next layer of the same
  // problem). Next.js Link prefetch fires fetch() with custom RSC
  // headers (RSC, next-router-prefetch, next-router-state-tree). For
  // cross-host Links — Audit on flintmere.com → audit.flintmere.com,
  // the Standards external, etc. — those custom headers trigger a CORS
  // preflight. Without explicit Access-Control-Allow-* on the OPTIONS
  // response, the preflight fails and DevTools fills with "Refused to
  // fetch ... blocked by CORS policy" + "Failed to fetch RSC payload"
  // errors. The clicks still work (Next.js falls back to full browser
  // navigation), but the console is noise visible to every visitor who
  // opens DevTools.
  //
  // Fix: detect cross-origin requests where the Origin header is a
  // Flintmere host. For OPTIONS preflight, return 204 with the right
  // Allow headers so the preflight passes. For the actual RSC GET that
  // follows, return 204 with Allow-Origin so the response can be read
  // (the prefetch effectively no-ops; Next.js falls back to full nav
  // on click, which is the natural path for cross-host navigations).
  // Regular cross-origin GETs (full-page navigations from a Link click)
  // are unaffected — they bypass CORS by design.
  const origin = request.headers.get('origin');
  const isFlintmereOrigin = origin
    ? /^https:\/\/(flintmere\.com|[\w-]+\.flintmere\.com)$/.test(origin)
    : false;
  const selfOrigin = `https://${requestHost}`;
  const isCrossOriginFlintmere = isFlintmereOrigin && origin !== selfOrigin;

  if (isCrossOriginFlintmere && origin) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, HEAD',
          'Access-Control-Allow-Headers':
            'RSC, next-router-prefetch, next-url, next-router-state-tree, next-router-segment-prefetch',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }

    const isRscPrefetchCrossOrigin =
      request.headers.get('rsc') === '1' ||
      request.headers.get('next-router-prefetch') === '1' ||
      request.nextUrl.searchParams.has('_rsc');
    if (isRscPrefetchCrossOrigin) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Vary': 'Origin',
        },
      });
    }
  }

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

  const csp = buildCsp();

  // Same-host rewrite — currently only standards.flintmere.com/ → /standards.
  const rewriteTo = rewritePathForHost(
    requestHost,
    request.nextUrl.pathname,
  );
  if (rewriteTo) {
    const url = request.nextUrl.clone();
    url.pathname = rewriteTo;
    const rewriteResponse = NextResponse.rewrite(url);
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

  const passResponse = NextResponse.next();
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
 * Build the Content-Security-Policy header value.
 *
 * Allowlist mode — see file header for the trade-off rationale.
 *
 * script-src 'unsafe-inline' covers Next.js's bootstrap inline (the
 * `self.__next_f` flight-data hydration). Per CSP3, `'unsafe-inline'`
 * is honoured only when no nonce/hash is present in the same directive;
 * since we no longer emit nonces, it applies.
 *
 * Host allowlist covers the external script loaders we ship:
 *  - (PostHog loads same-origin via the /ingest proxy — no host entry needed)
 *  - challenges.cloudflare.com — Turnstile widget loader
 *  - js.stripe.com — Stripe Elements + Payment Element loader
 *
 * Sentry's client SDK is bundled via webpack (served from /_next/static/
 * chunks/* under 'self') and its tunnel route /monitoring is same-origin,
 * so Sentry needs no script-src entry. We keep its ingest hosts in
 * connect-src as a fallback in case the tunnel rewrite is bypassed.
 *
 * style-src 'unsafe-inline' is unchanged — Tailwind + styled-jsx + JSX
 * `style={{...}}` props all emit inline styles.
 *
 * frame-ancestors 'none' enforces non-embeddability per security-
 * posture.md §CSP. Shopify-app embedding lives in apps/shopify-app
 * (not gated here).
 *
 * upgrade-insecure-requests deliberately omitted — every Flintmere
 * resource is HTTPS by construction (Coolify edge redirects 80→443),
 * and the directive is a no-op in that posture. It also generates a
 * PageSpeed warning when delivered in Report-Only mode.
 */
function buildCsp(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    // Cross-subdomain RSC prefetches need explicit allowlist. The C1
    // host architecture spans flintmere.com (marketing) + audit (scanner)
    // + standards + app — Next.js Link prefetches between these issue
    // `fetch()` calls that hit connect-src. `'self'` alone covers only
    // the current origin; without the four hosts below, hovering a
    // cross-host link in production trips a CSP block (caught live
    // 2026-05-11 immediately after the enforced flip in #33).
    "connect-src 'self' https://flintmere.com https://audit.flintmere.com https://app.flintmere.com https://standards.flintmere.com https://challenges.cloudflare.com https://api.stripe.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io",
    "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
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
    '/((?!_next/static|_next/image|ingest|favicon.ico|icon.svg|apple-icon|opengraph-image|api/healthz).*)',
  ],
};
