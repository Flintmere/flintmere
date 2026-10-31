import { describe, expect, it } from 'vitest';
import { scoreCrawlability } from '../src/pillars/crawlability.js';
import type { CrawlabilityInput } from '../src/types.js';

const wellFormedLlms = `# Meridian Coffee

A small-batch coffee gear shop.

## Products
- [Matte Black Grinder](https://meridian.com/products/grinder)
- [V60 Filters](https://meridian.com/products/v60)

## About
- [Story](https://meridian.com/about)
`;

const validSitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://meridian.com/</loc></url></urlset>';

const openRobots = `User-agent: *
Allow: /
Sitemap: https://meridian.com/sitemap.xml
`;

function makeInput(partial: Partial<CrawlabilityInput>): CrawlabilityInput {
  return {
    robotsTxt: null,
    llmsTxt: null,
    sitemapXml: null,
    ...partial,
  };
}

describe('scoreCrawlability', () => {
  it('scores a clean site near maximum', () => {
    const result = scoreCrawlability({
      robotsTxt: openRobots,
      llmsTxt: wellFormedLlms,
      sitemapXml: validSitemap,
    });
    expect(result.pillar).toBe('crawlability');
    expect(result.score).toBeGreaterThan(90);
    expect(result.issues).toHaveLength(0);
  });

  // The weights are published on flintmere.com/methodology, so a silent
  // drift between the engine and the page is a canon break, not a bug.
  // A perfect store scoring 100 is the invariant that catches it.
  it('a store passing every check scores exactly 100', () => {
    const result = scoreCrawlability(
      makeInput({
        robotsTxt: `${openRobots}\nSitemap: https://example.com/sitemap.xml`,
        llmsTxt: wellFormedLlms,
        sitemapXml: validSitemap,
      }),
    );
    expect(result.score).toBe(100);
  });

  // llms.txt is worth 10 of 100 since 2026-10-31, down from 40. Shopify
  // generates the file for every store, so this check is close to a
  // constant within the scanned population; the weight prices it as the
  // edge case it is. Raising it again needs a new ADR, not a tweak.
  it('missing llms.txt costs 10, not 40', () => {
    const base = {
      robotsTxt: `${openRobots}\nSitemap: https://example.com/sitemap.xml`,
      sitemapXml: validSitemap,
    };
    const withLlms = scoreCrawlability(makeInput({ ...base, llmsTxt: wellFormedLlms }));
    const without = scoreCrawlability(makeInput(base));
    expect(withLlms.score - without.score).toBe(10);
  });

  it('flags missing llms.txt as low severity', () => {
    const result = scoreCrawlability(
      makeInput({ robotsTxt: openRobots, sitemapXml: validSitemap }),
    );
    const missing = result.issues.find((i) => i.code === 'missing-llms-txt');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('low');
    // The severity drop (2026-09-10) moves ranking and the report email's
    // critical|high filter — never the score. The pillar score comes from
    // CHECKS alone: 0 llms + 45 aiAllowed + 30 sitemap + 15 referenced.
    //
    // 60 → 90 on 2026-10-31 when the llms.txt checks fell 40 → 10 (ADR 0030
    // §Open questions #4). A store missing llms.txt now forfeits 10, not 40:
    // Shopify generates the file for every store, so the check was close to
    // a constant and 40 points priced an edge case as a third of the pillar.
    expect(result.score).toBe(90);
  });

  it('emits critical when robots.txt disallows all', () => {
    const result = scoreCrawlability(
      makeInput({
        robotsTxt: 'User-agent: *\nDisallow: /',
        llmsTxt: wellFormedLlms,
        sitemapXml: validSitemap,
      }),
    );
    const block = result.issues.find((i) => i.code === 'robots-blocks-all');
    expect(block).toBeDefined();
    expect(block?.severity).toBe('critical');
    expect(result.score).toBeLessThan(70);
  });

  it('emits critical when robots.txt blocks named AI agents', () => {
    const result = scoreCrawlability(
      makeInput({
        robotsTxt: `User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /
`,
        llmsTxt: wellFormedLlms,
        sitemapXml: validSitemap,
      }),
    );
    const issue = result.issues.find(
      (i) => i.code === 'robots-blocks-ai-agents',
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('critical');
    expect(issue?.affectedCount).toBe(2);
  });

  it('flags missing sitemap as medium severity', () => {
    const result = scoreCrawlability(
      makeInput({ robotsTxt: openRobots, llmsTxt: wellFormedLlms }),
    );
    const missing = result.issues.find((i) => i.code === 'missing-sitemap');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('medium');
  });

  it('flags sitemap-not-referenced when robots omits sitemap directive', () => {
    const result = scoreCrawlability(
      makeInput({
        robotsTxt: 'User-agent: *\nAllow: /',
        llmsTxt: wellFormedLlms,
        sitemapXml: validSitemap,
      }),
    );
    const issue = result.issues.find(
      (i) => i.code === 'sitemap-not-referenced',
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('low');
  });

  it('flags malformed llms.txt', () => {
    const result = scoreCrawlability(
      makeInput({
        robotsTxt: openRobots,
        llmsTxt: 'Just a paragraph with no headings.',
        sitemapXml: validSitemap,
      }),
    );
    const issue = result.issues.find((i) => i.code === 'malformed-llms-txt');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('low');
  });

  it('rejects a non-xml body as sitemap', () => {
    const result = scoreCrawlability(
      makeInput({
        robotsTxt: openRobots,
        llmsTxt: wellFormedLlms,
        sitemapXml: '<html><body>404</body></html>',
      }),
    );
    const missing = result.issues.find((i) => i.code === 'missing-sitemap');
    expect(missing).toBeDefined();
  });

  it('returns zero with all inputs null', () => {
    const result = scoreCrawlability(makeInput({}));
    expect(result.score).toBeLessThan(50);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
