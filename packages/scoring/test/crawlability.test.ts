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

  it('flags missing llms.txt as high severity', () => {
    const result = scoreCrawlability(
      makeInput({ robotsTxt: openRobots, sitemapXml: validSitemap }),
    );
    const missing = result.issues.find((i) => i.code === 'missing-llms-txt');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('high');
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
