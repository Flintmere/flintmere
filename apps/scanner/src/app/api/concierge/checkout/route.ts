import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';
import {
  bandBySlug,
  STRIPE_BAND_METADATA_KEY,
  type AuditBandSlug,
} from '@/lib/audit-pricing';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkCheckoutRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().email(),
  shopUrl: z.string().min(4).max(512),
  bandSlug: z.enum(['band-1', 'band-2', 'band-3']),
  turnstileToken: z.string().optional().nullable(),
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
        message:
          'Stripe is not configured yet. Use /contact?topic=billing to book directly.',
      },
      { status: 503 },
    );
  }

  let email: string;
  let shopUrl: string;
  let bandSlug: AuditBandSlug;
  let turnstileToken: string | null | undefined;

  try {
    const json = BodySchema.parse(await req.json());
    email = json.email.toLowerCase();
    shopUrl = json.shopUrl.trim();
    bandSlug = json.bandSlug;
    turnstileToken = json.turnstileToken;
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Check your email, shop URL, and band selection.' },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  // Rate limit before Turnstile + Stripe to cap scripted card-testing
  // that solves Turnstile at scale. Per-email catches "one merchant
  // identity + many cards"; per-IP catches single-source flood. Both
  // are belt-and-braces — distributed botnets rotating identity bypass
  // both, but Radar at the Stripe level catches the velocity tail.
  const rl = checkCheckoutRateLimit({ email, ip });
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'rate-limited',
        reason: rl.reason,
        retryAfterSec: rl.retryAfterSec,
        message: 'Too many attempts. Please wait a few minutes and try again.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      },
    );
  }

  const turnstile = await verifyTurnstile(turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'turnstile-failed',
        reason: turnstile.reason,
        message: 'Verification failed. Please refresh the page and try again.',
      },
      { status: 403 },
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
        message:
          'Band 3 is a bespoke quote. Start at /contact?topic=audit.',
      },
      { status: 400 },
    );
  }

  // Per-charge statement-descriptor suffix. Stripe deprecated the full
  // `statement_descriptor` parameter for card payment methods 2026-05
  // (per support.stripe.com/questions/use-of-the-statement-descriptor-parameter-on-paymentintents-for-card-charges).
  // The replacement is `statement_descriptor_suffix` which Stripe
  // prepends with the account-level descriptor; combined length must
  // be ≤22 chars. Account-level default is "EAZYACCESS LTD" (parent
  // co), so the customer's bank line reads e.g. "EAZYACCESS LTD*
  // FLINT B1" — keeps the band code visible for bookkeeper
  // reconciliation. Earlier "FLINTMERE AUDIT B1" full descriptor
  // is no longer available via the API; achieving Flintmere-prefix
  // on the statement now requires either a separate Stripe account
  // for Flintmere or changing the parent's account-level descriptor
  // (which propagates to all Eazy Access Ltd businesses on that
  // account). Operator decision deferred — bookkeeper still has
  // band code + metadata.audit_band for full attribution.
  let intent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: band.pricePence,
      currency: 'gbp',
      receipt_email: email,
      description: `Flintmere Catalog Letter (${band.label}) — written deliverable in three working days`,
      statement_descriptor_suffix: `FLINT B${bandSlug === 'band-1' ? '1' : '2'}`,
      automatic_payment_methods: { enabled: true },
      // Force 3D Secure where the issuer supports it. Stripe's default
      // `automatic` decisioning fires 3DS for PSD2-mandated EEA cards
      // (UK + EU) and Radar-flagged risky transactions, but skips it on
      // most non-EEA cards. `any` requests 3DS for every supported card,
      // shifting chargeback liability to the issuer on every accepted
      // payment. Friction cost (~3–7% conversion on non-EEA cards per
      // Stripe data) is a worthwhile trade for one-shot £197+ audits
      // with no recurring relationship — no second-purchase opportunity
      // to make up a fraudulent one.
      payment_method_options: {
        card: {
          request_three_d_secure: 'any',
        },
      },
      metadata: {
        kind: 'concierge-audit',
        email,
        shop_url: shopUrl.slice(0, 250),
        [STRIPE_BAND_METADATA_KEY]: bandSlug,
        band_label: band.label,
      },
    });
  } catch (err) {
    // Stripe SDK throws on validation / auth / rate-limit / API errors.
    // Without this catch the throw becomes a 500 HTML error page from
    // Next.js, the UI maps the non-JSON body to "server is restarting"
    // copy, and the actual cause stays hidden. Caught 2026-05-05 — the
    // £197 test passed yesterday, today the same call started throwing
    // post-Turnstile-fix and we couldn't tell whether it was the
    // descriptor, the API key, an `automatic_payment_methods`
    // constraint, or something else entirely. Surface the underlying
    // `code` / `type` / `message` so the next failure self-explains.
    const stripeErr = err as { code?: string; type?: string; message?: string; statusCode?: number };
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'stripe-payment-intent-create-failed',
        code: stripeErr.code,
        type: stripeErr.type,
        statusCode: stripeErr.statusCode,
        message: stripeErr.message,
        bandSlug,
      }),
    );
    return NextResponse.json(
      {
        ok: false,
        code: 'stripe-error',
        stripeCode: stripeErr.code,
        stripeType: stripeErr.type,
        message:
          stripeErr.message ??
          'Payment provider rejected the request. Please refresh and try again.',
      },
      { status: 502 },
    );
  }

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
