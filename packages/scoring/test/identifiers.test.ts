import { describe, expect, it } from 'vitest';
import { scoreIdentifiers } from '../src/pillars/identifiers.js';
import { isValidGtin } from '../src/utils/gtin.js';
import {
  cleanProduct,
  invalidChecksumProduct,
  makeCatalog,
  noGtinProduct,
} from './fixtures/products.js';

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

  it('emits critical issue for missing GTIN', () => {
    const catalog = makeCatalog([noGtinProduct]);
    const result = scoreIdentifiers(catalog);
    expect(result.score).toBeLessThan(50);
    const missing = result.issues.find((i) => i.code === 'missing-gtin');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('critical');
    expect(missing?.affectedCount).toBe(1);
  });

  it('emits high issue for invalid GTIN checksum', () => {
    const catalog = makeCatalog([invalidChecksumProduct]);
    const result = scoreIdentifiers(catalog);
    const bad = result.issues.find((i) => i.code === 'invalid-gtin-checksum');
    expect(bad).toBeDefined();
    expect(bad?.severity).toBe('high');
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
