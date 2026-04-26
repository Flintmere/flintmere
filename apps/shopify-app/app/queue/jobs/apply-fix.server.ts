import type { Job } from 'bullmq';
import { prisma } from '../../db.server';
import shopify from '../../shopify.server';
import {
  applyBrandFromVendor,
  planBrandFromVendor,
  revertBrandFromVendor,
  type BrandPlanItem,
} from '../../lib/fixes/brand-from-vendor.server';
import { enqueueScore } from '../queues.server';
import type { ApplyFixJob } from '../types';

// Worker handler for the fix-tier1 queue. Dispatches on Fix.fixType.
// Loads the Fix row → resolves admin context for the shop → runs the
// fix-specific apply/revert logic → updates Fix.status + before/after state.

export async function handleApplyFix(job: Job<ApplyFixJob>): Promise<{
  fixId: string;
  op: 'apply' | 'revert';
  written: number;
  skipped: number;
  failed: number;
}> {
  const { shopDomain, fixId, op } = job.data;

  const fix = await prisma.fix.findUnique({ where: { id: fixId } });
  if (!fix) throw new Error(`fix-not-found:${fixId}`);
  if (fix.shopDomain !== shopDomain) {
    throw new Error(`fix-shop-mismatch:${fixId}`);
  }

  if (op === 'apply' && fix.status !== 'pending') {
    throw new Error(`fix-not-pending:${fixId}:${fix.status}`);
  }
  if (op === 'revert') {
    if (fix.status !== 'applied') {
      throw new Error(`fix-not-applied:${fixId}:${fix.status}`);
    }
    if (fix.revertedAt) {
      throw new Error(`fix-already-reverted:${fixId}`);
    }
    if (fix.revertableUntil < new Date()) {
      throw new Error(`fix-revert-window-closed:${fixId}`);
    }
  }

  const { admin } = await shopify.unauthenticated.admin(shopDomain);

  switch (fix.fixType) {
    case 'brand-from-vendor':
      return op === 'apply'
        ? handleBrandApply(fix.id, shopDomain, admin, job)
        : handleBrandRevert(fix.id, admin, fix.beforeState as unknown);
    default:
      throw new Error(`unknown-fix-type:${fix.fixType}`);
  }
}

async function handleBrandApply(
  fixId: string,
  shopDomain: string,
  admin: Awaited<ReturnType<typeof shopify.unauthenticated.admin>>['admin'],
  job: Job<ApplyFixJob>,
) {
  // beforeState was written at create time as { productIds: [...] } — load
  // the productIds and re-derive the plan now (DB is the snapshot of truth).
  const fix = await prisma.fix.findUniqueOrThrow({ where: { id: fixId } });
  const before = fix.beforeState as { productIds: string[] };
  const productIds = before.productIds ?? [];

  const plan = await planBrandFromVendor(shopDomain, productIds);
  const result = await applyBrandFromVendor(admin, plan);

  await prisma.fix.update({
    where: { id: fixId },
    data: {
      status: 'applied',
      productCount: result.written.length,
      beforeState: {
        productIds,
        items: result.written.map((i) => ({
          productId: i.productId,
          shopifyProductId: i.shopifyProductId,
          existingBrand: i.existingBrand,
        })),
      } as unknown as object,
      afterState: {
        items: result.written.map((i) => ({
          shopifyProductId: i.shopifyProductId,
          brand: i.vendor,
        })),
        skipped: plan.skipped,
        failed: result.failed.map((f) => ({
          shopifyProductId: f.item.shopifyProductId,
          error: f.error,
        })),
      } as unknown as object,
    },
  });

  await enqueueScore({
    shopDomain,
    syncCompletedAt: new Date().toISOString(),
    requestId: job.data.requestId,
  });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'fix-applied',
      fixId,
      shopDomain,
      fixType: 'brand-from-vendor',
      written: result.written.length,
      skipped: plan.skipped.length,
      failed: result.failed.length,
    }),
  );

  return {
    fixId,
    op: 'apply' as const,
    written: result.written.length,
    skipped: plan.skipped.length,
    failed: result.failed.length,
  };
}

async function handleBrandRevert(
  fixId: string,
  admin: Awaited<ReturnType<typeof shopify.unauthenticated.admin>>['admin'],
  beforeState: unknown,
) {
  const items = readBeforeItems(beforeState);
  const result = await revertBrandFromVendor(admin, items);

  await prisma.fix.update({
    where: { id: fixId },
    data: {
      status: 'reverted',
      revertedAt: new Date(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'fix-reverted',
      fixId,
      deleted: result.deleted,
      restored: result.restored,
      failed: result.failed,
    }),
  );

  return {
    fixId,
    op: 'revert' as const,
    written: result.deleted + result.restored,
    skipped: 0,
    failed: result.failed,
  };
}

function readBeforeItems(state: unknown): BrandPlanItem[] {
  if (!state || typeof state !== 'object') return [];
  const items = (state as Record<string, unknown>).items;
  if (!Array.isArray(items)) return [];
  const out: BrandPlanItem[] = [];
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const r = it as Record<string, unknown>;
    if (
      typeof r.productId === 'string' &&
      typeof r.shopifyProductId === 'string'
    ) {
      out.push({
        productId: r.productId,
        shopifyProductId: r.shopifyProductId,
        vendor: typeof r.vendor === 'string' ? r.vendor : '',
        existingBrand:
          typeof r.existingBrand === 'string' ? r.existingBrand : null,
      });
    }
  }
  return out;
}
