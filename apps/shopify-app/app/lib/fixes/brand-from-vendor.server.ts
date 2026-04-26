import type { AdminApiContext } from '@shopify/shopify-app-remix/server';
import { prisma } from '../../db.server';

// Tier 1 fix: copy Product.vendor → custom.brand metafield.
// Reversible because before/after state captures every product's prior
// metafield value (or absence). Revert deletes metafields that didn't
// exist before, restores those that did.

export interface BrandPlanItem {
  productId: string;        // Prisma cuid
  shopifyProductId: string; // GID e.g. "gid://shopify/Product/123"
  vendor: string;
  existingBrand: string | null;
}

export interface BrandPlan {
  items: BrandPlanItem[];
  skipped: { productId: string; reason: 'no-vendor' | 'has-brand-metafield' }[];
}

const BRAND_NAMESPACE = 'custom';
const BRAND_KEY = 'brand';
const BRAND_TYPE = 'single_line_text_field';

// Plan input shape — what `buildBrandPlan` consumes. Pure data so the
// filter logic can be tested without prisma + Shopify mocks.
export interface BrandPlanCandidate {
  id: string;
  shopifyProductId: string;
  vendor: string | null;
}

// Pure plan builder — given a candidate set + a map of existing brand
// metafields by Shopify GID, produce the apply plan. Tested in
// brand-from-vendor.test.ts. The merchant trust contract on Tier 1 fixes
// is "fully reversible"; this filter is what enforces it (products with
// a pre-existing brand metafield are SKIPPED, never overwritten).
export function buildBrandPlan(
  candidates: readonly BrandPlanCandidate[],
  existingBrandByGid: ReadonlyMap<string, string | null>,
): BrandPlan {
  const items: BrandPlanItem[] = [];
  const skipped: BrandPlan['skipped'] = [];
  for (const p of candidates) {
    const vendor = (p.vendor ?? '').trim();
    if (!vendor) {
      skipped.push({ productId: p.id, reason: 'no-vendor' });
      continue;
    }
    const existing = existingBrandByGid.get(p.shopifyProductId);
    if (existing && existing.trim()) {
      skipped.push({ productId: p.id, reason: 'has-brand-metafield' });
      continue;
    }
    items.push({
      productId: p.id,
      shopifyProductId: p.shopifyProductId,
      vendor,
      existingBrand: null,
    });
  }
  return { items, skipped };
}

// Build the apply plan: hydrate candidates from Postgres, fetch existing
// brand metafields from Shopify in one round-trip per 100 products, and
// hand off to the pure builder. Replaces the earlier rawPayload heuristic
// (which was a data-loss footgun once auto-apply landed: it could
// silently overwrite a merchant's manually-set brand metafield because
// the sync snapshot doesn't include metafields).
export async function planBrandFromVendor(
  admin: AdminApiContext,
  shopDomain: string,
  productIds: string[],
): Promise<BrandPlan> {
  const candidates = await prisma.product.findMany({
    where: { shopDomain, id: { in: productIds } },
    select: { id: true, shopifyProductId: true, vendor: true },
  });

  const gids = candidates.map((c) => c.shopifyProductId);
  const existingByGid = await fetchExistingBrandMetafields(admin, gids);
  return buildBrandPlan(candidates, existingByGid);
}

// Apply the plan via metafieldsSet. Up to 25 metafields per call per
// Shopify Admin API. Returns the per-item result so the worker can
// persist `afterState`.
export async function applyBrandFromVendor(
  admin: AdminApiContext,
  plan: BrandPlan,
): Promise<{ written: BrandPlanItem[]; failed: { item: BrandPlanItem; error: string }[] }> {
  const written: BrandPlanItem[] = [];
  const failed: { item: BrandPlanItem; error: string }[] = [];

  for (const batch of chunk(plan.items, 25)) {
    const metafields = batch.map((item) => ({
      ownerId: item.shopifyProductId,
      namespace: BRAND_NAMESPACE,
      key: BRAND_KEY,
      type: BRAND_TYPE,
      value: item.vendor,
    }));

    const response = await admin.graphql(METAFIELDS_SET_MUTATION, {
      variables: { metafields },
    });
    const json = (await response.json()) as MetafieldsSetResponse;
    const userErrors = json.data?.metafieldsSet?.userErrors ?? [];

    if (userErrors.length === 0) {
      written.push(...batch);
      continue;
    }

    // Per-batch error: attribute by ownerId index in userErrors.field path
    // when present, else mark whole batch failed with shared reason.
    const errorByOwner = new Map<string, string>();
    for (const ue of userErrors) {
      const ownerId = extractOwnerIdFromField(ue.field, batch);
      if (ownerId) errorByOwner.set(ownerId, ue.message);
    }
    for (const item of batch) {
      const err = errorByOwner.get(item.shopifyProductId);
      if (err) {
        failed.push({ item, error: err });
      } else {
        written.push(item);
      }
    }
  }

  return { written, failed };
}

// Revert: for each item where existingBrand was null, delete the metafield.
// Where existingBrand had a value, restore it via metafieldsSet.
// (Phase-1: all fix items have existingBrand=null — revert is pure-delete.)
export async function revertBrandFromVendor(
  admin: AdminApiContext,
  beforeState: BrandPlanItem[],
): Promise<{ deleted: number; restored: number; failed: number }> {
  let deleted = 0;
  let restored = 0;
  let failed = 0;

  // Phase 1: only delete-paths exist (we skip products that already had a brand metafield).
  for (const batch of chunk(beforeState, 25)) {
    const identifiers = batch
      .filter((b) => b.existingBrand === null)
      .map((b) => ({
        ownerId: b.shopifyProductId,
        namespace: BRAND_NAMESPACE,
        key: BRAND_KEY,
      }));

    if (identifiers.length === 0) continue;

    const response = await admin.graphql(METAFIELDS_DELETE_MUTATION, {
      variables: { metafields: identifiers },
    });
    const json = (await response.json()) as MetafieldsDeleteResponse;
    const userErrors = json.data?.metafieldsDelete?.userErrors ?? [];
    if (userErrors.length === 0) {
      deleted += identifiers.length;
    } else {
      failed += userErrors.length;
      deleted += Math.max(0, identifiers.length - userErrors.length);
    }
  }

  return { deleted, restored, failed };
}

// ---- helpers ----

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// Fetch the `custom.brand` metafield value (if any) for each candidate
// product. Returns a Map keyed by the product's Shopify GID. Products
// not found in Shopify (deleted between sync and fix) are mapped to
// null — treated downstream as "no existing metafield" so the apply
// will be a no-op (the productVariantUpdate would just fail silently
// for non-existent products).
//
// `nodes()` accepts up to 250 ids per call; we batch at 100 to keep
// query cost well below the rate-limit ceiling. A typical missing-brand
// issue affects far fewer products than this.
async function fetchExistingBrandMetafields(
  admin: AdminApiContext,
  productGids: readonly string[],
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (productGids.length === 0) return result;

  for (const batch of chunk([...productGids], 100)) {
    const response = await admin.graphql(GET_BRAND_METAFIELDS_QUERY, {
      variables: { ids: batch },
    });
    const json = (await response.json()) as GetBrandMetafieldsResponse;
    const nodes = json.data?.nodes ?? [];

    // `nodes()` preserves request-order in its result array; one entry
    // per requested id, null where the id doesn't exist.
    for (let i = 0; i < batch.length; i += 1) {
      const gid = batch[i]!;
      const node = nodes[i] ?? null;
      if (!node || node.__typename !== 'Product') {
        result.set(gid, null);
        continue;
      }
      // `__typename === 'Product'` discriminates the union but TS doesn't
      // narrow because the catch-all member `{ __typename: string }`
      // overlaps. Cast at the boundary.
      const productNode = node as unknown as { metafield: { value: string | null } | null };
      const value = productNode.metafield?.value;
      result.set(
        gid,
        typeof value === 'string' && value.trim() ? value.trim() : null,
      );
    }
  }
  return result;
}

function extractOwnerIdFromField(
  field: string[] | undefined,
  batch: BrandPlanItem[],
): string | null {
  if (!field || field.length < 2) return null;
  // userErrors.field shape is e.g. ["metafields", "3", "value"] — index into batch
  const idx = Number.parseInt(field[1] ?? '', 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= batch.length) return null;
  return batch[idx]?.shopifyProductId ?? null;
}

const METAFIELDS_SET_MUTATION = /* GraphQL */ `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        namespace
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const METAFIELDS_DELETE_MUTATION = /* GraphQL */ `
  mutation MetafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields {
        ownerId
        key
        namespace
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface MetafieldsSetResponse {
  data?: {
    metafieldsSet?: {
      userErrors: { field?: string[]; message: string; code?: string }[];
    };
  };
}

interface MetafieldsDeleteResponse {
  data?: {
    metafieldsDelete?: {
      userErrors: { field?: string[]; message: string }[];
    };
  };
}

const GET_BRAND_METAFIELDS_QUERY = /* GraphQL */ `
  query GetBrandMetafields($ids: [ID!]!) {
    nodes(ids: $ids) {
      __typename
      ... on Product {
        id
        metafield(namespace: "custom", key: "brand") {
          value
        }
      }
    }
  }
`;

interface GetBrandMetafieldsResponse {
  data?: {
    nodes: Array<
      | {
          __typename: 'Product';
          id: string;
          metafield: { value: string | null } | null;
        }
      | { __typename: string }
      | null
    >;
  };
}
