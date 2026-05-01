import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { ViewportReveal } from '@/components/ViewportReveal';
import { BandTriptych } from './BandTriptych';
import { CTAButton, DeliverableLift } from './audit-motion';
import { CONCIERGE_DELIVERABLE_LIST } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Concierge audit — from £197',
  description:
    'We read your Shopify store product by product and send a written audit letter plus a per-product fix CSV within three working days. Three SKU bands — £197 / £397 / from £597. 30-day re-scan included.',
};

/**
 * /audit — Concierge audit conversion surface.
 *
 * This page is a sales page first. Restrained motion: one section-level
 * fade-up per chapter (not word-by-word). Brackets render immediately,
 * not as theatrical reveals after a beat. The CheckoutCard is reachable
 * with a single scroll and is interactive within ~400ms of its section
 * entering the viewport — no multi-second cascade.
 *
 * List-stagger is reserved for the deliverables grid and the
 * how-it-works steps, where short sequencing aids scanning.
 *
 * Reduced-motion: the global `prefers-reduced-motion` block in
 * globals.css scales transition-duration to 0.01ms — reduced-motion
 * users land on every endpoint instantly.
 *
 * Bracket budget: ≤1 anchor bracket per section. Hero `[for you]`
 * (saks), price chord `[£197]` (saks, Band 1 floor), deliverables
 * `[three days]` (default). Ordinal markers `[01]…[05]` are ledger
 * numerals, not anchor brackets.
 *
 * Each section explicitly carries `bg-paper` so the universal
 * sticky-footer curtain (engaged by `flintmere-main`) is occluded
 * until the user reaches the bottom of the page.
 *
 * Motion delays follow a single grammar:
 *   - 0ms       section eyebrow
 *   - 80ms      headline
 *   - 160ms     supporting paragraph / hairline
 *   - 240ms     CTA / first list item
 *   - +80ms     each subsequent list item
 *
 * No 300ms BEAT. No 2000ms paragraph delay. No 2700ms hairline
 * sweep. Restraint is the spec.
 */

const STEP = 80;
const D_EYEBROW = 0;
const D_HEADLINE = STEP;
const D_SUPPORT = STEP * 2;
const D_PRIMARY = STEP * 3;

export default function Audit() {
  return (
    <main id="main" className="flintmere-main">
      <a href="#hero" className="skip-link">
        Skip to content
      </a>
      <ViewportReveal>
        {/* Chapter 1 — Hero. Single typographic canvas. The value
            proposition lands as one read, not as a six-word cascade. */}
        <section
          id="hero"
          aria-labelledby="audit-heading"
          className="relative isolate overflow-hidden bg-[color:var(--color-paper)] flex flex-col"
          style={{ minHeight: 'min(100vh, 880px)' }}
        >
          <div
            className="relative flex flex-col justify-center mx-auto w-full max-w-[1280px]"
            style={{
              flex: 1,
              paddingLeft: 'clamp(32px, 5vw, 96px)',
              paddingRight: 'clamp(32px, 4vw, 64px)',
              paddingTop: 'clamp(96px, 12vh, 160px)',
              paddingBottom: 'clamp(72px, 10vh, 120px)',
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
                marginBottom: 'clamp(32px, 4vw, 56px)',
                ['--reveal-delay' as string]: `${D_EYEBROW}ms`,
              }}
            >
              Flintmere · Concierge audit · from £197 · 3 working days
            </p>

            <h1
              id="audit-heading"
              data-reveal
              className="font-sans font-medium tracking-[-0.04em] leading-[0.88] text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(56px, 8vw, 128px)',
                maxWidth: '14ch',
                ['--reveal-delay' as string]: `${D_HEADLINE}ms`,
              }}
            >
              Want us to read your store{' '}
              <Bracket size="saks">for you</Bracket>?
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
                ['--reveal-delay' as string]: `${D_SUPPORT}ms`,
              }}
            >
              We read your catalog product by product, write a detailed
              letter pointing at exactly what to fix, and send a per-product
              CSV with the worst offenders already drafted for you. No call.
              No screen-share. Three working days.
            </p>

            <div
              data-reveal
              className="flex flex-wrap items-center gap-x-6 gap-y-3"
              style={{
                marginTop: 'clamp(32px, 4vw, 56px)',
                ['--reveal-delay' as string]: `${D_PRIMARY}ms`,
              }}
            >
              <CTAButton
                href="#checkout"
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)]"
              >
                See the bands
                <span aria-hidden="true">↓</span>
              </CTAButton>
              <Link
                href="/scan"
                className="font-mono uppercase"
                style={{
                  fontSize: 'clamp(11px, 1vw, 13px)',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  color: 'var(--color-mute)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 4,
                }}
              >
                Or run the free scan first
              </Link>
            </div>

            <div
              data-reveal
              aria-hidden="true"
              className="absolute h-[2px]"
              style={{
                left: 'clamp(32px, 5vw, 96px)',
                bottom: 'clamp(32px, 4vw, 56px)',
                width: 'clamp(160px, 14vw, 280px)',
                background: 'var(--color-accent-sage)',
                opacity: 0.85,
                ['--reveal-delay' as string]: `${D_PRIMARY}ms`,
              }}
            />
          </div>
        </section>

        {/* Chapter 2 — The price chord, as a triptych. The configurator
            IS the visual anchor: three saks chords visible at once
            across a grid that encodes the SKU-range axis (smallest →
            largest, left → right). Selection swaps which chord carries
            full ink fill + sage under-tick + paper-2 column wash; the
            others remain visible as outline-stroke recessive states.

            Per design-extravagant 2026-05-01 — bracket budget relaxed
            to permit comparison-set brackets in the recessive form.
            ADR 0021 §1 amendment pending operator codification. */}
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
              paddingTop: 'clamp(72px, 10vh, 128px)',
              paddingBottom: 'clamp(72px, 10vh, 128px)',
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
                marginBottom: 'clamp(28px, 3vw, 48px)',
                ['--reveal-delay' as string]: `${D_EYEBROW}ms`,
              }}
            >
              <span aria-hidden="true">// </span>the cost
            </p>

            <h2
              id="price-heading"
              data-reveal
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(40px, 5vw, 80px)',
                maxWidth: '20ch',
                ['--reveal-delay' as string]: `${D_HEADLINE}ms`,
              }}
            >
              Three bands. Pick yours.
            </h2>

            <BandTriptych />
          </div>
        </section>

        {/* Chapter 3 — Deliverables. Headline lands as one read; the
            list staggers (5 items × 60ms = 300ms total) so a scanner
            still feels rhythm without theatre. */}
        <section
          aria-labelledby="deliverables-heading"
          className="relative bg-[color:var(--color-paper)]"
        >
          <div
            className="mx-auto w-full max-w-[1280px]"
            style={{
              paddingLeft: 'clamp(24px, 5vw, 64px)',
              paddingRight: 'clamp(24px, 5vw, 64px)',
              paddingTop: 'clamp(72px, 10vh, 128px)',
              paddingBottom: 'clamp(72px, 10vh, 128px)',
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
                marginBottom: 'clamp(28px, 3vw, 48px)',
                ['--reveal-delay' as string]: `${D_EYEBROW}ms`,
              }}
            >
              <span aria-hidden="true">// </span>what lands in your inbox
            </p>

            <h2
              id="deliverables-heading"
              data-reveal
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(40px, 6vw, 96px)',
                maxWidth: '18ch',
                ['--reveal-delay' as string]: `${D_HEADLINE}ms`,
              }}
            >
              Your store, read by humans, in{' '}
              <Bracket>three days</Bracket>.
            </h2>

            <div
              data-reveal
              aria-hidden="true"
              className="mt-8 lg:mt-12"
              style={{
                height: '2px',
                width: 'clamp(160px, 14vw, 280px)',
                background: 'var(--color-accent-sage)',
                opacity: 0.85,
                ['--reveal-delay' as string]: `${D_SUPPORT}ms`,
              }}
            />

            {/* Cover plate — bespoke editorial still-life as
                proof-of-deliverable. "Type leads, imagery proves" canon.
                21:9, ~60KB. */}
            <figure
              data-reveal
              className="relative mt-10 lg:mt-14"
              style={{
                margin: 0,
                ['--reveal-delay' as string]: `${D_PRIMARY}ms`,
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
                marginTop: 'clamp(32px, 4vw, 56px)',
                fontSize: 'clamp(12px, 1vw, 13px)',
                lineHeight: 1.6,
                letterSpacing: '0.02em',
                color: 'var(--color-mute-2)',
                maxWidth: '64ch',
                ['--reveal-delay' as string]: `${D_PRIMARY}ms`,
              }}
            >
              <span aria-hidden="true">// </span>The list below shows the
              Band 1 deliverable. Band 2 audits draft the worst 25 products
              (not 10); Band 3 audits read a representative sample plus the
              structural data model, and draft the worst 25.
            </p>

            <ol
              className="list-none p-0 grid grid-cols-1 lg:grid-cols-2"
              style={{
                marginTop: 'clamp(32px, 4vw, 56px)',
                gap: 'clamp(32px, 3vw, 48px) clamp(40px, 4vw, 80px)',
              }}
            >
              {CONCIERGE_DELIVERABLE_LIST.map((item, idx) => (
                <DeliverableLift key={item.title} delayMs={idx * 60}>
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
                    style={{ fontSize: 'clamp(22px, 2vw, 32px)' }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="font-sans mt-3"
                    style={{
                      fontSize: 'clamp(15px, 1.05vw, 17px)',
                      lineHeight: 1.55,
                      color: 'var(--color-mute)',
                      maxWidth: '52ch',
                    }}
                  >
                    {item.body}
                  </p>
                </DeliverableLift>
              ))}
            </ol>
          </div>
        </section>

        {/* Chapter 4 — How it works. Headline + list-stagger. */}
        <section
          aria-labelledby="how-heading"
          className="relative bg-[color:var(--color-paper)]"
        >
          <div
            className="mx-auto w-full max-w-[1280px]"
            style={{
              paddingLeft: 'clamp(24px, 5vw, 64px)',
              paddingRight: 'clamp(24px, 5vw, 64px)',
              paddingTop: 'clamp(72px, 10vh, 128px)',
              paddingBottom: 'clamp(72px, 10vh, 128px)',
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
                marginBottom: 'clamp(28px, 3vw, 48px)',
                ['--reveal-delay' as string]: `${D_EYEBROW}ms`,
              }}
            >
              <span aria-hidden="true">// </span>the four moves
            </p>

            <h2
              id="how-heading"
              data-reveal
              className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(40px, 6vw, 96px)',
                maxWidth: '14ch',
                ['--reveal-delay' as string]: `${D_HEADLINE}ms`,
              }}
            >
              How it works.
            </h2>

            <div
              data-reveal
              aria-hidden="true"
              className="mt-8 lg:mt-12"
              style={{
                height: '2px',
                width: 'clamp(160px, 14vw, 280px)',
                background: 'var(--color-accent-sage)',
                opacity: 0.85,
                ['--reveal-delay' as string]: `${D_SUPPORT}ms`,
              }}
            />

            <ol
              className="list-none p-0"
              style={{
                marginTop: 'clamp(40px, 5vw, 72px)',
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
                    paddingTop: 'clamp(28px, 3vw, 48px)',
                    paddingBottom: 'clamp(28px, 3vw, 48px)',
                    ['--reveal-delay' as string]: `${idx * 60}ms`,
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
                      maxWidth: '36ch',
                    }}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Chapter 5 — Disclaimer band. Single quiet fade-up. */}
        <section
          aria-labelledby="legal-heading"
          className="relative bg-[color:var(--color-paper)]"
        >
          <div
            className="mx-auto w-full max-w-[1280px]"
            style={{
              paddingLeft: 'clamp(24px, 5vw, 64px)',
              paddingRight: 'clamp(24px, 5vw, 64px)',
              paddingTop: 'clamp(56px, 8vh, 96px)',
              paddingBottom: 'clamp(72px, 10vh, 128px)',
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
                ['--reveal-delay' as string]: '0ms',
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
