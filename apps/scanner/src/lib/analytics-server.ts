// Server-side PostHog capture (ADR 0025). One-shot client per call —
// volume is one event per payment; flushAt:1 + shutdown() guarantees
// delivery before the serverless handler exits.
// Events are anonymous ($process_person_profile: false) — server events
// describe revenue, not people.
import { randomUUID } from 'node:crypto';
import { PostHog } from 'posthog-node';
import {
  POSTHOG_KEY,
  POSTHOG_SERVER_HOST,
  posthogKeyIsStub,
} from './analytics-config';

export async function captureServerEvent(
  event: string,
  properties: Record<string, string | number | boolean>,
): Promise<void> {
  if (posthogKeyIsStub()) return;
  try {
    const client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_SERVER_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
    client.capture({
      distinctId: `server:${randomUUID()}`,
      event,
      properties: { ...properties, $process_person_profile: false },
    });
    // shutdown() flushes over the network to PostHog EU and blocks until the
    // request completes or posthog-node's 10s requestTimeout elapses. This call
    // sits on the Stripe webhook's payment-confirmation path (before the invoice
    // and email sends) inside a 10s handler window — cap the wait at 2s so a
    // PostHog outage or cold start can never delay the customer email or push
    // the handler past Stripe's deadline.
    await Promise.race([
      client.shutdown(),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    // Swallow — analytics must never break a payment path.
  }
}
