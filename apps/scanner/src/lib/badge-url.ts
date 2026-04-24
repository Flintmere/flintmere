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
