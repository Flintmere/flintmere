import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./ssrf', () => ({
  assertPublicHost: vi.fn(async () => undefined),
  isPrivateHostLiteral: vi.fn(() => false),
  SsrfBlockedError: class SsrfBlockedError extends Error {},
}));

import { fetchCatalog, ShopifyFetchError } from './shopify-fetcher';

/** One product as /products.json serves it — note: no `barcode` key. */
function rawProduct(n: number, variantIds: number[] = [n * 10]) {
  return {
    id: n,
    handle: `product-${n}`,
    title: `Product ${n}`,
    body_html: '<p>x</p>',
    vendor: 'Meridian',
    product_type: 'Coffee',
    tags: 'a,b',
    published_at: '2026-01-01T00:00:00Z',
    variants: variantIds.map((id) => ({
      id,
      sku: `SKU-${id}`,
      price: '9.00',
      compare_at_price: null,
      inventory_quantity: 5,
      inventory_policy: 'deny',
      available: true,
    })),
    images: [],
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

/**
 * Routes by URL substring, first match wins. Anything unmatched is a 404 —
 * so a test that forgets a route fails loudly instead of hanging.
 */
function mockFetch(routes: Array<[string, () => Response]>) {
  const fn = vi.fn(async (input: string | URL) => {
    const url = String(input);
    for (const [needle, make] of routes) {
      if (url.includes(needle)) return make();
    }
    return json({}, 404);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('fetchCatalog — catalog shape', () => {
  it('normalises a single page of products.json', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1), rawProduct(2)] })],
      ['/products/count.json', () => json({ count: 2 })],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.catalog.shopDomain).toBe('example.com');
    expect(result.catalog.products).toHaveLength(2);
    expect(result.truncated).toBe(false);
    expect(result.actualProductCount).toBe(2);
  });

  it('throws not-shopify on a 404 from products.json', async () => {
    mockFetch([['/products.json', () => json({}, 404)]]);

    await expect(fetchCatalog('example.com')).rejects.toMatchObject({
      name: 'ShopifyFetchError',
      code: 'not-shopify',
    });
    expect(ShopifyFetchError).toBeDefined();
  });
});

/** One product as /products/{handle}.js serves it — this one HAS barcode. */
function jsDoc(variants: Array<{ id: number; barcode: string | null }>) {
  return {
    id: 1,
    handle: 'product-1',
    title: 'Product 1',
    variants: variants.map((v) => ({
      id: v.id,
      barcode: v.barcode,
      sku: `SKU-${v.id}`,
      price: 900,
      available: true,
    })),
  };
}

describe('fetchCatalog — barcode pass', () => {
  it('fills variant barcodes from the .js document', async () => {
    const fn = mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
      ['/products/product-1.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.catalog.products[0]!.variants[0]!.barcode).toBe('5012345678900');
    expect(result.catalog.products[0]!.barcodeRead).toBe(true);
    expect(result.barcodesRead).toBe(1);
    expect(fn.mock.calls.map((c) => String(c[0]))).toContain(
      'https://example.com/products/product-1.js',
    );
  });

  it('records a genuine null barcode as read, not as unread', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
      ['/products/product-1.js', () => json(jsDoc([{ id: 10, barcode: null }]))],
    ]);

    const result = await fetchCatalog('example.com');

    // The distinction the whole plan exists for: we looked, and there is
    // nothing there. Not: we never looked.
    expect(result.catalog.products[0]!.variants[0]!.barcode).toBeNull();
    expect(result.catalog.products[0]!.barcodeRead).toBe(true);
    expect(result.barcodesRead).toBe(1);
  });

  it('reads at most barcodeSampleSize products and marks the rest unread', async () => {
    const products = [1, 2, 3].map((n) => rawProduct(n, [n * 10]));
    mockFetch([
      ['/products.json', () => json({ products })],
      ['/products/count.json', () => json({ count: 3 })],
      ['.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com', { barcodeSampleSize: 2 });

    expect(result.barcodesRead).toBe(2);
    expect(result.catalog.products.map((p) => p.barcodeRead)).toEqual([true, true, false]);
  });

  it('skips the pass entirely at barcodeSampleSize 0', async () => {
    const fn = mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
    ]);

    const result = await fetchCatalog('example.com', { barcodeSampleSize: 0 });

    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products[0]!.barcodeRead).toBe(false);
    expect(fn.mock.calls.every((c) => !String(c[0]).endsWith('.js'))).toBe(true);
  });
});
