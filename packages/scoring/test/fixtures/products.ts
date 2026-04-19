import type { CatalogInput, ProductInput } from '../../src/types.js';

export const cleanProduct: ProductInput = {
  id: 'gid://shopify/Product/1',
  handle: 'matte-black-coffee-grinder',
  title: 'Meridian Matte Black Manual Coffee Grinder',
  bodyHtml:
    '<p>Ideal for pour-over and espresso. Stainless steel burr, 20 grind settings.</p><ul><li>Capacity: 40g</li><li>Burr: stainless steel</li><li>Weight: 480g</li></ul>',
  vendor: 'Meridian',
  productType: 'Coffee Grinder',
  tags: ['coffee', 'manual', 'burr'],
  status: 'active',
  publishedAt: '2025-01-10T12:00:00Z',
  variants: [
    {
      id: 'gid://shopify/ProductVariant/1',
      sku: 'MERIDIAN-CG-01',
      barcode: '5012345678900',
      price: '89.00',
      inventoryQuantity: 42,
      inventoryPolicy: 'deny',
      available: true,
    },
  ],
  images: [
    {
      id: 'gid://shopify/ProductImage/1',
      src: 'https://cdn.shopify.com/s/files/1/meridian/grinder.jpg',
      altText: 'Matte black manual coffee grinder with stainless steel burr',
      width: 1200,
      height: 1200,
    },
  ],
  brandMetafield: 'Meridian',
};

export const noGtinProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/2',
  handle: 'no-gtin',
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: 'gid://shopify/ProductVariant/2',
      barcode: '',
    },
  ],
};

export const fluffyTitleProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/3',
  handle: 'fluffy-title',
  title: 'BEST EVER!!! LIMITED Meridian Coffee Grinder — MUST HAVE!!!',
};

export const longTitleProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/4',
  handle: 'long-title',
  title:
    'Meridian Manual Coffee Grinder Matte Black Stainless Steel Burr with 20 Grind Settings Precision Adjustment for Pour Over Espresso French Press Aeropress Cold Brew Ideal for Home and Professional Use',
};

export const noAltTextProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/5',
  handle: 'no-alt',
  images: [
    {
      id: 'gid://shopify/ProductImage/5',
      src: 'https://cdn.shopify.com/grinder.jpg',
      altText: null,
    },
  ],
};

export const invalidChecksumProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/6',
  handle: 'bad-checksum',
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: 'gid://shopify/ProductVariant/6',
      barcode: '5012345678901',
    },
  ],
};

export const activeZeroStockProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/7',
  handle: 'zero-stock',
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: 'gid://shopify/ProductVariant/7',
      inventoryQuantity: 0,
      inventoryPolicy: 'deny',
    },
  ],
};

export function makeCatalog(products: ProductInput[]): CatalogInput {
  return {
    shopDomain: 'meridian-coffee.myshopify.com',
    products,
    scoredAt: '2026-04-19T12:00:00Z',
  };
}
