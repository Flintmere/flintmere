import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import {
  GDPR_DEADLINE_MS,
  enqueueGdprDsarAlert,
} from '../../queue/queues.server';

/**
 * GDPR mandatory webhook: customers/data_request.
 * Shopify forwards a merchant customer's DSAR to us. We have 30 days to respond.
 * See memory/compliance-risk/incident-disclosure.md + memory/product-engineering/security-posture.md.
 *
 * Flintmere does not store end-buyer PII; the response is typically "we do not hold data for this customer."
 * The audit row + queued operator alert give us the durable proof we received the request and acted on it
 * within the 30-day window.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== 'CUSTOMERS_DATA_REQUEST') {
    return new Response('wrong topic', { status: 400 });
  }

  const receivedAt = new Date();
  const deadlineAt = new Date(receivedAt.getTime() + GDPR_DEADLINE_MS);

  const event = await prisma.gdprEvent.create({
    data: {
      shopDomain: shop,
      topic: 'CUSTOMERS_DATA_REQUEST',
      payload: payload as object,
      receivedAt,
      deadlineAt,
    },
  });

  await enqueueGdprDsarAlert({
    kind: 'dsar-alert',
    gdprEventId: event.id,
    shopDomain: shop,
    topic: 'CUSTOMERS_DATA_REQUEST',
    deadlineAt: deadlineAt.toISOString(),
  });

  return new Response();
}
