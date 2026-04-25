import * as Sentry from "@sentry/remix";

// Privacy posture: Privacy Policy clause 04 + DPA Annex 3 data minimisation.
// sendDefaultPii false; beforeSend strips request bodies, cookies, and
// sensitive headers (Shopify access token, HMAC, Stripe signature) before
// any event leaves this process.
Sentry.init({
  dsn: "https://2f2a8b84ddc26ef101251fd48ed07978@o4511281229266944.ingest.de.sentry.io/4511282414420048",
  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV,

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