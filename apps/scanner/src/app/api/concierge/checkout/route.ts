import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().email(),
  shopUrl: z.string().min(4).max(512),
});

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

  const contentType = req.headers.get('content-type') ?? '';
  let email: string;
  let shopUrl: string;

  try {
    if (contentType.includes('application/json')) {
      const json = BodySchema.parse(await req.json());
      email = json.email;
      shopUrl = json.shopUrl;
    } else {
      const form = await req.formData();
      const parsed = BodySchema.parse({
        email: form.get('email'),
        shopUrl: form.get('shopUrl'),
      });
      email = parsed.email;
      shopUrl = parsed.shopUrl;
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Check your email and shop URL.' },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flintmere.com';
  const priceId = process.env.STRIPE_CONCIERGE_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email.toLowerCase(),
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: 'gbp',
              unit_amount: 9700,
              product_data: {
                name: 'Flintmere concierge audit',
                description:
                  'Full Shopify catalog audit + 30-day remediation plan. 48-hour delivery.',
              },
            },
          },
    ],
    success_url: `${appUrl}/audit/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/audit`,
    metadata: {
      kind: 'concierge-audit',
      shop_url: shopUrl.slice(0, 250),
    },
    payment_intent_data: {
      metadata: {
        kind: 'concierge-audit',
        shop_url: shopUrl.slice(0, 250),
      },
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { ok: false, code: 'stripe-no-session-url', message: 'Could not open checkout.' },
      { status: 502 },
    );
  }

  return NextResponse.redirect(session.url, 303);
}
