// Sentry client-side init. Wizard-generated; manually amended for Cookie
// Policy compliance (clause 03 + 05 — explicit commitment to NO session
// replay and NO advertising/tracking technology) and Privacy Policy
// compliance (clause 04 — hashed IP only).

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://79d1fef09f845649f00fe46fbb99b29e@o4511281229266944.ingest.de.sentry.io/4511281236344912",

  // Session replay deliberately NOT included as an integration. Our Cookie
  // Policy commits to no session-replay technology, and the bundle weight
  // would penalise the marketing surface. Re-enable would require Cookie
  // Policy + Privacy Policy update + cookie-consent banner.

  tracesSampleRate: 0.1,
  enableLogs: true,

  // PRIVACY: must stay false.
  sendDefaultPii: false,

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    delete event.user;
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
