import Image from 'next/image';
import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import { BENCHMARK_PUBLISH_FLOOR } from '@/lib/copy';
import { type Published } from '../data';
import { CountUp } from './CountUp';

// Per-vertical editorial still-life thumbnails. All three rendered
// 2026-04-30 via Runware Flux Dev under per-surface operator override
// of the AI-imagery canon ban (memory: project_runware_image_workflow.md).
// Each is 1024×768 (matches the card's 4:3 aspect-ratio) so object-cover
// crops nothing. The --image-treatment-warm CSS filter pulls each photo
// into the page's warm paper register.
const VERTICAL_IMAGES: Record<
  string,
  { src: string; alt: string }
> = {
  apparel: {
    src: '/marketing/research/apparel.webp',
    alt: 'A single neatly folded ivory cotton jersey shirt with a small white sewn-in care label visible at the neckline, an ivory cloth measuring tape draped beside it on a warm cream surface in soft afternoon daylight — apparel catalogs hinge on size, colour, material, and gender as structured fields.',
  },
  beauty: {
    src: '/marketing/research/beauty.webp',
    alt: 'A single small unmarked cream-coloured ceramic apothecary bottle with a fluted neck, a small folded ivory paper booklet with a slim brass spatula resting on top, on a warm cream surface in soft afternoon daylight — beauty agents filter on ingredients, shade, volume, and claims, and most catalogs ship none of them structured.',
  },
  'food-and-drink': {
    src: '/marketing/research/food.webp',
    alt: 'A small clear glass artisan preserves jar three-quarters full of warm amber preserves, the lid hand-tied with kraft paper and twine, resting on a small folded blank cream paper sheet on a warm surface in soft daylight — food catalogs depend on allergens, nutrition, provenance, and certifications as regulatory fields.',
  },
};

/**
 * Chapters 5–7: By vertical (3 flagship cards) + All verticals (full grid)
 * + Methodology (with the reach-note callout). Each chapter cascades on
 * entry; cards/cells stagger by index.
 */
export function BodyBottom({ data }: { data: Published }) {
  return (
    <>
      {/* Chapter 5 — By vertical (3 flagship cards). */}
      <section
        aria-labelledby="verticals-heading"
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
            <span aria-hidden="true">// </span>by vertical
          </p>

          <h2
            id="verticals-heading"
            data-reveal
            className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
            style={{
              fontSize: 'clamp(36px, 5vw, 80px)',
              maxWidth: '26ch',
              ['--reveal-delay' as string]: '200ms',
            }}
          >
            The gap between verticals is bigger than the gap between good
            and bad stores inside any one vertical.
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
              ['--reveal-delay' as string]: '500ms',
            }}
          />

          <div className="grid md:grid-cols-3 mt-12 lg:mt-16 border-y border-[color:var(--color-line)]">
            {data.byVertical.map((v, idx) => {
              const thumb = VERTICAL_IMAGES[v.slug];
              return (
              <Link
                key={v.slug}
                href={v.href}
                data-reveal
                data-hover-lift
                className={`block p-10 ${
                  idx < data.byVertical.length - 1
                    ? 'md:border-r md:border-[color:var(--color-line)]'
                    : ''
                } max-md:border-b max-md:border-[color:var(--color-line-soft)] max-md:last:border-b-0 hover:bg-[color:var(--color-paper-2)] transition-colors duration-[var(--duration-instant)]`}
                style={{
                  ['--reveal-delay' as string]: `${600 + idx * 120}ms`,
                }}
              >
                {thumb ? (
                  <div
                    className="relative overflow-hidden border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)] mb-8"
                    style={{ aspectRatio: '4 / 3' }}
                  >
                    <Image
                      src={thumb.src}
                      alt={thumb.alt}
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                      style={{ filter: 'var(--image-treatment-warm)' }}
                      priority={false}
                    />
                  </div>
                ) : null}
                <p
                  className="font-mono uppercase mb-4"
                  style={{
                    fontSize: 'clamp(11px, 1vw, 13px)',
                    letterSpacing: '0.18em',
                    fontWeight: 500,
                    color: 'var(--color-mute-2)',
                  }}
                >
                  {v.label}
                </p>
                <p
                  className="font-sans font-medium tracking-[-0.05em] leading-[0.9] text-[color:var(--color-ink)]"
                  style={{ fontSize: 'clamp(56px, 6vw, 96px)' }}
                >
                  {v.median !== null ? (
                    <CountUp target={v.median} durationMs={1100} />
                  ) : (
                    '—'
                  )}
                </p>
                <p
                  className="font-mono uppercase mt-4"
                  style={{
                    fontSize: 'clamp(10px, 0.85vw, 12px)',
                    letterSpacing: '0.18em',
                    fontWeight: 500,
                    color: 'var(--color-mute-2)',
                  }}
                >
                  {v.median !== null
                    ? v.n >= BENCHMARK_PUBLISH_FLOOR
                      ? `median · grade ${v.grade} · ${v.n.toLocaleString()} stores`
                      : `early sample · ${v.n.toLocaleString()} store${v.n === 1 ? '' : 's'} · publishing at ${BENCHMARK_PUBLISH_FLOOR}`
                    : 'sample pending'}
                </p>
                <p
                  className="font-sans mt-6"
                  style={{
                    fontSize: 'clamp(14px, 1vw, 16px)',
                    lineHeight: 1.55,
                    color: 'var(--color-mute)',
                  }}
                >
                  {v.slug === 'apparel'
                    ? 'Size, colour, material, gender — the four fields apparel catalogs most often leave unstructured.'
                    : v.slug === 'beauty'
                      ? 'Ingredients, shade, volume, claims — beauty agents filter on all four, and most catalogs ship none of them structured.'
                      : 'Allergens, nutrition, provenance, certifications — the regulatory fields food agents depend on to answer any query safely.'}
                </p>
                <p
                  className="font-mono uppercase mt-8"
                  style={{
                    fontSize: 'clamp(11px, 1vw, 13px)',
                    letterSpacing: '0.18em',
                    fontWeight: 500,
                    color: 'var(--color-accent-ink)',
                  }}
                >
                  Read the {v.label.toLowerCase()} breakdown →
                </p>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chapter 6 — All verticals (when present). */}
      {data.allVerticals.length > data.byVertical.length ? (
        <section
          aria-labelledby="all-verticals-heading"
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
              <span aria-hidden="true">// </span>across {data.allVerticals.length} verticals
            </p>

            <h2
              id="all-verticals-heading"
              data-reveal
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(32px, 4.5vw, 64px)',
                maxWidth: '28ch',
                ['--reveal-delay' as string]: '200ms',
              }}
            >
              Same median, same tail — across every Shopify category we&rsquo;ve
              scanned so far.
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
                ['--reveal-delay' as string]: '500ms',
              }}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mt-12 lg:mt-16 border-y border-[color:var(--color-line)]">
              {data.allVerticals.map((v, idx) => (
                <div
                  key={v.slug}
                  data-reveal
                  className="p-6 border-b border-r border-[color:var(--color-line-soft)] last:border-r-0"
                  style={{
                    ['--reveal-delay' as string]: `${600 + idx * 50}ms`,
                  }}
                >
                  <p
                    className="font-mono uppercase mb-2"
                    style={{
                      fontSize: 'clamp(10px, 0.85vw, 11px)',
                      letterSpacing: '0.18em',
                      fontWeight: 500,
                      color: 'var(--color-mute-2)',
                    }}
                  >
                    {v.label}
                  </p>
                  <p
                    className="font-sans font-medium tracking-[-0.03em] leading-[0.95] text-[color:var(--color-ink)]"
                    style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}
                  >
                    {v.median !== null ? v.median : '—'}
                  </p>
                  <p
                    className="font-mono uppercase mt-2"
                    style={{
                      fontSize: '11px',
                      letterSpacing: '0.16em',
                      fontWeight: 500,
                      color: 'var(--color-mute-2)',
                    }}
                  >
                    n={v.n}
                    {v.n < BENCHMARK_PUBLISH_FLOOR ? ' · early' : ''}
                  </p>
                </div>
              ))}
            </div>

            <p
              data-reveal
              className="font-sans mt-10"
              style={{
                maxWidth: '64ch',
                fontSize: 'clamp(14px, 1vw, 15px)',
                lineHeight: 1.55,
                color: 'var(--color-mute)',
                ['--reveal-delay' as string]: `${600 + data.allVerticals.length * 50 + 200}ms`,
              }}
            >
              Apparel, beauty, and food &amp; drink are the three deep-sampled
              cohorts (read the breakdowns above). The remainder are surfacing
              as FlintmereBot widens the crawl — your vertical joins the
              sample the first time a merchant in it runs a scan.
            </p>
          </div>
        </section>
      ) : null}

      {/* Chapter 7 — Methodology + reach note (mechanic #5 dual-column
          pin). Headline + sage hairline pin LEFT (≥lg) while the body
          paragraphs + reach-note callout + methodology link scroll
          past on the RIGHT. The closing deliberate-pin beat before
          the ink CTA. */}
      <section
        aria-labelledby="methodology-heading"
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
            <span aria-hidden="true">// </span>methodology
          </p>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-12 lg:gap-x-20 gap-y-12 items-start">
            <div className="research-chapter-pinned">
              <h2
                id="methodology-heading"
                data-reveal
                className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
                style={{
                  fontSize: 'clamp(36px, 5vw, 72px)',
                  maxWidth: '18ch',
                  ['--reveal-delay' as string]: '200ms',
                }}
              >
                Scanned by <Bracket>FlintmereBot</Bracket> · aggregate-published ·
                refreshed monthly.
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
                  ['--reveal-delay' as string]: '500ms',
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-10 lg:gap-12">
            <p
              data-reveal
              className="font-sans"
              style={{
                fontSize: 'clamp(15px, 1.05vw, 17px)',
                lineHeight: 1.6,
                color: 'var(--color-mute)',
                ['--reveal-delay' as string]: '700ms',
              }}
            >
              FlintmereBot identifies itself as{' '}
              <code
                className="font-mono"
                style={{ fontSize: '0.85em', color: 'var(--color-ink)' }}
              >
                FlintmereBot/1.0 (+audit.flintmere.com/bot)
              </code>{' '}
              and rate-limits to one request per two seconds per host. Each
              scan fetches robots.txt, sitemap.xml, llms.txt, products.json,
              and a small sample of product pages. Scores are computed by the
              same rule-based engine that powers the public scanner.
            </p>
            <p
              data-reveal
              className="font-sans"
              style={{
                fontSize: 'clamp(15px, 1.05vw, 17px)',
                lineHeight: 1.6,
                color: 'var(--color-mute)',
                ['--reveal-delay' as string]: '850ms',
              }}
            >
              We publish medians, means, and grade distributions. We never
              publish the domain of any individual store. Merchants who want
              to be excluded can add FlintmereBot to their robots.txt and
              the next scan will honour it. The underlying dataset is never
              shared or sold.
            </p>

            <div
              data-reveal
              className="mt-2 lg:mt-4 border-l-[2px] pl-8 lg:pl-12"
              style={{
                borderColor: 'var(--color-accent-sage)',
                ['--reveal-delay' as string]: '1000ms',
              }}
            >
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 'clamp(11px, 1vw, 13px)',
                letterSpacing: '0.18em',
                fontWeight: 500,
                color: 'var(--color-mute-2)',
                marginBottom: '12px',
              }}
            >
              <span aria-hidden="true">// </span>a note on what we could reach
            </p>
            <p
              className="font-sans"
              style={{
                maxWidth: '72ch',
                fontSize: 'clamp(15px, 1.05vw, 17px)',
                lineHeight: 1.6,
                color: 'var(--color-ink)',
              }}
            >
              The v1 cohort is the stores FlintmereBot could read politely. A
              meaningful share of the Shopify market — mostly the larger
              catalogs sitting behind enterprise bot-management — returns a
              block before any product page loads. Those same blocks apply
              to ChatGPT, Perplexity, and every other AI shopping agent that
              comes knocking. So if a store isn&rsquo;t in this sample, the
              agent reading its catalog today is getting the same answer:
              nothing. That&rsquo;s the gap this research measures from both
              sides.
            </p>
          </div>

              <div
                data-reveal
                className="mt-2 lg:mt-4"
                style={{ ['--reveal-delay' as string]: '1200ms' }}
              >
                <Link href="/bot" className="btn inline-flex">
                  Full methodology notes →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
