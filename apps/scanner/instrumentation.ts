// Next.js 15 server instrumentation hook — loads Sentry on Node + edge runtimes.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captures errors thrown inside React Server Components + route handlers.
export { onRequestError } from '@sentry/nextjs';
