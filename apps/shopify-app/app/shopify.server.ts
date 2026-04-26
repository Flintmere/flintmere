import '@shopify/shopify-app-remix/adapters/node';
import {
  ApiVersion,
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
} from '@shopify/shopify-app-remix/server';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import type { PrismaClient as VendorPrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/remix';
import { prisma } from './db.server';
import { encryptToken } from './lib/encryption.server';
// NOTE: queues.server.ts is imported lazily inside afterAuth (see below).
// Static import would throw at app boot when REDIS_URL is missing because
// queue constructors call getRedis() synchronously — and shopify.server.ts
// is imported by every route (via `authenticate`). Lazy import isolates
// the Redis dependency to actual OAuth completion.

// PrismaSessionStorage's signature pins to the vendor `@prisma/client`'s
// PrismaClient. Our generated client is structurally identical but
// nominally distinct (per-app output path — see prisma/schema.prisma).
// Cast at the boundary; runtime behaviour is unchanged.
const sessionStoragePrisma = prisma as unknown as VendorPrismaClient;

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.July25,
  scopes: process.env.SHOPIFY_SCOPES?.split(',') ?? [],
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: '/auth',
  sessionStorage: new PrismaSessionStorage(sessionStoragePrisma),
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: true,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  // GDPR webhooks (customers-data-request, customers-redact, shop-redact)
  // are registered via the Shopify Partner Dashboard, NOT via this API
  // config. Only the business webhooks below register via API.
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks/app-uninstalled',
    },
    PRODUCTS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks/products',
    },
    PRODUCTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks/products',
    },
    PRODUCTS_DELETE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks/products',
    },
  },
  hooks: {
    // Runs after every successful OAuth completion — both first install
    // and re-auth flows. Without this hook the merchant gets through
    // OAuth, lands on the dashboard, sees "first scan is building" and
    // nothing happens because (1) Shop row never gets created, (2) no
    // sync is ever queued.
    afterAuth: async ({ session }) => {
      const shopDomain = session.shop;
      const accessToken = session.accessToken;

      if (!accessToken) {
        throw new Error('afterAuth: session.accessToken missing');
      }

      const existing = await prisma.shop.findUnique({
        where: { shopDomain },
        select: {
          shopDomain: true,
          lastSyncAt: true,
          uninstalledAt: true,
        },
      });

      const encryptedAccessToken = encryptToken(accessToken);
      const scopes = session.scope ?? process.env.SHOPIFY_SCOPES ?? '';

      await prisma.shop.upsert({
        where: { shopDomain },
        create: { shopDomain, encryptedAccessToken, scopes },
        update: {
          encryptedAccessToken,
          scopes,
          // Clear the uninstalled marker if this is a reinstall.
          uninstalledAt: null,
        },
      });

      // Register webhooks AFTER the Shop row is in place, so the webhook
      // handlers (which read prisma.shop) don't race the install.
      // The result is per-topic; partial failures don't fail the install
      // (re-auth re-tries) but we MUST surface them — a silently failed
      // PRODUCTS_UPDATE registration means drift detection is dead.
      try {
        const webhookResults = await shopify.registerWebhooks({ session });
        const failures = Object.entries(webhookResults ?? {}).flatMap(
          ([topic, results]) =>
            (results ?? [])
              .filter((r) => !r.success)
              .map((r) => ({
                topic,
                result: r.result as unknown,
              })),
        );
        if (failures.length > 0) {
          Sentry.withScope((scope) => {
            scope.setTag('shop_domain', shopDomain);
            scope.setTag('phase', 'webhook-registration');
            scope.setExtras({ failures });
            Sentry.captureMessage(
              `webhook registration: ${failures.length} topic(s) failed`,
              'warning',
            );
          });
          // eslint-disable-next-line no-console
          console.warn(
            JSON.stringify({
              event: 'afterAuth-webhook-registration-failures',
              shopDomain,
              failures,
            }),
          );
        }
      } catch (err) {
        // Total registration failure (e.g., admin call refused). Capture
        // but don't fail the install — merchant can re-auth to retry.
        Sentry.withScope((scope) => {
          scope.setTag('shop_domain', shopDomain);
          scope.setTag('phase', 'webhook-registration');
          Sentry.captureException(err);
        });
      }

      // Fresh install OR reinstall after uninstall OR install that never
      // completed its first sync: kick off the initial bulk-op sync.
      // The worker handles the bulk-op start + poll itself when no
      // signedUrl is on the job (see sync-catalog.server.ts).
      const isFreshInstall =
        !existing ||
        existing.uninstalledAt !== null ||
        existing.lastSyncAt === null;

      if (isFreshInstall) {
        const { enqueueSync } = await import('./queue/queues.server');
        await enqueueSync({
          shopDomain,
          enqueuedAt: new Date().toISOString(),
          trigger: 'install',
        });
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
