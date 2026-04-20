import { describe, expect, it } from 'vitest';
import { scoreCatalog } from '../src/score.js';
import { cleanProduct, makeCatalog, noGtinProduct } from './fixtures/products.js';

describe('scoreCatalog', () => {
  it('returns a composite score and seven pillars', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreCatalog(catalog);
    expect(result.pillars).toHaveLength(7);
    expect(result.shopDomain).toBe(catalog.shopDomain);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('locks crawlability when no crawl input is provided', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreCatalog(catalog);
    const crawl = result.pillars.find((p) => p.pillar === 'crawlability');
    expect(crawl?.locked).toBe(true);
    expect(crawl?.lockedReason).toBe('crawlability-not-fetched');
  });

  it('scores crawlability when input is provided', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreCatalog(catalog, {
      crawlability: {
        robotsTxt:
          'User-agent: *\nAllow: /\nSitemap: https://shop.com/sitemap.xml',
        llmsTxt: '# Meridian Coffee\n\n## Products\n- [Grinder](/grinder)',
        sitemapXml:
          '<?xml version="1.0"?><urlset><url><loc>https://shop.com/</loc></url></urlset>',
      },
    });
    const crawl = result.pillars.find((p) => p.pillar === 'crawlability');
    expect(crawl?.locked).toBe(false);
    expect(crawl?.score).toBeGreaterThan(90);
  });

  it('locks attributes, mapping, and checkout by default (scanner mode)', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreCatalog(catalog);
    const attributes = result.pillars.find((p) => p.pillar === 'attributes');
    const mapping = result.pillars.find((p) => p.pillar === 'mapping');
    const checkout = result.pillars.find(
      (p) => p.pillar === 'checkout-eligibility',
    );
    expect(attributes?.locked).toBe(true);
    expect(mapping?.locked).toBe(true);
    expect(checkout?.locked).toBe(true);
  });

  it('a catalog of noGtin product scores lower than clean', () => {
    const cleanResult = scoreCatalog(makeCatalog([cleanProduct]));
    const noGtinResult = scoreCatalog(makeCatalog([noGtinProduct]));
    expect(noGtinResult.score).toBeLessThan(cleanResult.score);
  });

  it('assigns a grade based on the composite score', () => {
    const high = scoreCatalog(makeCatalog([cleanProduct]));
    expect(['A', 'B', 'C']).toContain(high.grade);

    const low = scoreCatalog(makeCatalog([noGtinProduct]));
    expect(['D', 'F']).toContain(low.grade);
  });

  it('ranks issues by severity × revenue impact', () => {
    const catalog = makeCatalog([noGtinProduct]);
    const result = scoreCatalog(catalog);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]?.severity).toBe('critical');
  });

  it('computes a GTIN-less ceiling below 100', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreCatalog(catalog);
    expect(result.gtinlessCeiling).toBeLessThan(100);
    expect(result.gtinlessCeiling).toBeGreaterThan(60);
  });
});
