import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CatalogInput } from '@flintmere/scoring';

// ---- Mocks ----
// Mock prisma — both the create + the update branch are no-ops.
vi.mock('@/lib/db', () => ({
  prisma: {
    scan: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'test-scan-id',
        ...data,
      })),
      update: vi.fn(async () => ({})),
    },
  },
}));

// Mock the crawlability fetch — return null so the route falls through
// to the no-crawl-input branch (the suppression estimate is independent
// of crawlability).
vi.mock('@/lib/crawlability-fetcher', () => ({
  fetchCrawlability: vi.fn(async () => null),
}));

// Mock IP hash — deterministic.
vi.mock('@/lib/hash', () => ({
  hashIp: vi.fn(() => 'hashed-ip'),
}));

// Mock the Shopify catalog fetcher — return a controlled catalog with
// products carrying suppression-risk signals.
const SUPPRESSION_RISK_CATALOG: CatalogInput = {
  shopDomain: 'risky-food-store.myshopify.com',
  products: [
    {
      // Triple signal: no GTIN, no productType, food-vertical with no
      // allergen disclosure.
      id: 'gid://shopify/Product/1',
      handle: 'mystery-snack-1',
      title: 'Organic Snack Bar',
      bodyHtml: '<p>A delicious snack.</p>',
      vendor: 'Some Brand',
      productType: '',
      tags: ['snack'],
      status: 'active',
      publishedAt: '2026-01-01T00:00:00Z',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          sku: 'SKU-1',
          barcode: '',
          price: '5.00',
          inventoryQuantity: 10,
          inventoryPolicy: 'deny',
          available: true,
        },
      ],
      images: [],
      brandMetafield: 'Some Brand',
    },
    {
      // Clean control product (proper barcode, productType, non-food).
      id: 'gid://shopify/Product/2',
      handle: 'clean-grinder',
      title: 'Manual Coffee Grinder',
      bodyHtml:
        '<p>Stainless steel burr grinder with 20 click-stop settings.</p>',
      vendor: 'Meridian',
      productType: 'Coffee Grinder',
      tags: ['accessory'],
      status: 'active',
      publishedAt: '2026-01-01T00:00:00Z',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/2',
          sku: 'SKU-2',
          barcode: '5012345678900',
          price: '89.00',
          inventoryQuantity: 42,
          inventoryPolicy: 'deny',
          available: true,
        },
      ],
      images: [],
      brandMetafield: 'Meridian',
    },
  ],
  scoredAt: '2026-04-26T00:00:00Z',
};

vi.mock('@/lib/shopify-fetcher', () => ({
  fetchCatalog: vi.fn(async () => SUPPRESSION_RISK_CATALOG),
  ShopifyFetchError: class ShopifyFetchError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/scan — suppressionEstimate field', () => {
  it('includes suppressionEstimate in the response payload', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/scan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shopUrl: 'risky-food-store.myshopify.com' }),
    }) as unknown as import('next/server').NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.suppressionEstimate).toBeDefined();
    expect(typeof body.suppressionEstimate.low).toBe('number');
    expect(typeof body.suppressionEstimate.high).toBe('number');
    expect(body.suppressionEstimate.high).toBeGreaterThanOrEqual(
      body.suppressionEstimate.low,
    );
    // The fixture has 1 triple-signal product, so high should be at
    // least 1; low may be 0 after floor (3 signals → low band 0.85).
    expect(body.suppressionEstimate.high).toBeGreaterThanOrEqual(1);

    expect(body.suppressionEstimate.signals).toBeDefined();
    expect(body.suppressionEstimate.signals.missingGtin).toBe(1);
    expect(body.suppressionEstimate.signals.ambiguousAllergen).toBe(1);
    expect(body.suppressionEstimate.signals.missingGmcCategory).toBe(1);
  });
});
