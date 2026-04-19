import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';

/**
 * GDPR mandatory webhook: shop/redact.
 * Fires 48 hours after app uninstall. Must delete all shop-associated data within 30 days.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop } = await authenticate.webhook(request);

  if (topic !== 'SHOP_REDACT') {
    return new Response('wrong topic', { status: 400 });
  }

  // Cascade delete — Prisma schema has onDelete: Cascade for child tables.
  await prisma.shop.deleteMany({ where: { shopDomain: shop } });
  await prisma.session.deleteMany({ where: { shop } });

  // eslint-disable-next-line no-console
  console.info('[gdpr] shop/redact complete', { shop });

  return new Response();
}
