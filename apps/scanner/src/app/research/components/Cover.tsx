import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import {
  STAGGER,
  belowCeilingPct,
  type Published,
} from '../data';
import { CountUp } from './CountUp';

/**
 * Chapter 1 — Cover. The percentage IS the cover art. Saks bracket
 * reveals after the A24 credit; the framing sentence cascades word
 * by word beneath. Saks-scale bracket reserved for the cover ONLY
 * (per outline-shimmer canon: one heroic-scale anchor per surface).
 */
export function Cover({ data }: { data: Published }) {
  const dist = data.overall.distribution;
  const n = data.n;

  const headlinePct =
    data.available && !data.preview ? belowCeilingPct(dist, n) : null;

  // Cover chord adapts to data state — full v1 (the % statistic counts
  // up from 0 to target), preview (early sample word), or pre-launch
  // (scanning word). Numerals-count-up applies only to the percentage
  // state — text states render plain.
  const coverBracketContent: React.ReactNode =
    headlinePct !== null ? (
      <CountUp target={headlinePct} suffix="%" trigger="mount" durationMs={1500} />
    ) : data.available && data.preview ? (
      'early'
    ) : (
      'scanning'
    );

  const coverBracketAria =
    headlinePct !== null
      ? `${headlinePct}%`
      : data.available && data.preview
        ? 'early'
        : 'scanning';

  const coverSentence =
    headlinePct !== null
      ? `of ${n.toLocaleString()} Shopify catalogs grade D or F.`
      : data.available && data.preview
        ? `${n.toLocaleString()} Shopify ${n === 1 ? 'store' : 'stores'} in the sample so far.`
        : 'FlintmereBot is mid-crawl. The first dataset lands here as soon as scans complete.';

  const coverWords = coverSentence.split(' ');
  const lastWordDelay = 1400 + coverWords.length * STAGGER;

  return (
    <section
      id="cover"
      aria-labelledby="research-cover-heading"
      className="relative isolate overflow-hidden bg-[color:var(--color-paper)] flex flex-col"
      style={{ minHeight: '100vh' }}
    >
      <div
        className="relative flex flex-col justify-center mx-auto w-full max-w-[1280px]"
        style={{
          flex: 1,
          paddingLeft: 'clamp(32px, 5vw, 96px)',
          paddingRight: 'clamp(32px, 4vw, 64px)',
          paddingTop: 'clamp(120px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 12vh, 160px)',
        }}
      >
        <p
          data-reveal
          aria-label={`Flintmere, state of Shopify catalogs, version 1, ${data.asOfLabel}`}
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1vw, 13px)',
            letterSpacing: '0.18em',
            fontWeight: 500,
            color: 'var(--color-mute)',
            marginBottom: 'clamp(48px, 6vw, 96px)',
            ['--reveal-delay' as string]: '120ms',
          }}
        >
          Flintmere · State of Shopify catalogs · v1 · {data.asOfLabel}
        </p>

        <h1
          id="research-cover-heading"
          className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
          style={{ fontSize: 'clamp(40px, 5vw, 80px)', maxWidth: '20ch' }}
        >
          <span className="sr-only">
            {coverBracketAria} {coverSentence}
          </span>
          <span aria-hidden="true">
            <span
              data-reveal
              style={{
                display: 'inline-block',
                ['--reveal-delay' as string]: '500ms',
              }}
            >
              <Bracket size="saks">{coverBracketContent}</Bracket>
            </span>
            <span style={{ display: 'block', marginTop: 'clamp(20px, 2vw, 32px)' }}>
              {coverWords.map((w, i) => (
                <span
                  key={`cw-${i}`}
                  data-reveal
                  style={{
                    display: 'inline-block',
                    marginRight: i < coverWords.length - 1 ? '0.24em' : 0,
                    ['--reveal-delay' as string]: `${1400 + i * STAGGER}ms`,
                  }}
                >
                  {w}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <div
          data-reveal
          className="flex flex-wrap gap-3"
          style={{
            marginTop: 'clamp(40px, 5vw, 64px)',
            ['--reveal-delay' as string]: `${lastWordDelay + 200}ms`,
          }}
        >
          <Link href="/scan" className="btn btn-accent">
            Add my store to the next edition →
          </Link>
          <Link href="/bot" className="btn">
            How FlintmereBot works
          </Link>
        </div>

        <div
          data-reveal
          aria-hidden="true"
          className="absolute h-[2px]"
          style={{
            left: 'clamp(32px, 5vw, 96px)',
            bottom: 'clamp(40px, 5vw, 72px)',
            width: 'clamp(160px, 14vw, 280px)',
            background: 'var(--color-accent-sage)',
            opacity: 0.85,
            ['--reveal-delay' as string]: `${lastWordDelay + 600}ms`,
          }}
        />
      </div>
    </section>
  );
}
