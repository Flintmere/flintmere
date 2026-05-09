import type { Metadata } from 'next'

// Server-rendered, no-JS-required magic-link request form. Posts an email
// to /api/admin/magic-link/request which (a) rate-limits per-IP, (b) drops
// silent for non-allowlisted addresses, (c) sends a one-shot link to the
// allowlisted operator, then (d) 303-redirects back here with ?check=email
// regardless of allowlist match. The post-submit aria-live confirmation
// reveals nothing about whether the address is allowlisted.
//
// Council pre-flight references (per memory binding):
//   1. audit.flintmere.com/scan — mono uppercase section labels +
//      bracketed signature, prose body, type-only register.
//   2. linear.app — single display moment per section, calm utility UI.
//   3. stripe.com docs — inline mono chip pattern (used here for the
//      bracketed [ Sign in ] page anchor).
//
// Trust-load-bearing surface (memory: trust_load_bearing_surfaces_type_only).
// Bracket signature carries brand work; no photoreal imagery.

export const metadata: Metadata = {
  title: 'Sign in — Flintmere',
  // No indexing — admin surface.
  robots: 'noindex, nofollow',
}

const ERROR_COPY: Record<string, string> = {
  'invalid-link':
    'That sign-in link is no longer valid. Request a new one.',
  'rate-limited':
    'Too many attempts. Wait a few minutes and try again.',
  'bad-request': 'Something went wrong with that request. Try again.',
  server:
    'Sign-in is temporarily unavailable. The operator has been alerted.',
}

const TTL_MINUTES = 10

interface PageProps {
  searchParams: Promise<{ error?: string; check?: string }>
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const errorKey = typeof params.error === 'string' ? params.error : null
  const errorMessage = errorKey ? ERROR_COPY[errorKey] ?? null : null
  const showCheckEmail =
    typeof params.check === 'string' && params.check === 'email'

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--paper, #faf7f2)',
        color: 'var(--ink, #161410)',
        fontFamily: "'Geist Sans', system-ui, sans-serif",
      }}
    >
      <section
        aria-labelledby="admin-login-heading"
        style={{
          width: '100%',
          maxWidth: '24rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p
            style={{
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.7,
              margin: 0,
            }}
          >
            Flintmere — operator
          </p>
          <h1
            id="admin-login-heading"
            style={{
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              fontSize: '1.5rem',
              fontWeight: 500,
              margin: 0,
            }}
          >
            [ Sign in ]
          </h1>
        </header>

        {showCheckEmail ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0 }}>
              If that address is on the allowlist, a sign-in link is on its
              way. It expires in {TTL_MINUTES} minutes.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                opacity: 0.7,
              }}
            >
              Didn&rsquo;t receive it? Check spam, then{' '}
              <a
                href="/admin/login"
                style={{
                  color: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                request another
              </a>
              .
            </p>
          </div>
        ) : (
          <form
            method="POST"
            action="/api/admin/magic-link/request"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', opacity: 0.85 }}>Email</span>
              <input
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                required
                autoFocus
                style={{
                  fontFamily: "'Geist Mono', ui-monospace, monospace",
                  fontSize: '1rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid currentColor',
                  borderRadius: 0,
                  background: 'transparent',
                  color: 'inherit',
                }}
              />
            </label>

            {errorMessage && (
              <p
                role="alert"
                style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  color: 'var(--severity-high, #b14a3a)',
                }}
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              style={{
                fontFamily: "'Geist Mono', ui-monospace, monospace",
                fontSize: '0.875rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '0.875rem 1rem',
                border: '1px solid currentColor',
                background: 'currentColor',
                color: 'var(--paper, #faf7f2)',
                cursor: 'pointer',
              }}
            >
              Send link →
            </button>

            <p
              style={{
                fontSize: '0.75rem',
                opacity: 0.6,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              We&rsquo;ll email a one-shot link that expires in {TTL_MINUTES}{' '}
              minutes.
            </p>
          </form>
        )}

        <p
          style={{
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            fontSize: '0.75rem',
            opacity: 0.6,
            margin: 0,
          }}
        >
          Operator access only.
        </p>
      </section>
    </main>
  )
}
