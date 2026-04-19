import { describe, expect, it } from 'vitest';
import { scoreConsistency } from '../src/pillars/consistency.js';
import {
  activeZeroStockProduct,
  cleanProduct,
  makeCatalog,
  noAltTextProduct,
} from './fixtures/products.js';

describe('scoreConsistency', () => {
  it('scores a clean catalog at maximum', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreConsistency(catalog);
    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  it('flags missing alt text', () => {
    const catalog = makeCatalog([noAltTextProduct]);
    const result = scoreConsistency(catalog);
    const issue = result.issues.find((i) => i.code === 'image-missing-alt');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('high');
  });

  it('flags active-with-zero-inventory', () => {
    const catalog = makeCatalog([activeZeroStockProduct]);
    const result = scoreConsistency(catalog);
    const issue = result.issues.find((i) => i.code === 'active-zero-inventory');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('medium');
  });

  it('flags invalid image URLs', () => {
    const catalog = makeCatalog([
      {
        ...cleanProduct,
        images: [{ src: 'ftp://bad-url.com/img.jpg' as any, altText: 'img' }],
      },
    ]);
    const result = scoreConsistency(catalog);
    const issue = result.issues.find((i) => i.code === 'image-invalid-url');
    expect(issue).toBeDefined();
  });

  it('returns zero for an empty catalog', () => {
    const catalog = makeCatalog([]);
    const result = scoreConsistency(catalog);
    expect(result.score).toBe(0);
  });
});
