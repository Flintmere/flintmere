import { describe, expect, it } from 'vitest'
import {
  AUDIT_BANDS,
  bandBySlug,
  bandForSkuCount,
  bandPriceLine,
  type AuditBandSlug,
} from './audit-pricing'

describe('AUDIT_BANDS', () => {
  it('exposes exactly three bands in lower-bound order', () => {
    expect(AUDIT_BANDS).toHaveLength(3)
    expect(AUDIT_BANDS.map((b) => b.slug)).toEqual(['band-1', 'band-2', 'band-3'])
  })

  it('Band 1 + Band 2 are non-bespoke and carry pence amounts', () => {
    const b1 = bandBySlug('band-1')!
    const b2 = bandBySlug('band-2')!
    expect(b1.isBespoke).toBe(false)
    expect(b1.pricePence).toBe(19700)
    expect(b2.isBespoke).toBe(false)
    expect(b2.pricePence).toBe(39700)
  })

  it('Band 3 is bespoke and has null pence amount', () => {
    const b3 = bandBySlug('band-3')!
    expect(b3.isBespoke).toBe(true)
    expect(b3.pricePence).toBeNull()
    expect(b3.priceDisplay).toContain('bespoke')
  })

  it('per-band deliverable depth scales with price (ADR 0022 §Decision)', () => {
    expect(bandBySlug('band-1')!.deliverable.fullyDraftedFixCount).toBe(10)
    expect(bandBySlug('band-2')!.deliverable.fullyDraftedFixCount).toBe(25)
    expect(bandBySlug('band-3')!.deliverable.fullyDraftedFixCount).toBe(25)
  })

  it('Band 3 audit scope shifts to representative-sample', () => {
    expect(bandBySlug('band-1')!.deliverable.auditScope).toBe('full')
    expect(bandBySlug('band-2')!.deliverable.auditScope).toBe('full')
    expect(bandBySlug('band-3')!.deliverable.auditScope).toBe('representative-sample')
  })
})

describe('bandBySlug', () => {
  it.each(['band-1', 'band-2', 'band-3'] as AuditBandSlug[])(
    'returns the band for slug %s',
    (slug) => {
      expect(bandBySlug(slug)?.slug).toBe(slug)
    },
  )
})

describe('bandForSkuCount', () => {
  it.each([
    [0, 'band-1'],
    [1, 'band-1'],
    [200, 'band-1'],
    [500, 'band-1'],
    [1500, 'band-1'],
    [1501, 'band-2'],
    [3000, 'band-2'],
    [5000, 'band-2'],
    [5001, 'band-3'],
    [10_000, 'band-3'],
    [50_000, 'band-3'],
  ])('SKU count %i → %s', (skuCount, expectedSlug) => {
    expect(bandForSkuCount(skuCount).slug).toBe(expectedSlug)
  })

  it('coerces negative SKU counts to Band 1 defensively', () => {
    expect(bandForSkuCount(-1).slug).toBe('band-1')
    expect(bandForSkuCount(-9999).slug).toBe('band-1')
  })
})

describe('bandPriceLine', () => {
  it('returns canonical display strings per ADR 0022', () => {
    expect(bandPriceLine('band-1')).toBe('£197')
    expect(bandPriceLine('band-2')).toBe('£397')
    expect(bandPriceLine('band-3')).toBe('From £597 — bespoke quote')
  })
})
