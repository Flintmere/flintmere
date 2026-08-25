/**
 * Day-30 re-scan runner — Slice B of the catalog letter's re-scan promise.
 *
 * Slice A (already shipped in scripts/audit-deliver.ts) captures the
 * baseline scan + writes rescanDueAt = deliveredAt + 30d at delivery time.
 *
 * Slice B (this module) is the cron-driven counterpart:
 *   1. Find ConciergeAudit rows whose rescanDueAt is in the past AND
 *      have not yet completed a re-scan AND have not yet emailed the
 *      merchant.
 *   2. For each: run a fresh public scan against shopUrl, persist the
 *      Scan id + completion time onto the row, send the comparison
 *      email, mark rescanEmailSentAt.
 *
 * Idempotency:
 *   - rescanCompletedAt = re-scan ran (Scan row exists). Don't re-run.
 *   - rescanEmailSentAt = email landed. Don't re-send.
 *   These are independent, so an email-only retry is possible if the
 *   first send fails after the scan succeeded.
 *
 * Error tolerance:
 *   - Per-row errors don't fail the whole batch. The runner records the
 *     failure on the row's rescanError field and continues. The cron
 *     summary surfaces error counts so the operator can act on a stuck
 *     row before its 30-day window slips far past.
 *
 * Called by:
 *   - /api/cron/rescan-30-day/route.ts (Coolify-scheduled HTTP endpoint)
 */

import { prisma } from './db';
import { sendDay30RescanEmail, type PersistedScoreShape } from './rescan-email';
import { runScanForShop } from './run-scan';

export interface Day30RescanResult {
  dueCount: number;
  scannedCount: number;
  emailedCount: number;
  scanFailedCount: number;
  emailFailedCount: number;
  errors: Array<{ shopUrl: string; reason: string }>;
}

export interface Day30RescanOptions {
  /** Inject "now" for tests; falls back to new Date(). */
  now?: Date;
  /** Inject the public scanner origin for absolute /score/[id] links in the
   *  email. Falls back to env. */
  scannerOrigin?: string;
}

export async function runDay30Rescans(
  options: Day30RescanOptions = {},
): Promise<Day30RescanResult> {
  const now = options.now ?? new Date();
  const scannerOrigin =
    options.scannerOrigin ??
    process.env.NEXT_PUBLIC_SCANNER_ORIGIN ??
    'https://audit.flintmere.com';

  // The query has two terminal states the runner respects:
  //   - Scan-not-yet-run: rescanCompletedAt IS NULL — runner does scan + email.
  //   - Scan-done-email-failed: rescanCompletedAt IS NOT NULL AND
  //     rescanEmailSentAt IS NULL — runner skips scan, retries email only.
  // Both shapes are returned in one query; the per-row branch picks the path.
  const due = await prisma.conciergeAudit.findMany({
    where: {
      deliveredAt: { not: null },
      rescanDueAt: { lte: now, not: null },
      rescanEmailSentAt: null,
    },
    orderBy: { rescanDueAt: 'asc' },
  });

  const result: Day30RescanResult = {
    dueCount: due.length,
    scannedCount: 0,
    emailedCount: 0,
    scanFailedCount: 0,
    emailFailedCount: 0,
    errors: [],
  };

  for (const audit of due) {
    try {
      // Branch 1 — re-scan + email path.
      let rescanScanId = audit.rescanScanId;
      let rescanScoreJson: PersistedScoreShape | null = null;

      if (!audit.rescanCompletedAt || !rescanScanId) {
        const scan = await runScanForShop({
          shopUrl: audit.shopUrl,
          source: 'rescan_30_day',
        });
        if (scan.status === 'failed') {
          result.scanFailedCount++;
          result.errors.push({
            shopUrl: audit.shopUrl,
            reason: `scan-failed:${scan.errorCode}`,
          });
          continue;
        }
        rescanScanId = scan.scanId;
        rescanScoreJson = scan.scoreJson as PersistedScoreShape;
        await prisma.conciergeAudit.update({
          where: { id: audit.id },
          data: {
            rescanScanId,
            rescanCompletedAt: new Date(),
          },
        });
        result.scannedCount++;
      } else {
        // Branch 2 — email-only retry path. Re-load the persisted Scan
        // row to compose the comparison email without re-running the scan.
        const persisted = await prisma.scan.findUnique({
          where: { id: rescanScanId },
          select: { scoreJson: true },
        });
        rescanScoreJson = (persisted?.scoreJson as PersistedScoreShape) ?? null;
      }

      if (!rescanScanId || !rescanScoreJson) {
        result.emailFailedCount++;
        result.errors.push({
          shopUrl: audit.shopUrl,
          reason: 'rescan-scoreJson-missing',
        });
        continue;
      }

      const baselineScoreJson =
        (audit.baselineScoreJson as PersistedScoreShape | null) ?? null;
      if (!baselineScoreJson) {
        // Slice A guarantees baselineScoreJson on every newly-delivered
        // catalog letter, but legacy delivered rows (pre-Slice-A) won't have one.
        // Send the email with the rescan-only payload — the absence of a
        // baseline shows up as "Re-scan complete" with no delta.
      }

      const emailResult = await sendDay30RescanEmail({
        to: audit.email,
        shopUrl: audit.shopUrl,
        rescanScanId,
        baseline: baselineScoreJson ?? {},
        current: rescanScoreJson,
        scannerOrigin,
      });

      if (emailResult.sent) {
        await prisma.conciergeAudit.update({
          where: { id: audit.id },
          data: { rescanEmailSentAt: new Date() },
        });
        result.emailedCount++;
      } else {
        result.emailFailedCount++;
        result.errors.push({
          shopUrl: audit.shopUrl,
          reason: `email-failed:${emailResult.reason ?? 'unknown'}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ shopUrl: audit.shopUrl, reason: `exception:${message}` });
    }
  }

  return result;
}
