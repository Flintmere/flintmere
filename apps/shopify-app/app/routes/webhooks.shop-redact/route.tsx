import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';

/**
 * GDPR mandatory webhook: shop/redact.
 * Fires 48 hours after app uninstall. Must delete all shop-associated data within 30 days.
 *
 * Cascade deletes flow from the Shop row (onDelete: Cascade on Product, Score,
 * Issue, Fix, ChannelHealth, WebhookEvent in the schema). We capture the audit
 * row BEFORE the delete so the cascade doesn't take the GdprEvent with it —
 * the audit trail must survive the delete it documents.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== 'SHOP_REDACT') {
    return new Response('wrong topic', { status: 400 });
  }

  const receivedAt = new Date();

  await prisma.gdprEvent.create({
    data: {
      shopDomain: shop,
      topic: 'SHOP_REDACT',
      payload: (payload as object) ?? {},
      receivedAt,
      respondedAt: receivedAt,
      notes: 'shop and all associated data deleted on receipt',
    },
  });

  await prisma.shop.deleteMany({ where: { shopDomain: shop } });
  await prisma.session.deleteMany({ where: { shop } });

  return new Response();
}
