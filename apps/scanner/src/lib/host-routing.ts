/**
 * Host routing — single source of truth for which routes live on which host.
 *
 * Per the council-ratified C1 architecture (2026-05-03, extended to a third
 * host on 2026-05-03):
 *   flintmere.com               — marketing surfaces (homepage, /about,
 *                                 /pricing, /research, /methodology, /for/*,
 *                                 legal pages, /contact)
 *   audit.flintmere.com         — scanner surfaces (/scan, /audit,
 *                                 /score/[shop], /bot, /unsubscribe)
 *   standards.flintmere.com     — the food regulatory standard. Phase 1
 *                                 ships a holding page at the root; Phase 2
 *                                 (post-ingestion-engine, June 2026+) lands
 *                                 the actual taxonomy under the same
 *                                 routing scaffold.
 *   all hosts                   — APIs (/api/*), Next.js assets, metadata
 *                                 files (sitemap, robots, opengraph, icons)
 *
 * Cross-host requests get 301'd to the canonical host. Standards-host root
 * (`/`) is rewritten internally to `/standards` by middleware so the actual
 * page can live at `apps/scanner/src/app/standards/page.tsx` without
 * colliding with the marketing root.
 *
 * Cross-host 90-day window: 2026-05-03 → 2026-08-03. After that, evaluate
 * via Plausible whether to flip to 404 instead of 301. TODO: 2026-08-03.
 *
 * Why this file exists, not constants in middleware.ts: route classification
 * needs to be testable without spinning up Next.js middleware. Helpers
 * below take a pathname, return a host or null.
 */

export const MARKETING_HOST = 'flintmere.com';
export const SCANNER_HOST = 'audit.flintmere.com';
export const STANDARDS_HOST = 'standards.flintmere.com';

export const KNOWN_HOSTS: readonly string[] = [
  MARKETING_HOST,
  SCANNER_HOST,
  STANDARDS_HOST,
];

/**
 * Routes that live on `flintmere.com`. Hitting one of these on
 * `audit.flintmere.com` or `standards.flintmere.com` → 301 to flintmere.com.
 *
 * Order matters: prefix matches are evaluated longest-first so `/for/plus`
 * resolves before `/for`. Keep this list manually sorted longest-first.
 */
export const MARKETING_ROUTES: readonly string[] = [
  '/for/food-and-drink',
  '/for/apparel',
  '/for/beauty',
  '/for/plus',
  '/methodology',
  '/research',
  '/security',
  '/contact',
  '/support',
  '/cookies',
  '/pricing',
  '/privacy',
  '/founder',
  '/about',
  '/terms',
  '/dpa',
  '/',
];

/**
 * Routes that live on `audit.flintmere.com`. Hitting one of these on
 * `flintmere.com` or `standards.flintmere.com` → 301 to audit.flintmere.com.
 */
export const SCANNER_ROUTES: readonly string[] = [
  '/audit/success',
  '/score',
  '/scan',
  '/audit',
  '/bot',
  '/unsubscribe',
];

/**
 * Routes that live on `standards.flintmere.com`. Note: the canonical URL
 * for the root is `https://standards.flintmere.com/` — middleware rewrites
 * the request to `/standards` internally so the page can coexist with
 * the marketing root in the same app tree.
 */
export const STANDARDS_ROUTES: readonly string[] = ['/standards'];

/** Path prefixes that are allowed on every host (APIs, assets, metadata). */
export const HOST_AGNOSTIC_PREFIXES: readonly string[] = [
  '/api/',
  '/_next/',
  '/static/',
  '/sitemap.xml',
  '/robots.txt',
  '/opengraph-image',
  '/icon',
  '/apple-icon',
  '/favicon',
  '/manifest',
];

export type HostAssignment =
  | 'marketing'
  | 'scanner'
  | 'standards'
  | 'both'
  | 'unknown';

/**
 * Classify a pathname → which host owns it. Used by middleware to decide
 * whether to 301-redirect a request, and by metadata helpers to compute the
 * canonical host for a given route.
 *
 * Path-only — no host context. The standards-host root (`/`) is handled by
 * a middleware rewrite, not by this classifier (the root is always
 * 'marketing' here).
 */
export function classifyRoute(pathname: string): HostAssignment {
  // Normalise — strip trailing slash except for root, lowercase for the
  // comparison (route segments in Next are case-sensitive but Host header
  // is canonically lowercase; we normalise the path the same way).
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  // Host-agnostic first — APIs and assets answer everywhere.
  for (const prefix of HOST_AGNOSTIC_PREFIXES) {
    if (path.startsWith(prefix) || path === prefix.replace(/\/$/, '')) {
      return 'both';
    }
  }

  // Standards — match before scanner/marketing so /standards isn't picked
  // up as an unknown marketing path.
  for (const route of STANDARDS_ROUTES) {
    if (path === route || path.startsWith(`${route}/`)) {
      return 'standards';
    }
  }

  // Scanner — match the longer prefixes first (e.g. `/audit/success`
  // before `/audit` so the success page doesn't get matched as `/audit`).
  for (const route of SCANNER_ROUTES) {
    if (path === route || path.startsWith(`${route}/`)) {
      return 'scanner';
    }
  }

  // Marketing — same logic, longest first.
  for (const route of MARKETING_ROUTES) {
    if (route === '/') {
      // The root only matches the literal root, not a prefix.
      if (path === '/') return 'marketing';
      continue;
    }
    if (path === route || path.startsWith(`${route}/`)) {
      return 'marketing';
    }
  }

  return 'unknown';
}

/**
 * Canonical host for a given route. `unknown` falls back to marketing —
 * this matches the operator brand-first instinct (better to 404 on the
 * brand domain than the function domain).
 */
export function canonicalHost(pathname: string): string {
  const klass = classifyRoute(pathname);
  if (klass === 'scanner') return SCANNER_HOST;
  if (klass === 'standards') return STANDARDS_HOST;
  return MARKETING_HOST;
}

/**
 * Whether a request on `requestHost` for `pathname` should be 301'd to a
 * different host. Returns the target host if so, null if the request is
 * already on the right host (or the route is host-agnostic, or the request
 * is on a non-canonical host like localhost / Coolify preview).
 *
 * Special case for the standards-host root: returns null. Middleware
 * rewrites `standards.flintmere.com/` → `/standards` internally rather
 * than redirecting; the page lives at `apps/scanner/src/app/standards/`.
 */
export function targetHostForRedirect(
  requestHost: string,
  pathname: string,
): string | null {
  // Strip any port for comparison (e.g. `flintmere.com:443` → `flintmere.com`).
  const normalisedRequest = requestHost.split(':')[0]?.toLowerCase() ?? '';

  // Only redirect when the request is actually on one of OUR known hosts.
  // localhost / preview deploys / unknown hosts are passed through — local
  // dev expects all routes to work on a single origin.
  if (!KNOWN_HOSTS.includes(normalisedRequest)) {
    return null;
  }

  // Standards-host root → no redirect. Middleware rewrites internally.
  if (normalisedRequest === STANDARDS_HOST && (pathname === '/' || pathname === '')) {
    return null;
  }

  const klass = classifyRoute(pathname);
  if (klass === 'both' || klass === 'unknown') return null;

  const target =
    klass === 'scanner'
      ? SCANNER_HOST
      : klass === 'standards'
        ? STANDARDS_HOST
        : MARKETING_HOST;

  if (normalisedRequest === target) return null;

  return target;
}

/**
 * Absolute URL on the canonical host for `pathname`. Use this when emitting
 * cross-host links from a page that lives on a different host than the
 * target — e.g. a `<Link href="/scan">` from the marketing homepage would
 * 301 through `flintmere.com/scan` → `audit.flintmere.com/scan`. Calling
 * `crossHostHref('/scan')` from a marketing page returns the absolute URL
 * directly so there is no redirect hop. Pass-through for routes that live
 * on the same host (or that classify as host-agnostic / unknown — falls
 * back to a relative path so client-side nav still works).
 *
 * Pass `currentHost` from the caller — if you cannot determine the
 * current host (server components without request context), pass null and
 * the helper will always emit absolute URLs (safe and 301-free at the
 * cost of disabled prefetch within the same host).
 */
export function crossHostHref(
  pathname: string,
  currentHost: string | null = null,
): string {
  const klass = classifyRoute(pathname);
  if (klass === 'both' || klass === 'unknown') return pathname;
  const targetHost =
    klass === 'scanner'
      ? SCANNER_HOST
      : klass === 'standards'
        ? STANDARDS_HOST
        : MARKETING_HOST;
  if (currentHost && currentHost.split(':')[0]?.toLowerCase() === targetHost) {
    return pathname;
  }
  return `https://${targetHost}${pathname}`;
}

/**
 * Convenience constants for the most common cross-host targets — emitted
 * as absolute URLs always. Use these in shared components (header, footer,
 * sticky CTA) where the component is rendered on multiple hosts and you
 * cannot detect the current host at module load time. The cost is a
 * disabled prefetch when the component happens to render on the target
 * host (e.g. SCAN_URL from a page on audit.flintmere.com), but the saved
 * 301 hop on the much more common cross-host case is the bigger win.
 */
export const SCAN_URL = `https://${SCANNER_HOST}/scan`;
export const AUDIT_URL = `https://${SCANNER_HOST}/audit`;
export const BOT_URL = `https://${SCANNER_HOST}/bot`;

/**
 * Whether a request on `requestHost` for `pathname` should be rewritten
 * (internally re-routed without changing the URL the user sees) rather
 * than served directly. Returns the rewrite target path if so, null
 * otherwise.
 *
 * The only rewrite today: `standards.flintmere.com/` → `/standards`.
 * This lets the standards holding page live at
 * `apps/scanner/src/app/standards/page.tsx` while the user-facing URL
 * remains the clean root.
 */
export function rewritePathForHost(
  requestHost: string,
  pathname: string,
): string | null {
  const normalisedRequest = requestHost.split(':')[0]?.toLowerCase() ?? '';
  if (normalisedRequest !== STANDARDS_HOST) return null;
  if (pathname === '/' || pathname === '') return '/standards';
  return null;
}
