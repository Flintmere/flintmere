/**
 * concierge-sla-monitor — local CLI wrapper.
 *
 * In production the SLA monitor runs as a Coolify scheduled task that
 * curls /api/cron/concierge-sla on the deployed scanner. This script
 * is the same logic for local manual runs and debugging.
 *
 * Usage (from repo root, on operator's laptop):
 *   pnpm --filter scanner audit:sla-monitor
 *   SLA_WORKING_DAYS=3 pnpm --filter scanner audit:sla-monitor
 *
 * Env (read by the shared helper):
 *   DATABASE_URL              required
 *   RESEND_API_KEY            required (else send-email logs a stub)
 *   CONCIERGE_OPS_EMAIL       optional — operator inbox override
 *   SLA_WORKING_DAYS          optional — alert threshold (default 2)
 */

import { prisma } from '../src/lib/db';
import { runSlaScan } from '../src/lib/concierge-sla';

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('[concierge-sla-monitor] DATABASE_URL not set');
    process.exit(1);
  }

  const slaDaysRaw = process.env.SLA_WORKING_DAYS;
  const slaDays = slaDaysRaw ? Number(slaDaysRaw) : undefined;
  if (slaDaysRaw && (!Number.isFinite(slaDays) || (slaDays ?? 0) < 1)) {
    console.error(
      `[concierge-sla-monitor] SLA_WORKING_DAYS must be a positive integer; got ${slaDaysRaw}`,
    );
    process.exit(1);
  }

  const result = await runSlaScan(slaDays ? { slaWorkingDays: slaDays } : {});

  console.log(JSON.stringify({ event: 'concierge-sla-scan', ...result }));

  if (result.lateCount === 0) {
    console.log('[concierge-sla-monitor] No SLA breaches.');
    return;
  }

  if (!result.alertSent) {
    console.error(
      `[concierge-sla-monitor] alert email failed: ${result.alertReason ?? 'unknown'}`,
    );
    process.exit(1);
  }

  console.log(
    `[concierge-sla-monitor] alert sent. id=${result.alertId} late=${result.lateCount} to=${result.to}`,
  );
}

main()
  .catch((err) => {
    console.error('[concierge-sla-monitor]', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
