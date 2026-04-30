import { NumeralCountUp } from '@flintmere/ui';

/**
 * /bot Chapter 5 — Rate-limit numerals (Bloomberg-cover triad).
 *
 * Three big mono numerals laid horizontally — `2s`, `<20`, `1`. NumeralCountUp
 * drives them on viewport entry per ADR 0021 axis 8 (numerals-count-up motion
 * pattern). Mute-2 captions beneath each cell. Sage hairline above the triad.
 *
 * Mechanic #7 cascade + numerals-count-up.
 */

interface Cell {
  numeral: string;
  label: string;
  caption: string;
}

const CELLS: Cell[] = [
  {
    numeral: '2s',
    label: 'between requests',
    caption: '// per host',
  },
  {
    numeral: '<20',
    label: 'URLs fetched',
    caption: '// per visit',
  },
  {
    numeral: '1',
    label: 'revisit',
    caption: '// per host per month',
  },
];

export function Limits() {
  return (
    <section
      aria-labelledby="limits-heading"
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
          <span aria-hidden="true">// </span>the leash
        </p>

        <h2
          id="limits-heading"
          data-reveal
          className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(40px, 5.5vw, 88px)',
            maxWidth: '14ch',
            ['--reveal-delay' as string]: '180ms',
          }}
        >
          Polite by spec.
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
          className="list-none p-0 grid grid-cols-1 lg:grid-cols-3"
          style={{
            marginTop: 'clamp(64px, 8vw, 112px)',
            gap: 'clamp(48px, 5vw, 96px) clamp(48px, 5vw, 96px)',
          }}
        >
          {CELLS.map((cell, idx) => (
            <li
              key={cell.numeral}
              data-reveal
              className="border-t border-[color:var(--color-line)] pt-8"
              style={{
                ['--reveal-delay' as string]: `${600 + idx * 120}ms`,
              }}
            >
              <p
                aria-label={`${cell.numeral} ${cell.label}`}
                className="font-sans font-medium tracking-[-0.045em] text-[color:var(--color-ink)]"
                style={{
                  fontSize: 'clamp(72px, 9vw, 160px)',
                  lineHeight: 0.85,
                }}
              >
                <NumeralCountUp
                  value={cell.numeral}
                  className="inline-block"
                />
              </p>
              <p
                className="font-sans mt-4 text-[color:var(--color-ink-2)]"
                style={{
                  fontSize: 'clamp(16px, 1.2vw, 20px)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                {cell.label}
              </p>
              <p
                className="font-mono uppercase mt-2"
                aria-hidden="true"
                style={{
                  fontSize: 'clamp(10px, 0.9vw, 12px)',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  color: 'var(--color-mute-2)',
                }}
              >
                {cell.caption}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
