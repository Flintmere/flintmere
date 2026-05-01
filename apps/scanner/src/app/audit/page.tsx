import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { ViewportReveal } from '@/components/ViewportReveal';
import { CheckoutCard } from './CheckoutCard';
import { CONCIERGE_DELIVERABLE_LIST } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Concierge audit — from £197',
  description:
    'We read your Shopify store product by product and send a written audit letter plus a per-product fix CSV within three working days. Three SKU bands — £197 / £397 / from £597. 30-day re-scan included.',
};

/**
 * /audit — Concierge audit conversion surface (extravagant pass + choreography,
 * 2026-04-30).
 *
 * Council pre-flight (3 named references):
 *   - Pentagram Saks Fifth Avenue — logotype-scale numerals: the floor
 *     price (£197) set at Bracket size="saks" carries the page's brand mark
 *     until the Phase 2 redesign retires the chord in favour of a band
 *     selector signature (per ADR 0022).
 *   - The Modern House (offering pages) — single typographic chord per
 *     chapter, generous whitespace, sage hairline anchors.
 *   - A24 single-film overview — top-left mono credit replaces eyebrow
 *     chrome; one anchor per chapter, one CTA per page.
 *
 * Choreography: each chapter cascades on entry — eyebrow → headline word-
 * cascade with Apple-pattern beat → sage hairline → body rows with stagger.
 * Saks brackets `[for you]` and `[£197]` reveal as the punchline after a
 * 300ms beat; their continuous outline-shimmer (canonical, baked into the
 * Bracket primitive) runs through the letterforms underneath.
 *
 * Mechanism: a single `<ViewportReveal>` wraps the page; it observes every
 * `[data-reveal]` descendant individually with threshold 0.5. Each element
 * carries its own `--reveal-delay` so packed-together openers cascade from a
 * shared zero, while body rows fire when they personally enter the viewport.
 *
 * Reduced-motion: the global `prefers-reduced-motion` block in globals.css
 * scales transition-duration to 0.01ms — reduced-motion users land on every
 * data-reveal endpoint instantly. No motion library, no JS animation loop.
 *
 * Bracket budget: ≤1 anchor bracket per section. Hero `[for you]` (saks),
 * price chord `[£197]` (saks, Band 1 floor), deliverables `[three days]`
 * (default). Ordinal markers `[01]…[05]` are ledger numerals, not anchor
 * brackets.
 *
 * Each section explicitly carries `bg-paper` so the universal sticky-footer
 * curtain (engaged by `flintmere-main`) is occluded until the user reaches
 * the bottom of the page.
 */

const STAGGER_HERO = 110;
const STAGGER_BODY = 120;
const BEAT = 300;

export default function Audit() {
  return (
    <main id="main" className="flintmere-main">
      <a href="#hero" className="skip-link">
        Skip to content
      </a>
      <ViewportReveal>
        {/* Chapter 1 — Hero (single typographic canvas, A24 + Saks).
            Word-cascade with beat on the headline; the saks bracket
            `[for you]` lands as the punchline after the cascade settles. */}
        <section
          id="hero"
          aria-labelledby="audit-heading"
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
              aria-label="Flintmere concierge audit, from one hundred and ninety-seven pounds, three working days"
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
              Flintmere · Concierge audit · from £197 · 3 working days
            </p>

            <h1
              id="audit-heading"
              className="font-sans font-medium tracking-[-0.04em] leading-[0.88] text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(56px, 8vw, 128px)',
                maxWidth: '14ch',
              }}
            >
              <span className="sr-only">
                Want us to read your store for you?
              </span>
              {(() => {
                const WORDS = ['Want', 'us', 'to', 'read', 'your', 'store'];
                const ENTRY = 400;
                const cascadeEnd = ENTRY + WORDS.length * STAGGER_HERO;
                const bracketDelay = cascadeEnd + BEAT;
                return (
                  <span aria-hidden="true">
                    {WORDS.map((w, i) => (
                      <span
                        key={`hw-${i}`}
                        data-reveal
                        style={{
                          display: 'inline-block',
                          marginRight: '0.28em',
                          ['--reveal-delay' as string]: `${ENTRY + i * STAGGER_HERO}ms`,
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
                      <Bracket size="saks">for you</Bracket>?
                    </span>
                  </span>
                );
              })()}
            </h1>

            <p
              data-reveal
              className="font-sans"
              style={{
                marginTop: 'clamp(28px, 3vw, 48px)',
                maxWidth: '52ch',
                fontSize: 'clamp(16px, 1.15vw, 19px)',
                lineHeight: 1.55,
                fontWeight: 400,
                color: 'var(--color-mute)',
                ['--reveal-delay' as string]: '2000ms',
              }}
            >
              We read your catalog product by product, write a detailed letter
              pointing at exactly what to fix, and send a per-product CSV with
              the worst offenders already drafted for you. No call. No
              screen-share. Three working days.
            </p>

            <div
              data-reveal
              style={{
                marginTop: 'clamp(40px, 5vw, 64px)',
                ['--reveal-delay' as string]: '2200ms',
              }}
            >
              <Link
                href="#checkout"
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)]"
              >
                See the bands
                <span aria-hidden="true">↓</span>
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
                ['--reveal-delay' as string]: '2700ms',
              }}
            />
          </div>
        </section>

        {/* Chapter 2 — The price chord (Saks logotype-scale numeral).
            Word-cascade lands "The whole audit, from", beats 300ms, then
            the saks `[£197]` reveals as the brand-mark moment — the Band 1
            floor anchor per ADR 0022. Phase 2 redesign retires the chord
            in favour of a band-selector signature; this is the interim
            truthful read. Spec captions, hairline, and checkout cascade
            in after. */}
        <section
          id="checkout"
          aria-labelledby="price-heading"
          className="relative bg-[color:var(--color-paper)]"
        >
          <div
            className="relative mx-auto w-full max-w-[1280px]"
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
              <span aria-hidden="true">// </span>the cost
            </p>

            <h2
              id="price-heading"
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{ fontSize: 'clamp(40px, 5vw, 80px)', maxWidth: '20ch' }}
            >
              <span className="sr-only">The whole audit, from one hundred and ninety-seven pounds.</span>
              {(() => {
                const WORDS = ['The', 'whole', 'audit,', 'from'];
                const ENTRY = 200;
                const cascadeEnd = ENTRY + WORDS.length * STAGGER_BODY;
                const bracketDelay = cascadeEnd + BEAT;
                return (
                  <span aria-hidden="true">
                    {WORDS.map((w, i) => (
                      <span
                        key={`pw-${i}`}
                        data-reveal
                        style={{
                          display: 'inline-block',
                          marginRight: '0.22em',
                          ['--reveal-delay' as string]: `${ENTRY + i * STAGGER_BODY}ms`,
                        }}
                      >
                        {w}
                      </span>
                    ))}
                    <span
                      data-reveal
                      style={{
                        display: 'inline-block',
                        verticalAlign: 'baseline',
                        ['--reveal-delay' as string]: `${bracketDelay}ms`,
                      }}
                    >
                      <Bracket size="saks">£197</Bracket>
                    </span>
                  </span>
                );
              })()}
            </h2>

            <p
              data-reveal
              className="font-mono uppercase mt-12 lg:mt-16"
              aria-label="One-time payment, no VAT, thirty-day refund, three working days"
              style={{
                fontSize: 'clamp(11px, 1vw, 13px)',
                letterSpacing: '0.18em',
                fontWeight: 500,
                color: 'var(--color-ink)',
                ['--reveal-delay' as string]: '1500ms',
              }}
            >
              One-time
              <span className="mx-3" aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>·</span>
              No VAT
              <span className="mx-3" aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>·</span>
              30-day refund
              <span className="mx-3" aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>·</span>
              Three working days
            </p>

            <div
              data-reveal
              aria-hidden="true"
              className="mt-10 lg:mt-12"
              style={{
                height: '2px',
                width: 'clamp(160px, 14vw, 280px)',
                background: 'var(--color-accent-sage)',
                opacity: 0.85,
                ['--reveal-delay' as string]: '1700ms',
              }}
            />

            <div
              data-reveal
              className="mx-auto"
              style={{
                marginTop: 'clamp(64px, 8vw, 112px)',
                maxWidth: '520px',
                ['--reveal-delay' as string]: '1900ms',
              }}
            >
              <CheckoutCard />
            </div>
          </div>
        </section>

        {/* Chapter 3 — Deliverables. Headline word-cascade beats into the
            `[three days]` bracket; each spec row reveals as it personally
            enters the viewport (so slow-scrollers see each row land, fast-
            scrollers see them already there). */}
        <section
          aria-labelledby="deliverables-heading"
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
              <span aria-hidden="true">// </span>what lands in your inbox
            </p>

            <h2
              id="deliverables-heading"
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{ fontSize: 'clamp(40px, 6vw, 96px)', maxWidth: '18ch' }}
            >
              <span className="sr-only">
                Your store, read by humans, in three days.
              </span>
              {(() => {
                const WORDS = ['Your', 'store,', 'read', 'by', 'humans,', 'in'];
                const ENTRY = 200;
                const cascadeEnd = ENTRY + WORDS.length * STAGGER_BODY;
                const bracketDelay = cascadeEnd + BEAT;
                return (
                  <span aria-hidden="true">
                    {WORDS.map((w, i) => (
                      <span
                        key={`dw-${i}`}
                        data-reveal
                        style={{
                          display: 'inline-block',
                          marginRight: '0.24em',
                          ['--reveal-delay' as string]: `${ENTRY + i * STAGGER_BODY}ms`,
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
                      <Bracket>three days</Bracket>.
                    </span>
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
                ['--reveal-delay' as string]: '1700ms',
              }}
            />

            {/* Cover plate — bespoke editorial still-life as proof-of-deliverable.
                "Type leads, imagery proves" canon. Bracket signature co-occurs
                in the same viewport via the headline `[three days]` above.
                Asset rendered 2026-04-30 via Runware Flux Dev under per-surface
                operator override of the AI-imagery canon ban. Workflow: see
                memory project_runware_image_workflow.md. Native 21:9 (1344×576),
                60KB — well under the 100KB editorial-photo ceiling. */}
            <figure
              data-reveal
              className="relative mt-12 lg:mt-16"
              style={{
                margin: 0,
                ['--reveal-delay' as string]: '1900ms',
              }}
            >
              <div
                className="relative overflow-hidden border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
                style={{ aspectRatio: '21 / 9' }}
              >
                <Image
                  src="/marketing/audit/deliverables.webp"
                  alt="A still-life: a single blank cream paper sheet (the audit letter) layered over a faintly grid-ruled cream paper (the per-product fix CSV), a black-barrelled fountain pen resting at the bottom-right, and a closed brown leather-bound pocket notebook (the 30-day plan) at the top-right, on a warm cream backdrop in soft afternoon daylight from the upper-left."
                  fill
                  sizes="(min-width: 1280px) 1216px, 100vw"
                  className="object-cover"
                  style={{ filter: 'var(--image-treatment-warm)' }}
                  priority={false}
                />
              </div>
              <figcaption
                className="mt-3 font-mono uppercase"
                style={{
                  fontSize: 'clamp(10px, 0.85vw, 11px)',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  color: 'var(--color-mute-2)',
                }}
              >
                <span aria-hidden="true">// </span>figure{' '}
                <Bracket>01</Bracket>
                <span className="mx-2" aria-hidden="true">·</span>
                what arrives in your inbox
              </figcaption>
            </figure>

            <p
              data-reveal
              className="font-mono"
              style={{
                marginTop: 'clamp(48px, 6vw, 80px)',
                fontSize: 'clamp(12px, 1vw, 13px)',
                lineHeight: 1.6,
                letterSpacing: '0.02em',
                color: 'var(--color-mute-2)',
                maxWidth: '64ch',
                ['--reveal-delay' as string]: '2100ms',
              }}
            >
              <span aria-hidden="true">// </span>The list below shows the Band 1
              deliverable. Band 2 audits draft the worst 25 products (not 10);
              Band 3 audits read a representative sample plus the structural
              data model, and draft the worst 25.
            </p>

            <ol
              className="list-none p-0 grid grid-cols-1 lg:grid-cols-2"
              style={{
                marginTop: 'clamp(40px, 5vw, 64px)',
                gap: 'clamp(40px, 4vw, 64px) clamp(48px, 5vw, 96px)',
              }}
            >
              {CONCIERGE_DELIVERABLE_LIST.map((item, idx) => (
                <li
                  key={item.title}
                  data-reveal
                  className="border-t border-[color:var(--color-line)] pt-8"
                  style={{
                    ['--reveal-delay' as string]: `${idx * 100}ms`,
                  }}
                >
                  <p
                    className="font-mono uppercase"
                    style={{
                      fontSize: 'clamp(11px, 1vw, 13px)',
                      letterSpacing: '0.18em',
                      fontWeight: 500,
                      color: 'var(--color-mute-2)',
                    }}
                  >
                    <span aria-hidden="true">[ </span>
                    {String(idx + 1).padStart(2, '0')}
                    <span aria-hidden="true"> ]</span>
                  </p>
                  <p
                    className="font-sans font-medium tracking-[-0.02em] leading-[1.05] text-[color:var(--color-ink)] mt-4"
                    style={{ fontSize: 'clamp(24px, 2.4vw, 36px)' }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="font-sans mt-4"
                    style={{
                      fontSize: 'clamp(15px, 1.05vw, 17px)',
                      lineHeight: 1.55,
                      color: 'var(--color-mute)',
                      maxWidth: '52ch',
                    }}
                  >
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Chapter 4 — How it works. Short headline cascade, then each step
            reveals as the user scrolls past it. */}
        <section
          aria-labelledby="how-heading"
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
              <span aria-hidden="true">// </span>the four moves
            </p>

            <h2
              id="how-heading"
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{ fontSize: 'clamp(40px, 6vw, 96px)', maxWidth: '14ch' }}
            >
              <span className="sr-only">How it works.</span>
              {(() => {
                const WORDS = ['How', 'it', 'works.'];
                const ENTRY = 200;
                return (
                  <span aria-hidden="true">
                    {WORDS.map((w, i) => (
                      <span
                        key={`hiw-${i}`}
                        data-reveal
                        style={{
                          display: 'inline-block',
                          marginRight: i < WORDS.length - 1 ? '0.24em' : 0,
                          ['--reveal-delay' as string]: `${ENTRY + i * STAGGER_BODY}ms`,
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
                ['--reveal-delay' as string]: '900ms',
              }}
            />

            <ol
              className="list-none p-0"
              style={{
                marginTop: 'clamp(64px, 8vw, 112px)',
              }}
            >
              {[
                'Pick your band and pay. A confirmation email lands within a minute.',
                'We read your catalog and write the audit. The URL is all we need — no call, no screen-share.',
                'Within three working days, the letter, CSV, and 30-day plan land in your inbox.',
                'Day 30: the scanner re-runs and emails you a progress report.',
              ].map((step, idx) => (
                <li
                  key={idx}
                  data-reveal
                  className="border-t border-[color:var(--color-line)] grid grid-cols-[auto_1fr] items-baseline"
                  style={{
                    gap: 'clamp(24px, 4vw, 64px)',
                    paddingTop: 'clamp(32px, 4vw, 56px)',
                    paddingBottom: 'clamp(32px, 4vw, 56px)',
                    ['--reveal-delay' as string]: `${idx * 80}ms`,
                  }}
                >
                  <span
                    className="font-mono"
                    aria-hidden="true"
                    style={{
                      fontSize: 'clamp(20px, 2vw, 28px)',
                      letterSpacing: '0.04em',
                      fontWeight: 500,
                      color: 'var(--color-mute-2)',
                    }}
                  >
                    [ {String(idx + 1).padStart(2, '0')} ]
                  </span>
                  <p
                    className="font-sans font-medium tracking-[-0.015em] text-[color:var(--color-ink)]"
                    style={{
                      fontSize: 'clamp(20px, 2vw, 32px)',
                      lineHeight: 1.25,
                      maxWidth: '32ch',
                    }}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Chapter 5 — Disclaimer band. Single quiet fade-up on paper. */}
        <section
          aria-labelledby="legal-heading"
          className="relative bg-[color:var(--color-paper)]"
        >
          <div
            className="mx-auto w-full max-w-[1280px]"
            style={{
              paddingLeft: 'clamp(24px, 5vw, 64px)',
              paddingRight: 'clamp(24px, 5vw, 64px)',
              paddingTop: 'clamp(72px, 10vh, 144px)',
              paddingBottom: 'clamp(96px, 12vh, 160px)',
            }}
          >
            <h2 id="legal-heading" className="sr-only">
              Legal and disclosure
            </h2>
            <p
              data-reveal
              className="font-mono"
              style={{
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: 1.7,
                letterSpacing: '0.02em',
                color: 'var(--color-mute)',
                maxWidth: '72ch',
                ['--reveal-delay' as string]: '100ms',
              }}
            >
              Flintmere is a trading name of Eazy Access Ltd (England &amp; Wales).
              Eazy Access Ltd is not VAT-registered, so the band price you select
              (£197 / £397 / from £597) is the full price — no VAT is added.
              Flintmere is not affiliated with GS1. Identifier requirements vary
              by marketplace and jurisdiction. The audit is informational; the
              checks map to Shopify product data requirements, GS1 UK identifier
              rules, and Google Merchant Center specifications.
            </p>
          </div>
        </section>

        <SiteFooter />
      </ViewportReveal>
    </main>
  );
}
