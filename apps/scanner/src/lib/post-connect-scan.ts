/**
 * Post-connect auto-scan (ADR 0023 connect-friction spec, 2026-06-07, fix 1).
 *
 * After a merchant clears the OAuth round-trip, we route them straight to
 * their real ground truth instead of a dead-end Connected card. That payoff
 * needs a completed scan for the merchant's domain — one that read GMC now
 * that a connection exists.
 *
 * The dedupe collision (spec): the merchant may have run a scan moments
 * before connecting (e.g. from the audit email), which would 429 a fresh
 * scan inside `rate-limit.ts` `DOMAIN_DEDUPE_MS = 30_000`. We side-step it by
 * NOT going through the HTTP `/api/scan` path at all. Instead:
 *
 *   1. Reuse a recent completed scan row for the domain if one exists inside
 *      REUSE_WINDOW_MS — covers the 30s-dedupe collision and avoids a
 *      redundant catalog + GMC fetch.
 *   2. Otherwise run `runScanForShop` directly (trusted server path, no
 *      per-IP / per-domain limiter — the limiter is anti-abuse on the public
 *      form, not on this gated post-connect step).
 *
 * Returns a discriminated result so the payoff page can render the score +
 * ground truth on success, or a retriable state on failure (never a blank).
 */

import { prisma } from './db';
import { runScanForShop } from './run-scan';
import type { GmcGroundTruth } from './gmc/types';

// A scan completed within this window is fresh enough to reuse rather than
// re-run. Comfortably larger than DOMAIN_DEDUPE_MS (30s) so the collision
// case always reuses; small enough that the payoff reflects current state.
export const REUSE_WINDOW_MS = 10 * 60 * 1000;

export interface PostConnectScanOk {
  status: 'ok';
  scanId: string;
  shopDomain: string;
  score: number;
  grade: string;
  /** Null when the GMC read returned nothing or errored — caller degrades. */
  gmcGroundTruth: GmcGroundTruth | null;
  /** True when we reused a recent row rather than running a fresh scan. */
  reused: boolean;
}

export interface PostConnectScanError {
  status: 'error';
  errorCode: string;
}

export type PostConnectScanResult = PostConnectScanOk | PostConnectScanError;

interface RunScanForShopFn {
  (input: {
    shopUrl: string;
    source: 'user';
  }): ReturnType<typeof runScanForShop>;
}

/**
 * Resolve the merchant's ground-truth payoff scan: reuse-or-run.
 *
 * @param shopUrl          The audit's shopUrl (passed to runScanForShop).
 * @param normalisedDomain Canonical domain (`normaliseShopDomain` output),
 *                         used for the reuse lookup against Scan.normalisedDomain.
 */
export async function resolvePostConnectScan(
  shopUrl: string,
  normalisedDomain: string,
  opts: { now?: number; runScan?: RunScanForShopFn } = {},
): Promise<PostConnectScanResult> {
  const now = opts.now ?? Date.now();
  const run = opts.runScan ?? runScanForShop;

  const cutoff = new Date(now - REUSE_WINDOW_MS);
  const recent = await prisma.scan.findFirst({
    where: {
      normalisedDomain,
      status: 'complete',
      score: { not: null },
      grade: { not: null },
      completedAt: { gte: cutoff },
    },
    orderBy: { completedAt: 'desc' },
    select: { id: true, normalisedDomain: true, score: true, grade: true, scoreJson: true },
  });

  if (recent && recent.score !== null && recent.grade !== null) {
    return {
      status: 'ok',
      scanId: recent.id,
      shopDomain: recent.normalisedDomain,
      score: recent.score,
      grade: recent.grade,
      gmcGroundTruth: extractGroundTruth(recent.scoreJson),
      reused: true,
    };
  }

  const result = await run({ shopUrl, source: 'user' });
  if (result.status === 'failed') {
    return { status: 'error', errorCode: result.errorCode };
  }

  return {
    status: 'ok',
    scanId: result.scanId,
    shopDomain: result.shopDomain,
    score: result.score,
    grade: result.grade,
    gmcGroundTruth: result.gmcGroundTruth,
    reused: false,
  };
}

/** Pull the reserved `gmcGroundTruth` key out of a persisted scoreJson blob. */
function extractGroundTruth(scoreJson: unknown): GmcGroundTruth | null {
  if (scoreJson === null || typeof scoreJson !== 'object') return null;
  const gt = (scoreJson as Record<string, unknown>).gmcGroundTruth;
  return (gt as GmcGroundTruth | null | undefined) ?? null;
}
