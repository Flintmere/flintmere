/**
 * Host routing — single source of truth for which routes live on which host.
 *
 * Per the council-ratified C1 architecture (2026-05-03):
 *   flintmere.com           — marketing surfaces (homepage, /about, /pricing,
 *                             /research, /methodology, /for/*, legal pages)
 *   audit.flintmere.com     — scanner surfaces (/scan, /audit, /score/[shop],
 *                             /bot, /unsubscribe)
 *   both hosts              — APIs (/api/*), Next.js assets, metadata files
 *                             (sitemap, robots, opengraph, icons)
 *
 * Cross-host requests get 301'd to the canonical host for the next 90 days
 * (until 2026-08-03) so old bookmarks / backlinks survive the migration.
 * After that window, re-evaluate via Plausible: if cross-host hits are
 * <1% of traffic, switch to 404 for stricter routing. TODO: 2026-08-03.
 *
 * Why this file exists, not three constants in middleware.ts:
 * route classification needs to be testable without spinning up Next.js
 * middleware. Helpers below take a pathname, return a host or null.
 */

export const MARKETING_HOST = 'flintmere.com';
export const SCANNER_HOST = 'audit.flintmere.com';

/**
 * Routes that live on `flintmere.com`. Hitting one of these on
 * `audit.flintmere.com` → 301 to flintmere.com.
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
 * `flintmere.com` → 301 to audit.flintmere.com.
 */
export const SCANNER_ROUTES: readonly string[] = [
  '/audit/success',
  '/score',
  '/scan',
  '/audit',
  '/bot',
  '/unsubscribe',
];

/** Path prefixes that are allowed on both hosts (APIs, assets, metadata). */
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

export type HostAssignment = 'marketing' | 'scanner' | 'both' | 'unknown';

/**
 * Classify a pathname → which host owns it. Used by middleware to decide
 * whether to 301-redirect a request, and by metadata helpers to compute the
 * canonical host for a given route.
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
  return MARKETING_HOST;
}

/**
 * Whether a request on `requestHost` for `pathname` should be 301'd to a
 * different host. Returns the target host if so, null if the request is
 * already on the right host (or the route is host-agnostic).
 */
export function targetHostForRedirect(
  requestHost: string,
  pathname: string,
): string | null {
  const klass = classifyRoute(pathname);
  if (klass === 'both' || klass === 'unknown') return null;

  const target = klass === 'scanner' ? SCANNER_HOST : MARKETING_HOST;
  // Strip any port for comparison (e.g. `flintmere.com:443` → `flintmere.com`).
  const normalisedRequest = requestHost.split(':')[0]?.toLowerCase() ?? '';
  if (normalisedRequest === target) return null;

  // Only redirect when the request is actually on one of OUR known hosts.
  // If it's on localhost / preview deploy / unknown host, leave it alone —
  // local dev expects both routes to work on a single origin, and preview
  // URLs shouldn't 301 to production.
  if (
    normalisedRequest !== MARKETING_HOST &&
    normalisedRequest !== SCANNER_HOST
  ) {
    return null;
  }

  return target;
}
