import { init, browserTracingIntegration } from "@sentry/remix";
import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

// Privacy posture: Cookie Policy clauses 03 + 05 commit to NO session-replay
// technology. Privacy Policy clause 04 commits to "hashed IP only".
// replayIntegration deliberately omitted; sendDefaultPii false; PII scrub
// in beforeSend (defense-in-depth on top of Sentry-side data scrubbers).
init({
  dsn: "https://2f2a8b84ddc26ef101251fd48ed07978@o4511281229266944.ingest.de.sentry.io/4511282414420048",
  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV,

  integrations: [browserTracingIntegration({
    useEffect,
    useLocation,
    useMatches,
  })],

  beforeSend(event) {
    delete event.user;
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    return event;
  },
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});