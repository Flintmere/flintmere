import { describe, expect, it } from 'vitest';
import { scoreMapping } from '../src/pillars/mapping.js';
import { cleanProduct, makeCatalog } from './fixtures/products.js';
import { makeAdminContext } from './fixtures/admin-context.js';

describe('scoreMapping', () => {
  it('scores zero with critical issue when no products have a category', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext();
    const result = scoreMapping(catalog, ctx);
    expect(result.score).toBe(0);
    const missing = result.issues.find((i) => i.code === 'missing-gmc-category');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('critical');
  });

  it('scores max for a deep, leaf-level category', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      googleProductCategoryByProduct: {
        [cleanProduct.id]:
          'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Grinders',
      },
    });
    const result = scoreMapping(catalog, ctx);
    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  it('flags too-shallow when category exists but has < 3 segments', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      googleProductCategoryByProduct: {
        [cleanProduct.id]: 'Food, Beverages & Tobacco',
      },
    });
    const result = scoreMapping(catalog, ctx);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(80);
    const shallow = result.issues.find((i) => i.code === 'gmc-too-shallow');
    expect(shallow).toBeDefined();
    expect(shallow?.severity).toBe('medium');
  });

  it('downgrades severity to high (not critical) when most products have a category', () => {
    const products = Array.from({ length: 10 }, (_, i) => ({
      ...cleanProduct,
      id: `gid://shopify/Product/${i + 100}`,
      handle: `handle-${i + 100}`,
    }));
    // 7 of 10 have a deep category, 3 missing.
    const map: Record<string, string | null> = {};
    products.slice(0, 7).forEach((p) => {
      map[p.id] = 'Home & Garden > Kitchen & Dining > Coffee Grinders';
    });
    const ctx = makeAdminContext({ googleProductCategoryByProduct: map });
    const result = scoreMapping(makeCatalog(products), ctx);
    const missing = result.issues.find((i) => i.code === 'missing-gmc-category');
    expect(missing?.severity).toBe('high');
    expect(missing?.affectedCount).toBe(3);
  });

  it('returns zero with empty-catalog reason for an empty catalog', () => {
    const result = scoreMapping(makeCatalog([]), makeAdminContext());
    expect(result.score).toBe(0);
    expect(result.lockedReason).toBe('empty-catalog');
  });
});
