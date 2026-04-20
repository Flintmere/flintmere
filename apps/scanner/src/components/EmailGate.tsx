'use client';

import { useState } from 'react';
import { Bracket } from './Bracket';

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
 * Inverted-palette section that appears after scan results.
 * Captures email + sends the full report via Resend.
 * Canon: dark ink surface, paper text, amber CTA, one bracket moment on 'report'. ADR 0007.
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
            Check your inbox. Your full <Bracket>report</Bracket> for{' '}
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
              : 'We captured your email. Report generation is queued; you will receive it shortly.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="email-gate-heading"
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
          Full report · free · 10 minutes
        </p>
        <h2
          id="email-gate-heading"
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--color-paper)',
            margin: 0,
          }}
        >
          Get the full <Bracket>report</Bracket>. Free, delivered to your inbox.
        </h2>

        <ul
          style={{
            listStyle: 'none',
            margin: '24px 0 0 0',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px 24px',
            color: 'var(--color-mute-inv)',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <li>Pillar-by-pillar breakdown with fix priorities</li>
          <li>Per-product CSV — every issue + affected SKU</li>
          <li>Vertical benchmark against 500+ stores</li>
          <li>Install-free path to your GTIN-less ceiling</li>
        </ul>

        <form
          onSubmit={submit}
          style={{
            marginTop: 28,
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
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
              padding: '14px 24px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {state.phase === 'submitting' ? 'Sending…' : 'Send me the report'}
          </button>
        </form>

        {state.phase === 'error' ? (
          <p
            id="email-gate-error"
            role="alert"
            style={{ marginTop: 12, fontSize: 13, color: 'var(--color-alert)' }}
          >
            {state.message}
          </p>
        ) : null}

        <p
          style={{
            marginTop: 16,
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
