// Sentry client-side init. Wizard-generated; manually amended for Cookie
// Policy compliance (clause 03 + 05 — explicit commitment to NO session
// replay and NO advertising/tracking technology), Privacy Policy
// compliance (clause 04 — hashed IP only), and bundle-weight discipline
// (Lighthouse mobile audit 2026-05-05 surfaced Sentry as the dominant
// chunk on the marketing surface — 124 KB, 47% of total JS payload).

import * as Sentry from "@sentry/nextjs";

// Defer Sentry init until after first paint — its setup work
// (registering global handlers, hooking fetch/XHR, instrumenting the
// router) blocks the main thread for 100–200ms on mobile CPUs and
// adds directly to TBT. Errors that happen before init fires are
// lost; for marketing surfaces that's acceptable since most user
// errors hit checkout / API routes (server-side Sentry catches those)
// and the first 2 seconds of pageload are typically render, not
// user-error-prone interaction. requestIdleCallback runs when the
// browser is genuinely idle; setTimeout fallback for Safari.
const initSentry = () => Sentry.init({
  dsn: "https://79d1fef09f845649f00fe46fbb99b29e@o4511281229266944.ingest.de.sentry.io/4511281236344912",

  // Session replay deliberately NOT included as an integration. Our Cookie
  // Policy commits to no session-replay technology, and the bundle weight
  // would penalise the marketing surface. Re-enable would require Cookie
  // Policy + Privacy Policy update + cookie-consent banner.

  // Tracing disabled on the client. The BrowserTracing integration adds
  // ~40 KB to the marketing bundle for performance telemetry we don't
  // act on (Plausible covers Core Web Vitals; we don't have an SLA on
  // home-page latency that needs Sentry). Server-side tracing in
  // sentry.server.config.ts is unaffected — that's where checkout +
  // webhook + concierge-flow visibility lives. Re-enable here only if
  // a debugging session needs client-side spans for a specific bug.

  // Console/log capture also disabled — same reasoning. Errors still
  // capture via the default browser exception handlers.

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

if (typeof window !== "undefined") {
  const w = window as Window & {
    requestIdleCallback?: (
      cb: () => void,
      opts?: { timeout?: number },
    ) => number;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(() => initSentry(), { timeout: 4000 });
  } else {
    setTimeout(initSentry, 2000);
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
