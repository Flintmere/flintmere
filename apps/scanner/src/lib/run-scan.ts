/**
 * Scan-execution core — shared by /api/scan (HTTP-driven user/bot scans)
 * and /api/cron/rescan-30-day (cron-driven Day-30 re-scans).
 *
 * Responsibilities:
 *   - Persist the Scan row in `running` state (so failure has an id to update).
 *   - Fetch the public catalog + crawlability signals.
 *   - Compute the score, summary, and per-issue example citations.
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
  scoreCatalog,
  summarizeCatalog,
  type Issue,
} from '@flintmere/scoring';
import { fetchCrawlability } from './crawlability-fetcher';
import { fetchCatalog, ShopifyFetchError } from './shopify-fetcher';
import { prisma } from './db';
import { fetchGmcGroundTruth } from './gmc/ground-truth';
import type { GmcGroundTruth } from './gmc/types';

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
  gmcGroundTruth: GmcGroundTruth | null;
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
    // Per ADR 0023: GMC ground-truth fetch runs in parallel with the
    // remaining catalog work so its 30s budget overlaps scoring rather
    // than stacking onto user-facing scan latency. Returns null when no
    // active MerchantGmcConnection exists (current state pre-flag-flip).
    const gmcPromise = fetchGmcGroundTruth(catalog.shopDomain).catch((err) => {
      console.warn(
        'gmc-ground-truth: orchestrator-throw',
        err instanceof Error ? err.message : String(err),
      );
      return null;
    });
    const crawlability = await fetchCrawlability(catalog.shopDomain).catch(() => null);
    const score = scoreCatalog(catalog, crawlability ? { crawlability } : {});
    const catalogSummary = summarizeCatalog(catalog);
    const enrichedIssues = enrichIssuesWithExamples(score.issues, catalog);

    const gmcGroundTruth = await gmcPromise;

    const persistedScoreJson = {
      ...(score as unknown as Record<string, unknown>),
      issues: enrichedIssues,
      truncated,
      actualProductCount,
      catalogSummary,
      gmcGroundTruth,
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
      gmcGroundTruth,
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
