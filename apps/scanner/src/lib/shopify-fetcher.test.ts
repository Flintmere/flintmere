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
      // Anchored on the product path (not a bare '.js', which also matches
      // '/products.json' — Minor 5) and keyed per handle so each doc
      // carries that product's own variant id (Finding 3's fix rejects a
      // doc that shares no variant ids with the product being read).
      ['/products/product-1.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }]))],
      ['/products/product-2.js', () => json(jsDoc([{ id: 20, barcode: '5012345678901' }]))],
      ['/products/product-3.js', () => json(jsDoc([{ id: 30, barcode: '5012345678902' }]))],
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

describe('fetchCatalog — barcode read integrity (Finding 3)', () => {
  it('does not mark a product read when its .js document shares no variant ids with it', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
      // A redirected/stale handle: the doc that comes back describes a
      // completely different product's variants.
      ['/products/product-1.js', () => json(jsDoc([{ id: 999, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.catalog.products[0]!.barcodeRead).toBe(false);
    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products[0]!.variants[0]!.barcode).toBeNull();
  });

  it('still counts a partial match as a successful read', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10, 11])] })],
      ['/products/count.json', () => json({ count: 1 })],
      // Only variant 10 appears in the doc — 11 was added since the two
      // fetches ran. Still a genuine read of this product.
      ['/products/product-1.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.catalog.products[0]!.barcodeRead).toBe(true);
    expect(result.barcodesRead).toBe(1);
    expect(result.catalog.products[0]!.variants[0]!.barcode).toBe('5012345678900');
  });
});

describe('fetchCatalog — barcode failure ceiling (Finding 2)', () => {
  it('stops after consecutive non-404 failures before any product has been read', async () => {
    const products = [1, 2, 3, 4, 5].map((n) => rawProduct(n, [n * 10]));
    const fn = mockFetch([
      ['/products.json', () => json({ products })],
      ['/products/count.json', () => json({ count: 5 })],
      ['.js', () => json({}, 429)],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products.every((p) => p.barcodeRead === false)).toBe(true);
    // Ceiling is 3 — stops there rather than probing all 5.
    expect(fn.mock.calls.filter((c) => String(c[0]).endsWith('.js'))).toHaveLength(3);
  });

  it('stops after consecutive non-404 failures even once a prior product was read', async () => {
    const products = [1, 2, 3, 4, 5].map((n) => rawProduct(n, [n * 10]));
    const fn = mockFetch([
      ['/products.json', () => json({ products })],
      ['/products/count.json', () => json({ count: 5 })],
      ['/products/product-1.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }]))],
      ['.js', () => json({}, 500)],
    ]);

    const result = await fetchCatalog('example.com');

    // One success does not grant an unlimited pass afterwards — the
    // ceiling still applies to failures that follow it.
    expect(result.barcodesRead).toBe(1);
    expect(result.catalog.products.map((p) => p.barcodeRead)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(fn.mock.calls.filter((c) => String(c[0]).endsWith('.js'))).toHaveLength(4);
  });

  it('lets 404s continue indefinitely without counting towards the stop ceiling', async () => {
    const products = [1, 2, 3, 4, 5, 6].map((n) => rawProduct(n, [n * 10]));
    const fn = mockFetch([
      ['/products.json', () => json({ products })],
      ['/products/count.json', () => json({ count: 6 })],
      ['/products/product-2.js', () => json({}, 404)],
      ['/products/product-4.js', () => json({}, 404)],
      ['.js', () => json({}, 503)],
    ]);

    const result = await fetchCatalog('example.com');

    // products 1, 3, 5 all 503 — three non-404 failures reaches the
    // ceiling even though 404s at 2 and 4 are interleaved between them,
    // because a 404 never resets or advances the failure count either way.
    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products.every((p) => p.barcodeRead === false)).toBe(true);
    expect(fn.mock.calls.filter((c) => String(c[0]).endsWith('.js'))).toHaveLength(5);
  });
});

describe('fetchCatalog — barcode per-request ceiling (Finding 1)', () => {
  it('bounds a single stalled .js request to its own timeout, not the whole barcode budget', async () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn((input: string | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/products.json')) {
          return Promise.resolve(json({ products: [rawProduct(1, [10])] }));
        }
        if (url.includes('/products/count.json')) {
          return Promise.resolve(json({ count: 1 }));
        }
        // A request that never resolves on its own — only the per-request
        // AbortController (Finding 1) can end it, by aborting `init.signal`.
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        });
      });
      vi.stubGlobal('fetch', fn);

      const resultPromise = fetchCatalog('example.com');
      // Past BARCODE_REQUEST_TIMEOUT_MS (5s) but nowhere near the 20s
      // barcode budget or the 55s pipeline timeout.
      await vi.advanceTimersByTimeAsync(6_000);
      const result = await resultPromise;

      expect(result.barcodesRead).toBe(0);
      expect(result.catalog.products[0]!.barcodeRead).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('fetchCatalog — parent abort mid-pass (Finding 4)', () => {
  it('stops the barcode pass when the pipeline signal aborts between requests', async () => {
    vi.useFakeTimers();
    try {
      const products = [1, 2, 3].map((n) => rawProduct(n, [n * 10]));
      const fn = vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.includes('/products.json')) return json({ products });
        if (url.includes('/products/count.json')) return json({ count: 3 });
        // The first .js request pushes the fake clock past timeoutMs,
        // firing the pipeline's own AbortController mid-pass.
        vi.advanceTimersByTime(1_000);
        return json(jsDoc([{ id: 10, barcode: '5012345678900' }]));
      });
      vi.stubGlobal('fetch', fn);

      const result = await fetchCatalog('example.com', { timeoutMs: 500 });

      expect(result.barcodesRead).toBe(1);
      expect(result.catalog.products.map((p) => p.barcodeRead)).toEqual([
        true,
        false,
        false,
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('fetchCatalog — barcode endpoint blocked', () => {
  it('reports zero read and leaves every product unread when .js 403s', async () => {
    const products = [1, 2, 3, 4, 5].map((n) => rawProduct(n, [n * 10]));
    const fn = mockFetch([
      ['/products.json', () => json({ products })],
      ['/products/count.json', () => json({ count: 5 })],
      ['/products/product-', () => json({}, 403)],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products.every((p) => p.barcodeRead === false)).toBe(true);
    // Stops once BARCODE_FAILURE_CEILING consecutive non-404 refusals have
    // been seen, rather than spending the budget proving the same 403 fifty
    // times. Five products, three calls: the early stop is the assertion.
    expect(fn.mock.calls.filter((c) => String(c[0]).endsWith('.js'))).toHaveLength(3);
  });

  it('skips a single bad handle and keeps reading the rest', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10]), rawProduct(2, [20]), rawProduct(3, [30])] })],
      ['/products/count.json', () => json({ count: 3 })],
      ['/products/product-2.js', () => json({}, 404)],
      ['.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }, { id: 30, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.barcodesRead).toBe(2);
    expect(result.catalog.products.map((p) => p.barcodeRead)).toEqual([true, false, true]);
  });

  it('does not fail the scan when .js returns HTML instead of JSON', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
      ['.js', () => new Response('<!doctype html><html>password page</html>', { status: 200 })],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products).toHaveLength(1);
    expect(result.catalog.products[0]!.barcodeRead).toBe(false);
  });
});

describe('fetchCatalog — barcode budget', () => {
  it('stops reading barcodes once the 20s budget is spent', async () => {
    vi.useFakeTimers();
    try {
      const products = Array.from({ length: 10 }, (_, i) => rawProduct(i + 1, [(i + 1) * 10]));
      const fn = vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.includes('/products.json')) return json({ products });
        if (url.includes('/products/count.json')) return json({ count: 10 });
        // Each .js request costs 8 seconds of the 20s barcode budget.
        vi.advanceTimersByTime(8_000);
        // Key the response to the handle asked for. A fixed variant id here
        // would share no id with products 2..10, and the match-guard would
        // score those as mismatches rather than reads — the test would then
        // measure the guard, not the budget.
        const n = Number(url.match(/\/products\/product-(\d+)\.js/)?.[1] ?? 0);
        return json(jsDoc([{ id: n * 10, barcode: '5012345678900' }]));
      });
      vi.stubGlobal('fetch', fn);

      const result = await fetchCatalog('example.com');

      // 0s → read #1 → 8s → read #2 → 16s → read #3 → 24s > 20s, stop.
      expect(result.barcodesRead).toBe(3);
      expect(result.catalog.products).toHaveLength(10);
      expect(result.catalog.products[9]!.barcodeRead).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
