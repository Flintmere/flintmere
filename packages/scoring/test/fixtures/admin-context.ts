import type {
  AdminCheckoutContext,
  AdminContextInput,
  AdminMetafield,
} from '../../src/types.js';

/**
 * Build an AdminContextInput for tests. Defaults give an empty admin
 * context (zero metafields, no GMC categories, classic accounts) which
 * is the worst-case "merchant has admin enabled but populated nothing"
 * baseline — useful for asserting the floor scores.
 *
 * Per-call overrides take productId → metafields / category. Any product
 * id not listed gets the default (empty / null).
 */
export function makeAdminContext(opts: {
  metafieldsByProduct?: Record<string, AdminMetafield[]>;
  googleProductCategoryByProduct?: Record<string, string | null>;
  checkoutContext?: Partial<AdminCheckoutContext>;
} = {}): AdminContextInput {
  return {
    metafieldsByProduct: new Map(
      Object.entries(opts.metafieldsByProduct ?? {}),
    ),
    googleProductCategoryByProduct: new Map(
      Object.entries(opts.googleProductCategoryByProduct ?? {}),
    ),
    checkoutContext: {
      requiresCustomerAccount: null,
      customerAccountsVersion: null,
      ...opts.checkoutContext,
    },
  };
}

export const standardFoodMetafields: AdminMetafield[] = [
  { namespace: 'food', key: 'allergens', type: 'list.single_line_text_field', value: '["gluten","milk"]' },
  { namespace: 'food', key: 'ingredients', type: 'multi_line_text_field', value: 'wheat flour, water, salt' },
  { namespace: 'nutrition', key: 'energy_kcal', type: 'number_integer', value: '350' },
  { namespace: 'nutrition', key: 'fat_g', type: 'number_decimal', value: '12.4' },
  { namespace: 'dietary', key: 'vegan', type: 'boolean', value: 'false' },
  { namespace: 'dietary', key: 'gluten_free', type: 'boolean', value: 'false' },
  { namespace: 'shopify', key: 'country_of_origin', type: 'single_line_text_field', value: 'United Kingdom' },
];

export const customNamespaceMetafields: AdminMetafield[] = [
  { namespace: 'custom', key: 'badge_text', type: 'single_line_text_field', value: 'Best seller' },
  { namespace: 'custom', key: 'launch_date', type: 'date', value: '2025-09-01' },
];
