import { describe, expect, it } from 'vitest';
import { scoreCatalog } from '../src/score.js';
import { cleanProduct, makeCatalog, noGtinProduct } from './fixtures/products.js';

describe('scoreCatalog', () => {
  it('returns a composite score and six pillars', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreCatalog(catalog);
    expect(result.pillars).toHaveLength(6);
    expect(result.shopDomain).toBe(catalog.shopDomain);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
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
