/**
 * audit-deliver
 * -------------
 * Closes the loop on a concierge audit. Looks up the ConciergeAudit row
 * by Stripe payment-intent ID, emails the customer with the letter PDF
 * and per-product CSV attached, and stamps `deliveredAt`.
 *
 * Usage:
 *   pnpm --filter scanner audit:deliver \
 *     --intent pi_3xxxxxx \
 *     --letter ./letter.pdf \
 *     --csv ./completed.csv \
 *     [--notes "Optional one-liner pinned to the email body"] \
 *     [--force]   # re-deliver even if deliveredAt is set
 *
 * Side effects:
 *   - sends one email via Resend (RESEND_API_KEY required)
 *   - updates ConciergeAudit { status='delivered', deliveredAt=now() }
 *
 * Idempotency:
 *   - refuses to re-send if `deliveredAt` is already set, unless --force.
 *     Operator may need --force after a Resend failure that left state
 *     half-applied (in practice rare; the DB stamp follows a successful
 *     send, not the other way round).
 */

import { readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import { prisma } from '../src/lib/db';
import {
  bandBySlug,
  STRIPE_BAND_METADATA_KEY,
  type AuditBandSlug,
} from '../src/lib/audit-pricing';
import { sendConciergeDeliveryEmail } from '../src/lib/concierge-delivery-email';
import { normaliseDomain } from '../src/lib/shopify-fetcher';
import { getStripe } from '../src/lib/stripe';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx < 0) return undefined;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return undefined;
  return next;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main(): Promise<void> {
  const intent = arg('intent');
  const letterPath = arg('letter');
  const csvPath = arg('csv');
  const notes = arg('notes');
  const force = flag('force');

  if (!intent || !letterPath || !csvPath) {
    console.error(
      'Usage: pnpm --filter scanner audit:deliver --intent <pi_id> --letter <path> --csv <path> [--notes <text>] [--force]',
    );
    process.exit(1);
  }

  const letterAbs = resolve(letterPath);
  const csvAbs = resolve(csvPath);

  const [letterStat, csvStat] = await Promise.all([
    stat(letterAbs).catch(() => null),
    stat(csvAbs).catch(() => null),
  ]);
  if (!letterStat || !letterStat.isFile()) {
    console.error(`Letter not found at ${letterAbs}`);
    process.exit(1);
  }
  if (!csvStat || !csvStat.isFile()) {
    console.error(`CSV not found at ${csvAbs}`);
    process.exit(1);
  }

  const audit = await prisma.conciergeAudit.findUnique({
    where: { stripePaymentIntentId: intent },
  });
  if (!audit) {
    console.error(
      `No ConciergeAudit row for payment intent ${intent}. Has the Stripe webhook fired?`,
    );
    process.exit(1);
  }

  if (audit.deliveredAt && !force) {
    console.error(
      `Audit already delivered at ${audit.deliveredAt.toISOString()}. Pass --force to re-send.`,
    );
    process.exit(1);
  }

  const bandSlug = await resolveBandSlug(intent);

  console.log(`Delivering ${audit.shopUrl} → ${audit.email} (${bandBySlug(bandSlug)?.label ?? 'Band 1'})`);

  const [letterBuffer, csvBuffer] = await Promise.all([
    readFile(letterAbs),
    readFile(csvAbs),
  ]);

  const result = await sendConciergeDeliveryEmail({
    to: audit.email,
    shopUrl: audit.shopUrl,
    bandSlug,
    notes: notes ?? undefined,
    letterFilename: basename(letterAbs),
    letterBuffer,
    csvFilename: basename(csvAbs),
    csvBuffer,
  });

  if (!result.sent) {
    console.error(`Email send failed: ${result.reason ?? 'unknown'}`);
    console.error(`DB not updated. Re-run after fixing the cause.`);
    process.exit(1);
  }

  const deliveredAt = new Date();
  const rescanCapture = await captureBaselineForRescan(audit.shopUrl, deliveredAt);

  await prisma.conciergeAudit.update({
    where: { stripePaymentIntentId: intent },
    data: {
      status: 'delivered',
      deliveredAt,
      baselineScanId: rescanCapture?.baselineScanId ?? null,
      baselineScoreJson: rescanCapture?.baselineScoreJson ?? undefined,
      rescanDueAt: rescanCapture?.rescanDueAt ?? null,
    },
  });

  console.log(`Delivered.`);
  console.log(`  Email id : ${result.id}`);
  console.log(`  To       : ${audit.email}`);
  console.log(`  Shop     : ${audit.shopUrl}`);
  console.log(`  Letter   : ${basename(letterAbs)} (${formatBytes(letterBuffer.length)})`);
  console.log(`  CSV      : ${basename(csvAbs)} (${formatBytes(csvBuffer.length)})`);
  if (rescanCapture) {
    console.log(`  Baseline : ${rescanCapture.baselineScanId} (score ${rescanCapture.baselineScore})`);
    console.log(`  Re-scan  : due ${rescanCapture.rescanDueAt.toISOString()} (delivered + 30d)`);
  } else {
    console.warn(`  Re-scan  : no baseline scan found for ${audit.shopUrl} — Day-30 re-scan not scheduled.`);
    console.warn(`             Run a fresh public scan + re-deliver with --force to schedule.`);
  }
}

/**
 * Day-30 re-scan baseline capture. Picks the most recent completed scan
 * for the shop's normalised domain as the baseline. The merchant will
 * compare against this snapshot in 30 days. If no completed scan exists,
 * we skip baseline capture and warn — operator can re-run the scanner +
 * re-deliver with --force to backfill, or wait for Slice B's cron to
 * tolerate the missing baseline by running a fresh scan at re-scan time.
 */
async function captureBaselineForRescan(
  shopUrl: string,
  deliveredAt: Date,
): Promise<{
  baselineScanId: string;
  baselineScoreJson: unknown;
  baselineScore: number | null;
  rescanDueAt: Date;
} | null> {
  const normalised = normaliseDomain(shopUrl);
  const baseline = await prisma.scan.findFirst({
    where: {
      normalisedDomain: normalised,
      status: 'complete',
      scoreJson: { not: undefined },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, score: true, scoreJson: true },
  });
  if (!baseline) return null;
  const rescanDueAt = new Date(deliveredAt.getTime() + RESCAN_INTERVAL_MS);
  return {
    baselineScanId: baseline.id,
    baselineScoreJson: baseline.scoreJson ?? null,
    baselineScore: baseline.score ?? null,
    rescanDueAt,
  };
}

const RESCAN_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

async function resolveBandSlug(paymentIntentId: string): Promise<AuditBandSlug> {
  const stripe = getStripe();
  if (!stripe) return 'band-1';

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const raw = intent.metadata?.[STRIPE_BAND_METADATA_KEY];
    if (raw === 'band-1' || raw === 'band-2' || raw === 'band-3') return raw;
  } catch (err) {
    console.warn(
      `Could not fetch band from Stripe (${err instanceof Error ? err.message : String(err)}); defaulting to band-1`,
    );
  }
  return 'band-1';
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
