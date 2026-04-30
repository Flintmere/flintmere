import { Bracket } from '@flintmere/ui';
import { STAGGER, distributionPct, type Published } from '../data';
import { CountUp } from './CountUp';

/**
 * Chapters 2–4 of the research-report cover: Lede + Median + Distribution.
 * Each cascades on entry; the distribution chapter additionally uses
 * `.research-bar-grow` (scaleX 0→1) for Bloomberg-style ink bars.
 */
export function BodyTop({ data }: { data: Published }) {
  const dist = data.overall.distribution;
  const n = data.n;

  return (
    <>
      {/* Chapter 2 — Lede */}
      <section
        aria-labelledby="lede-heading"
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
            <span aria-hidden="true">// </span>what we measured
          </p>

          <h2
            id="lede-heading"
            className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
            style={{ fontSize: 'clamp(40px, 6vw, 96px)', maxWidth: '22ch' }}
          >
            <span className="sr-only">
              The state of Shopify catalogs, measured against AI shopping agents.
            </span>
            {(() => {
              const WORDS = [
                'The',
                'state',
                'of',
                'Shopify',
                'catalogs,',
                'measured',
                'against',
                'AI',
                'shopping',
                'agents.',
              ];
              const ENTRY = 200;
              return (
                <span aria-hidden="true">
                  {WORDS.map((w, i) => (
                    <span
                      key={`lw-${i}`}
                      data-reveal
                      style={{
                        display: 'inline-block',
                        marginRight: i < WORDS.length - 1 ? '0.24em' : 0,
                        ['--reveal-delay' as string]: `${ENTRY + i * STAGGER}ms`,
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </span>
              );
            })()}
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
              ['--reveal-delay' as string]: '1500ms',
            }}
          />

          <p
            data-reveal
            className="font-sans mt-12 lg:mt-16"
            style={{
              maxWidth: '60ch',
              fontSize: 'clamp(16px, 1.15vw, 19px)',
              lineHeight: 1.55,
              color: 'var(--color-mute)',
              ['--reveal-delay' as string]: '1700ms',
            }}
          >
            FlintmereBot scans Shopify stores against the{' '}
            <Bracket>seven checks</Bracket> AI shopping agents run — drawn
            from published Shopify, GS1 UK, and Google Merchant Center
            specs. We publish the aggregate numbers (score, grade
            distribution, per-vertical gaps) and nothing else. No
            individual store is ever named.
            {data.available && !data.preview
              ? ` This is v1: ${data.n.toLocaleString()} stores in the cohort, refreshed monthly.`
              : data.available && data.preview
                ? ` Early sample — ${data.n.toLocaleString()} stores scanned so far. We don't frame these as "the median Shopify store" until the dataset clears ${data.publishFloor.toLocaleString()} per vertical.`
                : ' The first bot scans are in flight; numbers appear here as soon as the first store lands in the dataset.'}
          </p>
        </div>
      </section>

      {/* Chapter 3 — Overall median (mechanic #5 dual-column pin).
          The big median number pins LEFT at viewport-top (≥lg) while
          the prose walks past on the RIGHT. The deliberate-pin beat
          before the action chapters that follow. */}
      <section
        aria-labelledby="median-heading"
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
            <span aria-hidden="true">// </span>
            {data.available && data.preview ? 'early sample' : 'overall median'}
          </p>

          <div className="grid lg:grid-cols-[auto_1fr] gap-x-16 gap-y-8 items-start">
            <div className="research-chapter-pinned">
              <p
                data-reveal
                className="font-sans font-medium tracking-[-0.05em] leading-[0.9] text-[color:var(--color-ink)]"
                style={{
                  fontSize: 'clamp(96px, 14vw, 220px)',
                  ['--reveal-delay' as string]: '200ms',
                }}
              >
                {data.available && data.overall.median !== null ? (
                  <CountUp
                    target={data.overall.median}
                    durationMs={1400}
                    trigger="viewport"
                  />
                ) : (
                  '—'
                )}
              </p>
              <p
                data-reveal
                className="font-mono uppercase mt-4"
                style={{
                  fontSize: 'clamp(11px, 1vw, 13px)',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  color: 'var(--color-mute-2)',
                  ['--reveal-delay' as string]: '500ms',
                }}
              >
                {data.available && !data.preview && data.overall.grade ? (
                  <>
                    / 100 · grade <Bracket>{data.overall.grade}</Bracket>
                  </>
                ) : data.available ? (
                  `/ 100 · ${data.n.toLocaleString()} store${data.n === 1 ? '' : 's'} so far`
                ) : (
                  'awaiting first scan'
                )}
              </p>
            </div>

            <div className="lg:pl-8" style={{ minHeight: 'clamp(0px, 60vh, 720px)' }}>
              <h2
                id="median-heading"
                className="font-sans font-medium tracking-[-0.025em] leading-[1.1] text-[color:var(--color-ink)]"
                style={{ fontSize: 'clamp(24px, 2.4vw, 36px)', maxWidth: '28ch' }}
              >
                <span className="sr-only">
                  {data.available && !data.preview
                    ? 'Most Shopify catalogs fail half the checks an AI shopping agent runs before it recommends a store.'
                    : data.available
                      ? 'Early signal — the first Shopify catalogs are landing, and the gap between visible and structured data is already loud.'
                      : 'The headline number appears once the first bot scans complete.'}
                </span>
                {(() => {
                  const sentence =
                    data.available && !data.preview
                      ? 'Most Shopify catalogs fail half the checks an AI shopping agent runs before it recommends a store.'
                      : data.available
                        ? 'Early signal — the first Shopify catalogs are landing, and the gap between visible and structured data is already loud.'
                        : 'The headline number appears once the first bot scans complete.';
                  const WORDS = sentence.split(' ');
                  const ENTRY = 400;
                  return (
                    <span aria-hidden="true">
                      {WORDS.map((w, i) => (
                        <span
                          key={`mw-${i}`}
                          data-reveal
                          style={{
                            display: 'inline-block',
                            marginRight: i < WORDS.length - 1 ? '0.24em' : 0,
                            ['--reveal-delay' as string]: `${ENTRY + i * STAGGER}ms`,
                          }}
                        >
                          {w}
                        </span>
                      ))}
                    </span>
                  );
                })()}
              </h2>

              <p
                data-reveal
                className="font-sans mt-8"
                style={{
                  maxWidth: '60ch',
                  fontSize: 'clamp(15px, 1.05vw, 17px)',
                  lineHeight: 1.55,
                  color: 'var(--color-mute)',
                  ['--reveal-delay' as string]: '1800ms',
                }}
              >
                {data.available && !data.preview
                  ? `Across ${data.n.toLocaleString()} scanned stores, the median Shopify catalog earns a grade ${data.overall.grade} — strong on visible surfaces (titles, imagery), weak on the structured fields agents depend on (barcodes, attribute metafields, category mapping). The difference between the median store and the top decile is not sophistication; it is fields populated.`
                  : data.available
                    ? `The number to the left is the score on the ${data.n.toLocaleString()} store${data.n === 1 ? '' : 's'} scanned so far, not a published median. We don't call it "the median Shopify catalog" until the per-vertical sample clears ${data.publishFloor.toLocaleString()}. The trend is already visible though: catalogs score high on titles and imagery and low on the structured fields agents actually filter on.`
                    : `FlintmereBot is mid-crawl. As soon as the first scan completes, its score appears here. Aggregate framing unlocks at ${data.publishFloor.toLocaleString()} stores per vertical; until then this page reports what the dataset can honestly support.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 4 — Grade distribution (Bloomberg-style ink bars). */}
      {data.available ? (
        <section
          aria-labelledby="distribution-heading"
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
              <span aria-hidden="true">// </span>
              {data.preview ? 'grade distribution · early sample' : 'grade distribution'}
            </p>

            <h2
              id="distribution-heading"
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{ fontSize: 'clamp(36px, 5vw, 80px)', maxWidth: '22ch' }}
            >
              {data.preview ? (
                <>
                  How the first {data.n.toLocaleString()} Shopify
                  {data.n === 1 ? ' store ' : ' stores '}
                  {data.n === 1 ? 'lands' : 'land'} against the seven AI-readiness checks.
                </>
              ) : (
                <>
                  How {data.n.toLocaleString()} Shopify stores stack up against{' '}
                  <Bracket>grade D or F</Bracket>.
                </>
              )}
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
                ['--reveal-delay' as string]: '300ms',
              }}
            />

            <ul className="list-none p-0 m-0 mt-12 lg:mt-16 border-y border-[color:var(--color-line)]">
              {(['A', 'B', 'C', 'D', 'F'] as const).map((g, idx) => {
                const pct = distributionPct(dist, g, n);
                const count = dist[g];
                return (
                  <li
                    key={g}
                    data-reveal
                    className="grid grid-cols-[64px_1fr_140px] gap-6 py-6 items-center border-t border-[color:var(--color-line-soft)] first:border-t-0"
                    style={{
                      ['--reveal-delay' as string]: `${500 + idx * 80}ms`,
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 'clamp(24px, 2.2vw, 32px)',
                        letterSpacing: '-0.02em',
                        fontWeight: 700,
                      }}
                    >
                      {g}
                    </span>
                    <div
                      className="h-[20px] bg-[color:var(--color-paper-2)] border border-[color:var(--color-line)] relative overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        data-reveal
                        className="research-bar-grow absolute inset-y-0 left-0"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background:
                            g === 'D' || g === 'F'
                              ? 'var(--color-accent)'
                              : 'var(--color-ink)',
                          ['--reveal-delay' as string]: `${700 + idx * 80}ms`,
                        }}
                      />
                    </div>
                    <p
                      className="font-mono uppercase text-right"
                      style={{
                        fontSize: 'clamp(11px, 1vw, 13px)',
                        letterSpacing: '0.18em',
                        fontWeight: 500,
                        color: 'var(--color-ink)',
                      }}
                    >
                      <CountUp target={pct} suffix="%" durationMs={900} />
                      {' · '}
                      <CountUp target={count} durationMs={900} />
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
