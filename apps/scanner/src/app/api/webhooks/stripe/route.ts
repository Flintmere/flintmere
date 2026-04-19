import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook handler — verifies signature, processes checkout.session.completed
 * for concierge audit purchases. Every side effect is idempotent by Stripe event ID.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json(
      { ok: false, code: 'stripe-not-configured' },
      { status: 503 },
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { ok: false, code: 'missing-signature' },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      JSON.stringify({
        event: 'stripe-webhook-bad-signature',
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return NextResponse.json(
      { ok: false, code: 'bad-signature' },
      { status: 401 },
    );
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleConciergeCheckout(session);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'stripe-webhook-handler-error',
        type: event.type,
        id: event.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    // Return 500 so Stripe retries.
    return NextResponse.json({ ok: false, code: 'handler-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, received: event.id });
}

async function handleConciergeCheckout(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.kind !== 'concierge-audit') return;

  const email = (session.customer_email ?? session.customer_details?.email ?? '').toLowerCase();
  const shopUrl = typeof session.metadata?.shop_url === 'string' ? session.metadata.shop_url : '';
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

  if (!email || !shopUrl || !paymentIntentId) return;

  await prisma.conciergeAudit.upsert({
    where: { stripePaymentIntentId: paymentIntentId },
    update: { status: 'paid' },
    create: {
      email,
      shopUrl,
      stripePaymentIntentId: paymentIntentId,
      status: 'paid',
    },
  });
}
