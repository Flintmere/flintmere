import { authenticate } from './shopify.server';
import { prisma } from './db.server';
import {
  GDPR_DEADLINE_MS,
  enqueueGdprDsarAlert,
} from './queue/queues.server';

/**
 * Shared handler for the two near-identical Shopify GDPR DSAR-alert
 * webhooks: CUSTOMERS_DATA_REQUEST and CUSTOMERS_REDACT. Both share the
 * same shape — authenticate, topic-guard, create a GdprEvent with the
 * 30-day deadline, enqueue an operator alert, ACK 200.
 *
 * NOTE on scope: HMAC verification + body parsing are already centralised
 * by Shopify's `authenticate.webhook(request)` (Shopify SDK). The
 * meaningful duplication this helper removes is the post-authenticate
 * DSAR-alert flow, not the HMAC layer.
 *
 * SHOP_REDACT and APP_UNINSTALLED have unique side effects (cascade
 * delete, token scrub + 30-day purge enqueue) and don't share this
 * helper. Adding them here would be premature abstraction.
 */
export async function handleGdprDsarWebhook({
  request,
  expectedTopic,
}: {
  request: Request;
  expectedTopic: 'CUSTOMERS_DATA_REQUEST' | 'CUSTOMERS_REDACT';
}): Promise<Response> {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== expectedTopic) {
    return new Response('wrong topic', { status: 400 });
  }

  const receivedAt = new Date();
  const deadlineAt = new Date(receivedAt.getTime() + GDPR_DEADLINE_MS);

  const event = await prisma.gdprEvent.create({
    data: {
      shopDomain: shop,
      topic: expectedTopic,
      payload: payload as object,
      receivedAt,
      deadlineAt,
    },
  });

  await enqueueGdprDsarAlert({
    kind: 'dsar-alert',
    gdprEventId: event.id,
    shopDomain: shop,
    topic: expectedTopic,
    deadlineAt: deadlineAt.toISOString(),
  });

  return new Response();
}
