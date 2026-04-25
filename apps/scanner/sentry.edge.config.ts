// Sentry edge-runtime init. Wizard-generated; manually amended for Privacy
// Policy compliance. Same posture as sentry.server.config.ts.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://79d1fef09f845649f00fe46fbb99b29e@o4511281229266944.ingest.de.sentry.io/4511281236344912",

  tracesSampleRate: 0.1,
  enableLogs: true,

  // PRIVACY: must stay false (clause 04 — "hashed IP only").
  sendDefaultPii: false,

  environment: process.env.NODE_ENV,
});
