/**
 * scrub-test-shop
 * ---------------
 * Scrubs all rows in scanner_* tables that belong to a specific shop
 * hostname. Use when an operator-side test sale or smoke run wrote
 * production rows that should not count toward metrics (e.g., the
 * 2026-05-05 £197 Stripe descriptor validation against matersandco.com,
 * which was operator-paid and refunded — see
 * project_stripe_audit_descriptor_validated.md).
 *
 * Tables targeted (in FK-safe deletion order):
 *   1. scanner_audit_drafts (shop = hostname)
 *   2. scanner_concierge_audits (shopUrl contains hostname)
 *   3. scanner_leads (scanId in scans matching hostname)
 *   4. scanner_scans (normalisedDomain = hostname)
 *
 * NOT touched (by design):
 *   - scanner_outreach_* — operator-managed cohorts; never scrub here
 *   - scanner_stripe_processed_events — idempotency ledger; preserve
 *   - scanner_resend_processed_events — idempotency ledger; preserve
 *   - Resend sent-email log (vendor-side; cannot scrub from script)
 *   - Stripe charge / refund history (vendor-side; cannot scrub)
 *   - PostHog page-view events (vendor-side; operator-filter only)
 *
 * Usage:
 *   # dry run — print what would be deleted, no writes
 *   DATABASE_URL=<prod> SHOP=matersandco.com DRY_RUN=true \
 *     pnpm --filter scanner scrub:test-shop
 *
 *   # execute — actually delete rows
 *   DATABASE_URL=<prod> SHOP=matersandco.com \
 *     pnpm --filter scanner scrub:test-shop
 *
 * Idempotent. A second run after a successful scrub is a no-op.
 * Failures non-zero-exit so a wrapping cron / shell logs them.
 */

import { PrismaClient } from '../src/generated/prisma';
import { normaliseDomain } from '../src/lib/shopify-fetcher';

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('[scrub-test-shop] DATABASE_URL not set');
    process.exit(1);
  }

  const rawShop = process.env.SHOP;
  if (!rawShop) {
    console.error('[scrub-test-shop] SHOP not set (e.g. SHOP=matersandco.com)');
    process.exit(1);
  }

  const dryRun = (process.env.DRY_RUN ?? 'false') === 'true';
  const hostname = normaliseDomain(rawShop);

  if (!hostname || hostname.length < 4) {
    console.error(
      `[scrub-test-shop] SHOP normalised to '${hostname}' — refusing to operate on ambiguous host`,
    );
    process.exit(1);
  }

  const startedAt = new Date();
  const prisma = new PrismaClient();

  try {
    const scans = await prisma.scan.findMany({
      where: { normalisedDomain: hostname },
      select: { id: true, shopUrl: true, createdAt: true },
    });
    const scanIds = scans.map((s) => s.id);

    const leads = await prisma.lead.findMany({
      where: { scanId: { in: scanIds } },
      select: { id: true, email: true, scanId: true },
    });

    const conciergeAudits = await prisma.conciergeAudit.findMany({
      where: { shopUrl: { contains: hostname, mode: 'insensitive' } },
      select: {
        id: true,
        shopUrl: true,
        email: true,
        stripePaymentIntentId: true,
        status: true,
      },
    });

    const auditDrafts = await prisma.auditDraft.findMany({
      where: { shop: hostname },
      select: { id: true, status: true, generatedAt: true },
    });

    const summary = {
      hostname,
      scans: scans.length,
      leads: leads.length,
      conciergeAudits: conciergeAudits.length,
      auditDrafts: auditDrafts.length,
    };

    console.log('[scrub-test-shop] preview:', JSON.stringify(summary));

    if (scans.length === 0 && conciergeAudits.length === 0 && auditDrafts.length === 0) {
      console.log('[scrub-test-shop] no rows match; nothing to scrub');
      return;
    }

    console.log('[scrub-test-shop] sample rows (first 5 each):');
    console.log('  scans:', scans.slice(0, 5));
    console.log('  leads:', leads.slice(0, 5));
    console.log('  conciergeAudits:', conciergeAudits.slice(0, 5));
    console.log('  auditDrafts:', auditDrafts.slice(0, 5));

    if (dryRun) {
      console.log('[scrub-test-shop] DRY_RUN=true — no writes performed');
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const deletedAuditDrafts = await tx.auditDraft.deleteMany({
        where: { shop: hostname },
      });
      const deletedConciergeAudits = await tx.conciergeAudit.deleteMany({
        where: { shopUrl: { contains: hostname, mode: 'insensitive' } },
      });
      const deletedLeads = await tx.lead.deleteMany({
        where: { scanId: { in: scanIds } },
      });
      const deletedScans = await tx.scan.deleteMany({
        where: { normalisedDomain: hostname },
      });
      return {
        auditDrafts: deletedAuditDrafts.count,
        conciergeAudits: deletedConciergeAudits.count,
        leads: deletedLeads.count,
        scans: deletedScans.count,
      };
    });

    const finishedAt = new Date();
    console.log(
      JSON.stringify({
        event: 'scrub_test_shop',
        hostname,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        deleted: result,
      }),
    );
  } catch (err) {
    console.error('[scrub-test-shop] failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
