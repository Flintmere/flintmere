import { describe, expect, it } from 'vitest';
import { buildBrandPlan, type BrandPlanCandidate } from './brand-from-vendor.server';

// Pure-filter coverage on the merchant-trust contract:
// "fully reversible" Tier 1 fix means the plan MUST skip any product
// with a pre-existing custom.brand metafield. Earlier rev of this code
// missed metafields entirely (rawPayload heuristic returned null) and
// could overwrite + lose merchant data on revert.

const c = (
  id: string,
  shopifyProductId: string,
  vendor: string | null,
): BrandPlanCandidate => ({ id, shopifyProductId, vendor });

describe('buildBrandPlan', () => {
  it('plans every candidate with a vendor and no existing brand', () => {
    const plan = buildBrandPlan(
      [
        c('p1', 'gid://shopify/Product/1', 'Acme'),
        c('p2', 'gid://shopify/Product/2', 'Meridian'),
      ],
      new Map([
        ['gid://shopify/Product/1', null],
        ['gid://shopify/Product/2', null],
      ]),
    );

    expect(plan.items).toHaveLength(2);
    expect(plan.skipped).toHaveLength(0);
    expect(plan.items.map((i) => i.vendor)).toEqual(['Acme', 'Meridian']);
    // Critical invariant: every planned item must record existingBrand=null.
    // Revert's delete-path keys off this; a non-null value would mean
    // "restore", which the current revert path doesn't implement.
    expect(plan.items.every((i) => i.existingBrand === null)).toBe(true);
  });

  it('skips products with a pre-existing brand metafield (the data-loss guard)', () => {
    const plan = buildBrandPlan(
      [
        c('p1', 'gid://shopify/Product/1', 'Acme Inc.'),
        c('p2', 'gid://shopify/Product/2', 'Meridian'),
      ],
      new Map([
        // Merchant manually set brand="Acme" (different from vendor "Acme Inc.")
        ['gid://shopify/Product/1', 'Acme'],
        ['gid://shopify/Product/2', null],
      ]),
    );

    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]?.productId).toBe('p2');
    expect(plan.skipped).toEqual([
      { productId: 'p1', reason: 'has-brand-metafield' },
    ]);
  });

  it('skips products with no vendor', () => {
    const plan = buildBrandPlan(
      [
        c('p1', 'gid://shopify/Product/1', null),
        c('p2', 'gid://shopify/Product/2', '  '), // whitespace-only
        c('p3', 'gid://shopify/Product/3', 'Real Vendor'),
      ],
      new Map(),
    );

    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]?.productId).toBe('p3');
    expect(plan.skipped.map((s) => s.reason)).toEqual([
      'no-vendor',
      'no-vendor',
    ]);
  });

  it('treats whitespace-only existing metafields as empty (no skip)', () => {
    const plan = buildBrandPlan(
      [c('p1', 'gid://shopify/Product/1', 'Acme')],
      new Map([['gid://shopify/Product/1', '   ']]),
    );

    expect(plan.items).toHaveLength(1);
    expect(plan.skipped).toHaveLength(0);
  });

  it('treats missing-from-map as no-existing-brand (deleted product case)', () => {
    // Shopify's nodes() returns null for deleted products → we map to null
    // → buildBrandPlan should plan as normal. The metafieldsSet apply will
    // fail per-product if the GID truly doesn't exist; that's handled in
    // applyBrandFromVendor.
    const plan = buildBrandPlan(
      [c('p1', 'gid://shopify/Product/1', 'Acme')],
      new Map(), // empty map — gid not in fetch result
    );

    expect(plan.items).toHaveLength(1);
    expect(plan.skipped).toHaveLength(0);
  });

  it('handles a mixed batch deterministically', () => {
    const plan = buildBrandPlan(
      [
        c('p1', 'gid://shopify/Product/1', null),         // no vendor
        c('p2', 'gid://shopify/Product/2', 'Acme'),       // has brand
        c('p3', 'gid://shopify/Product/3', 'Meridian'),   // plan
        c('p4', 'gid://shopify/Product/4', 'Brandless'),  // plan
      ],
      new Map([['gid://shopify/Product/2', 'Acme Heritage']]),
    );

    expect(plan.items.map((i) => i.productId)).toEqual(['p3', 'p4']);
    expect(plan.skipped).toEqual([
      { productId: 'p1', reason: 'no-vendor' },
      { productId: 'p2', reason: 'has-brand-metafield' },
    ]);
  });
});
