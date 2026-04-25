// Sentry server-side init. Wizard-generated; manually amended for Privacy
// Policy compliance (clause 04 — "hashed IP only"; DPA Annex 3 data
// minimisation). DSN is hardcoded by Sentry's recommended pattern; it is a
// public write-key by design (rate-limited + spike-protected on Sentry side).

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://79d1fef09f845649f00fe46fbb99b29e@o4511281229266944.ingest.de.sentry.io/4511281236344912",

  // 10% trace sampling — keep volume sane at scale; bump to 1.0 in dev only.
  tracesSampleRate: 0.1,
  enableLogs: true,

  // PRIVACY: must stay false. Sentry's default sends raw IP + cookies + auth
  // headers — direct conflict with our Privacy Policy commitments. Server-side
  // hashing happens in our app layer; Sentry sees the hashed value at most.
  sendDefaultPii: false,

  environment: process.env.NODE_ENV,

  // Defense-in-depth PII scrub on top of Sentry's data scrubbers + the
  // sendDefaultPii: false above. Strips request bodies, cookies, and
  // sensitive headers from every captured event before transmission.
  beforeSend(event) {
    delete event.user;
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      if (event.request.headers) {
        const sensitive = [
          "authorization",
          "cookie",
          "set-cookie",
          "x-shopify-access-token",
          "x-shopify-hmac-sha256",
          "x-stripe-signature",
        ];
        for (const k of sensitive) delete event.request.headers[k];
      }
    }
    return event;
  },
});
