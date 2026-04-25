import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

if (!dsn) {
  console.warn('[sentry] no DSN — server-side init SKIPPED');
} else {
  console.log('[sentry] initializing server-side, env=' + (process.env.NODE_ENV ?? 'unknown'));
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
    // Defense-in-depth PII scrub on top of Sentry-side data scrubbers.
    // Privacy Policy commits to "hashed IP only" + no message bodies.
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          const sensitive = [
            'authorization',
            'cookie',
            'set-cookie',
            'x-shopify-access-token',
            'x-shopify-hmac-sha256',
            'x-stripe-signature',
          ];
          for (const k of sensitive) delete event.request.headers[k];
        }
      }
      return event;
    },
  });
  console.log('[sentry] server-side init COMPLETE');
}
