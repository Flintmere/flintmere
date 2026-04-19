/**
 * Stripe client singleton. One place imports the SDK.
 * Returns null if STRIPE_SECRET_KEY is not configured (dev / CI).
 */

import Stripe from 'stripe';

declare global {
  // eslint-disable-next-line no-var
  var __stripe: Stripe | null | undefined;
}

export function getStripe(): Stripe | null {
  if (globalThis.__stripe !== undefined) return globalThis.__stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  const instance = key
    ? new Stripe(key, {
        apiVersion: '2024-10-28.acacia',
        typescript: true,
      })
    : null;
  globalThis.__stripe = instance;
  return instance;
}

export function requireStripe(): Stripe {
  const s = getStripe();
  if (!s) {
    throw new Error(
      'STRIPE_SECRET_KEY missing — required for payment operations.',
    );
  }
  return s;
}
