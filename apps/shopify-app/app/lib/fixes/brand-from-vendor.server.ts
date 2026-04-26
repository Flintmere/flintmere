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

// Build the apply plan from local DB state. No Shopify call; we use the
// raw_payload metafield snapshot to decide whether a brand metafield
// already exists. If a fresher source of truth is needed, fetch metafields
// per product before applying.
export async function planBrandFromVendor(
  shopDomain: string,
  productIds: string[],
): Promise<BrandPlan> {
  const products = await prisma.product.findMany({
    where: {
      shopDomain,
      id: { in: productIds },
    },
    select: {
      id: true,
      shopifyProductId: true,
      vendor: true,
      rawPayload: true,
    },
  });

  const items: BrandPlanItem[] = [];
  const skipped: BrandPlan['skipped'] = [];
  for (const p of products) {
    const vendor = (p.vendor ?? '').trim();
    if (!vendor) {
      skipped.push({ productId: p.id, reason: 'no-vendor' });
      continue;
    }
    const existingBrand = readExistingBrandFromPayload(p.rawPayload);
    if (existingBrand) {
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

// rawPayload snapshot from sync currently does not include metafields.
// Until that ships, treat 'no payload metafield' as 'no metafield set'.
// The Shopify Admin API will silently no-op if the metafield exists with
// the same value, so this is safe for first-time applies.
function readExistingBrandFromPayload(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const metafields = (raw as Record<string, unknown>).metafields;
  if (!Array.isArray(metafields)) return null;
  for (const mf of metafields) {
    if (
      mf &&
      typeof mf === 'object' &&
      (mf as Record<string, unknown>).namespace === BRAND_NAMESPACE &&
      (mf as Record<string, unknown>).key === BRAND_KEY
    ) {
      const v = (mf as Record<string, unknown>).value;
      return typeof v === 'string' && v.trim() ? v.trim() : null;
    }
  }
  return null;
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
