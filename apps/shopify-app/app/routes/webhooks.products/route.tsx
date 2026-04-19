import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { enqueueDriftRescore } from '../../queue/queues.server';

/**
 * Product drift webhook handler.
 * Topics subscribed: products/create, products/update, products/delete.
 *
 * Per memory/product-engineering/shopify-api-rules.md §5-second rule:
 * 1. HMAC verify (@shopify/shopify-app-remix handles this)
 * 2. Idempotency check via shopify_event_id
 * 3. Enqueue drift re-score job (debounced 30s per shop+product)
 * 4. Return 200 within 5s
 */
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload, webhookId } = await authenticate.webhook(request);

  // Idempotency: has this event id been processed already?
  const existing = await prisma.webhookEvent.findUnique({
    where: { shopifyEventId: webhookId },
  });
  if (existing?.processedAt) {
    return new Response(); // already handled; acknowledge
  }

  await prisma.webhookEvent.upsert({
    where: { shopifyEventId: webhookId },
    update: {},
    create: {
      id: webhookId,
      shopifyEventId: webhookId,
      shopDomain: shop,
      topic,
      payload: payload as object,
    },
  });

  const productId =
    typeof (payload as { id?: unknown }).id === 'string'
      ? (payload as { id: string }).id
      : typeof (payload as { admin_graphql_api_id?: unknown }).admin_graphql_api_id === 'string'
        ? (payload as { admin_graphql_api_id: string }).admin_graphql_api_id
        : 'unknown';

  await enqueueDriftRescore({
    shopDomain: shop,
    productId,
    topic: topic as 'products/create' | 'products/update' | 'products/delete',
    webhookId,
  });

  await prisma.webhookEvent.update({
    where: { shopifyEventId: webhookId },
    data: { processedAt: new Date() },
  });

  return new Response();
}
