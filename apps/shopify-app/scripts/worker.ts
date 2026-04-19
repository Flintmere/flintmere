/**
 * Standalone worker process.
 *   Local dev:  pnpm -F shopify-app worker:dev
 *   Production: a second Coolify service running `pnpm -F shopify-app worker`
 *
 * Kept tiny on purpose: business logic lives in app/queue/worker.server.ts.
 */

import { createWorkers } from '../app/queue/worker.server';

const workers = createWorkers();

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    // eslint-disable-next-line no-console
    console.log(`[worker] received ${signal}, closing workers…`);
    await workers.close();
    process.exit(0);
  });
}

// eslint-disable-next-line no-console
console.log(JSON.stringify({
  event: 'worker-started',
  pid: process.pid,
  nodeEnv: process.env.NODE_ENV ?? 'development',
}));
