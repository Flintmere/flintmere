import type {
  AdminContextInput,
  CatalogInput,
  Issue,
  PillarResult,
} from '../types.js';

// Sub-check weights — sum to 100 inside this pillar's internal scale.
// The pillar carries 10% of the composite (PILLAR_WEIGHTS['checkout-eligibility']).
const CHECKS = {
  modernCustomerAccounts: 40,
  inventorySignals: 30,
  priceCoherence: 30,
} as const;

// Customer-accounts version semantics. Shopify's CustomerAccountsVersion
// enum exposes two values via `shop.customerAccountsV2.customerAccountsVersion`:
//   NEW_CUSTOMER_ACCOUNTS — the v2 / "new" accounts that unlock the
//                           agent-checkout app permissions and the
//                           structured customerAccessToken surface.
//   CLASSIC               — legacy accounts; human checkout still works
//                           but the agent path is degraded.
// Confirmed against admin-graphql 2025-07 docs (CustomerAccountsVersion
// enum). We accept the canonical enum and any reasonable casing in case
// a transport layer normalises the response.
function customerAccountsScore(version: string | null): number {
  if (!version) {
    // Field not exposed by the merchant's API version — treat as
    // partial credit because we cannot prove either way. Better to
    // under-flag than to penalise a shop on missing data.
    return 0.5;
  }
  const v = version.toLowerCase();
  if (v === 'new_customer_accounts' || v === 'new' || v === 'v2') return 1;
  if (v === 'classic') return 0.4;
  return 0.5;
}

// Inventory-signal completeness — % of variants where Shopify has an
// integer `inventoryQuantity` recorded. Variants left at `null` (the
// merchant hasn't enabled inventory tracking) make stock state opaque
// to agents, which then either skip the variant or recommend an OOS
// product. Tracking turned on with a meaningful number is the goal.
function variantHasInventorySignal(
  inventoryQuantity: number | null | undefined,
): boolean {
  return typeof inventoryQuantity === 'number';
}

// Price-coherence — variants where compareAtPrice is either absent or
// strictly greater than price. A compareAtPrice ≤ price is the classic
// "fake discount" that confuses agents trying to surface a real sale,
// and signals price-data hygiene problems to GMC.
function variantHasCoherentPrice(
  price: string,
  compareAtPrice: string | null | undefined,
): boolean {
  const p = Number.parseFloat(price);
  if (!Number.isFinite(p) || p <= 0) return false;
  if (compareAtPrice == null || compareAtPrice === '') return true;
  const cap = Number.parseFloat(compareAtPrice);
  if (!Number.isFinite(cap)) return true;
  return cap > p;
}

export function scoreCheckout(
  input: CatalogInput,
  adminContext: AdminContextInput,
): PillarResult {
  const productCount = input.products.length;

  if (productCount === 0) {
    return {
      pillar: 'checkout-eligibility',
      weight: 10,
      score: 0,
      maxScore: 100,
      locked: false,
      lockedReason: 'empty-catalog',
      issues: [],
    };
  }

  const allVariants = input.products.flatMap((p) =>
    p.variants.map((v) => ({ product: p, variant: v })),
  );
  const variantCount = allVariants.length;

  const accountsRate = customerAccountsScore(
    adminContext.checkoutContext.customerAccountsVersion,
  );
  const accountsScore = accountsRate * CHECKS.modernCustomerAccounts;

  const variantsWithInventorySignal = allVariants.filter(({ variant }) =>
    variantHasInventorySignal(variant.inventoryQuantity),
  );
  const inventoryRate = variantCount
    ? variantsWithInventorySignal.length / variantCount
    : 0;
  const inventoryScore = inventoryRate * CHECKS.inventorySignals;

  const variantsWithCoherentPrice = allVariants.filter(({ variant }) =>
    variantHasCoherentPrice(variant.price, variant.compareAtPrice),
  );
  const priceRate = variantCount
    ? variantsWithCoherentPrice.length / variantCount
    : 0;
  const priceScore = priceRate * CHECKS.priceCoherence;

  const score =
    Math.round((accountsScore + inventoryScore + priceScore) * 100) / 100;

  const issues: Issue[] = [];

  const accountsVersionRaw = adminContext.checkoutContext.customerAccountsVersion;
  const accountsVersionLower = accountsVersionRaw?.toLowerCase() ?? null;
  if (accountsVersionLower === 'classic') {
    issues.push({
      pillar: 'checkout-eligibility',
      code: 'legacy-customer-accounts',
      severity: 'high',
      title: 'Customer accounts are on the classic (legacy) version',
      description:
        'Agent-checkout flows are gated on Shopify’s new customer accounts. Classic accounts work for human checkout but block the structured permission surface agents use to place orders on a shopper’s behalf. Migrate in Shopify admin → Settings → Customer accounts.',
      affectedCount: 1,
      affectedProductIds: [],
      revenueImpactScore: 75,
    });
  }

  const productsMissingInventory = input.products.filter((p) =>
    p.variants.some((v) => !variantHasInventorySignal(v.inventoryQuantity)),
  );
  if (inventoryRate < 0.8 && productsMissingInventory.length > 0) {
    issues.push({
      pillar: 'checkout-eligibility',
      code: 'missing-inventory-signals',
      severity: 'medium',
      title: `${productsMissingInventory.length} products have variants with no inventory signal`,
      description:
        'These variants have no integer `inventoryQuantity` set. Agents read inventory state to avoid recommending out-of-stock products and to surface low-stock urgency — missing data leaves them guessing. Turn on inventory tracking in Shopify admin or set the variant policy explicitly.',
      affectedCount: productsMissingInventory.length,
      affectedProductIds: productsMissingInventory.map((p) => p.id),
      revenueImpactScore: 50,
    });
  }

  const productsIncoherentPrice = input.products.filter((p) =>
    p.variants.some(
      (v) => !variantHasCoherentPrice(v.price, v.compareAtPrice),
    ),
  );
  if (priceRate < 0.95 && productsIncoherentPrice.length > 0) {
    issues.push({
      pillar: 'checkout-eligibility',
      code: 'incoherent-pricing',
      severity: 'low',
      title: `${productsIncoherentPrice.length} products have variants with incoherent pricing`,
      description:
        'A `compareAtPrice` set at or below `price` reads as a fake discount. Agents surfacing real sales drop these products because the discount signal cannot be verified. Either remove the `compareAtPrice` or set it strictly above the live price.',
      affectedCount: productsIncoherentPrice.length,
      affectedProductIds: productsIncoherentPrice.map((p) => p.id),
      revenueImpactScore: 30,
    });
  }

  return {
    pillar: 'checkout-eligibility',
    weight: 10,
    score,
    maxScore: 100,
    locked: false,
    issues,
  };
}
