'use client';

/**
 * Apple-style checkout for the Flintmere concierge audit.
 *
 * Three-step shape on one card:
 *
 *   1. Band — pick Band 1 (£197), Band 2 (£397), or Band 3 (bespoke).
 *      Default Band 2 (BUSINESS.md target cohort).
 *   2. Collect — email + shop URL.
 *   3. Pay — order summary at top, Express Checkout (Apple Pay /
 *      Google Pay / Link) row, "or pay another way" divider, then
 *      PaymentElement in accordion (single-column radio) layout. Card
 *      first via `paymentMethodOrder`.
 *
 * Band 3 swaps the form for a mailto enquiry — bespoke quotes go via
 * email, never Stripe.
 *
 * On Stripe success: redirect to /audit/success?payment_intent=…
 * The webhook at /api/webhooks/stripe is the source of truth for
 * fulfilment and reads the `audit_band` metadata key set by the
 * checkout API.
 */

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  loadStripe,
  type Appearance,
  type StripeElementsOptions,
} from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { track } from '@/lib/plausible';
import {
  AUDIT_BANDS,
  AUDIT_BESPOKE_ENQUIRY_EMAIL,
  bandBySlug,
  type AuditBand,
  type AuditBandSlug,
} from '@/lib/audit-pricing';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CardState =
  | { kind: 'collect' }
  | { kind: 'loading' }
  | {
      kind: 'pay';
      clientSecret: string;
      band: AuditBand;
      email: string;
      shopUrl: string;
    }
  | { kind: 'error'; message: string };

const DEFAULT_BAND: AuditBandSlug = 'band-2';

function telemetry(event: string, data: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ event, ts: Date.now(), ...data }));
}

const APPEARANCE: Appearance = {
  theme: 'flat',
  variables: {
    fontFamily:
      'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSizeBase: '15px',
    colorPrimary: '#0a0a0b',
    colorBackground: '#ffffff',
    colorText: '#0a0a0b',
    colorTextSecondary: '#5a5c64',
    colorTextPlaceholder: '#8b8d95',
    colorDanger: '#e54a2a',
    spacingUnit: '4px',
    borderRadius: '0px',
  },
  rules: {
    '.Input': {
      border: '1px solid #d5d2c8',
      backgroundColor: '#ffffff',
      padding: '14px 16px',
      boxShadow: 'none',
    },
    '.Input:focus': {
      outline: '2px solid #0a0a0b',
      outlineOffset: '0px',
      border: '1px solid #0a0a0b',
      boxShadow: 'none',
    },
    '.Label': {
      fontFamily:
        'var(--font-mono), ui-monospace, "SF Mono", Menlo, monospace',
      fontSize: '11px',
      fontWeight: '500',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#5a5c64',
      marginBottom: '8px',
    },
    '.AccordionItem': {
      border: '1px solid #d5d2c8',
      backgroundColor: '#ffffff',
      padding: '16px',
      boxShadow: 'none',
    },
    '.AccordionItem--selected': {
      border: '1px solid #0a0a0b',
      backgroundColor: '#fbfaf6',
    },
    '.AccordionItem:hover': {
      backgroundColor: '#fbfaf6',
    },
  },
};

export function CheckoutCard() {
  const [bandSlug, setBandSlug] = useState<AuditBandSlug>(DEFAULT_BAND);
  const [email, setEmail] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [state, setState] = useState<CardState>({ kind: 'collect' });

  const selectedBand = useMemo(() => bandBySlug(bandSlug), [bandSlug]);

  async function handleStart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBand || selectedBand.isBespoke) return;

    setState({ kind: 'loading' });
    telemetry('concierge-checkout-start', { band: bandSlug });
    track('concierge_clicked', { shop: shopUrl.trim(), band: bandSlug });

    try {
      const res = await fetch('/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          shopUrl: shopUrl.trim(),
          bandSlug,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.clientSecret) {
        telemetry('concierge-checkout-intent-failed', {
          status: res.status,
          code: body?.code,
          band: bandSlug,
        });
        setState({
          kind: 'error',
          message:
            body?.message ??
            'Could not start checkout. Try again, or email hello@flintmere.com.',
        });
        return;
      }
      telemetry('concierge-checkout-intent-ready', { band: bandSlug });
      setState({
        kind: 'pay',
        clientSecret: body.clientSecret,
        band: selectedBand,
        email: email.trim(),
        shopUrl: shopUrl.trim(),
      });
    } catch {
      telemetry('concierge-checkout-intent-network-error', { band: bandSlug });
      setState({
        kind: 'error',
        message: 'Network error. Check your connection and try again.',
      });
    }
  }

  if (!stripePromise) {
    return (
      <CardShell>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ fontSize: 14, lineHeight: 1.55, padding: 32 }}
        >
          Payment is temporarily unavailable. Email{' '}
          <a href="mailto:hello@flintmere.com" className="underline">
            hello@flintmere.com
          </a>{' '}
          and we&rsquo;ll invoice you directly.
        </p>
      </CardShell>
    );
  }

  if (state.kind === 'pay') {
    const returnUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/audit/success`
        : 'https://audit.flintmere.com/audit/success';
    const options: StripeElementsOptions = {
      clientSecret: state.clientSecret,
      appearance: APPEARANCE,
    };
    return (
      <CardShell>
        <OrderSummary
          band={state.band}
          email={state.email}
          shopUrl={state.shopUrl}
          onEdit={() => setState({ kind: 'collect' })}
        />
        <Elements stripe={stripePromise} options={options}>
          <PayStep returnUrl={returnUrl} band={state.band} />
        </Elements>
      </CardShell>
    );
  }

  // Bespoke band — swap the form for an enquiry block.
  if (selectedBand?.isBespoke) {
    const subject = encodeURIComponent(
      'Concierge audit — Band 3 enquiry (5,001+ SKUs)',
    );
    const mailto = `mailto:${AUDIT_BESPOKE_ENQUIRY_EMAIL}?subject=${subject}`;
    return (
      <CardShell>
        <BandSelector value={bandSlug} onChange={setBandSlug} />
        <hr style={hairline} />
        <div style={{ padding: '28px 32px 32px 32px' }}>
          <p className="eyebrow mb-3">Bespoke quote</p>
          <p
            className="text-[color:var(--color-ink)]"
            style={{ fontSize: 16, lineHeight: 1.55, marginBottom: 12 }}
          >
            For catalogs above 5,000 SKUs, the audit reads a representative
            sample plus the structural data model. We scope and quote per
            store — typically £597+, contracted before any work starts.
          </p>
          <p
            className="text-[color:var(--color-mute)]"
            style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 24 }}
          >
            Send the shop URL and a sentence on what you&rsquo;re selling. We
            reply within two working days with a fixed-fee quote.
          </p>
          <a
            href={mailto}
            className="btn btn-accent w-full justify-center"
            onClick={() =>
              track('concierge_clicked', {
                shop: shopUrl.trim(),
                band: bandSlug,
                kind: 'bespoke-enquiry',
              })
            }
          >
            Email {AUDIT_BESPOKE_ENQUIRY_EMAIL} →
          </a>
        </div>
      </CardShell>
    );
  }

  const ctaLabel =
    state.kind === 'loading'
      ? 'One moment…'
      : `Continue to pay ${selectedBand?.priceDisplay ?? '—'}`;

  return (
    <CardShell>
      <BandSelector value={bandSlug} onChange={setBandSlug} />

      <hr style={hairline} />

      <form onSubmit={handleStart} style={{ padding: '28px 32px 32px 32px' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div>
            <label htmlFor="audit-email" className="eyebrow block mb-2">
              Your email
            </label>
            <input
              id="audit-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              style={inputStyle}
              placeholder="you@store.com"
            />
          </div>
          <div>
            <label htmlFor="audit-shop" className="eyebrow block mb-2">
              Shop URL
            </label>
            <input
              id="audit-shop"
              name="shopUrl"
              type="text"
              required
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              className="w-full"
              style={inputStyle}
              placeholder="your-store.myshopify.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={state.kind === 'loading'}
          className="btn btn-accent w-full justify-center"
          style={{ marginTop: 24 }}
        >
          {ctaLabel}
        </button>
        {state.kind === 'error' ? (
          <p
            role="alert"
            className="mt-4"
            style={{
              fontSize: 13,
              color: 'var(--color-alert)',
              lineHeight: 1.5,
            }}
          >
            {state.message}
          </p>
        ) : null}
      </form>

      <div
        style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--color-line-soft)',
          fontSize: 12,
          color: 'var(--color-mute)',
          lineHeight: 1.55,
        }}
      >
        30-day refund if we miss the three-working-day deadline. Card details
        stay with Stripe — never on our servers.
      </div>
    </CardShell>
  );
}

const hairline: React.CSSProperties = {
  border: 0,
  borderTop: '1px solid var(--color-line-soft)',
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-line)',
  padding: '14px 16px',
  fontFamily: 'var(--font-mono)',
  fontSize: 15,
  width: '100%',
};

function BandSelector({
  value,
  onChange,
}: {
  value: AuditBandSlug;
  onChange: (slug: AuditBandSlug) => void;
}) {
  return (
    <fieldset style={{ border: 0, padding: '32px 32px 0 32px', margin: 0 }}>
      <legend className="eyebrow mb-4" style={{ padding: 0 }}>
        Pick your band
      </legend>
      <div style={{ display: 'grid', gap: 10 }}>
        {AUDIT_BANDS.map((band) => {
          const selected = value === band.slug;
          return (
            <label
              key={band.slug}
              htmlFor={`band-${band.slug}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 16,
                padding: '16px 18px',
                border: selected
                  ? '1px solid var(--color-ink)'
                  : '1px solid var(--color-line)',
                background: selected ? '#fbfaf6' : '#ffffff',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-mute)',
                    marginBottom: 6,
                  }}
                >
                  {band.label} · {band.skuRangeLabel}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 17,
                    color: 'var(--color-ink)',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {band.priceDisplay}
                </span>
              </span>
              <input
                id={`band-${band.slug}`}
                type="radio"
                name="audit-band"
                value={band.slug}
                checked={selected}
                onChange={() => onChange(band.slug)}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: '#0a0a0b',
                  cursor: 'pointer',
                }}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--color-ink)',
        maxWidth: 640,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

function OrderSummary({
  band,
  email,
  shopUrl,
  onEdit,
}: {
  band: AuditBand;
  email: string;
  shopUrl: string;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        padding: '28px 32px',
        borderBottom: '1px solid var(--color-line)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            {band.label} · Concierge audit
          </p>
          <p
            style={{
              fontSize: 28,
              letterSpacing: '-0.02em',
              fontWeight: 500,
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            {band.priceDisplay}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="eyebrow"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: 'var(--color-mute)',
            padding: 4,
            flexShrink: 0,
          }}
        >
          Edit
        </button>
      </div>
      <dl
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          rowGap: 6,
          columnGap: 16,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <dt
          className="eyebrow"
          style={{ color: 'var(--color-mute)', marginBottom: 0 }}
        >
          Email
        </dt>
        <dd
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={email}
        >
          {email}
        </dd>
        <dt
          className="eyebrow"
          style={{ color: 'var(--color-mute)', marginBottom: 0 }}
        >
          Shop
        </dt>
        <dd
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={shopUrl}
        >
          {shopUrl}
        </dd>
      </dl>
    </div>
  );
}

function PayStep({ returnUrl, band }: { returnUrl: string; band: AuditBand }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasExpressOption, setHasExpressOption] = useState(false);

  async function confirm() {
    if (!stripe || !elements) return;
    setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (error) {
      telemetry('concierge-checkout-error', {
        type: error.type,
        code: error.code,
        declineCode: error.decline_code,
        band: band.slug,
      });
      setErr(
        error.message ??
          'Payment could not be confirmed. Try another method or contact your bank.',
      );
      setBusy(false);
    }
    // On success Stripe redirects to returnUrl; nothing more to do here.
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    telemetry('concierge-checkout-confirm', { band: band.slug });
    await confirm();
  }

  return (
    <form onSubmit={onSubmit} style={{ padding: '28px 32px 32px 32px' }}>
      <ExpressCheckoutElement
        options={{
          paymentMethods: {
            applePay: 'auto',
            googlePay: 'auto',
            link: 'auto',
            amazonPay: 'never',
            paypal: 'never',
          },
          buttonHeight: 48,
        }}
        onReady={(e) => {
          const types = e.availablePaymentMethods;
          setHasExpressOption(
            !!(
              types?.applePay ||
              types?.googlePay ||
              types?.link
            ),
          );
        }}
        onConfirm={async () => {
          telemetry('concierge-checkout-express-confirm', {
            band: band.slug,
          });
          setBusy(true);
          await confirm();
        }}
      />

      {hasExpressOption ? (
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '20px 0',
            color: 'var(--color-mute-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              flex: 1,
              height: 1,
              background: 'var(--color-line)',
            }}
          />
          or pay another way
          <span
            style={{
              flex: 1,
              height: 1,
              background: 'var(--color-line)',
            }}
          />
        </div>
      ) : (
        <div style={{ height: 12 }} />
      )}

      <PaymentElement
        options={{
          layout: {
            type: 'accordion',
            defaultCollapsed: false,
            radios: true,
            spacedAccordionItems: false,
          },
          paymentMethodOrder: [
            'card',
            'apple_pay',
            'google_pay',
            'link',
            'bacs_debit',
            'pay_by_bank',
          ],
        }}
      />

      {err ? (
        <p
          role="alert"
          className="mt-4"
          style={{
            fontSize: 13,
            color: 'var(--color-alert)',
            lineHeight: 1.5,
          }}
        >
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || busy}
        className="btn btn-accent w-full justify-center"
        style={{ marginTop: 24, fontSize: 14 }}
      >
        {busy ? 'Processing…' : `Pay ${band.priceDisplay}`}
      </button>

      <p
        style={{
          marginTop: 18,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-mute-2)',
          textAlign: 'center',
        }}
      >
        Secured by Stripe · 30-day refund if we miss the three-day deadline
      </p>
    </form>
  );
}
