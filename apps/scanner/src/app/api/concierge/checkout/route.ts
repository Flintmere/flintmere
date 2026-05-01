import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';
import {
  bandBySlug,
  STRIPE_BAND_METADATA_KEY,
  type AuditBandSlug,
} from '@/lib/audit-pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().email(),
  shopUrl: z.string().min(4).max(512),
  bandSlug: z.enum(['band-1', 'band-2', 'band-3']),
});

/**
 * Creates a PaymentIntent for the chosen Concierge-audit band per ADR 0022
 * (three-band SKU ladder: £197 / £397 / £597+). Band 3 is bespoke and
 * routes to a mailto enquiry on the client; the API rejects it.
 *
 * Metadata mirrors what the Stripe webhook expects: `kind: concierge-audit`,
 * `shop_url`, plus `audit_band` (canonical key from `lib/audit-pricing.ts`)
 * and `band_label`. Stripe is the audit trail for band-by-band reporting —
 * no Prisma column per Phase 1b architectural call.
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
  let bandSlug: AuditBandSlug;

  try {
    const json = BodySchema.parse(await req.json());
    email = json.email.toLowerCase();
    shopUrl = json.shopUrl.trim();
    bandSlug = json.bandSlug;
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Check your email, shop URL, and band selection.' },
      { status: 400 },
    );
  }

  const band = bandBySlug(bandSlug);
  if (!band) {
    return NextResponse.json(
      { ok: false, code: 'bad-band', message: 'Pick a band to continue.' },
      { status: 400 },
    );
  }

  // Band 3 is bespoke-quote; it never hits Stripe. The client routes to
  // a mailto enquiry instead, but defend the API in case a stale form
  // submits the slug.
  if (band.isBespoke || band.pricePence === null) {
    return NextResponse.json(
      {
        ok: false,
        code: 'bespoke-band',
        message: 'Band 3 is a bespoke quote. Email hello@flintmere.com to start.',
      },
      { status: 400 },
    );
  }

  const intent = await stripe.paymentIntents.create({
    amount: band.pricePence,
    currency: 'gbp',
    receipt_email: email,
    description: `Flintmere concierge audit (${band.label}) — written deliverable in three working days`,
    statement_descriptor_suffix: `AUDIT-B${bandSlug === 'band-1' ? '1' : '2'}`,
    automatic_payment_methods: { enabled: true },
    metadata: {
      kind: 'concierge-audit',
      email,
      shop_url: shopUrl.slice(0, 250),
      [STRIPE_BAND_METADATA_KEY]: bandSlug,
      band_label: band.label,
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
    amountPence: band.pricePence,
    bandSlug,
  });
}
