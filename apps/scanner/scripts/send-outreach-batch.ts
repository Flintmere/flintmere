/* eslint-disable no-console */
/**
 * Laptop-side batch sender. Thin wrapper around `lib/outreach/batch.ts`
 * so the CLI and the Coolify cron routes share one execution path.
 *
 * Env vars (all optional):
 *   KIND     'initial' | 'followup'   default: 'initial'
 *   DRY_RUN  'true' to render without sending; default: false
 *   PACE_MS  ms between sends. Default 60_000 (60s — kindness-contract
 *            cadence for laptop-side use; the cron routes use 2000).
 *   LIMIT    hard limit on this run; default = today's daily-cap remaining.
 *
 * Usage:
 *   pnpm tsx scripts/send-outreach-batch.ts                      # initial sends
 *   KIND=followup pnpm tsx scripts/send-outreach-batch.ts        # follow-ups
 *   DRY_RUN=true pnpm tsx scripts/send-outreach-batch.ts         # preview
 *   LIMIT=1 DRY_RUN=true pnpm tsx scripts/send-outreach-batch.ts # one-shot smoke
 */

import { prisma } from '../src/lib/db';
import { runSendBatch } from '../src/lib/outreach/batch';

const rawKind = process.env.KIND ?? 'initial';
const DRY_RUN = process.env.DRY_RUN === 'true';
const PACE_MS = Number.parseInt(process.env.PACE_MS ?? '60000', 10);
const LIMIT_OVERRIDE = process.env.LIMIT ? Number.parseInt(process.env.LIMIT, 10) : null;

async function main(): Promise<void> {
  if (rawKind !== 'initial' && rawKind !== 'followup') {
    console.error(`KIND must be 'initial' or 'followup'; got '${rawKind}'`);
    process.exit(2);
  }
  if (!Number.isFinite(PACE_MS) || PACE_MS < 0) {
    console.error(`PACE_MS must be a non-negative integer; got '${process.env.PACE_MS}'`);
    process.exit(2);
  }

  console.log(
    JSON.stringify({
      event: 'outreach-batch.start',
      kind: rawKind,
      dryRun: DRY_RUN,
      paceMs: PACE_MS,
      limitOverride: LIMIT_OVERRIDE,
    }),
  );

  const result = await runSendBatch({
    kind: rawKind,
    dryRun: DRY_RUN,
    paceMs: PACE_MS,
    ...(LIMIT_OVERRIDE !== null ? { limit: LIMIT_OVERRIDE } : {}),
  });

  for (const r of result.sends) {
    console.log(
      JSON.stringify({
        event: r.ok ? 'outreach-batch.sent' : 'outreach-batch.failed',
        targetId: r.targetId,
        shopDomain: r.shopDomain,
        recipientEmail: r.recipientEmail,
        ...(r.resendMessageId !== undefined ? { resendMessageId: r.resendMessageId } : {}),
        ...(r.replay !== undefined ? { replay: r.replay } : {}),
        ...(r.reason !== undefined ? { reason: r.reason } : {}),
      }),
    );
  }

  console.log(
    JSON.stringify({
      event: 'outreach-batch.done',
      kind: result.kind,
      attempted: result.attempted,
      ok: result.ok,
      replay: result.replay,
      failed: result.failed,
      cap: result.cap,
      sentToday: result.sentToday,
      remaining: result.remaining,
      dryRun: result.dryRun,
    }),
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      event: 'outreach-batch.fatal',
      message: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
});
