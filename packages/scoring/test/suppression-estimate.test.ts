import { describe, expect, it } from 'vitest';
import { estimateSuppression } from '../src/pillars/suppression-estimate.js';
import type { ProductInput } from '../src/types.js';
import { cleanProduct, makeCatalog, noGtinProduct } from './fixtures/products.js';

// A food-vertical product with all three suppression signals — no GTIN,
// no allergen disclosure in the description, no productType / GMC category.
const tripleSignalFoodProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/100',
  handle: 'organic-snack-bar',
  title: 'Organic Snack Bar',
  bodyHtml: '<p>A crunchy snack bar.</p>',
  productType: '',
  tags: ['snack', 'organic'],
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: 'gid://shopify/ProductVariant/100',
      barcode: '',
    },
  ],
};

// A food-vertical product with two signals — missing GTIN + missing
// productType — but allergens are disclosed.
const twoSignalFoodProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/101',
  handle: 'gluten-free-cookies',
  title: 'Gluten Free Cookies',
  bodyHtml:
    '<p>Crunchy biscuit. Contains: oats, soya. Free from wheat and dairy.</p>',
  productType: '',
  tags: ['snack', 'biscuit'],
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: 'gid://shopify/ProductVariant/101',
      barcode: '',
    },
  ],
};

// A food-vertical product with one signal — missing GTIN only; allergens
// disclosed, productType present.
const oneSignalFoodProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/102',
  handle: 'almond-butter',
  title: 'Smooth Almond Butter',
  bodyHtml:
    '<p>100% roasted almonds. Contains: almonds (tree nuts). May contain traces of peanuts.</p>',
  productType: 'Pantry',
  tags: ['food', 'pantry'],
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: 'gid://shopify/ProductVariant/102',
      barcode: '',
    },
  ],
};

describe('estimateSuppression', () => {
  it('returns {0, 0} for an empty catalog', () => {
    const result = estimateSuppression(makeCatalog([]));
    expect(result.low).toBe(0);
    expect(result.high).toBe(0);
    expect(result.signals.missingGtin).toBe(0);
    expect(result.signals.ambiguousAllergen).toBe(0);
    expect(result.signals.missingGmcCategory).toBe(0);
  });

  it('returns {0, 0} for a zero-signal catalog (clean non-food product)', () => {
    // cleanProduct: barcode present, productType present, non-food. No
    // signals should fire.
    const result = estimateSuppression(makeCatalog([cleanProduct]));
    expect(result.low).toBe(0);
    expect(result.high).toBe(0);
    expect(result.signals.missingGtin).toBe(0);
    expect(result.signals.ambiguousAllergen).toBe(0);
    expect(result.signals.missingGmcCategory).toBe(0);
  });

  it('returns a non-trivial range for a high-signal catalog', () => {
    // Ten copies of the triple-signal food product. Per the bands,
    // each contributes [0.85, 1.0] → sum [8.5, 10.0]. After floor/ceil,
    // low = 8, high = 10.
    const products = Array.from({ length: 10 }, (_, i) => ({
      ...tripleSignalFoodProduct,
      id: `gid://shopify/Product/${200 + i}`,
      handle: `triple-${i}`,
    }));
    const result = estimateSuppression(makeCatalog(products));
    expect(result.high).toBeGreaterThan(result.low);
    expect(result.low).toBeGreaterThan(0);
    expect(result.high).toBeGreaterThan(0);
    expect(result.signals.missingGtin).toBe(10);
    expect(result.signals.ambiguousAllergen).toBe(10);
    expect(result.signals.missingGmcCategory).toBe(10);
  });

  it('range is monotonic — high is always >= low', () => {
    // Sweep across mixed catalogs and confirm high never drops below low.
    const fixtures: ProductInput[][] = [
      [],
      [cleanProduct],
      [cleanProduct, noGtinProduct],
      [oneSignalFoodProduct],
      [oneSignalFoodProduct, twoSignalFoodProduct],
      [tripleSignalFoodProduct, twoSignalFoodProduct, oneSignalFoodProduct],
      [
        tripleSignalFoodProduct,
        tripleSignalFoodProduct,
        tripleSignalFoodProduct,
        cleanProduct,
      ],
    ];
    for (const products of fixtures) {
      const result = estimateSuppression(makeCatalog(products));
      expect(result.high).toBeGreaterThanOrEqual(result.low);
      expect(result.low).toBeGreaterThanOrEqual(0);
    }
  });

  it('hard-caps the range at the catalog product count', () => {
    // Three products, all triple-signal — sum of high probabilities is 3.0
    // exactly. Cap should hold; high never exceeds product count.
    const products = Array.from({ length: 3 }, (_, i) => ({
      ...tripleSignalFoodProduct,
      id: `gid://shopify/Product/${300 + i}`,
      handle: `triple-cap-${i}`,
    }));
    const result = estimateSuppression(makeCatalog(products));
    expect(result.high).toBeLessThanOrEqual(3);
    expect(result.low).toBeLessThanOrEqual(3);
  });

  it('signals breakdown reflects per-product counts, not aggregated probabilities', () => {
    const products = [
      tripleSignalFoodProduct, // all three
      twoSignalFoodProduct, // missing GTIN + missing GMC category
      oneSignalFoodProduct, // missing GTIN only
      cleanProduct, // none
    ];
    const result = estimateSuppression(makeCatalog(products));
    // 3 products are missing GTIN (the food triple, the food two-signal,
    // the food one-signal). Clean product has GTIN.
    expect(result.signals.missingGtin).toBe(3);
    // Only the triple-signal lacks an allergen disclosure (food + no
    // marker). The two-signal mentions "Contains: oats, soya"; the
    // one-signal mentions almonds + peanuts. Clean is non-food so the
    // allergen check doesn't fire.
    expect(result.signals.ambiguousAllergen).toBe(1);
    // 2 products lack productType (the triple, the two-signal).
    expect(result.signals.missingGmcCategory).toBe(2);
  });

  it('does not flag non-food products as ambiguous-allergen', () => {
    // Non-food product with no allergen text, no GTIN, no productType —
    // should fire missingGtin + missingGmcCategory but NOT ambiguousAllergen.
    const nonFoodNoAllergen: ProductInput = {
      ...cleanProduct,
      id: 'gid://shopify/Product/400',
      handle: 'leather-wallet',
      title: 'Brown Leather Wallet',
      bodyHtml: '<p>A handsome leather wallet.</p>',
      productType: '',
      tags: ['accessory', 'leather'],
      variants: [
        {
          ...cleanProduct.variants[0]!,
          id: 'gid://shopify/ProductVariant/400',
          barcode: '',
        },
      ],
    };
    const result = estimateSuppression(makeCatalog([nonFoodNoAllergen]));
    expect(result.signals.missingGtin).toBe(1);
    expect(result.signals.ambiguousAllergen).toBe(0);
    expect(result.signals.missingGmcCategory).toBe(1);
  });

  it('respects the food-keyword heuristic via productType, tags, or title', () => {
    // Same body text on three products with food signal in different
    // fields: productType, tags, title. All should be flagged
    // ambiguousAllergen because none mention an allergen.
    const baseFood: Omit<ProductInput, 'id' | 'handle'> = {
      title: 'Mystery Item',
      bodyHtml: '<p>A delicious treat.</p>',
      vendor: 'Some Brand',
      productType: '',
      tags: [],
      status: 'active',
      publishedAt: '2026-01-01T00:00:00Z',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/500',
          sku: 'SKU-500',
          barcode: '5012345678900',
          price: '5.00',
          inventoryQuantity: 10,
          inventoryPolicy: 'deny',
          available: true,
        },
      ],
      images: [],
      brandMetafield: 'Some Brand',
    };
    const viaProductType: ProductInput = {
      ...baseFood,
      id: 'gid://shopify/Product/501',
      handle: 'pt',
      productType: 'Snack',
    };
    const viaTags: ProductInput = {
      ...baseFood,
      id: 'gid://shopify/Product/502',
      handle: 'tg',
      tags: ['bakery'],
    };
    const viaTitle: ProductInput = {
      ...baseFood,
      id: 'gid://shopify/Product/503',
      handle: 'tl',
      title: 'Chocolate Mystery Item',
    };
    const result = estimateSuppression(
      makeCatalog([viaProductType, viaTags, viaTitle]),
    );
    expect(result.signals.ambiguousAllergen).toBe(3);
  });
});
