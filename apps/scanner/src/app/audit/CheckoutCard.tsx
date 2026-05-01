'use client';

/**
 * Apple-styled custom checkout for the Flintmere concierge audit.
 *
 * Per ADR 0022 (audit-band pricing), the card carries a band selector
 * above the email + shop URL fields. Three bands:
 *
 *   - Band 1 (£197) and Band 2 (£397) — Stripe Payment Element flow.
 *   - Band 3 (from £597) — bespoke quote; the card swaps to an
 *     enquiry block with a mailto link to john@flintmere.com.
 *
 * Default selection is Band 2 (BUSINESS.md target cohort: £500K–£20M
 * revenue UK food merchants pushing 1,501–5,000 SKUs).
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
  | { kind: 'pay'; clientSecret: string; band: AuditBand }
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
      border: '1px solid #0a0a0b',
      backgroundColor: '#f7f7f4',
      padding: '12px 14px',
      boxShadow: 'none',
    },
    '.Input:focus': {
      outline: '2px solid #0a0a0b',
      outlineOffset: '2px',
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
      color: '#8b8d95',
      marginBottom: '6px',
    },
    '.Tab': {
      border: '1px solid #0a0a0b',
      backgroundColor: '#ffffff',
      padding: '12px 14px',
      boxShadow: 'none',
    },
    '.Tab--selected': {
      backgroundColor: '#0a0a0b',
      color: '#f7f7f4',
      border: '1px solid #0a0a0b',
    },
    '.Tab:hover': {
      backgroundColor: '#edece6',
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
          style={{ fontSize: 14, lineHeight: 1.55, padding: 28 }}
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
        <CardHeader
          email={email}
          band={state.band}
          onBack={() => setState({ kind: 'collect' })}
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
        <hr
          style={{
            border: 0,
            borderTop: '1px solid var(--color-line-soft)',
            margin: 0,
          }}
        />
        <div style={{ padding: '24px 28px 28px 28px' }}>
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
            style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}
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
      : `Pay ${selectedBand?.priceDisplay ?? '—'} →`;

  return (
    <CardShell>
      <BandSelector value={bandSlug} onChange={setBandSlug} />

      <hr
        style={{
          border: 0,
          borderTop: '1px solid var(--color-line-soft)',
          margin: 0,
        }}
      />

      <form onSubmit={handleStart} style={{ padding: '24px 28px 28px 28px' }}>
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
          className="w-full border border-[color:var(--color-ink)]"
          style={{
            background: 'var(--color-paper)',
            padding: '12px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            marginBottom: 16,
          }}
          placeholder="you@store.com"
        />
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
          className="w-full border border-[color:var(--color-ink)]"
          style={{
            background: 'var(--color-paper)',
            padding: '12px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            marginBottom: 20,
          }}
          placeholder="your-store.myshopify.com"
        />
        <button
          type="submit"
          disabled={state.kind === 'loading'}
          className="btn btn-accent w-full justify-center"
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
          padding: '20px 28px',
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

function BandSelector({
  value,
  onChange,
}: {
  value: AuditBandSlug;
  onChange: (slug: AuditBandSlug) => void;
}) {
  return (
    <fieldset style={{ border: 0, padding: '28px 28px 0 28px', margin: 0 }}>
      <legend className="eyebrow mb-3" style={{ padding: 0 }}>
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
                gap: 12,
                padding: '14px 16px',
                border: selected
                  ? '1px solid var(--color-ink)'
                  : '1px solid var(--color-line-soft)',
                background: selected
                  ? 'var(--color-paper-2, #f7f7f4)'
                  : '#ffffff',
                cursor: 'pointer',
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
                    marginBottom: 4,
                  }}
                >
                  {band.label} · {band.skuRangeLabel}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 15,
                    color: 'var(--color-ink)',
                    fontWeight: 500,
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
                  width: 16,
                  height: 16,
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
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  email,
  band,
  onBack,
}: {
  email: string;
  band: AuditBand;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        padding: '20px 28px',
        borderBottom: '1px solid var(--color-line-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p className="eyebrow" style={{ marginBottom: 4 }}>
          {band.priceDisplay} · {band.label} · Concierge audit
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-ink-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={email}
        >
          {email}
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="eyebrow"
        style={{
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          color: 'var(--color-mute)',
          padding: 4,
        }}
      >
        Edit
      </button>
    </div>
  );
}

function PayStep({ returnUrl, band }: { returnUrl: string; band: AuditBand }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    telemetry('concierge-checkout-confirm', { band: band.slug });

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
      return;
    }
    // On success Stripe redirects to returnUrl; no further action here.
  }

  return (
    <form onSubmit={onSubmit} style={{ padding: '24px 28px 28px 28px' }}>
      <PaymentElement
        options={{
          layout: { type: 'tabs', defaultCollapsed: false },
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
        style={{ marginTop: 20 }}
      >
        {busy ? 'Processing…' : `Pay ${band.priceDisplay}`}
      </button>
      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-mute-2)',
          textAlign: 'center',
        }}
      >
        Secured by Stripe
      </p>
    </form>
  );
}
