import { describe, expect, it } from 'vitest'
import {
  conciergeDeliverableItems,
  conciergeDeliverableSummary,
  conciergeEmailDeliverableLine,
  gs1UkBarcodePathSection,
} from './concierge-deliverable'
import { CONCIERGE_DELIVERABLE_LIST } from './copy'
import { AUDIT_BANDS } from './audit-pricing'

// SSOT parity tests. The deliverable copy lives in concierge-deliverable.ts
// (introduced 2026-05-09 to prevent the spec/page drift caught in the
// deliverable-canon-alignment review). copy.ts re-exports for the page
// surface; concierge-email.ts renders the post-purchase email line from
// the same module. Drift detection lives here.

describe('deliverable parity (ADR 0028)', () => {
  it.each(['band-1', 'band-2', 'band-3'] as const)(
    'keeps five items in canonical order for %s',
    (slug) => {
      expect(conciergeDeliverableItems(slug).map((i) => i.title)).toEqual([
        'A 1,500-word letter',
        'A per-product fix CSV',
        'A 30-day fix sequence',
        'A GS1 UK barcode path',
        'A 30-day re-scan',
      ]);
    },
  );

  it('never says "audit" in any deliverable string', () => {
    for (const slug of ['band-1', 'band-2', 'band-3'] as const) {
      for (const item of conciergeDeliverableItems(slug)) {
        expect(`${item.title} ${item.body}`.toLowerCase()).not.toContain('audit');
      }
    }
  });
});

describe('conciergeDeliverableItems', () => {
  it('returns five items per band, in canonical order', () => {
    for (const band of AUDIT_BANDS) {
      const items = conciergeDeliverableItems(band.slug)
      expect(items).toHaveLength(5)
      expect(items[0]?.title).toBe('A 1,500-word letter')
      expect(items[1]?.title).toBe('A per-product fix CSV')
      expect(items[2]?.title).toBe('A 30-day fix sequence')
      expect(items[3]?.title).toBe('A GS1 UK barcode path')
      expect(items[4]?.title).toBe('A 30-day re-scan')
    }
  })

  it('renders worst-N from audit-pricing.ts for each band', () => {
    expect(conciergeDeliverableItems('band-1')[1]?.body).toContain(
      'worst 10 offenders',
    )
    expect(conciergeDeliverableItems('band-2')[1]?.body).toContain(
      'worst 25 offenders',
    )
    expect(conciergeDeliverableItems('band-3')[1]?.body).toContain(
      'worst 25 offenders',
    )
  })

  it('switches the audit-letter copy on representative-sample scope (Band 3)', () => {
    const b1Letter = conciergeDeliverableItems('band-1')[0]?.body ?? ''
    const b3Letter = conciergeDeliverableItems('band-3')[0]?.body ?? ''
    expect(b1Letter).toContain('product by product')
    expect(b3Letter).toContain('representative sample')
    expect(b3Letter).toContain('structural data model')
  })

  it('switches the CSV copy to "sampled product" on Band 3', () => {
    expect(conciergeDeliverableItems('band-1')[1]?.body).toContain(
      'Every product that has a problem',
    )
    expect(conciergeDeliverableItems('band-3')[1]?.body).toContain(
      'Every sampled product',
    )
  })
})

describe('SSOT parity — copy.ts re-export matches concierge-deliverable.ts', () => {
  it('CONCIERGE_DELIVERABLE_LIST equals conciergeDeliverableItems("band-1")', () => {
    expect(CONCIERGE_DELIVERABLE_LIST).toEqual(
      conciergeDeliverableItems('band-1'),
    )
  })
})

describe('conciergeEmailDeliverableLine', () => {
  it('mentions all five deliverable items in the prose summary', () => {
    for (const band of AUDIT_BANDS) {
      const line = conciergeEmailDeliverableLine(band.slug)
      expect(line).toContain('catalog letter')
      expect(line).toContain('CSV')
      expect(line).toContain('30-day fix sequence')
      expect(line).toContain('GS1 UK barcode path')
      // Re-scan is implied by the 30-day fix sequence in the email
      // line; the explicit re-scan promise lives in the structured list.
    }
  })

  it('adds the structural-data-model phrase only on Band 3', () => {
    expect(conciergeEmailDeliverableLine('band-1')).not.toContain(
      'structural data model',
    )
    expect(conciergeEmailDeliverableLine('band-2')).not.toContain(
      'structural data model',
    )
    expect(conciergeEmailDeliverableLine('band-3')).toContain(
      'structural data model',
    )
  })

  it('embeds the band-specific worst-N count', () => {
    expect(conciergeEmailDeliverableLine('band-1')).toContain('worst 10')
    expect(conciergeEmailDeliverableLine('band-2')).toContain('worst 25')
    expect(conciergeEmailDeliverableLine('band-3')).toContain('worst 25')
  })
})

describe('conciergeDeliverableSummary', () => {
  it('returns a single sentence ending in the delivery promise', () => {
    for (const band of AUDIT_BANDS) {
      const summary = conciergeDeliverableSummary(band.slug)
      expect(summary).toMatch(/Delivered within three working days\.$/)
    }
  })
})

describe('gs1UkBarcodePathSection', () => {
  it('renders the UK GS1 paragraph for jurisdiction GB', () => {
    const section = gs1UkBarcodePathSection({ jurisdiction: 'GB' })
    expect(section).toContain('## GS1 UK barcode path')
    expect(section).toContain('GS1 UK Ltd')
    expect(section).toContain('gs1uk.org')
    expect(section).toContain('GTIN-13')
    expect(section).toContain('Flintmere is not affiliated with GS1.')
  })

  it('renders an OPERATOR_VERIFY placeholder for non-UK jurisdictions', () => {
    const section = gs1UkBarcodePathSection({ jurisdiction: 'unknown' })
    expect(section).toContain('[OPERATOR_VERIFY: GS1 jurisdiction')
    expect(section).toContain('Flintmere is not affiliated with GS1.')
    expect(section).not.toContain('GS1 UK Ltd')
  })

  it('defaults to GB jurisdiction when not specified', () => {
    const section = gs1UkBarcodePathSection({})
    expect(section).toContain('GS1 UK Ltd')
  })
})
