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
              className="font-medium tracking-[-0.04em] leading-[0.88] text-[color:var(--color-ink)] max-w-[14ch]"
              style={{ fontSize: 'clamp(48px, 7vw, 112px)' }}
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

      {/* Chapter 2 — Pillars (v3 — list-as-design, 2026-04-29).
          Replaces the Bureau-MB cover at 63e0a41 — that composition's
          two-column grid + numeral-bleed produced catastrophic overlap
          at narrow desktop viewports (the `[ 0 7 ]` characters collided
          with the headline column). The list IS the cover; v3 trusts
          the seven amplified pillar rows to carry the section without
          a borrowed cover above them.
          References: Order Form magazine (lead — typography-led indie-mag
          where the explicit grid IS the design language); Areena's index
          numerals (secondary — display-scale ordinals as section anchors);
          Anthony Burrill (tertiary — bold declarative typography as the
          entire surface, no decoration competing with the rows). */}
      <section
        id="pillars"
        aria-labelledby="pillars-heading"
        className="bg-[color:var(--color-paper)]"
      >
        {/* Section opener — single column, contained typography, no
            overflow risk. The eyebrow + two-line headline carry the
            opening; a 2px sage hairline anchors the bottom-left as
            structural-decorative ornament (ADR 0021 §Decoration earns
            its keep — sage on paper ≈5.5:1, decorative-ornament use). */}
        <div
          className="relative mx-auto max-w-[1280px] px-8 lg:px-12"
          style={{
            paddingTop: 'clamp(96px, 14vh, 200px)',
            paddingBottom: 'clamp(72px, 10vh, 144px)',
          }}
        >
          <p
            data-reveal
            className="font-mono uppercase mb-12 lg:mb-16"
            style={{
              fontSize: 'clamp(11px, 1.2vw, 13px)',
              letterSpacing: '0.18em',
              color: 'var(--color-mute)',
              fontWeight: 500,
              ['--reveal-delay' as string]: '60ms',
            }}
          >
            // the seven checks
          </p>
          <h2
            id="pillars-heading"
            data-reveal
            className="font-sans tracking-[-0.04em] leading-[0.92] max-w-[26ch] text-[color:var(--color-ink)]"
            style={{
              fontSize: 'clamp(48px, 7vw, 112px)',
              ['--reveal-delay' as string]: '120ms',
            }}
          >
            <span className="block font-medium">
              An AI agent reads your catalog in seven passes.
            </span>
            <span className="block font-bold mt-2">
              Fail one, lose the sale.
            </span>
          </h2>
          {/* Decorative sage hairline anchor — structural-decorative use
              per ADR 0021 §Accent §Decorative. Sets up the rhythm to
              the list below. */}
          <div
            aria-hidden="true"
            data-reveal
            className="mt-16 lg:mt-20"
            style={{
              height: '2px',
              width: 'clamp(160px, 14vw, 280px)',
              background: 'var(--color-accent-sage)',
              opacity: 0.85,
              ['--reveal-delay' as string]: '240ms',
            }}
          />
        </div>

        {/* Section body — the seven amplified pillars carry the section.
            Order-Form-magazine register: explicit grid as design language;
            each row is a tiny editorial spread. Visual-weight-by-data-weight
            scaling preserved from v2 (20%→1.0, 15%→0.9, 10%→0.82, 5%→0.72)
            so the smallest pillar reads as quieter, not broken. */}
        <div
          className="mx-auto max-w-[1280px] px-8 lg:px-12"
          style={{ paddingBottom: 'clamp(96px, 12vh, 160px)' }}
        >
          <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
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
          {/* Section close — small mute methodology note in mono.
              Sits below the list as a quiet footer to the section,
              matching the editorial-spread cadence (the row IS the
              spread; this is the colophon). */}
          <p
            className="mt-16 lg:mt-20 max-w-[60ch] font-sans"
            style={{
              fontSize: 'clamp(13px, 1vw, 15px)',
              color: 'var(--color-mute)',
              lineHeight: 1.55,
            }}
          >
            Each pillar carries the weight shown. Your final score is a
            weighted average across the seven.
          </p>
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

