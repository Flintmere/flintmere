import { Worker } from 'bullmq';
import { getRedis } from './connection.server';
import { QUEUE_NAMES } from './types';
import { handleSyncCatalog } from './jobs/sync-catalog.server';
import { handleScoreCatalog } from './jobs/score-catalog.server';
import { handleDriftRescore } from './jobs/drift-rescore.server';

/**
 * Starts all Flintmere workers. Call from scripts/worker.ts for standalone-process
 * deployment, or from the Remix server startup hook for in-process (dev + small-scale).
 *
 * Concurrency defaults mirror memory/product-engineering/architecture-rules.md §BullMQ
 * and memory/product-engineering/performance-budget.md §Runtime cost.
 */
export function createWorkers(): { close: () => Promise<void> } {
  const connection = getRedis();

  const sync = new Worker(QUEUE_NAMES.sync, async (job) => handleSyncCatalog(job), {
    connection,
    concurrency: 2,
  });

  const score = new Worker(QUEUE_NAMES.score, async (job) => handleScoreCatalog(job), {
    connection,
    concurrency: 4,
  });

  const drift = new Worker(QUEUE_NAMES.drift, async (job) => handleDriftRescore(job), {
    connection,
    concurrency: 8,
  });

  const workers = [sync, score, drift];
  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'worker-job-failed',
          queue: worker.name,
          jobId: job?.id,
          name: job?.name,
          attempt: job?.attemptsMade,
          error: err.message,
        }),
      );
    });
  }

  return {
    close: async () => {
      await Promise.all(workers.map((w) => w.close()));
    },
  };
}
