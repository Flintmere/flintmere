import { Worker } from 'bullmq';
import * as Sentry from '@sentry/remix';
import { getRedis } from './connection.server';
import { QUEUE_NAMES } from './types';
import { handleSyncCatalog } from './jobs/sync-catalog.server';
import { handleScoreCatalog } from './jobs/score-catalog.server';
import { handleDriftRescore } from './jobs/drift-rescore.server';
import { handleApplyFix } from './jobs/apply-fix.server';

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

  const fixTier1 = new Worker(QUEUE_NAMES.fixTier1, async (job) => handleApplyFix(job), {
    connection,
    concurrency: 2,
  });

  const workers = [sync, score, drift, fixTier1];
  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      // BullMQ catches the throw and emits 'failed'; Sentry's
      // uncaughtException hook never fires. Capture explicitly here so
      // worker errors reach Sentry with queue/job context. Only on the
      // FINAL attempt — earlier attempts will be retried per backoff.
      const finalAttempt =
        job?.attemptsMade !== undefined &&
        job.opts?.attempts !== undefined &&
        job.attemptsMade >= job.opts.attempts;

      if (finalAttempt) {
        Sentry.withScope((scope) => {
          scope.setTag('queue', worker.name);
          scope.setTag('job_name', job?.name ?? 'unknown');
          scope.setExtras({
            jobId: job?.id ?? null,
            attempt: job?.attemptsMade ?? null,
            maxAttempts: job?.opts?.attempts ?? null,
            data: job?.data ?? null,
          });
          Sentry.captureException(err);
        });
      }

      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'worker-job-failed',
          queue: worker.name,
          jobId: job?.id,
          name: job?.name,
          attempt: job?.attemptsMade,
          finalAttempt,
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
