import { Queue, QueueEvents } from 'bullmq';
import { getRedis } from './connection.server';
import {
  QUEUE_NAMES,
  type AlertJob,
  type ApplyFixJob,
  type DriftRescoreJob,
  type EnrichBatchJob,
  type ScoreCatalogJob,
  type SyncCatalogJob,
} from './types';

const connection = () => getRedis();

/**
 * Typed Queue instances. Import where you enqueue from route handlers / webhook handlers.
 * Workers that consume these live in app/queue/worker.server.ts.
 */

export const syncQueue = new Queue<SyncCatalogJob>(QUEUE_NAMES.sync, {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 3600, count: 500 },
    removeOnFail: { age: 86_400 * 7 }, // keep 7d for debugging
  },
});

export const scoreQueue = new Queue<ScoreCatalogJob>(QUEUE_NAMES.score, {
  connection: connection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { age: 3600, count: 500 },
  },
});

export const enrichQueue = new Queue<EnrichBatchJob>(QUEUE_NAMES.enrich, {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 15_000 },
    removeOnComplete: { age: 3600, count: 200 },
  },
});

export const fixTier1Queue = new Queue<ApplyFixJob>(QUEUE_NAMES.fixTier1, {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 86_400 * 7, count: 1000 },
    removeOnFail: { age: 86_400 * 14 },
  },
});

export const driftQueue = new Queue<DriftRescoreJob>(QUEUE_NAMES.drift, {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { age: 600, count: 1000 },
  },
});

export const alertsQueue = new Queue<AlertJob>(QUEUE_NAMES.alerts, {
  connection: connection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 86_400, count: 500 },
  },
});

/**
 * Queue-events subscribers for telemetry — optional, attach in worker process.
 */
export function subscribeQueueEvents(logger: (event: {
  queue: string;
  type: 'completed' | 'failed';
  jobId: string;
  reason?: string;
  durationMs?: number;
}) => void): () => Promise<void> {
  const subs: QueueEvents[] = [];
  for (const name of Object.values(QUEUE_NAMES)) {
    const qe = new QueueEvents(name, { connection: connection() });
    qe.on('completed', ({ jobId }) => {
      logger({ queue: name, type: 'completed', jobId });
    });
    qe.on('failed', ({ jobId, failedReason }) => {
      logger({ queue: name, type: 'failed', jobId, reason: failedReason });
    });
    subs.push(qe);
  }
  return async () => {
    await Promise.all(subs.map((qe) => qe.close()));
  };
}

// ---- Enqueue helpers ----

export async function enqueueSync(job: SyncCatalogJob) {
  return syncQueue.add('sync-catalog', job, {
    jobId: `sync:${job.shopDomain}:${job.enqueuedAt}`,
  });
}

export async function enqueueDriftRescore(job: DriftRescoreJob) {
  // Shop-level debounce: 30s window per shop. BullMQ treats same jobId as
  // duplicate. Earlier rev keyed by (shop, product) which collapsed only
  // the same-product edits — N products edited in window = N syncs. The
  // handler now triggers a full-catalog sync, so per-shop is the right
  // granularity: 50 products edited in 30s = 1 sync.
  const debounceWindow = 30_000;
  const bucket = Math.floor(Date.now() / debounceWindow);
  return driftQueue.add('drift-rescore', job, {
    jobId: `drift:${job.shopDomain}:${bucket}`,
    delay: debounceWindow,
  });
}

export async function enqueueScore(job: ScoreCatalogJob) {
  return scoreQueue.add('score-catalog', job, {
    jobId: `score:${job.shopDomain}:${job.syncCompletedAt}`,
  });
}

export async function enqueueFixTier1(job: ApplyFixJob) {
  return fixTier1Queue.add(`fix-${job.op}`, job, {
    jobId: `fix:${job.op}:${job.fixId}`,
  });
}
