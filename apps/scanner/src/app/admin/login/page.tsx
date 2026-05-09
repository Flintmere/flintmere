import type { Metadata } from 'next'

// Server-rendered, no-JS-required two-step OTP form.
//
// Step 1 (?step missing or =email): email field, POSTs to
//   /api/admin/email-code/request → server emails a 6-digit code, sets a
//   short-lived `flintmere_admin_pending_email` cookie, 303s back to
//   /admin/login?step=code.
// Step 2 (?step=code): code field, POSTs to /api/admin/email-code/verify
//   → server reads the pending-email cookie, verifies + consumes the
//   code, sets the HMAC session cookie, 303s to /admin/audit-draft.
//
// Replaced magic-link 2026-05-09 (operator pref: stay on the page, type
// a code, no link-click thrash). Replaced password 2026-05-09 (same
// session, operator preferred OTP over password handoff).

export const metadata: Metadata = {
  title: 'Sign in — Flintmere',
  robots: 'noindex, nofollow',
}

const ERROR_COPY: Record<string, string> = {
  invalid:
    'That code is not valid. Check the email or request a new one.',
  unauth: 'Your session expired. Sign in again.',
  'session-expired':
    'That sign-in attempt expired. Start again with your email.',
  'rate-limited':
    'Too many attempts. Wait a few minutes and try again.',
  'bad-request': 'Something went wrong with that request. Try again.',
  server:
    'Sign-in is temporarily unavailable. The operator has been alerted.',
}

const TTL_MINUTES = 10

interface PageProps {
  searchParams: Promise<{ error?: string; step?: string }>
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const errorKey = typeof params.error === 'string' ? params.error : null
  const errorMessage = errorKey ? ERROR_COPY[errorKey] ?? null : null
  const isCodeStep = params.step === 'code'

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

        {isCodeStep ? (
          <>
            <p
              role="status"
              aria-live="polite"
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              If that address is on the allowlist, a one-shot code is on
              its way. Type it below within {TTL_MINUTES} minutes.
            </p>
            <form
              method="POST"
              action="/api/admin/email-code/verify"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', opacity: 0.85 }}>
                  Code
                </span>
                <input
                  type="text"
                  name="code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  placeholder="000000"
                  style={{
                    fontFamily: "'Geist Mono', ui-monospace, monospace",
                    fontSize: '1.5rem',
                    letterSpacing: '0.3em',
                    textAlign: 'center',
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
                Verify code →
              </button>
            </form>

            <p
              style={{
                fontSize: '0.8125rem',
                opacity: 0.7,
                margin: 0,
                lineHeight: 1.5,
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
          </>
        ) : (
          <form
            method="POST"
            action="/api/admin/email-code/request"
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
              Email me a code →
            </button>

            <p
              style={{
                fontSize: '0.75rem',
                opacity: 0.6,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              We&rsquo;ll email a one-shot code that expires in{' '}
              {TTL_MINUTES} minutes.
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
