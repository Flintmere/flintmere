import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import {
  GDPR_DEADLINE_MS,
  enqueueGdprShopPurge,
} from '../../queue/queues.server';

/**
 * Shopify mandatory compliance webhook.
 * On uninstall:
 *   • scrub access tokens within 60s (security-posture.md)
 *   • mark `purgeScheduledAt` so operator dashboards see the pending erasure
 *   • enqueue a delayed shop-purge job (30 days) — the worker deletes
 *     products / scores / fixes / channel-health for the shop, leaving an
 *     audit shell on the Shop row.
 *
 * SHOP_REDACT (fires 48h after uninstall) does the broader Shopify-mandated
 * delete; the 30-day purge here is our internal retention contract per
 * memory/product-engineering/security-posture.md.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { shop, topic, payload } = await authenticate.webhook(request);

  if (topic !== 'APP_UNINSTALLED') {
    return new Response('wrong topic', { status: 400 });
  }

  const now = new Date();

  // Scrub encrypted token + Shopify session inside the 60s window.
  await prisma.$transaction([
    prisma.shop.updateMany({
      where: { shopDomain: shop },
      data: {
        encryptedAccessToken: '',
        uninstalledAt: now,
        purgeScheduledAt: new Date(now.getTime() + GDPR_DEADLINE_MS),
      },
    }),
    prisma.session.deleteMany({
      where: { shop },
    }),
  ]);

  const event = await prisma.gdprEvent.create({
    data: {
      shopDomain: shop,
      topic: 'APP_UNINSTALLED',
      payload: (payload as object) ?? {},
      receivedAt: now,
      deadlineAt: new Date(now.getTime() + GDPR_DEADLINE_MS),
    },
  });

  await enqueueGdprShopPurge({
    kind: 'shop-purge',
    gdprEventId: event.id,
    shopDomain: shop,
    scheduledAt: now.toISOString(),
  });

  return new Response();
}
