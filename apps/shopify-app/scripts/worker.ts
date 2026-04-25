/**
 * Standalone worker process.
 *   Local dev:  pnpm -F shopify-app worker:dev
 *   Production: a second Coolify service running `pnpm -F shopify-app worker`
 *
 * Kept tiny on purpose: business logic lives in app/queue/worker.server.ts.
 *
 * Sentry is initialised at the TOP of this file — before any imports that
 * could throw at module-load time — so module-load errors are captured.
 * The web app and the worker run as separate Coolify containers; each
 * needs its own Sentry init. Worker failures are arguably more critical
 * than web failures (silent BullMQ failures cause merchant catalog drift).
 */

import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: process.env.SENTRY_DSN ??
    'https://2f2a8b84ddc26ef101251fd48ed07978@o4511281229266944.ingest.de.sentry.io/4511282414420048',
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV,
  serverName: 'shopify-app-worker',
  beforeSend(event) {
    delete event.user;
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    return event;
  },
});

import { createWorkers } from '../app/queue/worker.server';

const workers = createWorkers();

// Top-level safety net for anything not caught by BullMQ's own error handlers.
process.on('uncaughtException', (err) => {
  Sentry.captureException(err);
  // eslint-disable-next-line no-console
  console.error('[worker] uncaughtException', err);
});
process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason);
  // eslint-disable-next-line no-console
  console.error('[worker] unhandledRejection', reason);
});

// Graceful shutdown — flush Sentry's buffer before exit so in-flight events
// reach the dashboard.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    // eslint-disable-next-line no-console
    console.log(`[worker] received ${signal}, closing workers…`);
    await workers.close();
    await Sentry.close(2000);
    process.exit(0);
  });
}

// eslint-disable-next-line no-console
console.log(JSON.stringify({
  event: 'worker-started',
  pid: process.pid,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  sentry: !!process.env.SENTRY_DSN || true,
}));
