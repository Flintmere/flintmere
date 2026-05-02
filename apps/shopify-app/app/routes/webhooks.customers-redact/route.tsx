import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import {
  GDPR_DEADLINE_MS,
  enqueueGdprDsarAlert,
} from '../../queue/queues.server';

/**
 * GDPR mandatory webhook: customers/redact.
 * 30-day deadline to delete identified customer's PII. Flintmere does not store end-buyer PII by default,
 * so the operation is generally a no-op recorded for audit. If any customer-level data exists, the
 * operator removes it within the window — the audit row + alert make that visible.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== 'CUSTOMERS_REDACT') {
    return new Response('wrong topic', { status: 400 });
  }

  const receivedAt = new Date();
  const deadlineAt = new Date(receivedAt.getTime() + GDPR_DEADLINE_MS);

  const event = await prisma.gdprEvent.create({
    data: {
      shopDomain: shop,
      topic: 'CUSTOMERS_REDACT',
      payload: payload as object,
      receivedAt,
      deadlineAt,
    },
  });

  await enqueueGdprDsarAlert({
    kind: 'dsar-alert',
    gdprEventId: event.id,
    shopDomain: shop,
    topic: 'CUSTOMERS_REDACT',
    deadlineAt: deadlineAt.toISOString(),
  });

  return new Response();
}
