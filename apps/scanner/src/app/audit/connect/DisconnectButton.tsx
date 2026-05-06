'use client';

import { useState } from 'react';

// Per ADR 0023 §slice 2b — disconnect button. Posts to
// /api/auth/google/disconnect?audit=<id> which best-effort revokes
// at Google, zeros the ciphertext, and sets revokedAt. The row
// remains for audit trail; reconnect from same merchant updates
// the row in place.

interface Props {
  auditId: string;
}

type State =
  | { phase: 'idle' }
  | { phase: 'confirming' }
  | { phase: 'submitting' }
  | { phase: 'done' }
  | { phase: 'error'; message: string };

export function DisconnectButton({ auditId }: Props) {
  const [state, setState] = useState<State>({ phase: 'idle' });

  if (state.phase === 'done') {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: 16,
          background: 'var(--color-paper-2)',
          border: '1px solid var(--color-line-soft)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--color-ink-2)',
          }}
        >
          Disconnected. Refresh this page or wait for your next scan
          &mdash; we&rsquo;ll fall back to public signals.
        </p>
      </div>
    );
  }

  if (state.phase === 'confirming' || state.phase === 'submitting') {
    return (
      <div
        style={{
          display: 'grid',
          gap: 12,
          padding: 16,
          border: '1px solid var(--color-line)',
          background: 'var(--color-paper-2)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--color-ink-2)',
          }}
        >
          Disconnect now? Your refresh token gets zeroed here and revoked at
          Google. Your next scan reads public signals only.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={state.phase === 'submitting'}
            onClick={async () => {
              setState({ phase: 'submitting' });
              try {
                const res = await fetch(
                  `/api/auth/google/disconnect?audit=${encodeURIComponent(auditId)}`,
                  { method: 'POST' },
                );
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setState({
                    phase: 'error',
                    message:
                      body?.error ?? 'Could not disconnect. Try again.',
                  });
                  return;
                }
                setState({ phase: 'done' });
              } catch (err) {
                setState({
                  phase: 'error',
                  message:
                    err instanceof Error ? err.message : 'Network error.',
                });
              }
            }}
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-alert)',
              border: '1px solid var(--color-alert)',
              padding: '12px 18px',
              minHeight: 44,
              fontFamily:
                'var(--font-mono, ui-monospace, Menlo, monospace)',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor:
                state.phase === 'submitting' ? 'wait' : 'pointer',
            }}
          >
            {state.phase === 'submitting' ? 'Disconnecting…' : 'Yes, disconnect'}
          </button>
          <button
            type="button"
            onClick={() => setState({ phase: 'idle' })}
            style={{
              background: 'transparent',
              color: 'var(--color-mute)',
              border: '1px solid var(--color-line-soft)',
              padding: '12px 18px',
              minHeight: 44,
              fontFamily:
                'var(--font-mono, ui-monospace, Menlo, monospace)',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button
        type="button"
        onClick={() => setState({ phase: 'confirming' })}
        style={{
          justifySelf: 'start',
          background: 'transparent',
          color: 'var(--color-mute)',
          border: 'none',
          padding: 0,
          fontSize: 13,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          cursor: 'pointer',
        }}
      >
        Disconnect
      </button>
      {state.phase === 'error' ? (
        <p
          role="alert"
          style={{
            margin: 0,
            color: 'var(--color-alert)',
            fontSize: 13,
          }}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
