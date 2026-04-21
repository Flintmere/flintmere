import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().email(),
  shopUrl: z.string().min(4).max(512),
});

/**
 * Creates a PaymentIntent for the £97 concierge audit and returns its client
 * secret so the Payment Element on /audit can confirm the payment in-place.
 *
 * Metadata mirrors what the Stripe webhook expects: `kind: concierge-audit`
 * plus `shop_url`. The webhook reads `customer_email` off the expanded Charge;
 * we set `receipt_email` so Stripe sends its receipt and so the webhook has an
 * email even when the Payment Element's AddressElement is not used.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        ok: false,
        code: 'stripe-not-configured',
        message: 'Stripe is not configured yet. Email hello@flintmere.com to book directly.',
      },
      { status: 503 },
    );
  }

  let email: string;
  let shopUrl: string;

  try {
    const json = BodySchema.parse(await req.json());
    email = json.email.toLowerCase();
    shopUrl = json.shopUrl.trim();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Check your email and shop URL.' },
      { status: 400 },
    );
  }

  const intent = await stripe.paymentIntents.create({
    amount: 9700,
    currency: 'gbp',
    receipt_email: email,
    description: 'Flintmere concierge audit — written deliverable in three working days',
    statement_descriptor_suffix: 'AUDIT',
    automatic_payment_methods: { enabled: true },
    metadata: {
      kind: 'concierge-audit',
      email,
      shop_url: shopUrl.slice(0, 250),
    },
  });

  if (!intent.client_secret) {
    return NextResponse.json(
      { ok: false, code: 'stripe-no-client-secret', message: 'Could not start checkout.' },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  });
}
