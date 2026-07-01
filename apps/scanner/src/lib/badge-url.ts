// Hostname segment validation for the public /score/[shop] route.
// Guards the route against path-traversal, reflected-XSS in the URL
// segment, and accidental uppercase / protocol / port that would
// miss an exact match on Scan.normalisedDomain (which we always
// store as lowercase hostname only).

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,63}$/;

export function validateDomainSegment(raw: string): string | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return null;
    }
  })();
  if (decoded === null) return null;
  const trimmed = decoded.trim().toLowerCase();
  if (!DOMAIN_RE.test(trimmed)) return null;
  return trimmed;
}

export function scoreUrl(domain: string): string {
  return `https://flintmere.com/score/${domain}`;
}

// Absolute URL of the embeddable PNG score badge (served by
// /badge/[shop]). Merchants drop this in an <img src> on their own site.
export function badgeUrl(domain: string): string {
  return `https://flintmere.com/badge/${domain}`;
}

// Display-truncate a domain for the fixed-width 400x120 badge. Satori
// (next/og) does not wrap or ellipsize, and the badge's domain line has room
// for ~26 monospace chars before it overflows the canvas — so long custom
// domains are trimmed with a trailing ellipsis. Typical *.myshopify.com
// domains are well under the cap and pass through untouched.
export function truncateDomain(domain: string, max = 26): string {
  return domain.length > max ? domain.slice(0, max - 3) + '...' : domain;
}
