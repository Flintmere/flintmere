// Next.js 15 server instrumentation hook — loads Sentry on Node + edge runtimes.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export async function register() {
  console.log('[instrumentation] register() invoked, runtime=' + (process.env.NEXT_RUNTIME ?? 'unknown'));
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    // Boot-time verification ping — fires once per container start. Visible in
    // Sentry Issues as "container boot — sentry sdk verified". Remove once the
    // SDK is proven and your operational confidence is real.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureMessage('[scanner boot] sentry sdk verified — ' + new Date().toISOString(), 'info');
      console.log('[sentry] boot message dispatched');
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captures errors thrown inside React Server Components + route handlers.
export { onRequestError } from '@sentry/nextjs';
