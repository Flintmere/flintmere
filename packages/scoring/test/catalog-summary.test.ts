import { describe, expect, it } from 'vitest';
import { summarizeCatalog } from '../src/catalog-summary.js';
import type { ProductInput } from '../src/types.js';
import { cleanProduct, makeCatalog } from './fixtures/products.js';

const product = (overrides: Partial<ProductInput> & { id: string }): ProductInput => ({
  ...cleanProduct,
  ...overrides,
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: `${overrides.id}-v1`,
    },
  ],
});

describe('summarizeCatalog', () => {
  it('returns the empty shape when the catalog has no products', () => {
    const summary = summarizeCatalog(makeCatalog([]));
    expect(summary).toEqual({
      totalProducts: 0,
      topCategories: [],
      source: 'generic',
    });
  });

  it('groups productType case-insensitively but displays first-seen casing', () => {
    const summary = summarizeCatalog(
      makeCatalog([
        product({ id: '1', productType: 'Coffee' }),
        product({ id: '2', productType: 'coffee' }),
        product({ id: '3', productType: 'COFFEE' }),
      ]),
    );
    expect(summary.source).toBe('product-type');
    expect(summary.totalProducts).toBe(3);
    expect(summary.topCategories).toEqual([{ label: 'Coffee', count: 3 }]);
  });

  it('caps top categories at four, ordered by count desc then alpha', () => {
    const summary = summarizeCatalog(
      makeCatalog([
        product({ id: '1', productType: 'Coffee' }),
        product({ id: '2', productType: 'Coffee' }),
        product({ id: '3', productType: 'Coffee' }),
        product({ id: '4', productType: 'Tea' }),
        product({ id: '5', productType: 'Tea' }),
        product({ id: '6', productType: 'Bakery' }),
        product({ id: '7', productType: 'Bakery' }),
        product({ id: '8', productType: 'Snacks' }),
        product({ id: '9', productType: 'Sauces' }),
        product({ id: '10', productType: 'Drinks' }),
      ]),
    );
    expect(summary.source).toBe('product-type');
    expect(summary.totalProducts).toBe(10);
    expect(summary.topCategories).toHaveLength(4);
    expect(summary.topCategories).toEqual([
      { label: 'Coffee', count: 3 },
      { label: 'Bakery', count: 2 },
      { label: 'Tea', count: 2 },
      { label: 'Drinks', count: 1 },
    ]);
  });

  it('skips empty / whitespace productType values when tallying', () => {
    const summary = summarizeCatalog(
      makeCatalog([
        product({ id: '1', productType: 'Coffee' }),
        product({ id: '2', productType: '' }),
        product({ id: '3', productType: '   ' }),
        product({ id: '4', productType: null }),
      ]),
    );
    expect(summary.source).toBe('product-type');
    expect(summary.totalProducts).toBe(4);
    expect(summary.topCategories).toEqual([{ label: 'Coffee', count: 1 }]);
  });

  it('falls back to vendor when no product carries a productType', () => {
    const summary = summarizeCatalog(
      makeCatalog([
        product({ id: '1', productType: '', vendor: 'Origin' }),
        product({ id: '2', productType: null, vendor: 'Origin' }),
        product({ id: '3', productType: '   ', vendor: 'Square Mile' }),
      ]),
    );
    expect(summary.source).toBe('vendor');
    expect(summary.totalProducts).toBe(3);
    expect(summary.topCategories).toEqual([
      { label: 'Origin', count: 2 },
      { label: 'Square Mile', count: 1 },
    ]);
  });

  it('falls back to generic "products" when neither productType nor vendor exists', () => {
    const summary = summarizeCatalog(
      makeCatalog([
        product({ id: '1', productType: '', vendor: '' }),
        product({ id: '2', productType: null, vendor: null }),
      ]),
    );
    expect(summary).toEqual({
      totalProducts: 2,
      topCategories: [{ label: 'products', count: 2 }],
      source: 'generic',
    });
  });

  it('preserves verbatim merchant casing on display (no title-casing)', () => {
    const summary = summarizeCatalog(
      makeCatalog([
        product({ id: '1', productType: 'plant-based snacks' }),
      ]),
    );
    expect(summary.topCategories[0]!.label).toBe('plant-based snacks');
  });
});
