'use client'

// Operator-readable error boundary. The audit-draft surface bubbles
// real errors from `getAuditDraft`, the LLM router, and any UI hook
// boundary up to here. We surface the message verbatim — operator
// owns this surface, no need for sanitised copy.
//
// `reset` is Next's retry callback — re-runs the page's data fetch
// without a full reload.

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'admin-audit-draft.client-error',
        message: error.message,
        digest: error.digest ?? null,
      }),
    )
  }, [error])

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--color-paper)',
        color: 'var(--color-ink)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '3rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <p className="eyebrow" style={{ color: 'var(--color-alert)' }}>
          Audit-assist · error
        </p>
        <h1
          className="bracket"
          style={{
            margin: 0,
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            lineHeight: 1.1,
          }}
        >
          Something broke
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            paddingLeft: '0.75rem',
            borderLeft: '2px solid var(--color-alert)',
            color: 'var(--color-ink-2)',
            wordBreak: 'break-word',
          }}
        >
          {error.message}
        </p>
        {error.digest && (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--color-mute)',
            }}
          >
            digest · {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '0.625rem 1.25rem',
              border: '1px solid var(--color-ink)',
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            Try again
          </button>
          <a
            href="/admin/audit-draft"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '0.625rem 1.25rem',
              border: '1px solid var(--color-ink)',
              background: 'transparent',
              color: 'var(--color-ink)',
              textDecoration: 'none',
              borderRadius: 0,
            }}
          >
            New draft
          </a>
        </div>
      </div>
    </main>
  )
}
