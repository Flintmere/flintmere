import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import {
  sendConciergeCustomerEmail,
  sendConciergeOpsEmail,
} from '@/lib/concierge-email';
import {
  STRIPE_BAND_METADATA_KEY,
  type AuditBandSlug,
} from '@/lib/audit-pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook handler — verifies signature, processes payment_intent.succeeded
 * for concierge audit purchases. Every side effect is idempotent by payment intent ID.
 *
 * We also accept `checkout.session.completed` so older bookings made via hosted
 * Checkout (pre-Payment-Element) still reconcile if Stripe retries them.
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
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await handleConciergePaymentIntent(intent);
    } else if (event.type === 'checkout.session.completed') {
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
    return NextResponse.json({ ok: false, code: 'handler-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, received: event.id });
}

async function handleConciergePaymentIntent(
  intent: Stripe.PaymentIntent,
): Promise<void> {
  if (intent.metadata?.kind !== 'concierge-audit') return;

  const email = (
    intent.metadata?.email ||
    intent.receipt_email ||
    ''
  ).toLowerCase();
  const shopUrl = typeof intent.metadata?.shop_url === 'string' ? intent.metadata.shop_url : '';
  const bandSlug = readBandSlug(intent.metadata);

  if (!email || !shopUrl) return;

  await finaliseConciergeBooking({
    email,
    shopUrl,
    paymentIntentId: intent.id,
    bandSlug,
  });
}

async function handleConciergeCheckout(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.kind !== 'concierge-audit') return;

  const email = (session.customer_email ?? session.customer_details?.email ?? '').toLowerCase();
  const shopUrl = typeof session.metadata?.shop_url === 'string' ? session.metadata.shop_url : '';
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
  const bandSlug = readBandSlug(session.metadata);

  if (!email || !shopUrl || !paymentIntentId) return;

  await finaliseConciergeBooking({ email, shopUrl, paymentIntentId, bandSlug });
}

/**
 * Reads the band slug off Stripe metadata, defaulting to band-1 when
 * absent. Defensive: zero in-flight pre-cutover audits exist (per ADR
 * 0022 §Existing customers), so this branch only protects against
 * malformed metadata, not legitimate legacy bookings.
 */
function readBandSlug(
  metadata: Stripe.Metadata | null | undefined,
): AuditBandSlug {
  const raw = metadata?.[STRIPE_BAND_METADATA_KEY];
  if (raw === 'band-1' || raw === 'band-2' || raw === 'band-3') return raw;
  return 'band-1';
}

async function finaliseConciergeBooking(args: {
  email: string;
  shopUrl: string;
  paymentIntentId: string;
  bandSlug: AuditBandSlug;
}): Promise<void> {
  const { email, shopUrl, paymentIntentId, bandSlug } = args;

  const row = await prisma.conciergeAudit.upsert({
    where: { stripePaymentIntentId: paymentIntentId },
    update: { status: 'paid' },
    create: {
      email,
      shopUrl,
      stripePaymentIntentId: paymentIntentId,
      status: 'paid',
    },
  });

  if (row.notificationSentAt) return;

  const calendlyUrl = process.env.CALENDLY_CONCIERGE_URL || null;
  const opsEmail = process.env.CONCIERGE_OPS_EMAIL || process.env.RESEND_REPLY_TO || 'hello@flintmere.com';

  const [customerResult, opsResult] = await Promise.all([
    sendConciergeCustomerEmail({ to: email, shopUrl, calendlyUrl, bandSlug }),
    sendConciergeOpsEmail({
      to: opsEmail,
      customerEmail: email,
      shopUrl,
      paymentIntentId,
      bandSlug,
    }),
  ]);

  if (customerResult.sent && opsResult.sent) {
    await prisma.conciergeAudit.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: { notificationSentAt: new Date() },
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      JSON.stringify({
        event: 'concierge-email-partial-failure',
        paymentIntentId,
        customerSent: customerResult.sent,
        opsSent: opsResult.sent,
        customerReason: customerResult.reason,
        opsReason: opsResult.reason,
      }),
    );
  }
}
