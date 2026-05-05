import { describe, expect, it } from 'vitest';
import { enrichIssuesWithExamples } from '../src/enrich-issues.js';
import type { Issue, ProductInput } from '../src/types.js';
import { cleanProduct, makeCatalog } from './fixtures/products.js';

const product = (overrides: Partial<ProductInput> & { id: string }): ProductInput => ({
  ...cleanProduct,
  ...overrides,
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: `${overrides.id}-v1`,
    },
  ],
});

const issue = (overrides: Partial<Issue> & { code: string }): Issue => ({
  pillar: 'identifiers',
  severity: 'high',
  title: 'Test issue',
  description: 'Test description',
  affectedCount: 0,
  affectedProductIds: [],
  revenueImpactScore: 0,
  ...overrides,
});

describe('enrichIssuesWithExamples', () => {
  it('returns empty examples for issues with no affected ids', () => {
    const enriched = enrichIssuesWithExamples(
      [issue({ code: 'site-issue', affectedProductIds: [] })],
      makeCatalog([product({ id: 'p1', title: 'Almond Butter' })]),
    );
    expect(enriched[0]!.affectedProductExamples).toEqual([]);
  });

  it('looks up titles + handles from the catalog by id', () => {
    const enriched = enrichIssuesWithExamples(
      [
        issue({
          code: 'missing-gtin',
          affectedProductIds: ['p1', 'p2'],
          affectedCount: 2,
        }),
      ],
      makeCatalog([
        product({ id: 'p1', title: 'Almond Butter', handle: 'almond-butter' }),
        product({ id: 'p2', title: 'Coffee Grinder', handle: 'coffee-grinder' }),
      ]),
    );
    expect(enriched[0]!.affectedProductExamples).toEqual([
      { title: 'Almond Butter', handle: 'almond-butter' },
      { title: 'Coffee Grinder', handle: 'coffee-grinder' },
    ]);
  });

  it('caps examples at the default limit of 3', () => {
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const products = ids.map((id, i) =>
      product({ id, title: `Product ${i + 1}`, handle: `product-${i + 1}` }),
    );
    const enriched = enrichIssuesWithExamples(
      [issue({ code: 'missing-gtin', affectedProductIds: ids, affectedCount: 5 })],
      makeCatalog(products),
    );
    expect(enriched[0]!.affectedProductExamples).toHaveLength(3);
  });

  it('honours a custom limit', () => {
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const products = ids.map((id, i) =>
      product({ id, title: `Product ${i + 1}`, handle: `product-${i + 1}` }),
    );
    const enriched = enrichIssuesWithExamples(
      [issue({ code: 'missing-gtin', affectedProductIds: ids, affectedCount: 5 })],
      makeCatalog(products),
      2,
    );
    expect(enriched[0]!.affectedProductExamples).toHaveLength(2);
  });

  it('sorts examples alphabetically (case-insensitive), tie-breaks by handle', () => {
    const enriched = enrichIssuesWithExamples(
      [
        issue({
          code: 'missing-gtin',
          affectedProductIds: ['p1', 'p2', 'p3', 'p4'],
          affectedCount: 4,
        }),
      ],
      makeCatalog([
        product({ id: 'p1', title: 'zebra cake', handle: 'zebra-cake' }),
        product({ id: 'p2', title: 'Almond Butter', handle: 'almond-butter' }),
        product({ id: 'p3', title: 'almond butter', handle: 'almond-butter-2' }),
        product({ id: 'p4', title: 'Brownie', handle: 'brownie' }),
      ]),
    );
    expect(enriched[0]!.affectedProductExamples).toEqual([
      { title: 'Almond Butter', handle: 'almond-butter' },
      { title: 'almond butter', handle: 'almond-butter-2' },
      { title: 'Brownie', handle: 'brownie' },
    ]);
  });

  it('skips ids that do not appear in the catalog (orphaned)', () => {
    const enriched = enrichIssuesWithExamples(
      [
        issue({
          code: 'missing-gtin',
          affectedProductIds: ['p1', 'orphan-id', 'p2'],
          affectedCount: 3,
        }),
      ],
      makeCatalog([
        product({ id: 'p1', title: 'Almond Butter', handle: 'almond-butter' }),
        product({ id: 'p2', title: 'Coffee Grinder', handle: 'coffee-grinder' }),
      ]),
    );
    expect(enriched[0]!.affectedProductExamples).toEqual([
      { title: 'Almond Butter', handle: 'almond-butter' },
      { title: 'Coffee Grinder', handle: 'coffee-grinder' },
    ]);
  });

  it('preserves all other issue fields unchanged', () => {
    const original = issue({
      code: 'missing-gtin',
      pillar: 'identifiers',
      severity: 'critical',
      title: 'Products have no barcode',
      description: 'Barcode required by Google Merchant Center.',
      affectedCount: 1,
      affectedProductIds: ['p1'],
      revenueImpactScore: 42,
    });
    const enriched = enrichIssuesWithExamples(
      [original],
      makeCatalog([product({ id: 'p1', title: 'Almond Butter' })]),
    );
    expect(enriched[0]).toMatchObject({
      code: 'missing-gtin',
      pillar: 'identifiers',
      severity: 'critical',
      title: 'Products have no barcode',
      description: 'Barcode required by Google Merchant Center.',
      affectedCount: 1,
      affectedProductIds: ['p1'],
      revenueImpactScore: 42,
    });
  });

  it('returns one enriched issue per input issue, preserving order', () => {
    const enriched = enrichIssuesWithExamples(
      [
        issue({ code: 'a', affectedProductIds: ['p1'] }),
        issue({ code: 'b', affectedProductIds: [] }),
        issue({ code: 'c', affectedProductIds: ['p2'] }),
      ],
      makeCatalog([
        product({ id: 'p1', title: 'Almond Butter' }),
        product({ id: 'p2', title: 'Coffee Grinder' }),
      ]),
    );
    expect(enriched.map((i) => i.code)).toEqual(['a', 'b', 'c']);
  });
});
