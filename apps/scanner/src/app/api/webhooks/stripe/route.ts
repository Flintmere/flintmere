import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import {
  sendConciergeCustomerEmail,
  sendConciergeOpsEmail,
} from '@/lib/concierge-email';
import {
  sendConciergeDisputeOpsEmail,
  sendConciergeRefundOpsEmail,
} from '@/lib/concierge-refund-email';
import { createConciergeInvoice } from '@/lib/stripe-invoice';
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
      { status: 400 },
    );
  }

  // Event-ID idempotency gate. Stripe guarantees at-least-once delivery
  // — if our handler takes >20s or fails mid-flight, Stripe retries the
  // SAME event_id. The PK race on scanner_stripe_processed_events.event_id
  // serialises concurrent attempts: the loser's INSERT raises a unique
  // violation, we treat that as a replay and ACK 200 without re-dispatch.
  // Failed first-attempts leave the row in place so subsequent Stripe
  // retries are no-ops; Sentry alert (via the handler-error log below)
  // is the manual-recovery signal.
  try {
    await prisma.stripeProcessedEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({
        ok: true,
        received: event.id,
        replay: true,
      });
    }
    // Any other error — DB down, schema mismatch — surfaces as 500 so
    // Stripe retries.
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'stripe-webhook-idempotency-write-failed',
        type: event.type,
        id: event.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return NextResponse.json(
      { ok: false, code: 'idempotency-write-failed' },
      { status: 500 },
    );
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await handleConciergePaymentIntent(stripe, intent);
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleConciergeCheckout(stripe, session);
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      await handleConciergeRefund(charge);
    } else if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      await handleConciergeDispute(dispute);
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

/**
 * Prisma raises a `PrismaClientKnownRequestError` with code 'P2002' on
 * unique-constraint violations. We don't import the error type directly
 * to keep this route runtime-light; structural check is sufficient.
 */
function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown };
  return e.code === 'P2002';
}

async function handleConciergePaymentIntent(
  stripe: Stripe,
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
    stripe,
    email,
    shopUrl,
    paymentIntentId: intent.id,
    bandSlug,
  });
}

async function handleConciergeCheckout(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.kind !== 'concierge-audit') return;

  const email = (session.customer_email ?? session.customer_details?.email ?? '').toLowerCase();
  const shopUrl = typeof session.metadata?.shop_url === 'string' ? session.metadata.shop_url : '';
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
  const bandSlug = readBandSlug(session.metadata);

  if (!email || !shopUrl || !paymentIntentId) return;

  await finaliseConciergeBooking({
    stripe,
    email,
    shopUrl,
    paymentIntentId,
    bandSlug,
  });
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
  stripe: Stripe;
  email: string;
  shopUrl: string;
  paymentIntentId: string;
  bandSlug: AuditBandSlug;
}): Promise<void> {
  const { stripe, email, shopUrl, paymentIntentId, bandSlug } = args;

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

  // Issue the branded Stripe Invoice as a downloadable artefact for the
  // merchant's accounts team. Failure here doesn't block the email send —
  // the customer's already paid, the row exists, and Stripe's auto-receipt
  // covers their proof-of-purchase. Operator can hand-create from the
  // dashboard if the API call ever fails.
  const invoice = await createConciergeInvoice({
    stripe,
    email,
    shopUrl,
    paymentIntentId,
    bandSlug,
  });

  const calendlyUrl = process.env.CALENDLY_CONCIERGE_URL || null;
  const opsEmail = process.env.CONCIERGE_OPS_EMAIL || process.env.RESEND_REPLY_TO || 'hello@flintmere.com';

  const [customerResult, opsResult] = await Promise.all([
    sendConciergeCustomerEmail({
      to: email,
      shopUrl,
      calendlyUrl,
      bandSlug,
      invoice,
    }),
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

/**
 * Refund handler — fires on every `charge.refunded` event Stripe sends,
 * which includes both full and partial refunds. We only flip status when
 * the refund is full AND the prior status was 'paid' (clean cancel
 * path). Refunds against a 'delivered' row are accounting events, not
 * status flips — the deliverable + 30-day re-scan promise is already
 * spent, so the row stays 'delivered' and ops gets a high-severity
 * "investigate" alert.
 *
 * Idempotency: re-firing on an already-'refunded' row is a no-op (no
 * second email, no re-update). Stripe occasionally retries webhooks; the
 * `wasAlreadyRefunded` guard keeps us safe.
 */
async function handleConciergeRefund(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
  if (!paymentIntentId) return;

  const row = await prisma.conciergeAudit.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (!row) return;

  const wasAlreadyRefunded = row.status === 'refunded';
  if (wasAlreadyRefunded) return;

  const wasDelivered = row.status === 'delivered';
  const fullyRefunded = charge.refunded === true;
  const bandSlug = readBandSlug(charge.metadata);
  const opsEmail =
    process.env.CONCIERGE_OPS_EMAIL ||
    process.env.RESEND_REPLY_TO ||
    'hello@flintmere.com';

  // Status policy:
  //   - 'paid'     + full refund    → flip to 'refunded'
  //   - 'paid'     + partial refund → stay 'paid' (operator decides), email ops
  //   - 'delivered' + any refund    → stay 'delivered' (accounting flow), high-severity email
  //   - any other state             → don't touch status, just alert
  if (!wasDelivered && fullyRefunded && row.status === 'paid') {
    await prisma.conciergeAudit.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: { status: 'refunded' },
    });
  }

  await sendConciergeRefundOpsEmail({
    to: opsEmail,
    shopUrl: row.shopUrl,
    customerEmail: row.email,
    paymentIntentId,
    bandSlug,
    amountRefundedPence: charge.amount_refunded ?? 0,
    amountPence: charge.amount,
    currency: charge.currency,
    fullyRefunded,
    wasDelivered,
  });
}

/**
 * Dispute handler — fires on `charge.dispute.created`. Always
 * high-severity: chargebacks have a 7–21 day evidence window, missing
 * the deadline forfeits the dispute by default. Status flips to
 * 'disputed' regardless of prior state so the SLA monitor + delivery
 * scripts can branch on it (e.g., don't auto-deliver an audit for a
 * disputed booking).
 */
async function handleConciergeDispute(dispute: Stripe.Dispute): Promise<void> {
  const paymentIntentId =
    typeof dispute.payment_intent === 'string' ? dispute.payment_intent : null;
  if (!paymentIntentId) return;

  const row = await prisma.conciergeAudit.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (!row) return;

  if (row.status !== 'disputed') {
    await prisma.conciergeAudit.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: { status: 'disputed' },
    });
  }

  const bandSlug = readBandSlug(dispute.metadata);
  const opsEmail =
    process.env.CONCIERGE_OPS_EMAIL ||
    process.env.RESEND_REPLY_TO ||
    'hello@flintmere.com';
  const evidenceDueBy =
    typeof dispute.evidence_details?.due_by === 'number'
      ? new Date(dispute.evidence_details.due_by * 1000)
      : null;

  await sendConciergeDisputeOpsEmail({
    to: opsEmail,
    shopUrl: row.shopUrl,
    customerEmail: row.email,
    paymentIntentId,
    bandSlug,
    amountPence: dispute.amount,
    currency: dispute.currency,
    reason: dispute.reason,
    evidenceDueBy,
  });
}
