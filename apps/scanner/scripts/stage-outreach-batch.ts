/* eslint-disable no-console */
/**
 * Stage an outreach batch for operator approval — ADR 0026.
 *
 * Staging logic lives in src/lib/outreach/stage-batch (shared with the
 * /api/agent/stage-outreach route). Prints the batchId + approve URL;
 * the daily brief re-surfaces the approve link every day until clicked.
 *
 * Usage: pnpm -F scanner outreach:stage -- 20
 */

import { prisma } from '../src/lib/db';
import { scannerBaseUrl } from '../src/lib/host-url';
import { buildApproveUrl } from '../src/lib/outreach/approval';
import { stageOutreachBatch } from '../src/lib/outreach/stage-batch';

async function main(): Promise<void> {
  const limit = Number(process.argv[2] ?? '20');

  const result = await stageOutreachBatch(limit);

  if (result.batchId === null) {
    console.log('no enriched targets available — run discovery/enrichment first');
    await prisma.$disconnect();
    return;
  }

  if (result.skipped > 0) {
    console.log(`skipped ${result.skipped} targets whose status changed mid-run`);
  }

  console.log(`staged ${result.staged} targets under ${result.batchId}`);
  for (const domain of result.shopDomains) console.log(`  - ${domain}`);

  const secret = process.env.ADMIN_SESSION_SECRET;
  const baseUrl = scannerBaseUrl();
  if (secret) {
    console.log(`approve URL: ${buildApproveUrl(result.batchId, secret, baseUrl)}`);
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
