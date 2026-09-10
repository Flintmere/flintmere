import { describe, expect, it, vi } from 'vitest'
import type { ProductInput } from '@flintmere/scoring'

vi.mock('../shopify-fetcher', () => ({
  fetchCatalog: vi.fn(async () => ({
    catalog: {
      shopDomain: 'example.com',
      scoredAt: '2026-09-09T00:00:00Z',
      products: [
        {
          id: 'gid://product/1',
          handle: 'sample-product',
          title: 'Sample Product',
          tags: [],
          variants: [{ id: 'v1', sku: 'SKU-1', barcode: '5012345678900', price: '14.50' }],
          images: [],
          barcodeRead: true,
        },
      ],
    },
    truncated: false,
    actualProductCount: 1,
    barcodesRead: 1,
  })),
  ShopifyFetchError: class ShopifyFetchError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
}))

import { getCatalogSampleForDraft, summariseProductsForLLM } from './catalog-sample'
import { fetchCatalog } from '../shopify-fetcher'

function buildProduct(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    id: 'gid://product/1',
    handle: 'sample-product',
    title: 'Sample Product',
    bodyHtml: null,
    vendor: 'Acme',
    productType: 'Goods',
    tags: ['tag-one', 'tag-two'],
    status: 'active',
    publishedAt: null,
    variants: [
      {
        id: 'v1',
        sku: 'SKU-1',
        barcode: '5012345678900',
        price: '14.50',
        compareAtPrice: null,
        inventoryQuantity: 5,
        inventoryPolicy: 'deny',
        available: true,
      },
    ],
    images: [
      {
        id: 'img1',
        src: 'https://example.test/image.jpg',
        altText: 'Sample product on a wooden table',
        width: 800,
        height: 800,
      },
    ],
    brandMetafield: null,
    mpnMetafield: null,
    ...overrides,
  }
}

describe('summariseProductsForLLM', () => {
  it('produces one pipe-delimited line per product', () => {
    const out = summariseProductsForLLM([buildProduct(), buildProduct()])
    expect(out.split('\n')).toHaveLength(2)
  })

  it('renders single-price as a fixed point, not a range', () => {
    const out = summariseProductsForLLM([buildProduct()])
    expect(out).toContain('£14.50')
    expect(out).not.toContain('£14.50–')
  })

  it('renders a price range when variants vary', () => {
    const product = buildProduct({
      variants: [
        { ...buildProduct().variants[0]!, id: 'v1', price: '10.00' },
        { ...buildProduct().variants[0]!, id: 'v2', price: '25.00' },
      ],
    })
    const out = summariseProductsForLLM([product])
    expect(out).toContain('£10.00–£25.00')
  })

  it('marks images:y when at least one image is present', () => {
    const out = summariseProductsForLLM([buildProduct()])
    expect(out).toContain('images:y')
  })

  it('marks images:n when no images', () => {
    const out = summariseProductsForLLM([buildProduct({ images: [] })])
    expect(out).toContain('images:n')
  })

  it('marks barcode:y when at least one variant has a barcode', () => {
    const out = summariseProductsForLLM([buildProduct()])
    expect(out).toContain('barcode:y')
  })

  it('marks barcode:n when all variants lack a barcode', () => {
    const product = buildProduct({
      variants: [
        { ...buildProduct().variants[0]!, barcode: null },
      ],
    })
    const out = summariseProductsForLLM([product])
    expect(out).toContain('barcode:n')
  })

  it('marks alt:n when no image carries alt text', () => {
    const product = buildProduct({
      images: [
        { ...buildProduct().images[0]!, altText: null },
      ],
    })
    const out = summariseProductsForLLM([product])
    expect(out).toContain('alt:n')
  })

  it('truncates tags beyond five', () => {
    const product = buildProduct({
      tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    })
    const out = summariseProductsForLLM([product])
    expect(out).toContain('a,b,c,d,e')
    expect(out).not.toContain('f,g')
  })

  it('renders an em-dash when the product has no tags', () => {
    const product = buildProduct({ tags: [] })
    const out = summariseProductsForLLM([product])
    // tagSummary segment: "— |" with a leading separator either side.
    expect(out).toMatch(/\| — \|/)
  })

  it('replaces pipe characters in titles to keep the delimiter intact', () => {
    const product = buildProduct({ title: 'Sample | with | pipes' })
    const out = summariseProductsForLLM([product])
    expect(out.split(' | ')[0]).toBe('Sample / with / pipes')
  })

  it('truncates very long titles to 120 chars', () => {
    const longTitle = 'x'.repeat(200)
    const product = buildProduct({ title: longTitle })
    const out = summariseProductsForLLM([product])
    const firstField = out.split(' | ')[0]!
    expect(firstField.length).toBe(120)
  })

  it('renders an em-dash for vendor / type when null', () => {
    const product = buildProduct({ vendor: null, productType: null })
    const out = summariseProductsForLLM([product])
    const fields = out.split(' | ')
    expect(fields[1]).toBe('—')
    expect(fields[2]).toBe('—')
  })
})

describe('getCatalogSampleForDraft', () => {
  it('asks the fetcher for a barcode on every product it will summarise', async () => {
    await getCatalogSampleForDraft('example.com')
    expect(fetchCatalog).toHaveBeenCalledWith('example.com', {
      maxPages: 1,
      barcodeSampleSize: 50,
    })
  })
})
