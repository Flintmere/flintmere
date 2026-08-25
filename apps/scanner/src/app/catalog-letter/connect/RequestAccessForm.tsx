'use client';

import { useEffect, useRef, useState } from 'react';

// Per ADR 0023 §slice 2b — the load-bearing wait-list form.
// Captures interest while FEATURE_GMC_OAUTH=false. Posts to
// /api/audit/gmc-access-request which writes a row in
// scanner_gmc_access_requests; we email the merchant the day
// Google T&S verification clears.

interface Props {
  auditId: string;
  defaultEmail: string;
  shopUrl: string;
}

type State =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'success' }
  | { phase: 'error'; message: string };

export function RequestAccessForm({ auditId, defaultEmail, shopUrl }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [reason, setReason] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<State>({ phase: 'idle' });
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.phase === 'submitting') return;
    if (website.trim().length > 0) {
      setState({ phase: 'success' });
      return;
    }
    if (Date.now() - mountedAt.current < 1500) {
      setState({ phase: 'success' });
      return;
    }
    setState({ phase: 'submitting' });
    try {
      const res = await fetch('/api/audit/gmc-access-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          auditId,
          email: email.trim(),
          shopUrl,
          reason: reason.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message:
            body?.message ?? 'Could not save. Please reply to your audit email.',
        });
        return;
      }
      setState({ phase: 'success' });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    }
  };

  if (state.phase === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: '32px',
          border: '1px solid var(--color-line)',
          borderLeft: '3px solid var(--color-accent)',
          background: 'var(--color-paper)',
        }}
      >
        <p
          className="eyebrow"
          style={{ color: 'var(--color-mute)', margin: 0 }}
        >
          On the list
        </p>
        <p
          style={{
            margin: '12px 0 0 0',
            fontSize: 20,
            lineHeight: 1.4,
            color: 'var(--color-ink)',
            letterSpacing: '-0.01em',
          }}
        >
          We&rsquo;ll email <strong>{email}</strong> the day Google
          verification clears.
        </p>
        <p
          style={{
            margin: '12px 0 0 0',
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--color-mute)',
          }}
        >
          Typical wait is 4&ndash;6 weeks. Reply to your audit email anytime
          if anything changes &mdash; we read every reply.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      style={{
        display: 'grid',
        gap: 20,
        padding: 32,
        border: '1px solid var(--color-line)',
        background: 'var(--color-paper)',
      }}
    >
      <p
        className="eyebrow"
        style={{ color: 'var(--color-mute)', margin: 0 }}
      >
        Request access
      </p>

      <Field label="Where to write" htmlFor="gmc-req-email">
        <input
          id="gmc-req-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="Store" htmlFor="gmc-req-shop">
        <input
          id="gmc-req-shop"
          type="text"
          value={shopUrl}
          readOnly
          style={{ ...inputStyle, color: 'var(--color-mute)' }}
        />
      </Field>

      <Field
        label="Anything you want from the connection (optional)"
        htmlFor="gmc-req-reason"
      >
        <textarea
          id="gmc-req-reason"
          rows={3}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. specific products are showing as suppressed in Search Console"
          style={{
            ...inputStyle,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </Field>

      <div inert style={honeypotStyle}>
        <label>
          Website
          <input
            type="text"
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {state.phase === 'error' ? (
        <p
          role="alert"
          style={{
            color: 'var(--color-alert)',
            fontSize: 13,
            margin: 0,
          }}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state.phase === 'submitting'}
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-ink)',
          padding: '16px 24px',
          minHeight: 52,
          fontFamily:
            'var(--font-mono, ui-monospace, Menlo, monospace)',
          fontSize: 13,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 600,
          cursor: state.phase === 'submitting' ? 'wait' : 'pointer',
        }}
      >
        {state.phase === 'submitting' ? 'Saving…' : 'Add me to the list →'}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'grid', gap: 6 }}>
      <span
        className="eyebrow"
        style={{ color: 'var(--color-mute)' }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  appearance: 'none',
  background: 'var(--color-paper)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-line)',
  padding: '12px 14px',
  fontSize: 15,
  lineHeight: 1.4,
  width: '100%',
  borderRadius: 0,
};

const honeypotStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: 1,
  height: 1,
  overflow: 'hidden',
};
