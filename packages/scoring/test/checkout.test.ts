import { describe, expect, it } from 'vitest';
import { scoreCheckout } from '../src/pillars/checkout.js';
import { cleanProduct, makeCatalog } from './fixtures/products.js';
import { makeAdminContext } from './fixtures/admin-context.js';

describe('scoreCheckout', () => {
  it('scores well when accounts are NEW_CUSTOMER_ACCOUNTS, inventory tracked, and prices coherent', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      checkoutContext: { customerAccountsVersion: 'NEW_CUSTOMER_ACCOUNTS' },
    });
    const result = scoreCheckout(catalog, ctx);
    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  it('flags legacy-customer-accounts when version is CLASSIC', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      checkoutContext: { customerAccountsVersion: 'CLASSIC' },
    });
    const result = scoreCheckout(catalog, ctx);
    expect(result.score).toBeLessThan(80);
    const legacy = result.issues.find((i) => i.code === 'legacy-customer-accounts');
    expect(legacy).toBeDefined();
    expect(legacy?.severity).toBe('high');
  });

  it('treats null customer-accounts version as partial credit, no issue', () => {
    const catalog = makeCatalog([cleanProduct]);
    const ctx = makeAdminContext({
      checkoutContext: { customerAccountsVersion: null },
    });
    const result = scoreCheckout(catalog, ctx);
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThan(100);
    expect(
      result.issues.find((i) => i.code === 'legacy-customer-accounts'),
    ).toBeUndefined();
  });

  it('flags missing-inventory-signals when many variants lack inventoryQuantity', () => {
    const products = Array.from({ length: 5 }, (_, i) => ({
      ...cleanProduct,
      id: `gid://shopify/Product/${i + 200}`,
      handle: `h-${i + 200}`,
      variants: [
        {
          ...cleanProduct.variants[0]!,
          id: `gid://shopify/ProductVariant/${i + 200}`,
          inventoryQuantity: null,
        },
      ],
    }));
    const ctx = makeAdminContext({
      checkoutContext: { customerAccountsVersion: 'NEW_CUSTOMER_ACCOUNTS' },
    });
    const result = scoreCheckout(makeCatalog(products), ctx);
    const missing = result.issues.find((i) => i.code === 'missing-inventory-signals');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('medium');
    expect(missing?.affectedCount).toBe(5);
  });

  it('flags incoherent-pricing when compareAtPrice <= price', () => {
    const broken = {
      ...cleanProduct,
      id: 'gid://shopify/Product/300',
      handle: 'broken-price',
      variants: [
        {
          ...cleanProduct.variants[0]!,
          id: 'gid://shopify/ProductVariant/300',
          price: '50.00',
          compareAtPrice: '50.00',
        },
      ],
    };
    const ctx = makeAdminContext({
      checkoutContext: { customerAccountsVersion: 'NEW_CUSTOMER_ACCOUNTS' },
    });
    const result = scoreCheckout(makeCatalog([broken]), ctx);
    const bad = result.issues.find((i) => i.code === 'incoherent-pricing');
    expect(bad).toBeDefined();
    expect(bad?.severity).toBe('low');
  });

  it('returns zero with empty-catalog reason for an empty catalog', () => {
    const result = scoreCheckout(makeCatalog([]), makeAdminContext());
    expect(result.score).toBe(0);
    expect(result.lockedReason).toBe('empty-catalog');
  });
});
