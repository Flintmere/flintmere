'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import { REPLY_SLA } from '@/lib/copy';
import { track } from '@/lib/plausible';

export interface EmailGateProps {
  scanId: string;
  shopDomain: string;
}

type GateState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'success'; reportSent: boolean }
  | { phase: 'error'; message: string };

/**
 * Post-scan commit surface. Three doors:
 *   1. Book the concierge audit (from £197) — primary, amber CTA.
 *   2. Email me the free report — secondary.
 *   3. Reply to John direct — tertiary, soft.
 * Canon: dark ink surface, paper text, amber accent, one bracket moment.
 */
export function EmailGate({ scanId, shopDomain }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<GateState>({ phase: 'idle' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setState({ phase: 'error', message: 'Enter your email.' });
      return;
    }
    setState({ phase: 'submitting' });
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          scanId,
          consentedAt: new Date().toISOString(),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message: body?.message ?? 'Could not send. Try again.',
        });
        return;
      }
      setState({ phase: 'success', reportSent: Boolean(body.reportSent) });
      track('email_captured', { scan_id: scanId, shop: shopDomain });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    }
  };

  if (state.phase === 'success') {
    return (
      <section
        aria-live="polite"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          padding: '48px 32px',
          marginTop: 48,
        }}
      >
        <div className="mx-auto max-w-[720px]">
          <p
            className="eyebrow"
            style={{ color: 'var(--color-accent)', marginBottom: 16 }}
          >
            Report sent
          </p>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: 'var(--color-paper)',
              margin: 0,
            }}
          >
            Check your inbox. The full <Bracket>report</Bracket> for{' '}
            {shopDomain} is on the way.
          </h2>
          <p
            style={{
              marginTop: 16,
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--color-mute-inv)',
              maxWidth: '52ch',
            }}
          >
            {state.reportSent
              ? 'Delivery usually takes under a minute. If it does not arrive within 10 minutes, check your spam folder.'
              : 'We captured your email. The report is queued and will arrive shortly.'}
          </p>
          <p
            style={{
              marginTop: 24,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--color-paper)',
              maxWidth: '52ch',
            }}
          >
            Want the full fix plan instead of the summary?{' '}
            <Link
              href="/audit"
              style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
            >
              Book the concierge audit (from £197) →
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="commit-heading"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper)',
        padding: '48px 32px',
        marginTop: 48,
      }}
    >
      <div className="mx-auto max-w-[720px]">
        <p
          className="eyebrow"
          style={{ color: 'var(--color-mute-inv)', marginBottom: 16 }}
        >
          What next
        </p>
        <h2
          id="commit-heading"
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--color-paper)',
            margin: 0,
          }}
        >
          Three ways to fix the <Bracket>gaps</Bracket> we found on{' '}
          {shopDomain}.
        </h2>

        {/* Door 1 — primary: concierge audit (from £197 per ADR 0022) */}
        <div
          style={{
            marginTop: 32,
            padding: '28px',
            border: '1px solid var(--color-accent)',
            background: 'rgba(248, 191, 36, 0.06)',
          }}
        >
          <p
            className="eyebrow"
            style={{
              color: 'var(--color-accent)',
              marginBottom: 8,
              margin: 0,
            }}
          >
            Recommended · from £197 one-off · three working days
          </p>
          <h3
            style={{
              fontSize: 22,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              color: 'var(--color-paper)',
              margin: '12px 0 0 0',
            }}
          >
            Have us read your store for you.
          </h3>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: 1.5,
              color: 'var(--color-mute-inv)',
              maxWidth: '52ch',
            }}
          >
            We read your store product by product, write a detailed audit
            letter pointing at exactly what to fix, and send a per-product CSV
            with the worst 10 (£197, up to 1,500 SKUs) or worst 25 (£397,
            1,501–5,000 SKUs) products already drafted. A 30-day re-scan is
            included. No video, no call — just the data. Larger catalogs
            scope bespoke from £597.
          </p>
          <Link
            href="/audit"
            style={{
              display: 'inline-block',
              marginTop: 20,
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
              padding: '14px 24px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Book the audit →
          </Link>
        </div>

        {/* Door 2 — secondary: free report */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 28,
            borderTop: '1px solid var(--color-line-inv, rgba(250,247,242,0.15))',
          }}
        >
          <p
            className="eyebrow"
            style={{ color: 'var(--color-mute-inv)', marginBottom: 8 }}
          >
            Free · 10 minutes
          </p>
          <h3
            style={{
              fontSize: 20,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              color: 'var(--color-paper)',
              margin: '8px 0 0 0',
            }}
          >
            Or email me the full report.
          </h3>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--color-mute-inv)',
              maxWidth: '52ch',
            }}
          >
            Every issue on this page, plus a CSV of every product affected, a
            short explanation of what AI agents expect, and which fix to do
            first.
          </p>

          <form
            onSubmit={submit}
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 0,
              maxWidth: 560,
              border: '1px solid var(--color-paper)',
            }}
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@store.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state.phase === 'submitting'}
              autoComplete="email"
              aria-describedby={
                state.phase === 'error' ? 'email-gate-error' : undefined
              }
              aria-invalid={state.phase === 'error' ? 'true' : undefined}
              style={{
                flex: 1,
                padding: '14px 18px',
                background: 'transparent',
                color: 'var(--color-paper)',
                border: 0,
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={state.phase === 'submitting'}
              style={{
                border: 0,
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                padding: '14px 24px',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {state.phase === 'submitting' ? 'Sending…' : 'Send the report'}
            </button>
          </form>

          {state.phase === 'error' ? (
            <p
              id="email-gate-error"
              role="alert"
              style={{
                marginTop: 12,
                fontSize: 13,
                color: 'var(--color-alert)',
              }}
            >
              {state.message}
            </p>
          ) : null}
        </div>

        {/* Door 3 — tertiary: direct reply */}
        <p
          style={{
            marginTop: 28,
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--color-mute-inv)',
            maxWidth: '52ch',
          }}
        >
          Prefer to talk first? Email{' '}
          <a
            href={`mailto:hello@flintmere.com?subject=Scan%20of%20${encodeURIComponent(shopDomain)}`}
            style={{ color: 'var(--color-paper)', textDecoration: 'underline' }}
          >
            hello@flintmere.com
          </a>{' '}
          and tell us what you need. {REPLY_SLA}
        </p>

        <p
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-mute-inv)',
          }}
        >
          No spam. Unsubscribe in one click. We do not share your data.
        </p>
      </div>
    </section>
  );
}
