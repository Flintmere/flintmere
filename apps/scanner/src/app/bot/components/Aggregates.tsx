import Link from 'next/link';
import { Bracket } from '@flintmere/ui';

/**
 * /bot Chapter 7 — Why aggregates only (the close).
 *
 * Closing argument with default-size `[ aggregates ]` bracket anchor (Saks
 * is reserved for the cover, per outline-shimmer canon: one heroic-scale
 * anchor per surface). Word-cascade lands on the bracket as the punchline.
 *
 * Mechanic #7 cascade.
 */

const STAGGER = 110;
const BEAT = 300;

export function Aggregates() {
  const WORDS = ['We', 'publish', 'a', "vertical's", 'median, never'];
  const ENTRY = 200;
  const cascadeEnd = ENTRY + WORDS.length * STAGGER;
  const bracketDelay = cascadeEnd + BEAT;

  return (
    <section
      aria-labelledby="aggregates-heading"
      className="relative bg-[color:var(--color-paper)]"
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
            color: 'var(--color-mute)',
            fontWeight: 500,
            marginBottom: 'clamp(32px, 4vw, 64px)',
            ['--reveal-delay' as string]: '60ms',
          }}
        >
          <span aria-hidden="true">// </span>what we publish
        </p>

        <h2
          id="aggregates-heading"
          className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
          style={{ fontSize: 'clamp(40px, 5.5vw, 88px)', maxWidth: '20ch' }}
        >
          <span className="sr-only">
            We publish a vertical's median, never a store's name.
          </span>
          <span aria-hidden="true">
            {WORDS.map((w, i) => (
              <span
                key={`aw-${i}`}
                data-reveal
                style={{
                  display: 'inline-block',
                  marginRight: '0.26em',
                  ['--reveal-delay' as string]: `${ENTRY + i * STAGGER}ms`,
                }}
              >
                {w}
              </span>
            ))}
            <span
              data-reveal
              style={{
                display: 'inline-block',
                ['--reveal-delay' as string]: `${bracketDelay}ms`,
              }}
            >
              a <Bracket>store's name</Bracket>.
            </span>
          </span>
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
            ['--reveal-delay' as string]: `${bracketDelay + 600}ms`,
          }}
        />

        <p
          data-reveal
          className="font-sans mt-12 lg:mt-16 text-[color:var(--color-mute)]"
          style={{
            fontSize: 'clamp(16px, 1.15vw, 19px)',
            lineHeight: 1.55,
            maxWidth: '60ch',
            ['--reveal-delay' as string]: `${bracketDelay + 900}ms`,
          }}
        >
          Naming individual stores in a league table would be unfair and
          unhelpful. The research at{' '}
          <Link
            href="/research"
            className="underline hover:text-[color:var(--color-ink)] transition-colors"
          >
            /research
          </Link>{' '}
          is drawn from these aggregates — vertical medians, distributions,
          and the single biggest catalog mistake by category. Never a list of
          stores by grade.
        </p>
      </div>
    </section>
  );
}
