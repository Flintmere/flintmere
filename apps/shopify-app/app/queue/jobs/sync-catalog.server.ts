import type { Job } from 'bullmq';
import { prisma } from '../../db.server';
import { decryptToken } from '../../lib/encryption.server';
import { openBulkStream, parseJsonlStream, type ParsedProductBlock } from '../../lib/sync/streaming-parser.server';
import { writeChunk } from '../../lib/sync/chunk-write.server';
import { enqueueScore } from '../queues.server';
import type { SyncCatalogJob } from '../types';

const CHUNK_SIZE = 500;

/**
 * Sync a merchant's catalog from Shopify into app_products + app_variants.
 *
 * Invoked by the sync queue worker. Uses the admin GraphQL bulk operation
 * to avoid paginated reads. Progress is emitted via job.updateProgress()
 * for the dashboard status card.
 */
export async function handleSyncCatalog(job: Job<SyncCatalogJob>): Promise<{
  productsWritten: number;
  variantsWritten: number;
  malformedLines: number;
}> {
  const { shopDomain, requestId, trigger } = job.data;

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop || !shop.encryptedAccessToken) {
    throw new Error(`no-shop-token:${shopDomain}`);
  }

  // The signed URL comes from the operator-run Shopify bulk-op flow. This job
  // expects the URL to already exist (or the calling code to have invoked
  // startBulkCatalogQuery + pollBulkOp upstream). In a worker process the
  // current simplest orchestration is: caller invokes Shopify, stores the
  // signed URL in job.data — refactor when wiring is complete.

  const signedUrl = (job.data as SyncCatalogJob & { signedUrl?: string })
    .signedUrl;
  if (!signedUrl) {
    throw new Error('sync-job-missing-signed-url');
  }

  const stream = await openBulkStream(signedUrl);
  const buffer: ParsedProductBlock[] = [];
  let productsWritten = 0;
  let variantsWritten = 0;
  let malformed = 0;

  const iter = parseJsonlStream(stream);
  while (true) {
    const next = await iter.next();
    if (next.done) {
      malformed = next.value.malformedLines;
      break;
    }
    buffer.push(next.value);
    if (buffer.length >= CHUNK_SIZE) {
      const stats = await writeChunk(prisma, shopDomain, buffer);
      productsWritten += stats.productsUpserted;
      variantsWritten += stats.variantsUpserted;
      await job.updateProgress({
        productsWritten,
        variantsWritten,
        phase: 'writing',
      });
      buffer.length = 0;
    }
  }
  if (buffer.length > 0) {
    const stats = await writeChunk(prisma, shopDomain, buffer);
    productsWritten += stats.productsUpserted;
    variantsWritten += stats.variantsUpserted;
  }

  await prisma.shop.update({
    where: { shopDomain },
    data: { lastSyncAt: new Date() },
  });

  await enqueueScore({
    shopDomain,
    syncCompletedAt: new Date().toISOString(),
    requestId,
  });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'sync-catalog-complete',
      shopDomain,
      productsWritten,
      variantsWritten,
      malformedLines: malformed,
      trigger,
      jobId: job.id,
    }),
  );

  return { productsWritten, variantsWritten, malformedLines: malformed };
}

// Unused but kept for future use when wiring the full flow inside the worker.
export { decryptToken };
