import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';

/**
 * Product drift webhook handler.
 * Topics subscribed: products/create, products/update, products/delete.
 *
 * Per memory/product-engineering/shopify-api-rules.md §5-second rule:
 * 1. HMAC verify (@shopify/shopify-app-remix handles this)
 * 2. Idempotency check via shopify_event_id
 * 3. Enqueue re-score job (not implemented yet — BullMQ wiring is a follow-up)
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

  // TODO(queue): enqueue re-score job keyed on (shop, productId). Debounce 30s.

  return new Response();
}
