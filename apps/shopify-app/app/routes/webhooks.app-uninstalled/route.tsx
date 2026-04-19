import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';

/**
 * Shopify mandatory compliance webhook.
 * On uninstall: scrub access tokens within 60s per memory/product-engineering/security-posture.md.
 * Full data purge follows the 30-day window (enqueue a delayed job here when the queue is wired).
 */
export async function action({ request }: ActionFunctionArgs) {
  const { shop, session, topic } = await authenticate.webhook(request);

  if (topic !== 'APP_UNINSTALLED') {
    return new Response('wrong topic', { status: 400 });
  }

  // Scrub encrypted token + Shopify session
  await prisma.$transaction([
    prisma.shop.updateMany({
      where: { shopDomain: shop },
      data: {
        encryptedAccessToken: '',
        uninstalledAt: new Date(),
      },
    }),
    prisma.session.deleteMany({
      where: { shop },
    }),
  ]);

  // TODO(queue): enqueue 30-day data-purge job for products/scores/fixes/channel-health.

  return new Response();
}
