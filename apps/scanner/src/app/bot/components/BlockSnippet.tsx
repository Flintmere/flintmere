/**
 * /bot Chapter 6 — How to block us (robots.txt poster).
 *
 * The opt-out snippet rendered as a centred mono panel — the page's
 * typographic image. A24 reference: moment-of-arrival composition.
 * Mechanic #7 cascade.
 *
 * Email opt-out and 24-hour respect-window stated below in mute caption.
 */

const SNIPPET = `User-agent: FlintmereBot\nDisallow: /`;

export function BlockSnippet() {
  return (
    <section
      aria-labelledby="block-heading"
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
          <span aria-hidden="true">// </span>the off-switch
        </p>

        <h2
          id="block-heading"
          data-reveal
          className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(40px, 5.5vw, 88px)',
            maxWidth: '18ch',
            ['--reveal-delay' as string]: '180ms',
          }}
        >
          Two lines. Twenty-four hours.
        </h2>

        <div
          data-reveal
          aria-hidden="true"
          className="mt-10 lg:mt-14"
          style={{
            height: '2px',
            width: 'clamp(160px, 14vw, 280px)',
            background: 'var(--color-accent-sage)',
            opacity: 0.85,
            ['--reveal-delay' as string]: '420ms',
          }}
        />

        <pre
          data-reveal
          className="font-mono"
          aria-label="Add User-agent FlintmereBot, Disallow slash, to your robots.txt to block FlintmereBot."
          style={{
            margin: 'clamp(56px, 7vw, 112px) auto 0',
            maxWidth: 720,
            padding: 'clamp(28px, 3.5vw, 56px) clamp(32px, 4vw, 64px)',
            fontSize: 'clamp(18px, 1.6vw, 28px)',
            lineHeight: 1.5,
            letterSpacing: 0,
            fontWeight: 500,
            color: 'var(--color-ink)',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--color-line)',
            whiteSpace: 'pre-wrap',
            ['--reveal-delay' as string]: '600ms',
          }}
        >
          {SNIPPET}
        </pre>

        <p
          data-reveal
          className="font-sans mt-12 lg:mt-16 mx-auto text-[color:var(--color-mute)]"
          style={{
            fontSize: 'clamp(15px, 1.05vw, 17px)',
            lineHeight: 1.55,
            maxWidth: '60ch',
            ['--reveal-delay' as string]: '900ms',
          }}
        >
          We respect robots.txt. New directives are picked up within 24 hours.
          To remove existing data from the benchmark entirely, email{' '}
          <a
            href="mailto:hello@flintmere.com?subject=FlintmereBot%20opt-out"
            className="underline hover:text-[color:var(--color-ink)] transition-colors"
          >
            hello@flintmere.com
          </a>{' '}
          — we reply within two working days.
        </p>
      </div>
    </section>
  );
}
