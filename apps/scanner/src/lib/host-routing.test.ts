import { describe, expect, it } from 'vitest';
import {
  MARKETING_HOST,
  SCANNER_HOST,
  STANDARDS_HOST,
  canonicalHost,
  classifyRoute,
  rewritePathForHost,
  targetHostForRedirect,
} from './host-routing';

describe('classifyRoute', () => {
  it.each([
    ['/', 'marketing'],
    ['/about', 'marketing'],
    ['/pricing', 'marketing'],
    ['/methodology', 'marketing'],
    ['/research', 'marketing'],
    ['/for/food-and-drink', 'marketing'],
    ['/for/beauty', 'marketing'],
    ['/for/apparel', 'marketing'],
    ['/for/plus', 'marketing'],
    ['/privacy', 'marketing'],
    ['/terms', 'marketing'],
    ['/dpa', 'marketing'],
    ['/cookies', 'marketing'],
    ['/security', 'marketing'],
    ['/support', 'marketing'],
    ['/contact', 'marketing'],
  ])('classifies %s as marketing', (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });

  it.each([
    ['/scan', 'scanner'],
    ['/audit', 'scanner'],
    ['/audit/success', 'scanner'],
    ['/score/example-shop', 'scanner'],
    ['/bot', 'scanner'],
    ['/unsubscribe', 'scanner'],
    ['/admin', 'scanner'],
    ['/admin/audit-draft', 'scanner'],
    ['/admin/login', 'scanner'],
  ])('classifies %s as scanner', (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });

  it.each([
    ['/standards', 'standards'],
    ['/standards/food', 'standards'],
    ['/standards/food/allergens', 'standards'],
  ])('classifies %s as standards', (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });

  it.each([
    ['/api/scan', 'both'],
    ['/api/lead', 'both'],
    ['/api/contact', 'both'],
    ['/api/healthz', 'both'],
    ['/api/webhooks/stripe', 'both'],
    ['/ingest/e/', 'both'],
    ['/ingest/static/array.js', 'both'],
    ['/sitemap.xml', 'both'],
    ['/robots.txt', 'both'],
    ['/_next/static/foo.js', 'both'],
    ['/icon.svg', 'both'],
    ['/apple-icon', 'both'],
    ['/opengraph-image', 'both'],
    ['/favicon.ico', 'both'],
  ])('classifies %s as both', (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });

  it('classifies unknown routes as unknown', () => {
    expect(classifyRoute('/this-does-not-exist')).toBe('unknown');
    expect(classifyRoute('/random/deep/path')).toBe('unknown');
  });

  it('does not match /audit when given /audit/success (longest-prefix-first)', () => {
    // Both /audit and /audit/success are scanner — not the bug we're guarding.
    // Real bug: ensure /score/X resolves correctly even though /score is its prefix.
    expect(classifyRoute('/score/example.myshopify.com')).toBe('scanner');
    expect(classifyRoute('/score')).toBe('scanner');
  });

  it('handles trailing slashes', () => {
    expect(classifyRoute('/about/')).toBe('marketing');
    expect(classifyRoute('/scan/')).toBe('scanner');
    expect(classifyRoute('/standards/')).toBe('standards');
  });

  it('does not match / as a prefix for everything', () => {
    // Bug guard: `/` as a marketing route must not match `/scan` as `/` + `scan`
    expect(classifyRoute('/scan')).toBe('scanner');
    expect(classifyRoute('/this-is-unknown')).toBe('unknown');
  });
});

describe('canonicalHost', () => {
  it('returns scanner host for scanner routes', () => {
    expect(canonicalHost('/scan')).toBe(SCANNER_HOST);
    expect(canonicalHost('/audit')).toBe(SCANNER_HOST);
    expect(canonicalHost('/score/foo')).toBe(SCANNER_HOST);
  });

  it('returns marketing host for marketing routes', () => {
    expect(canonicalHost('/')).toBe(MARKETING_HOST);
    expect(canonicalHost('/pricing')).toBe(MARKETING_HOST);
    expect(canonicalHost('/about')).toBe(MARKETING_HOST);
  });

  it('returns standards host for standards routes', () => {
    expect(canonicalHost('/standards')).toBe(STANDARDS_HOST);
    expect(canonicalHost('/standards/food')).toBe(STANDARDS_HOST);
  });

  it('returns marketing host for unknown routes (brand-first)', () => {
    expect(canonicalHost('/unknown-route')).toBe(MARKETING_HOST);
  });

  it('returns marketing host for both-classified routes (brand is the better default)', () => {
    expect(canonicalHost('/api/scan')).toBe(MARKETING_HOST);
  });
});

describe('targetHostForRedirect', () => {
  it('redirects scanner-route hits on marketing host to scanner host', () => {
    expect(targetHostForRedirect(MARKETING_HOST, '/scan')).toBe(SCANNER_HOST);
    expect(targetHostForRedirect(MARKETING_HOST, '/audit/success')).toBe(SCANNER_HOST);
    expect(targetHostForRedirect(MARKETING_HOST, '/admin')).toBe(SCANNER_HOST);
    expect(targetHostForRedirect(MARKETING_HOST, '/admin/audit-draft')).toBe(SCANNER_HOST);
  });

  it('redirects marketing-route hits on scanner host to marketing host', () => {
    expect(targetHostForRedirect(SCANNER_HOST, '/pricing')).toBe(MARKETING_HOST);
    expect(targetHostForRedirect(SCANNER_HOST, '/about')).toBe(MARKETING_HOST);
  });

  it('redirects standards-route hits on marketing host to standards host', () => {
    expect(targetHostForRedirect(MARKETING_HOST, '/standards')).toBe(STANDARDS_HOST);
    expect(targetHostForRedirect(MARKETING_HOST, '/standards/food')).toBe(STANDARDS_HOST);
  });

  it('redirects standards-route hits on scanner host to standards host', () => {
    expect(targetHostForRedirect(SCANNER_HOST, '/standards')).toBe(STANDARDS_HOST);
  });

  it('redirects scanner-route hits on standards host to scanner host', () => {
    expect(targetHostForRedirect(STANDARDS_HOST, '/scan')).toBe(SCANNER_HOST);
  });

  it('redirects marketing-route hits on standards host to marketing host', () => {
    expect(targetHostForRedirect(STANDARDS_HOST, '/pricing')).toBe(MARKETING_HOST);
    expect(targetHostForRedirect(STANDARDS_HOST, '/about')).toBe(MARKETING_HOST);
  });

  it('does not redirect the standards-host root (handled by middleware rewrite)', () => {
    expect(targetHostForRedirect(STANDARDS_HOST, '/')).toBeNull();
    expect(targetHostForRedirect(STANDARDS_HOST, '')).toBeNull();
  });

  it('does not redirect when route is on the right host already', () => {
    expect(targetHostForRedirect(MARKETING_HOST, '/pricing')).toBeNull();
    expect(targetHostForRedirect(SCANNER_HOST, '/scan')).toBeNull();
    expect(targetHostForRedirect(STANDARDS_HOST, '/standards')).toBeNull();
  });

  it('does not redirect both-classified routes', () => {
    expect(targetHostForRedirect(MARKETING_HOST, '/api/scan')).toBeNull();
    expect(targetHostForRedirect(SCANNER_HOST, '/sitemap.xml')).toBeNull();
    expect(targetHostForRedirect(STANDARDS_HOST, '/api/contact')).toBeNull();
  });

  it('does not cross-host-redirect the PostHog /ingest proxy on any host', () => {
    expect(targetHostForRedirect(MARKETING_HOST, '/ingest/e/')).toBeNull();
    expect(targetHostForRedirect(SCANNER_HOST, '/ingest/e/')).toBeNull();
    expect(targetHostForRedirect(STANDARDS_HOST, '/ingest/static/array.js')).toBeNull();
  });

  it('does not redirect unknown routes (let the 404 handler render)', () => {
    expect(targetHostForRedirect(MARKETING_HOST, '/random')).toBeNull();
    expect(targetHostForRedirect(SCANNER_HOST, '/random')).toBeNull();
    expect(targetHostForRedirect(STANDARDS_HOST, '/random')).toBeNull();
  });

  it('does not redirect from non-canonical hosts (preview / localhost)', () => {
    expect(targetHostForRedirect('localhost:3001', '/scan')).toBeNull();
    expect(targetHostForRedirect('preview-abc.coolify.app', '/pricing')).toBeNull();
    expect(targetHostForRedirect('preview-abc.coolify.app', '/standards')).toBeNull();
  });

  it('strips port from request host for comparison', () => {
    expect(targetHostForRedirect('flintmere.com:443', '/pricing')).toBeNull();
    expect(targetHostForRedirect('flintmere.com:443', '/scan')).toBe(SCANNER_HOST);
    expect(targetHostForRedirect('standards.flintmere.com:443', '/')).toBeNull();
  });

  it('case-insensitive on host comparison', () => {
    expect(targetHostForRedirect('FLINTMERE.COM', '/pricing')).toBeNull();
    expect(targetHostForRedirect('Audit.Flintmere.Com', '/scan')).toBeNull();
    expect(targetHostForRedirect('Standards.Flintmere.Com', '/')).toBeNull();
  });
});

describe('rewritePathForHost', () => {
  it('rewrites the standards-host root to /standards', () => {
    expect(rewritePathForHost(STANDARDS_HOST, '/')).toBe('/standards');
    expect(rewritePathForHost(STANDARDS_HOST, '')).toBe('/standards');
  });

  it('rewrites with port stripped and case-insensitive', () => {
    expect(rewritePathForHost('Standards.Flintmere.Com:443', '/')).toBe(
      '/standards',
    );
  });

  it('does not rewrite non-root paths on standards host', () => {
    expect(rewritePathForHost(STANDARDS_HOST, '/standards')).toBeNull();
    expect(rewritePathForHost(STANDARDS_HOST, '/standards/food')).toBeNull();
    expect(rewritePathForHost(STANDARDS_HOST, '/about')).toBeNull();
  });

  it('does not rewrite anything on marketing or scanner hosts', () => {
    expect(rewritePathForHost(MARKETING_HOST, '/')).toBeNull();
    expect(rewritePathForHost(MARKETING_HOST, '/standards')).toBeNull();
    expect(rewritePathForHost(SCANNER_HOST, '/')).toBeNull();
  });

  it('does not rewrite from non-canonical hosts', () => {
    expect(rewritePathForHost('localhost:3001', '/')).toBeNull();
    expect(rewritePathForHost('preview-abc.coolify.app', '/')).toBeNull();
  });
});
