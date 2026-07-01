import { describe, expect, it } from 'vitest';
import { publishedScanQuery } from './public-score';

describe('publishedScanQuery', () => {
  it('gates on publish consent, completion, and a present score + grade', () => {
    const { where, orderBy } = publishedScanQuery('acme.myshopify.com');

    // The consent gate is security-relevant (#24): all five conditions must
    // hold or a non-consented / incomplete scan could leak onto a public
    // surface. This locks them so a future edit cannot silently weaken it.
    expect(where).toEqual({
      normalisedDomain: 'acme.myshopify.com',
      publishPublicPage: true,
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    });
    expect(orderBy).toEqual({ completedAt: 'desc' });
  });
});
