import type { Job } from 'bullmq';
import { scoreCatalog, type CatalogInput, type ProductInput } from '@flintmere/scoring';
import { prisma } from '../../db.server';
import { fixTypeForIssueCode } from '../../lib/fixes/registry';
import { enqueueFixTier1 } from '../queues.server';
import type { ScoreCatalogJob } from '../types';

const AUTO_APPLY_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const REVERT_WINDOW_DAYS = 7;

/**
 * Score job — reads products + variants from Postgres, feeds @flintmere/scoring,
 * writes Score + Issue rows. Unlocks all six pillars (app mode) because OAuth
 * data is available.
 */
export async function handleScoreCatalog(
  job: Job<ScoreCatalogJob>,
): Promise<{ composite: number; grade: string; issues: number }> {
  const { shopDomain } = job.data;

  const products = await prisma.product.findMany({
    where: { shopDomain },
    include: { variants: true },
  });

  if (products.length === 0) {
    throw new Error(`no-products:${shopDomain}`);
  }

  const catalog: CatalogInput = {
    shopDomain,
    products: products.map(toProductInput),
    scoredAt: new Date().toISOString(),
  };

  const result = scoreCatalog(catalog);

  const score = await prisma.score.create({
    data: {
      shopDomain,
      composite: result.score,
      grade: result.grade,
      gtinlessCeiling: result.gtinlessCeiling,
      pillars: result.pillars as unknown as object,
      productCount: result.productCount,
      variantCount: result.variantCount,
      issues: {
        create: result.issues.slice(0, 50).map((issue) => ({
          pillar: issue.pillar,
          code: issue.code,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          affectedCount: issue.affectedCount,
          affectedProductIds: issue.affectedProductIds,
          revenueImpactScore: issue.revenueImpactScore,
        })),
      },
    },
    include: { issues: true },
  });

  await prisma.shop.update({
    where: { shopDomain },
    data: {
      lastScoreAt: new Date(),
      lastScoreComposite: result.score,
    },
  });

  const autoApplied = await maybeAutoApplyTier1Fixes(shopDomain, score.issues);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'score-catalog-complete',
      shopDomain,
      composite: result.score,
      grade: result.grade,
      issueCount: result.issues.length,
      autoAppliedFixes: autoApplied,
      jobId: job.id,
    }),
  );

  return {
    composite: result.score,
    grade: result.grade,
    issues: result.issues.length,
  };
}

/**
 * If shop.autoApplyTier1Enabled is on, queue a Fix for every Tier 1 issue
 * code that has no recent in-flight Fix of the same fixType. Returns the
 * number of fixes queued.
 *
 * Dedupe: skip a fixType if any Fix of that type with status in
 * (pending|applied) was created in the last 24h. Prevents the same fix
 * being queued repeatedly across drift-triggered re-scores.
 */
async function maybeAutoApplyTier1Fixes(
  shopDomain: string,
  issues: Array<{ id: string; code: string; affectedProductIds: string[] }>,
): Promise<number> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { autoApplyTier1Enabled: true },
  });

  if (!shop?.autoApplyTier1Enabled) return 0;

  const since = new Date(Date.now() - AUTO_APPLY_DEDUPE_WINDOW_MS);
  const recent = await prisma.fix.findMany({
    where: {
      shopDomain,
      appliedAt: { gte: since },
      status: { in: ['pending', 'applied'] },
    },
    select: { fixType: true },
  });
  const recentTypes = new Set(recent.map((r) => r.fixType));

  const revertableUntil = new Date();
  revertableUntil.setDate(revertableUntil.getDate() + REVERT_WINDOW_DAYS);

  let queued = 0;
  for (const issue of issues) {
    const meta = fixTypeForIssueCode(issue.code);
    if (!meta || meta.tier !== 1) continue;
    if (recentTypes.has(meta.fixType)) continue;
    if (issue.affectedProductIds.length === 0) continue;

    const fix = await prisma.fix.create({
      data: {
        shopDomain,
        tier: 1,
        status: 'pending',
        fixType: meta.fixType,
        productCount: issue.affectedProductIds.length,
        beforeState: { productIds: issue.affectedProductIds } as unknown as object,
        afterState: {} as unknown as object,
        revertableUntil,
      },
    });

    await enqueueFixTier1({
      shopDomain,
      fixId: fix.id,
      op: 'apply',
    });

    recentTypes.add(meta.fixType);
    queued += 1;
  }

  return queued;
}

// Minimal row → ProductInput mapping (matches scoring package schema)
function toProductInput(row: {
  shopifyProductId: string;
  handle: string;
  title: string;
  vendor: string | null;
  productType: string | null;
  status: string;
  publishedAt: Date | null;
  rawPayload: unknown;
  variants: Array<{
    shopifyVariantId: string;
    sku: string | null;
    barcode: string | null;
    price: string;
    inventoryQuantity: number | null;
    rawPayload: unknown;
  }>;
}): ProductInput {
  const raw = (row.rawPayload ?? {}) as Record<string, unknown>;
  const statusNarrow =
    row.status === 'active' || row.status === 'draft' || row.status === 'archived'
      ? row.status
      : undefined;

  const images = Array.isArray(raw.children)
    ? (raw.children as Array<Record<string, unknown>>)
        .filter((c) => typeof c.id === 'string' && /MediaImage/.test(c.id as string))
        .map((c) => {
          const image = (c.image ?? {}) as Record<string, unknown>;
          return {
            id: typeof c.id === 'string' ? c.id : undefined,
            src: typeof image.url === 'string' ? (image.url as string) : '',
            altText: typeof c.alt === 'string' ? (c.alt as string) : null,
            width: typeof image.width === 'number' ? image.width : null,
            height: typeof image.height === 'number' ? image.height : null,
          };
        })
        .filter((img) => img.src)
    : [];

  return {
    id: row.shopifyProductId,
    handle: row.handle,
    title: row.title,
    bodyHtml:
      typeof raw.descriptionHtml === 'string'
        ? (raw.descriptionHtml as string)
        : null,
    vendor: row.vendor,
    productType: row.productType,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    status: statusNarrow,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    variants: row.variants.length
      ? row.variants.map((v) => ({
          id: v.shopifyVariantId,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          inventoryQuantity: v.inventoryQuantity,
        }))
      : [
          {
            id: 'default',
            sku: null,
            barcode: null,
            price: '0.00',
          },
        ],
    images,
  };
}
