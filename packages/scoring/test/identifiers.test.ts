import { describe, expect, it } from 'vitest';
import { MIN_SAMPLED_READS, scoreIdentifiers } from '../src/pillars/identifiers.js';
import { isValidGtin } from '../src/utils/gtin.js';
import type { ProductInput } from '../src/types.js';
import {
  cleanProduct,
  invalidChecksumProduct,
  makeCatalog,
  noGtinProduct,
  unreadBarcodeProduct,
} from './fixtures/products.js';

/**
 * `n` clones of cleanProduct, each with its own id, handle and SKU — the
 * shape of a catalog whose barcode sample cleared MIN_SAMPLED_READS.
 */
function readClones(n: number): ProductInput[] {
  return Array.from({ length: n }, (_, i) => ({
    ...cleanProduct,
    id: `gid://shopify/Product/10${i}`,
    handle: `clean-${i}`,
    variants: [
      {
        ...cleanProduct.variants[0]!,
        id: `gid://shopify/ProductVariant/10${i}`,
        sku: `MERIDIAN-CG-1${i}`,
      },
    ],
  }));
}

describe('isValidGtin', () => {
  it('accepts valid EAN-13', () => {
    expect(isValidGtin('5012345678900')).toBe(true);
  });

  it('rejects checksum mismatch', () => {
    expect(isValidGtin('5012345678901')).toBe(false);
  });

  it('rejects non-numeric', () => {
    expect(isValidGtin('ABC123')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidGtin('12345')).toBe(false);
  });

  it('handles null / undefined', () => {
    expect(isValidGtin(null)).toBe(false);
    expect(isValidGtin(undefined)).toBe(false);
    expect(isValidGtin('')).toBe(false);
  });

  it('strips hyphens and spaces', () => {
    expect(isValidGtin('5-012-345-678-900')).toBe(true);
    expect(isValidGtin('5 012 345 678 900')).toBe(true);
  });
});

describe('scoreIdentifiers', () => {
  it('scores a clean catalog near maximum', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreIdentifiers(catalog);
    expect(result.pillar).toBe('identifiers');
    expect(result.score).toBeGreaterThan(95);
    expect(result.issues).toHaveLength(0);
  });

  it('emits a high issue for missing GTIN', () => {
    const catalog = makeCatalog([noGtinProduct]);
    const result = scoreIdentifiers(catalog);
    expect(result.score).toBeLessThan(50);
    const missing = result.issues.find((i) => i.code === 'missing-gtin');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('high');
    expect(missing?.affectedCount).toBe(1);
  });

  it('emits a critical issue for invalid GTIN checksum', () => {
    const catalog = makeCatalog([invalidChecksumProduct]);
    const result = scoreIdentifiers(catalog);
    const bad = result.issues.find((i) => i.code === 'invalid-gtin-checksum');
    expect(bad).toBeDefined();
    expect(bad?.severity).toBe('critical');
  });

  it('returns zero for an empty catalog', () => {
    const catalog = makeCatalog([]);
    const result = scoreIdentifiers(catalog);
    expect(result.score).toBe(0);
    expect(result.lockedReason).toBe('empty-catalog');
  });

  it('aggregates issues when multiple products fail', () => {
    const catalog = makeCatalog([noGtinProduct, invalidChecksumProduct]);
    const result = scoreIdentifiers(catalog);
    const missing = result.issues.find((i) => i.code === 'missing-gtin');
    expect(missing?.affectedCount).toBe(1);
    const bad = result.issues.find((i) => i.code === 'invalid-gtin-checksum');
    expect(bad?.affectedCount).toBe(1);
  });
});

describe('scoreIdentifiers — products whose barcode was never read', () => {
  it('does not count an unread product as a product without a barcode', () => {
    const catalog = makeCatalog([cleanProduct, unreadBarcodeProduct]);
    const result = scoreIdentifiers(catalog);
    expect(result.issues.find((i) => i.code === 'missing-gtin')).toBeUndefined();
  });

  it('renormalises the pillar when no barcode was read at all', () => {
    const catalog = makeCatalog([unreadBarcodeProduct]);
    const result = scoreIdentifiers(catalog);
    // The 75 barcode points leave the denominator rather than scoring zero:
    // we have no evidence either way.
    expect(result.maxScore).toBe(25);
    expect(result.issues.find((i) => i.code === 'missing-gtin')).toBeUndefined();
    expect(result.issues.find((i) => i.code === 'invalid-gtin-checksum')).toBeUndefined();
    const notRead = result.issues.find((i) => i.code === 'barcodes-not-read');
    expect(notRead?.severity).toBe('low');
    expect(notRead?.revenueImpactScore).toBe(0);
  });

  it('keeps the full denominator when the sample clears the floor', () => {
    const catalog = makeCatalog([
      noGtinProduct,
      ...readClones(MIN_SAMPLED_READS - 1),
      unreadBarcodeProduct,
    ]);
    const result = scoreIdentifiers(catalog);
    expect(result.maxScore).toBe(100);
    expect(result.issues.find((i) => i.code === 'barcodes-not-read')).toBeUndefined();
    // Only the read products are counted — the unread one is not a product
    // without a barcode, it is a product nobody looked at.
    expect(result.issues.find((i) => i.code === 'missing-gtin')?.affectedCount).toBe(1);
  });

  it('pins the score so the barcode-coverage denominator cannot silently regress', () => {
    // Ten read clones, each with a valid barcode and its own SKU, plus one
    // unread product with none. Full marks on both barcode sub-checks
    // (45 + 30) if — and only if — the coverage denominator is
    // readVariants.length (10), not variantCount (11). Brand (11/11),
    // SKU-presence (11/11) and SKU-uniqueness (11/11) also score full:
    // 45 + 30 + 10 + 10 + 5 = 100. A regression to variantCount would drop
    // barcode coverage to 10/11 and the score to 95.91 — this assertion is
    // the one that catches it; every other test in this suite would still
    // pass.
    const catalog = makeCatalog([
      ...readClones(MIN_SAMPLED_READS),
      unreadBarcodeProduct,
    ]);
    const result = scoreIdentifiers(catalog);
    expect(result.maxScore).toBe(100);
    expect(result.score).toBe(100);
  });
});

describe('scoreIdentifiers — the minimum-read floor on a sampled catalog', () => {
  it('does not let one read product speak for a sampled catalog', () => {
    // The production-reachable shape: the fetcher reads one product, then
    // three consecutive non-404 failures trip its ceiling and end the pass.
    // Before the floor, that one product carried 75 of the pillar's 100
    // points — full-pillar confidence from n = 1.
    const catalog = makeCatalog([
      cleanProduct,
      ...Array.from({ length: 40 }, (_, i) => ({
        ...unreadBarcodeProduct,
        id: `gid://shopify/Product/90${i}`,
        handle: `unread-${i}`,
      })),
    ]);
    const result = scoreIdentifiers(catalog);
    expect(result.maxScore).toBe(25);
    expect(result.issues.find((i) => i.code === 'barcodes-not-read')).toBeDefined();
  });

  it('flips to assessable at exactly the floor, and not one product below it', () => {
    const below = scoreIdentifiers(
      makeCatalog([
        ...readClones(MIN_SAMPLED_READS - 1),
        unreadBarcodeProduct,
      ]),
    );
    const at = scoreIdentifiers(
      makeCatalog([...readClones(MIN_SAMPLED_READS), unreadBarcodeProduct]),
    );
    expect(below.maxScore).toBe(25);
    expect(at.maxScore).toBe(100);
  });

  it('grades a small catalog read in full — a census is not a sample', () => {
    // The floor must never reach a store that simply has fewer products
    // than the floor and had every one of them read. `barcodeRead` absent
    // means READ (Admin API, fixtures), so this is also why no existing
    // scoring fixture changed behaviour.
    const result = scoreIdentifiers(makeCatalog([cleanProduct]));
    expect(result.maxScore).toBe(100);
    expect(result.issues.find((i) => i.code === 'barcodes-not-read')).toBeUndefined();
  });

  it('still reports what it found on the products it did read', () => {
    // The floor withholds the grade, not the finding: a barcode that fails
    // its check digit is a true statement about that specific product
    // however few were read, and `scanScopeLine` states the count.
    const catalog = makeCatalog([
      invalidChecksumProduct,
      { ...unreadBarcodeProduct, id: 'gid://shopify/Product/91', handle: 'u-1' },
      { ...unreadBarcodeProduct, id: 'gid://shopify/Product/92', handle: 'u-2' },
    ]);
    const result = scoreIdentifiers(catalog);
    expect(result.maxScore).toBe(25);
    const bad = result.issues.find((i) => i.code === 'invalid-gtin-checksum');
    expect(bad?.affectedCount).toBe(1);
    // ...and the note that fires alongside it must not deny the finding.
    const notRead = result.issues.find((i) => i.code === 'barcodes-not-read');
    expect(notRead?.description).toContain('did not read enough');
    expect(notRead?.description).not.toContain('could not read barcodes');
  });
});
