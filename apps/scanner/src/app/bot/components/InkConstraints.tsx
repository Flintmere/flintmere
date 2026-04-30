/**
 * /bot Chapter 4 — Ink-slab inverse: what we don't touch.
 *
 * Ink-slab is the documented ADR 0021 surface variant — used here as the
 * page's negative space. Four declarative one-liners stacked on rule lines,
 * `[ 01 ]–[ 04 ]` ledger numerals, sage hairline above the first row.
 *
 * Mechanic #7 cascade fade-in (per-row). The tonal flip from paper to ink
 * mid-page is the chapter's whole point — the scanner DOESN'T do these
 * things, and the inversion makes the negative space tangible.
 */

const ROWS = [
  'We never sign in.',
  'We never submit forms.',
  'We never read data behind authentication.',
  'We never crawl customer or order pages.',
];

export function InkConstraints() {
  return (
    <section
      aria-labelledby="constraints-heading"
      className="relative bg-[color:var(--color-ink)]"
    >
      <div
        className="mx-auto w-full max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 5vw, 64px)',
          paddingRight: 'clamp(24px, 5vw, 64px)',
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 14vh, 200px)',
        }}
      >
        <p
          data-reveal
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            letterSpacing: '0.18em',
            color: 'var(--color-mute-inv)',
            fontWeight: 500,
            marginBottom: 'clamp(32px, 4vw, 64px)',
            ['--reveal-delay' as string]: '60ms',
          }}
        >
          <span aria-hidden="true">// </span>the negative space
        </p>

        <h2
          id="constraints-heading"
          data-reveal
          className="font-sans font-medium tracking-[-0.04em] leading-[0.92]"
          style={{
            fontSize: 'clamp(40px, 5.5vw, 88px)',
            color: 'var(--color-paper-on-ink)',
            maxWidth: '18ch',
            ['--reveal-delay' as string]: '180ms',
          }}
        >
          What we never touch.
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

        <ol
          className="list-none p-0"
          style={{
            marginTop: 'clamp(48px, 6vw, 96px)',
          }}
        >
          {ROWS.map((row, idx) => (
            <li
              key={idx}
              data-reveal
              className="grid grid-cols-[auto_1fr] items-baseline border-t"
              style={{
                gap: 'clamp(24px, 4vw, 64px)',
                paddingTop: 'clamp(28px, 3.5vw, 48px)',
                paddingBottom: 'clamp(28px, 3.5vw, 48px)',
                borderColor: 'var(--color-line-dark)',
                ['--reveal-delay' as string]: `${600 + idx * 100}ms`,
              }}
            >
              <span
                className="font-mono"
                aria-hidden="true"
                style={{
                  fontSize: 'clamp(18px, 1.6vw, 24px)',
                  letterSpacing: '0.04em',
                  fontWeight: 500,
                  color: 'var(--color-mute-inv)',
                }}
              >
                [ {String(idx + 1).padStart(2, '0')} ]
              </span>
              <p
                className="font-sans font-medium tracking-[-0.015em]"
                style={{
                  fontSize: 'clamp(20px, 2vw, 32px)',
                  lineHeight: 1.25,
                  color: 'var(--color-paper-on-ink)',
                  maxWidth: '32ch',
                }}
              >
                {row}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
