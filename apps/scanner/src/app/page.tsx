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
      {/* Chapter 1 — Hero (Modern House split + Pentagram Saks logotype scale +
          A24 single-film credit). Second dispatch under design-extravagant
          (commit 69d068d). Spec source of truth:
          context/design/extravagant/2026-04-29-chapter-1-hero-modern-house-saks.md.

          Composition (Option α): full-viewport split. Photo zone left 58%,
          ink-letterboxed, full-bleed wooden tray AVIF, parallax retained, no
          scrim — the photo's own light contrast carries. Paper zone right
          42% holds the headline, compressed lede, and single primary CTA.
          The bracketed word `[ suppressed ]` renders at clamp(140px, 16vw,
          280px) via the new Bracket size="saks" variant — the bracket
          characters become the brand mark at hero scale, not inline
          formatting (Saks Fifth Avenue identity reference).

          Relaxed bans (per dispatch #2): dual-CTA convention suspended (single
          CTA only; audit CTA relocates to FounderStrip), eyebrow-above-headline
          suspended (A24 bottom-left credit replaces it), hero-fineprint
          suspended (covered by FounderStrip + SiteFooter), hero-lede 38→20
          words.

          References:
          - The Modern House (themodernhouse.com) — split-composition lead.
          - Pentagram Saks Fifth Avenue (case study) — logotype-scale typography.
          - A24 single-film overview pages — bottom-left mono credit register. */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative isolate overflow-hidden bg-[color:var(--color-paper)] grid grid-cols-1 lg:grid-cols-[58fr_42fr]"
        style={{ height: '100vh', minHeight: '640px' }}
      >
        {/* Photo zone — full-bleed, ink-letterboxed (so asymmetric crops blend
            into the section edge), warm-treated wooden-tray AVIF. No scrim
            in Option α — the photo's own composition carries the contrast and
            keeps the typographic event on paper, not on a darkened image.
            Mobile: this zone stacks on top, min-height 56vh. */}
        <div
          className="relative overflow-hidden bg-[color:var(--color-ink)] max-lg:min-h-[56vh]"
        >
          <HeroParallaxFigure className="absolute inset-0 w-full h-full">
            <Image
              src="/marketing/hero/hero.avif"
              alt="A wooden compartmented tray displaying unbranded artisan goods — small jars, brass mortar, dried herbs — in warm afternoon side-light."
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
              style={{
                objectPosition: 'center',
                filter: 'var(--image-treatment-warm)',
              }}
            />
          </HeroParallaxFigure>

          {/* A24 single-film bottom-left credit. Replaces the prior top
              eyebrow. Tiny mono uppercase tracking-loose; sits on the photo's
              dark wooden-base region (mean luminance ~0.14, paper-on-ink at
              #F0EFE8 ⇒ ≈7.8:1, AAA at small text floor). aria-label expands
              the dot-separators for screen readers (matches Chapter 2 A.5
              pattern). */}
          <p
            aria-label="Flintmere catalog readiness scan, 2026, takes 60 seconds, no install required"
            className="absolute font-mono uppercase"
            style={{
              bottom: 'clamp(32px, 3vw, 48px)',
              left: 'clamp(32px, 4vw, 64px)',
              right: 'clamp(24px, 3vw, 48px)',
              fontSize: 'clamp(11px, 1vw, 13px)',
              letterSpacing: '0.18em',
              fontWeight: 500,
              color: 'var(--color-paper-on-ink)',
            }}
          >
            Flintmere · Catalog readiness scan · 2026 · 60 seconds, no install
          </p>
        </div>

        {/* Paper zone — Saks-scale typography on warm paper. The Bracket
            saks variant carries the brand-mark scale; the running text flows
            at clamp(56px, 9vw, 144px). No scrim, no overlay — the colour-edge
            (warm photo to paper) is the rule. */}
        <div
          className="relative flex flex-col justify-center"
          style={{
            paddingLeft: 'clamp(32px, 5vw, 96px)',
            paddingRight: 'clamp(32px, 4vw, 64px)',
            paddingTop: 'clamp(48px, 6vw, 96px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <ViewportReveal>
            <h1
              id="hero-heading"
              className="font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)] max-w-[14ch]"
              style={{ fontSize: 'clamp(56px, 9vw, 144px)' }}
            >
              Which of your products are{' '}
              <Bracket size="saks">suppressed</Bracket>
              {' '}in Google Shopping today?
            </h1>
          </ViewportReveal>

          {/* Compressed lede (38 → 20 words) per spec §2.5. Geist Sans (NOT
              mono — mono at body scale on paper reads as code-block). Mute on
              paper ≈ 6.3:1, AAA. */}
          <p
            className="font-sans"
            style={{
              marginTop: 'clamp(28px, 3vw, 48px)',
              maxWidth: '42ch',
              fontSize: 'clamp(15px, 1.1vw, 17px)',
              lineHeight: 1.55,
              fontWeight: 400,
              color: 'var(--color-mute)',
            }}
          >
            Paste your URL. We estimate how much annual demand is routing to
            competitors while these products stay suppressed — and show the
            catalog data costing you the sale.
          </p>

          {/* Single primary CTA — radical-reduction per spec §2.4. The audit
              CTA relocates to FounderStrip (Chapter 3) where the founder copy
              earns the ask. Amber fill, mono uppercase 12px, tracking 0.14em
              — visual unchanged from prior hero. */}
          <div style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}>
            <Link
              href="/scan"
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
            >
              Run the scan
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Decorative sage hairline — relocated from photo zone (prior
              composition) to paper zone bottom-left. Anchors the typography
              column to the structural grid (same role The Modern House
              listings give their single hairline rule). Sage on paper ≈
              5.5:1 — well above the 3:1 non-text decorative floor per ADR
              0021 §sage. */}
          <div
            aria-hidden="true"
            className="absolute h-[2px]"
            style={{
              left: 'clamp(32px, 5vw, 96px)',
              bottom: 'clamp(32px, 4vw, 56px)',
              width: 'clamp(160px, 12vw, 240px)',
              background: 'var(--color-accent-sage)',
              opacity: 0.85,
            }}
          />
        </div>
      </section>

      {/* Chapter 2 — Pillars (Bureau Mirko Borsche embodiment, 2026-04-28).
          Replaces the centred Pentagram cover at e50d9c4. First dispatch under
          design-extravagant. Zone A: full-bleed cover with oversized [ 07 ]
          numeral hard-right-bleeding past viewport edge, two-line Bloomberg-
          cadence headline (line 1 weight 500, line 2 weight 700), hand-drawn
          sage SVG arrow pointing from headline to numeral, A24 mono film-credit
          caption bottom-left. Zone B: preserved intro paragraph + seven-pillar
          list with visual-weight-by-data-weight scaling.
          References: mirkoborsche.com (lead — type-bleeds-off-page);
          Bloomberg Businessweek Richard-Turley-era covers (secondary —
          headline-as-cover, weight-shift cadence); A24 single-film overview
          pages (tertiary — bottom-left mono film-credit register). */}
      <section
        id="pillars"
        aria-labelledby="pillars-heading"
        className="relative isolate overflow-x-hidden"
      >
        {/* Zone A — Bureau Mirko Borsche project-cover.
            Full-bleed within the page. Section-level overflow-x-hidden clips
            the bleeding `]` at the viewport edge without disturbing body
            scroll. Two-column grid at desktop; stacks at <768px. */}
        <div
          className="relative grid items-center min-h-[100vh] max-md:min-h-[80vh] max-md:flex max-md:flex-col max-md:justify-center"
          style={{
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
            paddingTop: 'clamp(48px, 6vw, 96px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
            paddingLeft: 'clamp(32px, 4vw, 64px)',
            paddingRight: '0',
          }}
        >
          {/* A.4 — Mono eyebrow, top-left of the cover (asymmetric placement,
              negative-space discipline per Bureau-MB). */}
          <p
            data-reveal
            className="absolute font-mono uppercase"
            style={{
              top: 'clamp(32px, 4vw, 64px)',
              left: 'clamp(32px, 4vw, 64px)',
              fontSize: 'clamp(11px, 1.2vw, 13px)',
              letterSpacing: '0.18em',
              color: 'var(--color-mute)',
              fontWeight: 500,
              ['--reveal-delay' as string]: '60ms',
            }}
          >
            // the seven checks
          </p>

          {/* A.2 — Headline column (left, vertically centred).
              Two `<span>` lines wrapped inside one `<h2>`. Line 1 weight 500
              sets the informational frame; line 2 weight 700 lands the
              consequence — Bloomberg-cadence weight shift permitted at ≥80px
              per ADR 0021 axis 5. */}
          <div className="flex flex-col justify-center max-md:items-start max-md:order-1">
            <h2
              id="pillars-heading"
              data-reveal
              className="font-sans tracking-[-0.04em] leading-[0.95] max-w-[22ch]"
              style={{
                fontSize: 'clamp(48px, 7vw, 104px)',
                color: 'var(--color-ink)',
                ['--reveal-delay' as string]: '120ms',
              }}
            >
              <span className="block font-medium">
                An AI agent reads your catalog in seven passes.
              </span>
              <span className="block font-bold">
                Fail one, lose the sale.
              </span>
            </h2>
          </div>

          {/* A.1 + A.3 — Right column carries the numeral and the arrow.
              `flex-end` justification + the translateX bleed produces the
              hard-right cut. The arrow is absolute-positioned within this
              relative wrapper so it sits in the gap between headline and
              numeral. */}
          <div className="relative flex items-center justify-end max-md:order-2 max-md:w-full max-md:mt-8">
            {/* A.3 — Hand-drawn sage SVG arrow.
                Inline path data with deliberate bezier wobble + asymmetric
                arrowhead. Responsive width via clamp. Decorative ornament
                per ADR 0021 §Decoration earns its keep when beautiful —
                sage `#5A6B4D` on paper at ~5.5:1, well above 3:1 non-text
                AA floor. Rotates 90° down at mobile via CSS transform.
                Reference: Bureau Mirko Borsche project pages (hand-drawn
                marks alongside display type). */}
            <svg
              aria-hidden="true"
              data-reveal
              viewBox="0 0 200 28"
              preserveAspectRatio="none"
              className="absolute pointer-events-none max-md:rotate-90 max-md:-translate-y-12"
              style={{
                width: 'clamp(96px, 11vw, 200px)',
                height: 'auto',
                left: 'calc(-1 * clamp(96px, 11vw, 200px) - 24px)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-accent-sage)',
                ['--reveal-delay' as string]: '240ms',
              }}
            >
              {/* Wobbly horizontal stroke — three quadratic beziers with
                  off-axis control points produce the hand-drawn cadence.
                  NOT a straight line; NOT auto-CAD. */}
              <path
                d="M 4 14 Q 40 11, 70 15 Q 110 18, 140 13 Q 165 11, 184 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Asymmetric arrowhead — top stroke ~8px, bottom stroke ~6px.
                  Drawn-in-30-seconds cadence. */}
              <path
                d="M 176 7 L 188 14 L 178 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* A.1 — The oversized [ 07 ] numeral.
                Geist Mono weight 700 at clamp(280px, 42vw, 720px). The
                translateX(min(8vw, 80px)) push past the right edge produces
                the closing `]` half-cut — Bureau-MB's signature
                type-bleeds-off-page move. aria-hidden because the seven
                <Pillar> rows below carry the canonical enumeration. */}
            <span
              aria-hidden="true"
              data-reveal
              className="font-mono leading-[0.85] block max-md:self-end"
              style={{
                fontSize: 'clamp(280px, 42vw, 720px)',
                color: 'var(--color-ink)',
                fontWeight: 700,
                transform: 'translateX(min(8vw, 80px))',
              }}
            >
              <Bracket>07</Bracket>
            </span>
          </div>

          {/* A.5 — Bottom-left film-credit caption (A24 register).
              Middle-dot separators (U+00B7), uppercase mono, --color-mute on
              paper at 6.3:1. aria-label expands the dots-as-separators for
              screen readers. */}
          <p
            className="absolute font-mono uppercase"
            aria-label="Flintmere homepage section 02 — catalog readiness"
            style={{
              bottom: 'clamp(24px, 3vw, 48px)',
              left: 'clamp(32px, 4vw, 64px)',
              fontSize: 'clamp(10px, 0.85vw, 12px)',
              letterSpacing: '0.18em',
              color: 'var(--color-mute)',
              fontWeight: 500,
            }}
          >
            Flintmere · Catalog readiness · 2026 · Section 02
          </p>
        </div>

        {/* Zone B — pillar list (intro paragraph + amplified rows). */}
        <div
          className="mx-auto max-w-[1280px] px-8"
          style={{
            paddingTop: 'clamp(96px, 12vh, 160px)',
            paddingBottom: 'clamp(96px, 12vh, 160px)',
          }}
        >
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
        </div>
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

