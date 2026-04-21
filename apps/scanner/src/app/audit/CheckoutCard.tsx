'use client';

/**
 * Apple-styled custom checkout for the £97 Flintmere concierge audit.
 * Two states on one card:
 *   1. Collect — email + shop URL, "Continue to payment" button.
 *   2. Pay    — Stripe Payment Element (Apple Pay / Google Pay / card), "Pay £97".
 *
 * On submit, Stripe redirects to /audit/success?payment_intent=… which is where
 * the thank-you UI lives. The webhook at /api/webhooks/stripe fires the
 * confirmation email and is the source of truth for fulfilment.
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

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CardState =
  | { kind: 'collect' }
  | { kind: 'loading' }
  | { kind: 'pay'; clientSecret: string }
  | { kind: 'error'; message: string };

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
  const [email, setEmail] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [state, setState] = useState<CardState>({ kind: 'collect' });

  async function handleStart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: 'loading' });
    telemetry('concierge-checkout-start');

    try {
      const res = await fetch('/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), shopUrl: shopUrl.trim() }),
      });
      const body = await res.json();
      if (!res.ok || !body?.clientSecret) {
        telemetry('concierge-checkout-intent-failed', {
          status: res.status,
          code: body?.code,
        });
        setState({
          kind: 'error',
          message:
            body?.message ??
            'Could not start checkout. Try again, or email hello@flintmere.com.',
        });
        return;
      }
      telemetry('concierge-checkout-intent-ready');
      setState({ kind: 'pay', clientSecret: body.clientSecret });
    } catch {
      telemetry('concierge-checkout-intent-network-error');
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
          style={{ fontSize: 14, lineHeight: 1.55 }}
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
          onBack={() => setState({ kind: 'collect' })}
        />
        <Elements stripe={stripePromise} options={options}>
          <PayStep returnUrl={returnUrl} />
        </Elements>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <div style={{ padding: '28px 28px 0 28px' }}>
        <p className="eyebrow mb-3">Concierge audit</p>
        <p
          style={{
            fontSize: 52,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontWeight: 500,
          }}
        >
          £97
        </p>
        <p
          className="mt-2 text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.55 }}
        >
          One-time. No VAT added. Delivered in three working days or full refund.
        </p>
      </div>

      <hr
        style={{
          border: 0,
          borderTop: '1px solid var(--color-line-soft)',
          margin: '24px 0 0 0',
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
          {state.kind === 'loading' ? 'One moment…' : 'Pay £97 →'}
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
  onBack,
}: {
  email: string;
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
          £97 · Concierge audit
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

function PayStep({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    telemetry('concierge-checkout-confirm');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      telemetry('concierge-checkout-error', {
        type: error.type,
        code: error.code,
        declineCode: error.decline_code,
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
        {busy ? 'Processing…' : 'Pay £97'}
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
