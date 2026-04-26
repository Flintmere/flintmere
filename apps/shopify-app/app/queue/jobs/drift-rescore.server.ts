import type { Job } from 'bullmq';
import type { DriftRescoreJob } from '../types';
import { enqueueSync } from '../queues.server';

/**
 * Drift rescore — fired from webhooks/products handler on product
 * create / update / delete. Triggers a fresh catalog SYNC (which chains
 * to a score on completion). Earlier rev enqueued a score directly — but
 * score reads from the local Postgres mirror; without a sync first, the
 * mirror still holds the pre-edit product. The merchant would edit a
 * product, the score wouldn't move, and the loop would feel broken.
 *
 * Debounce is shop-level (see enqueueDriftRescore in queues.server.ts):
 * 50 products edited in a 30s window collapse into one sync.
 *
 * For v1 we re-sync the whole catalog on any drift. A future refinement:
 * single-product fetch + targeted score-diff.
 */
export async function handleDriftRescore(
  job: Job<DriftRescoreJob>,
): Promise<void> {
  const { shopDomain } = job.data;
  await enqueueSync({
    shopDomain,
    enqueuedAt: new Date().toISOString(),
    trigger: 'rescan',
  });
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'drift-sync-enqueued',
      shopDomain,
      productId: job.data.productId,
      topic: job.data.topic,
      jobId: job.id,
    }),
  );
}
