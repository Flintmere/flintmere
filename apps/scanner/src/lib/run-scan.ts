/**
 * Scan-execution core — shared by /api/scan (HTTP-driven user/bot scans)
 * and /api/cron/rescan-30-day (cron-driven Day-30 re-scans).
 *
 * Responsibilities:
 *   - Persist the Scan row in `running` state (so failure has an id to update).
 *   - Fetch the public catalog + crawlability signals.
 *   - Compute the score, summary, suppression + revenue estimates,
 *     scaled projections, and per-issue example citations.
 *   - Persist the Scan row in `complete` state with the projection envelope.
 *   - On failure, persist the Scan row in `failed` state with errorCode + message.
 *
 * NOT responsibilities (caller-side):
 *   - HTTP body parsing, rate limiting, Turnstile verification.
 *   - Response shaping (HTTP JSON vs cron summary email).
 *
 * Returns a normalised result object — callers project the bits they
 * need (HTTP route → JSON payload; cron runner → comparison email).
 */

import {
  enrichIssuesWithExamples,
  estimateAov,
  estimateSuppression,
  scoreCatalog,
  summarizeCatalog,
  type AovEstimate,
  type Issue,
  type RevenueEstimate,
  type SuppressionEstimate,
} from '@flintmere/scoring';
import { fetchCrawlability } from './crawlability-fetcher';
import { fetchCatalog, ShopifyFetchError } from './shopify-fetcher';
import { prisma } from './db';

// Mirrors the Prisma `ScanSource` enum. The underscore-form value
// (`rescan_30_day`) is constrained by Postgres enum naming rules — the
// kebab-case 'rescan-30-day' isn't a valid enum value. Surface labels
// (email tags, log lines) can still kebab-case if needed, but the
// persisted value is the underscore form.
export type ScanSource = 'user' | 'bot' | 'rescan_30_day';

export interface RunScanInput {
  shopUrl: string;
  source: ScanSource;
  vertical?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
}

interface RunScanCompleteResult {
  status: 'complete';
  scanId: string;
  shopDomain: string;
  score: number;
  grade: string;
  productCount: number;
  variantCount: number;
  gtinlessCeiling: number | null;
  truncated: boolean;
  actualProductCount: number | null;
  catalogSummary: ReturnType<typeof summarizeCatalog>;
  suppressionEstimate: SuppressionEstimate;
  scaledSuppressionEstimate: SuppressionEstimate | null;
  aovEstimate: AovEstimate | null;
  revenueEstimate: RevenueEstimate | null;
  scaledRevenueEstimate: RevenueEstimate | null;
  pillars: Array<{
    pillar: string;
    score: number;
    maxScore: number;
    locked: boolean;
    lockedReason: string | null;
  }>;
  issues: Issue[];
  scoreJson: Record<string, unknown>;
}

interface RunScanFailedResult {
  status: 'failed';
  scanId: string;
  errorCode: string;
  errorMessage: string;
}

export type RunScanResult = RunScanCompleteResult | RunScanFailedResult;

export async function runScanForShop(input: RunScanInput): Promise<RunScanResult> {
  const startedAt = new Date();
  const normalisedDomain = input.shopUrl.toLowerCase().trim();
  // Bot scans persist the operator-supplied vertical hint; everything
  // else stores null (the field is reserved for curated aggregate data).
  const vertical = input.source === 'bot' ? (input.vertical ?? null) : null;

  const scan = await prisma.scan.create({
    data: {
      shopUrl: input.shopUrl,
      normalisedDomain,
      status: 'running',
      source: input.source,
      vertical,
      ipHash: input.ipHash ?? null,
      userAgent: input.userAgent ?? null,
      startedAt,
    },
  });

  try {
    const fetched = await fetchCatalog(input.shopUrl, { maxPages: 4 });
    const { catalog, truncated, actualProductCount } = fetched;
    const crawlability = await fetchCrawlability(catalog.shopDomain).catch(() => null);
    const score = scoreCatalog(catalog, crawlability ? { crawlability } : {});
    const catalogSummary = summarizeCatalog(catalog);
    const enrichedIssues = enrichIssuesWithExamples(score.issues, catalog);
    const suppressionEstimate = estimateSuppression(catalog);
    const aovResult = estimateAov(catalog, suppressionEstimate);

    // Ratio-scaling projects sample-derived counts up to the merchant's
    // true catalog size. Only when truncated AND we know the total.
    const sampledCount = catalog.products.length;
    const scaleRatio =
      truncated && actualProductCount !== null && actualProductCount > sampledCount
        ? actualProductCount / sampledCount
        : null;

    const scaledSuppressionEstimate: SuppressionEstimate | null =
      scaleRatio !== null
        ? {
            low: Math.ceil(suppressionEstimate.low * scaleRatio),
            high: Math.ceil(suppressionEstimate.high * scaleRatio),
            signals: {
              missingGtin: Math.ceil(suppressionEstimate.signals.missingGtin * scaleRatio),
              ambiguousAllergen: Math.ceil(
                suppressionEstimate.signals.ambiguousAllergen * scaleRatio,
              ),
              missingGmcCategory: Math.ceil(
                suppressionEstimate.signals.missingGmcCategory * scaleRatio,
              ),
            },
            productsWithAnySignal:
              suppressionEstimate.productsWithAnySignal !== undefined
                ? Math.ceil(suppressionEstimate.productsWithAnySignal * scaleRatio)
                : undefined,
          }
        : null;

    const scaledRevenueEstimate: RevenueEstimate | null =
      scaleRatio !== null && aovResult?.revenueEstimate
        ? {
            low: Math.floor(aovResult.revenueEstimate.low * scaleRatio),
            high: Math.ceil(aovResult.revenueEstimate.high * scaleRatio),
            aovEstimate: aovResult.revenueEstimate.aovEstimate,
          }
        : null;

    const persistedScoreJson = {
      ...(score as unknown as Record<string, unknown>),
      issues: enrichedIssues,
      truncated,
      actualProductCount,
      catalogSummary,
      suppressionEstimate,
      scaledSuppressionEstimate,
      aovEstimate: aovResult?.aovEstimate ?? null,
      revenueEstimate: aovResult?.revenueEstimate ?? null,
      scaledRevenueEstimate,
    };

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'complete',
        normalisedDomain: catalog.shopDomain,
        score: score.score,
        grade: score.grade,
        productCount: score.productCount,
        variantCount: score.variantCount,
        scoreJson: persistedScoreJson as unknown as object,
        completedAt: new Date(),
      },
    });

    return {
      status: 'complete',
      scanId: scan.id,
      shopDomain: score.shopDomain,
      score: score.score,
      grade: score.grade,
      productCount: score.productCount,
      variantCount: score.variantCount,
      gtinlessCeiling: score.gtinlessCeiling,
      truncated,
      actualProductCount,
      catalogSummary,
      suppressionEstimate,
      scaledSuppressionEstimate,
      aovEstimate: aovResult?.aovEstimate ?? null,
      revenueEstimate: aovResult?.revenueEstimate ?? null,
      scaledRevenueEstimate,
      pillars: score.pillars.map((p) => ({
        pillar: p.pillar,
        score: p.score,
        maxScore: p.maxScore,
        locked: p.locked,
        lockedReason: p.lockedReason ?? null,
      })),
      issues: enrichedIssues,
      scoreJson: persistedScoreJson,
    };
  } catch (err) {
    const errorCode = err instanceof ShopifyFetchError ? err.code : 'fetch-failed';
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error during scan.';

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'failed',
        errorCode,
        errorMessage,
        completedAt: new Date(),
      },
    });

    return {
      status: 'failed',
      scanId: scan.id,
      errorCode,
      errorMessage,
    };
  }
}
