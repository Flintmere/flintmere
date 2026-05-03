/**
 * Host-aware URL builders.
 *
 * Use these when authoring cross-host links — e.g. a CTA on a marketing
 * page (`flintmere.com/pricing`) that points at the scanner (`/scan`):
 *
 *   import { scannerUrl } from '@/lib/host-url';
 *   <a href={scannerUrl('/scan')}>Run the free scan →</a>
 *
 * In production, `scannerUrl('/scan')` returns `https://audit.flintmere.com/scan`.
 * In local dev (NODE_ENV !== 'production'), it returns the relative path
 * `/scan` so a single `localhost:3001` origin serves both flows.
 *
 * Same-host links keep using Next.js `<Link>` for prefetching — these
 * helpers are exclusively for the cross-host case. A Link to the scanner
 * from inside the scanner stays a Link.
 */

import {
  MARKETING_HOST,
  SCANNER_HOST,
  STANDARDS_HOST,
  canonicalHost,
} from './host-routing';

const isProd = process.env.NODE_ENV === 'production';

function absolute(host: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${host}${cleanPath}`;
}

/**
 * URL for a marketing-host route. Use from scanner pages that link back
 * to marketing surfaces (e.g. footer "Pricing" link from /scan).
 */
export function marketingUrl(path: string): string {
  if (!isProd) return path.startsWith('/') ? path : `/${path}`;
  return absolute(MARKETING_HOST, path);
}

/**
 * URL for a scanner-host route. Use from marketing pages that link to
 * scanner surfaces (e.g. homepage CTA → /scan, /audit → /audit).
 */
export function scannerUrl(path: string): string {
  if (!isProd) return path.startsWith('/') ? path : `/${path}`;
  return absolute(SCANNER_HOST, path);
}

/**
 * URL for a standards-host route. Use from anywhere on the site that
 * links into the food regulatory standard. Note: the canonical root is
 * `https://standards.flintmere.com/` — pass `/` and middleware rewrites
 * to the internal `/standards` page on the standards host.
 */
export function standardsUrl(path: string): string {
  if (!isProd) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // In dev, root requests resolve to the actual page path so the page
    // renders without spinning up middleware host-rewrite.
    if (cleanPath === '/' || cleanPath === '') return '/standards';
    return cleanPath;
  }
  return absolute(STANDARDS_HOST, path);
}

/**
 * Canonical absolute URL for a given pathname. Used by metadata
 * (`<link rel="canonical">`, OpenGraph `url`, JSON-LD `@id`) to declare
 * which host owns a route regardless of which host served the request.
 *
 * In dev, returns relative path so previews don't leak production hosts.
 */
export function canonicalUrl(path: string): string {
  if (!isProd) return path.startsWith('/') ? path : `/${path}`;
  return absolute(canonicalHost(path), path);
}
