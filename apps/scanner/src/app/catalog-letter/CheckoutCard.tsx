'use client';

/**
 * Apple-style checkout for the Flintmere Catalog Letter.
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
 * On Stripe success: redirect to /catalog-letter/success?payment_intent=…
 * The webhook at /api/webhooks/stripe is the source of truth for
 * fulfilment and reads the `audit_band` metadata key set by the
 * checkout API.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { TurnstileWidget } from '@/components/TurnstileWidget';
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
import { track } from '@/lib/analytics';
import { readAndConsumeHandoff } from '@/lib/audit-handoff';
import {
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

interface CheckoutCardProps {
  /** Selected band slug — controlled by the BandTriptych above. */
  bandSlug: AuditBandSlug;
  /** Lift selection back up — bespoke-fork advisory uses this hint. */
  onBandChange: (slug: AuditBandSlug) => void;
}

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

export function CheckoutCard({ bandSlug, onBandChange: _onBandChange }: CheckoutCardProps) {
  const [email, setEmail] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [state, setState] = useState<CardState>({ kind: 'collect' });
  const formRef = useRef<HTMLFormElement | null>(null);

  const selectedBand = useMemo(() => bandBySlug(bandSlug), [bandSlug]);

  // Bridge /scan → /audit. Shop URL via `?shop=` (non-PII, copy-paste
  // shareable); email via sessionStorage handoff (PII out of URLs per
  // Council #24, see lib/audit-handoff.ts). One-shot consume on mount —
  // a refresh of /audit does not silently re-pre-fill.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shopParam = new URLSearchParams(window.location.search)
      .get('shop')
      ?.trim() ?? '';
    const handoff = readAndConsumeHandoff();
    let prefilledEmail = false;
    let prefilledShop = false;
    if (handoff?.email) {
      setEmail(handoff.email);
      prefilledEmail = true;
    }
    if (shopParam) {
      setShopUrl(shopParam);
      prefilledShop = true;
    }
    if (prefilledEmail || prefilledShop) {
      track('audit_prefill_applied', {
        from_handoff: prefilledEmail,
        from_shop_url: prefilledShop,
      });
    }
  }, []);

  async function handleStart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBand || selectedBand.isBespoke) return;

    setState({ kind: 'loading' });
    telemetry('concierge-checkout-start', { band: bandSlug });
    track('concierge_clicked', { shop: shopUrl.trim(), band: bandSlug });

    const turnstileInput = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]',
    );
    const turnstileToken = turnstileInput?.value ?? '';

    // Pre-flight refuse-to-submit. If the Turnstile widget didn't render
    // (NEXT_PUBLIC_TURNSTILE_SITE_KEY missing at build, Invisible-mode
    // timing miss, network failure loading challenges.cloudflare.com),
    // the token is empty and the server will 403 with `missing-token`
    // *after* we've already taken the user through card entry. Catching
    // it client-side surfaces the failure before they invest the data.
    // Caught 2026-05-05 — operator hit a misconfigured Turnstile
    // (Invisible widget mode + no client-side render) and only saw the
    // failure after typing card details.
    if (process.env.NODE_ENV === 'production' && !turnstileToken) {
      setState({
        kind: 'error',
        message:
          'Verification is unavailable right now. Please refresh the page in a few seconds; if it persists, please use /contact.',
      });
      telemetry('concierge-checkout-turnstile-missing', { band: bandSlug });
      return;
    }

    try {
      const res = await fetch('/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          shopUrl: shopUrl.trim(),
          bandSlug,
          turnstileToken,
        }),
      });

      // Three-layer error parse. The earlier flow conflated all
      // failures into one vague "Network error" message — a 502 from
      // Coolify mid-deploy returning HTML, a 403 turnstile failure
      // returning JSON, and an actual offline-fetch all read identical
      // to the user. Caught 2026-05-05 (operator screenshot during the
      // three-commit-in-five-minutes deploy wave): res.json() threw on
      // the 502's HTML body, the catch fired, the user saw "Network
      // error" while the actual cause was "the server is restarting,
      // wait 30 seconds". Now we surface the specific cause.
      let body: {
        clientSecret?: string;
        message?: string;
        code?: string;
      } | null = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok || !body?.clientSecret) {
        telemetry('concierge-checkout-intent-failed', {
          status: res.status,
          code: body?.code,
          parseFailed: body === null,
          band: bandSlug,
        });
        const fallback =
          body === null && res.status >= 500
            ? 'The server is restarting after a deploy. Refresh the page in 30 seconds and try again.'
            : body === null
              ? 'Could not read the server response. Refresh the page and try again, or contact us via /contact?topic=billing.'
              : 'Could not start checkout. Try again, or contact us via /contact?topic=billing.';
        setState({
          kind: 'error',
          message: body?.message ?? fallback,
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
    } catch (err) {
      telemetry('concierge-checkout-intent-network-error', {
        band: bandSlug,
        error: err instanceof Error ? err.message : 'unknown',
      });
      setState({
        kind: 'error',
        message:
          'We could not reach the server. Check your connection and try again, or contact us via /contact?topic=billing.',
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
          Payment is temporarily unavailable. Send us a message via our{' '}
          <a href="/contact?topic=billing" className="underline">
            contact form
          </a>{' '}
          and we&rsquo;ll invoice you directly.
        </p>
      </CardShell>
    );
  }

  if (state.kind === 'pay') {
    const returnUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/catalog-letter/success`
        : 'https://audit.flintmere.com/catalog-letter/success';
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
    return (
      <CardShell>
        <div style={{ padding: '28px 32px 32px 32px' }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 13,
              letterSpacing: '0.14em',
              color: 'var(--color-mute)',
              marginBottom: 16,
            }}
          >
            Catalog smaller than 5,000 SKUs? — pick Band 1 or Band 2 above.
          </p>
          <p className="eyebrow mb-3">Bespoke quote</p>
          <p
            className="text-[color:var(--color-ink)]"
            style={{ fontSize: 16, lineHeight: 1.55, marginBottom: 12 }}
          >
            For catalogs above 5,000 SKUs, the catalog letter reads a
            representative sample plus the structural data model. We scope and quote per
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
            href="/contact?topic=concierge"
            className="btn btn-accent w-full justify-center"
            onClick={() =>
              track('concierge_clicked', {
                shop: shopUrl.trim(),
                band: bandSlug,
                kind: 'bespoke-enquiry',
              })
            }
          >
            Open the bespoke-quote contact form →
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
      <form ref={formRef} onSubmit={handleStart} style={{ padding: '28px 32px 32px 32px' }}>
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

        <div style={{ marginTop: 20 }}>
          <TurnstileWidget />
        </div>

        <button
          type="submit"
          disabled={state.kind === 'loading'}
          className="btn btn-accent w-full justify-center"
          style={{ marginTop: 20 }}
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
        stay with Stripe — never on our servers. Charge appears on your bank
        statement as <strong>FLINTMERE AUDIT</strong>.
      </div>
    </CardShell>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--color-paper)',
  border: '1px solid var(--color-line)',
  padding: '14px 16px',
  fontFamily: 'var(--font-mono)',
  fontSize: 15,
  width: '100%',
};

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--color-paper)',
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
            {band.label} · The Catalog Letter
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
            color: 'var(--color-mute)',
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
          color: 'var(--color-mute)',
          textAlign: 'center',
        }}
      >
        Secured by Stripe · 30-day refund if we miss the three-day deadline
      </p>
    </form>
  );
}
