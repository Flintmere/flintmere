/* eslint-disable no-console */
/**
 * Stage an outreach batch for operator approval — ADR 0026.
 *
 * Flips up to N 'enriched' targets (oldest first, send-eligible data
 * guards) to 'ready_for_approval' under a fresh batchId, then prints
 * the batchId + approve URL. The daily brief re-surfaces the approve
 * link every day until clicked.
 *
 * Usage: pnpm -F scanner outreach:stage -- 20
 */

import { prisma } from '../src/lib/db';
import { OUTREACH_STATUS } from '../src/lib/outreach/db';
import { buildApproveUrl } from '../src/lib/outreach/approval';

async function main(): Promise<void> {
  const limit = Number(process.argv[2] ?? '20');
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) {
    throw new Error('limit must be 1–30');
  }

  const candidates = await prisma.outreachTarget.findMany({
    where: {
      status: OUTREACH_STATUS.enriched,
      recipientEmail: { not: null },
      score: { not: null },
      grade: { not: null },
      productCount: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, shopDomain: true },
  });

  if (candidates.length === 0) {
    console.log('no enriched targets available — run discovery/enrichment first');
    await prisma.$disconnect();
    return;
  }

  const batchId = `batch-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  const { count } = await prisma.outreachTarget.updateMany({
    where: {
      id: { in: candidates.map((c) => c.id) },
      status: OUTREACH_STATUS.enriched,
    },
    data: { status: OUTREACH_STATUS.readyForApproval, batchId },
  });

  if (count !== candidates.length) {
    console.log(`skipped ${candidates.length - count} targets whose status changed mid-run`);
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com';
  console.log(`staged ${count} targets under ${batchId}`);
  for (const c of candidates) console.log(`  - ${c.shopDomain}`);
  if (secret) {
    console.log(`approve URL: ${buildApproveUrl(batchId, secret, baseUrl)}`);
  } else {
    console.log('(ADMIN_SESSION_SECRET unset locally — approve link will appear in the daily brief)');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
  void prisma.$disconnect();
});
