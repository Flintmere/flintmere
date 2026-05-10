/**
 * Batch-send orchestrator. Single source of truth shared by:
 *   - scripts/send-outreach-batch.ts  (laptop-side CLI)
 *   - app/api/cron/outreach-initial   (Coolify scheduled task)
 *   - app/api/cron/outreach-followup  (Coolify scheduled task)
 *
 * Picks up to today's remaining cap-budget of eligible targets for the
 * given kind, calls `sendOutreach` per target with optional PACE_MS
 * spacing, returns aggregate + per-send results.
 *
 * Cap-budget invariant: `limit = min(opts.limit, dailyCap() - sentToday)`.
 * Operator override via env `OUTREACH_DAILY_CAP_OVERRIDE` flows through
 * `dailyCap()` automatically.
 */

import { sendOutreach } from './send';
import { dailyCap } from './cap';
import { findEligibleTargets, countSentSince } from './db';

export interface BatchOptions {
  kind: 'initial' | 'followup';
  /** Hard limit for this run. Capped by today's remaining-budget regardless. */
  limit?: number;
  /** Render + log without hitting Resend or writing OutreachSend rows. */
  dryRun?: boolean;
  /** Milliseconds between sends; 0 disables pacing. Default 60_000 (CLI), 2000 recommended for cron. */
  paceMs?: number;
}

export interface BatchSendRecord {
  targetId: string;
  shopDomain: string;
  recipientEmail: string | null;
  ok: boolean;
  reason?: string;
  resendMessageId?: string | null;
  replay?: boolean;
}

export interface BatchResult {
  kind: 'initial' | 'followup';
  attempted: number;
  ok: number;
  replay: number;
  failed: number;
  cap: number;
  sentToday: number;
  remaining: number;
  dryRun: boolean;
  sends: BatchSendRecord[];
}

export async function runSendBatch(opts: BatchOptions): Promise<BatchResult> {
  const kind = opts.kind;
  const paceMs = opts.paceMs ?? 60_000;
  const dryRun = opts.dryRun === true;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sentToday = await countSentSince(startOfDay);
  const cap = dailyCap();
  const remaining = Math.max(0, cap - sentToday);
  const limit = opts.limit != null ? Math.min(opts.limit, remaining) : remaining;

  if (limit === 0) {
    return {
      kind,
      attempted: 0,
      ok: 0,
      replay: 0,
      failed: 0,
      cap,
      sentToday,
      remaining,
      dryRun,
      sends: [],
    };
  }

  const targets = await findEligibleTargets(kind, limit);
  if (targets.length === 0) {
    return {
      kind,
      attempted: 0,
      ok: 0,
      replay: 0,
      failed: 0,
      cap,
      sentToday,
      remaining,
      dryRun,
      sends: [],
    };
  }

  const sends: BatchSendRecord[] = [];
  let okCount = 0;
  let failCount = 0;
  let replayCount = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    if (!target) continue;
    try {
      const result = await sendOutreach({ targetId: target.id, kind, dryRun });
      if (result.ok) {
        okCount += 1;
        if (result.idempotentReplay) replayCount += 1;
        sends.push({
          targetId: target.id,
          shopDomain: target.shopDomain,
          recipientEmail: target.recipientEmail,
          ok: true,
          resendMessageId: result.resendMessageId,
          replay: result.idempotentReplay,
        });
      } else {
        failCount += 1;
        sends.push({
          targetId: target.id,
          shopDomain: target.shopDomain,
          recipientEmail: target.recipientEmail,
          ok: false,
          reason: 'reason' in result ? result.reason : 'unknown',
        });
      }
    } catch (err) {
      failCount += 1;
      sends.push({
        targetId: target.id,
        shopDomain: target.shopDomain,
        recipientEmail: target.recipientEmail,
        ok: false,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
    if (i < targets.length - 1 && paceMs > 0) {
      await new Promise((r) => setTimeout(r, paceMs));
    }
  }

  return {
    kind,
    attempted: targets.length,
    ok: okCount,
    replay: replayCount,
    failed: failCount,
    cap,
    sentToday,
    remaining,
    dryRun,
    sends,
  };
}
