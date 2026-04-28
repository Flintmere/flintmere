import Image from 'next/image';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { ViewportReveal } from '@/components/ViewportReveal';
import { HeroParallaxFigure } from '@/components/HeroParallaxFigure';
import { Pillar } from '@/components/sections/Pillar';
import { FounderStrip } from '@/components/sections/FounderStrip';

/**
 * Marketing home — cull-to-four arc 2026-04-28.
 *
 * Four chapters: Hero · Pillars · FounderStrip · Footer. Council 11-1
 * (#15 conditional) approved cull from 12 sections to 4. Path A
 * (type-led, no imagery beyond the hero photo) — operator pick.
 *
 * Each chapter awaits its amplification dispatch:
 *  - Chapter 1 (Hero): typographic scale-up to clamp(72px,11vw,144px)
 *    weight 500, parallax + photoreal stay.
 *  - Chapter 2 (Pillars): Pentagram-scale rebuild — oversized [ 06 ]
 *    numeral fills 60% of frame; six pillars as Bloomberg-cover essay
 *    with hairline rules between rows.
 *  - Chapter 3 (FounderStrip): Margaret-Howell restraint amplified;
 *    paper-bordered Book audit CTA at chapter-anchor scale.
 *  - Chapter 4 (Footer): closing wordmark amplified to clamp(80px,
 *    10vw,160px) so the page closes on the mark.
 *
 * Cuts (one commit, no replacement): StatTriad, live sample,
 * HomepageVerticalPicker, Before/After, £97 audit-deep, CompareSection,
 * PricingStripPlaceholder, ManifestoSection.
 */
export default function MarketingHome() {
  return (
    <main id="main">
      <a href="#hero" className="skip-link">Skip to content</a>
      <ViewportReveal>
      {/* Hero — full-bleed photoreal overlay (Louis-Vuitton-heritage register
          per operator 2026-04-28 lock). Image fills the section edge-to-edge;
          two-layer scrim provides AA contrast on the left half; eyebrow +
          h1 + lede + CTAs + fineprint overlaid on the photo, left-aligned,
          vertically centered. Sage hairline at bottom-left anchors the
          section to the page's structural grid (set cohesion with the
          PickerDrivenContentBlock). Parallax via HeroParallaxFigure (Pattern 3
          — 0.5× scroll velocity, ±40px clamp, JS prefers-reduced-motion
          bypass + change-listener). */}
      <section
        id="hero"
        className="relative isolate overflow-hidden border-b border-[color:var(--color-line)] bg-[color:var(--color-ink)]"
        style={{ height: 'min(92vh, 920px)', minHeight: '640px' }}
      >
        <HeroParallaxFigure className="absolute inset-0 w-full h-full">
          <Image
            src="/marketing/hero/hero.avif"
            alt="A wooden compartmented tray displaying unbranded artisan goods — small jars, brass mortar, dried herbs — in warm afternoon side-light."
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{
              objectPosition: 'center',
              filter: 'var(--image-treatment-warm)',
            }}
          />
        </HeroParallaxFigure>

        {/* Scrim layer 1 — vertical paper-mist for atmospheric depth. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,11,0.18) 0%, rgba(10,10,11,0.0) 32%, rgba(10,10,11,0.0) 65%, rgba(10,10,11,0.38) 100%)',
          }}
        />

        {/* Scrim layer 2 — horizontal ink fade, softer than v1 so the photo
            bleeds through more on the left side. Operator critique 2026-04-28:
            previous near-opaque scrim made the headline read as "shouting on
            black"; reducing the on-text opacity from 0.82 → 0.55 lets the
            tray photo's warm tones come through behind the text. AA contrast
            still holds (~4.8:1 on display weight 500 + paper-on-ink). */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(10,10,11,0.62) 0%, rgba(10,10,11,0.45) 30%, rgba(10,10,11,0.20) 58%, rgba(10,10,11,0.04) 82%, rgba(10,10,11,0) 100%)',
          }}
        />

        {/* Decorative sage hairline anchor. */}
        <div
          aria-hidden="true"
          className="absolute left-8 bottom-8 h-[2px] w-[160px] lg:left-12 lg:bottom-12 lg:w-[240px]"
          style={{
            background: 'var(--color-accent-sage)',
            opacity: 0.85,
          }}
        />

        {/* Overlay content — left ~58% column, vertically centered. */}
        <div className="relative h-full mx-auto max-w-[1280px] px-8 lg:px-12">
          <div className="grid h-full items-center">
            <div className="max-w-[680px]">
              <p
                className="font-mono text-[11px] tracking-[0.18em] uppercase mb-8"
                style={{
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                }}
              >
                // free scan · 60 seconds · no install
              </p>
              <ViewportReveal>
                <h1
                  className="font-medium tracking-[-0.04em] leading-[0.95] text-[clamp(48px,7.2vw,88px)] max-w-[20ch]"
                  style={{ color: 'var(--color-paper-on-ink)' }}
                >
                  Which of your products are{' '}
                  <Bracket>suppressed</Bracket>
                  {' '}in Google Shopping today?
                </h1>
              </ViewportReveal>
              <p
                className="mt-10 max-w-[44ch] text-[clamp(17px,1.55vw,20px)] leading-[1.55] font-medium"
                style={{ color: 'var(--color-paper-on-ink)' }}
              >
                Paste your URL. We estimate how much annual demand is going to
                competitors while these products stay demoted — and show you the
                catalog data costing you the sale.
              </p>
              <div className="mt-12 flex flex-wrap gap-3">
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-3 px-7 py-3.5 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
                >
                  Run the free scan
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/audit"
                  className="inline-flex items-center gap-3 px-7 py-3.5 border border-[color:var(--color-paper-on-ink)] text-[color:var(--color-paper-on-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
                >
                  Or book the £97 concierge audit
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              <p
                className="mt-8 max-w-[52ch] text-[14px] leading-[1.55]"
                style={{ color: 'var(--color-mute-inv)' }}
              >
                Prefer to talk first? Email{' '}
                <a
                  href="mailto:hello@flintmere.com"
                  className="underline hover:text-[color:var(--color-paper-on-ink)] transition-colors"
                  style={{ color: 'var(--color-paper-on-ink)' }}
                >
                  hello@flintmere.com
                </a>{' '}
                — the team usually replies within two working days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 2 — Pillars (awaiting Chapter 2 Pentagram-scale
          amplification per cull-to-four arc 2026-04-28) */}
      <section id="pillars" className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">What we check</p>
        <h2 className="max-w-[22ch] mb-4">
          Seven things an AI shopping agent looks for before it will recommend your product.
        </h2>
        <p className="pillars-intro max-w-[60ch] text-[color:var(--color-mute)]">
          Each pillar carries the weight shown. Your final score is a weighted average across the seven.
        </p>
        <ol className="mt-12 list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          {[
            {
              name: 'Product IDs',
              weight: '20%',
              weightPct: 0.2,
              desc: 'Whether each product carries the codes agents look it up by — barcode, brand, manufacturer part number.',
            },
            {
              name: 'Structured attributes',
              weight: '20%',
              weightPct: 0.2,
              desc: 'Whether size, colour, material and other fields exist as structured data — not hidden inside the description.',
            },
            {
              name: 'Title & description quality',
              weight: '15%',
              weightPct: 0.15,
              desc: 'Whether titles and descriptions read like spec sheets an agent can parse — not marketing copy.',
            },
            {
              name: 'Google category match',
              weight: '15%',
              weightPct: 0.15,
              desc: 'Whether products carry a Google Merchant Center category, so agents know what you sell.',
            },
            {
              name: 'Data consistency',
              weight: '15%',
              weightPct: 0.15,
              desc: 'Whether the catalog looks healthy — images load, active products have stock, alt text exists, prices match across pages.',
            },
            {
              name: 'AI agent access',
              weight: '5%',
              weightPct: 0.05,
              desc: 'Whether AI shopping agents are allowed to read your site at all — robots rules, sitemap, llms.txt.',
            },
            {
              name: 'Agent checkout readiness',
              weight: '10%',
              weightPct: 0.1,
              desc: 'Whether an AI agent can actually complete a purchase on your store without human intervention.',
            },
          ].map((p, idx) => (
            <Pillar key={p.name} {...p} idx={idx} />
          ))}
        </ol>
      </section>

      {/* Chapter 3 — Founder strip (post-Batch-A canon-compliant; awaiting
          Chapter 3 amplification per cull-to-four arc 2026-04-28) */}
      <FounderStrip />

      {/* Chapter 4 — Footer (post-Batch-A canon-compliant) */}
      <SiteFooter />
      </ViewportReveal>
    </main>
  );
}

