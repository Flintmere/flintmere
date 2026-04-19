import type { Job } from 'bullmq';
import type { DriftRescoreJob } from '../types';
import { enqueueScore } from '../queues.server';

/**
 * Drift rescore — fired from webhooks/products handler on product create / update / delete.
 * Debounce is handled at enqueue time (30s bucket per shop+product); this handler just
 * coalesces the re-score by triggering the scoring queue with a shop-level token.
 *
 * For v1 we re-score the whole shop. A future refinement: score-diff the one touched
 * product and only bump the pillar aggregates.
 */
export async function handleDriftRescore(
  job: Job<DriftRescoreJob>,
): Promise<void> {
  const { shopDomain } = job.data;
  await enqueueScore({
    shopDomain,
    syncCompletedAt: new Date().toISOString(),
  });
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'drift-rescore-enqueued',
      shopDomain,
      productId: job.data.productId,
      topic: job.data.topic,
      jobId: job.id,
    }),
  );
}
