import type { Job } from 'bullmq';
import * as Sentry from '@sentry/remix';
import { prisma } from '../../db.server';
import type { GdprJob } from '../types';

/**
 * Single handler for the `gdpr` queue, dispatching by `kind`.
 *
 * Why one handler: both job kinds are admin-ops side-effects on the same
 * audit trail (`app_gdpr_events`). Splitting would force the worker.server
 * to register two Workers on the same queue or branch externally; cleaner
 * to keep the dispatch local.
 */
export async function handleGdprJob(job: Job<GdprJob>): Promise<void> {
  const data = job.data;
  if (data.kind === 'dsar-alert') return handleDsarAlert(job as Job<typeof data>);
  if (data.kind === 'shop-purge') return handleShopPurge(job as Job<typeof data>);
  // Exhaustiveness — Sentry catches if a new kind is added without a branch.
  Sentry.captureMessage(`unknown gdpr job kind: ${(data as { kind: string }).kind}`, 'error');
}

/**
 * DSAR / customer-redact operator alert.
 *
 * Flintmere does not store end-buyer PII by default (per security-posture.md),
 * so the merchant-facing answer is almost always "we hold no data for this
 * customer." We still raise a high-priority Sentry event so the operator
 * sees the request inside the existing alert pipeline, and we update the
 * audit row's `jobId` so it's traceable from the queue side.
 *
 * Idempotent on `gdprEventId` — the BullMQ jobId pattern keeps a single
 * job per event; this handler is also safe to retry (Sentry de-dupes on
 * fingerprint).
 */
async function handleDsarAlert(
  job: Job<Extract<GdprJob, { kind: 'dsar-alert' }>>,
): Promise<void> {
  const { gdprEventId, shopDomain, topic, deadlineAt } = job.data;

  // Sentry as the operator-alert channel: tagged `gdpr` for routing rules.
  Sentry.withScope((scope) => {
    scope.setLevel('warning');
    scope.setTag('gdpr', topic.toLowerCase());
    scope.setTag('shop', shopDomain);
    scope.setExtras({
      gdprEventId,
      shopDomain,
      topic,
      deadlineAt,
      window: '30 days from receivedAt',
      action: 'review GDPR audit row + reply to merchant',
    });
    Sentry.captureMessage(
      `GDPR ${topic} received for ${shopDomain} — operator action required`,
    );
  });

  // Mirror to console for ops dashboards that scrape stdout.
  // eslint-disable-next-line no-console
  console.warn(
    JSON.stringify({
      event: 'gdpr-operator-alert',
      gdprEventId,
      shopDomain,
      topic,
      deadlineAt,
    }),
  );

  await prisma.gdprEvent.update({
    where: { id: gdprEventId },
    data: { jobId: job.id ?? null },
  });
}

/**
 * Shop data purge — deletes everything we hold for a shop after the
 * 30-day uninstall retention window. The Shop row itself is preserved
 * so we keep a minimal audit shell (no token, no PII, just the domain
 * and timestamps); a full erasure runs separately on SHOP_REDACT.
 *
 * Idempotent: if the Shop has already been deleted (SHOP_REDACT ran
 * inside the window), we no-op and mark the audit row complete.
 */
async function handleShopPurge(
  job: Job<Extract<GdprJob, { kind: 'shop-purge' }>>,
): Promise<void> {
  const { gdprEventId, shopDomain } = job.data;

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });

  // Re-installation guard: if the shop reinstalled after the purge was
  // scheduled, `uninstalledAt` will be null and the merchant has live
  // sessions. Don't wipe their data out from under them.
  if (shop && shop.uninstalledAt === null) {
    await prisma.gdprEvent.update({
      where: { id: gdprEventId },
      data: {
        respondedAt: new Date(),
        notes: 'shop reinstalled before purge deadline — purge skipped',
      },
    });
    return;
  }

  // Cascade deletes (Product → Variant, Score → Issue, Fix, ChannelHealth,
  // WebhookEvent) are wired in the schema. Issuing a single deleteMany on
  // each child table is explicit and survives a future cascade rule change.
  await prisma.$transaction([
    prisma.product.deleteMany({ where: { shopDomain } }),
    prisma.score.deleteMany({ where: { shopDomain } }),
    prisma.fix.deleteMany({ where: { shopDomain } }),
    prisma.channelHealth.deleteMany({ where: { shopDomain } }),
    prisma.webhookEvent.deleteMany({ where: { shopDomain } }),
    prisma.shop.updateMany({
      where: { shopDomain },
      data: { purgeCompletedAt: new Date() },
    }),
  ]);

  await prisma.gdprEvent.update({
    where: { id: gdprEventId },
    data: { respondedAt: new Date(), jobId: job.id ?? null },
  });

  // eslint-disable-next-line no-console
  console.info(
    JSON.stringify({
      event: 'gdpr-shop-purge-complete',
      gdprEventId,
      shopDomain,
    }),
  );
}
