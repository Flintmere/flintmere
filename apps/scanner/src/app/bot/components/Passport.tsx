/**
 * /bot Chapter 2 — Passport (the user-agent string).
 *
 * The literal UA string as editorial display — Stripe-docs reference for
 * mono-in-prose, but here promoted to display-scale so the token IS the
 * chapter. The version segment + the +URL get <strong> emphasis (Geist
 * Mono 700) — the load-bearing tokens an admin reads from their access log.
 *
 * Mechanic #7 cascade fade-in. Sage hairline beneath.
 */

const USER_AGENT = 'FlintmereBot/1.0 (+https://audit.flintmere.com/bot)';

export function Passport() {
  return (
    <section
      aria-labelledby="passport-heading"
      className="relative bg-[color:var(--color-paper)]"
    >
      <div
        className="mx-auto w-full max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 5vw, 64px)',
          paddingRight: 'clamp(24px, 5vw, 64px)',
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(72px, 10vh, 144px)',
        }}
      >
        <p
          data-reveal
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            letterSpacing: '0.18em',
            color: 'var(--color-mute)',
            fontWeight: 500,
            marginBottom: 'clamp(32px, 4vw, 64px)',
            ['--reveal-delay' as string]: '60ms',
          }}
        >
          <span aria-hidden="true">// </span>the passport
        </p>

        <h2 id="passport-heading" className="sr-only">
          User-agent string
        </h2>

        <p
          data-reveal
          aria-label={USER_AGENT}
          className="font-mono text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(20px, 2.4vw, 36px)',
            letterSpacing: '-0.01em',
            lineHeight: 1.35,
            fontWeight: 500,
            wordBreak: 'break-word',
            ['--reveal-delay' as string]: '180ms',
          }}
        >
          <span aria-hidden="true">FlintmereBot</span>
          <strong
            aria-hidden="true"
            style={{ fontWeight: 700, color: 'var(--color-ink)' }}
          >
            /1.0
          </strong>
          <span aria-hidden="true"> (+</span>
          <strong
            aria-hidden="true"
            style={{ fontWeight: 700, color: 'var(--color-ink)' }}
          >
            https://audit.flintmere.com/bot
          </strong>
          <span aria-hidden="true">)</span>
        </p>

        <div
          data-reveal
          aria-hidden="true"
          className="mt-10 lg:mt-14"
          style={{
            height: '2px',
            width: 'clamp(160px, 14vw, 280px)',
            background: 'var(--color-accent-sage)',
            opacity: 0.85,
            ['--reveal-delay' as string]: '480ms',
          }}
        />

        <p
          data-reveal
          className="font-sans mt-12 lg:mt-16"
          style={{
            fontSize: 'clamp(15px, 1.05vw, 17px)',
            lineHeight: 1.55,
            color: 'var(--color-mute)',
            maxWidth: '60ch',
            ['--reveal-delay' as string]: '600ms',
          }}
        >
          RFC 7231–compliant. The <span className="font-mono">+URL</span>{' '}
          resolves to this page so any admin reading their access log can
          verify who we are.
        </p>
      </div>
    </section>
  );
}
