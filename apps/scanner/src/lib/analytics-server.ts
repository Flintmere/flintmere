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
    await client.shutdown();
  } catch {
    // Swallow — analytics must never break a payment path.
  }
}
