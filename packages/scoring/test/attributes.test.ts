import { describe, expect, it } from 'vitest';
import { scoreAttributes } from '../src/pillars/attributes.js';
import { cleanProduct, makeCatalog } from './fixtures/products.js';
import {
  customNamespaceMetafields,
  makeAdminContext,
  standardFoodMetafields,
} from './fixtures/admin-context.js';

describe('scoreAttributes', () => {
  it('scores zero with a critical issue when no metafields exist', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext();
    const result = scoreAttributes(catalog, ctx);
    expect(result.pillar).toBe('attributes');
    expect(result.locked).toBe(false);
    expect(result.score).toBe(0);
    const missing = result.issues.find((i) => i.code === 'missing-structured-attributes');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('critical');
  });

  it('scores near-max for a product with deep standard-namespace metafields', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      metafieldsByProduct: { [cleanProduct.id]: standardFoodMetafields },
    });
    const result = scoreAttributes(catalog, ctx);
    expect(result.score).toBeGreaterThan(95);
    expect(result.issues).toHaveLength(0);
  });

  it('flags low-attribute-depth when products carry only a couple of metafields', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      metafieldsByProduct: { [cleanProduct.id]: customNamespaceMetafields },
    });
    const result = scoreAttributes(catalog, ctx);
    // Two custom metafields: presence 50 + depth band-45 → ~63 (max 100).
    expect(result.score).toBeLessThan(70);
    const lowDepth = result.issues.find((i) => i.code === 'low-attribute-depth');
    expect(lowDepth).toBeDefined();
    expect(lowDepth?.severity).toBe('high');
  });

  it('flags no-standard-taxonomy when only custom namespaces are used', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      metafieldsByProduct: { [cleanProduct.id]: customNamespaceMetafields },
    });
    const result = scoreAttributes(catalog, ctx);
    const noStandard = result.issues.find((i) => i.code === 'no-standard-taxonomy');
    expect(noStandard).toBeDefined();
    expect(noStandard?.severity).toBe('medium');
  });

  it('excludes brand and MPN metafields from the attribute count', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      metafieldsByProduct: {
        [cleanProduct.id]: [
          { namespace: 'custom', key: 'brand', type: 'single_line_text_field', value: 'Meridian' },
          { namespace: 'custom', key: 'mpn', type: 'single_line_text_field', value: 'MPN-123' },
        ],
      },
    });
    const result = scoreAttributes(catalog, ctx);
    expect(result.score).toBe(0);
    const missing = result.issues.find((i) => i.code === 'missing-structured-attributes');
    expect(missing).toBeDefined();
  });

  it('returns zero with empty-catalog reason for an empty catalog', () => {
    const result = scoreAttributes(makeCatalog([]), makeAdminContext());
    expect(result.score).toBe(0);
    expect(result.lockedReason).toBe('empty-catalog');
  });
});
