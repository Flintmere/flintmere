import Image from 'next/image';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { ViewportReveal } from '@/components/ViewportReveal';
import { HeroParallaxFigure } from '@/components/HeroParallaxFigure';
import { type PillarSpec } from '@/components/sections/PillarWheel';
import { PillarWheelScrollPin } from '@/components/sections/PillarWheelScrollPin';
import { FounderStrip } from '@/components/sections/FounderStrip';
import { ManifestoChord } from '@/components/sections/ManifestoChord';

/**
 * Marketing home — Batch B expand-to-five arc 2026-04-29.
 * Five chapters: Hero · Pillars · FounderStrip · Manifesto · Footer.
 *
 * Chapter 4 (ManifestoChord) is the new chord between proof and close,
 * sitting on opaque paper at z:1. Chapter 5 (Footer) is pinned beneath
 * via .flintmere-footer-sticky, so as chapter 4 scrolls off, the wordmark
 * curtain is uncovered. The reveal mechanic is CSS-only — see
 * apps/scanner/src/app/globals.css §Sticky-footer reveal.
 *
 * Spec: context/design/extravagant/2026-04-29-batch-b-five-chapter-spec.md.
 */

const PILLARS: PillarSpec[] = [
  {
    name: 'Product IDs',
    headline: "Without IDs, you don't exist.",
    weight: '20%',
    weightPct: 0.2,
    looksFor:
      'GTIN, MPN or brand on every product variant — set as structured Shopify metafields, not buried in description text.',
    commonMiss:
      '"Brand: Generic" or empty MPN. Agents skip the listing because they cannot disambiguate the product from look-alikes.',
    whatToDo:
      'Backfill GTIN where you have one, MPN where you do not, and brand on every variant. Five minutes per product, properly categorised, beats five hours of guesswork at the checkout.',
    image: '/marketing/pillars/01-product-ids.webp',
    imageAlt:
      'A small printed paper barcode sticker on a plain unbranded brown kraft parcel, soft daylight from upper-left, warm cream backdrop.',
  },
  {
    name: 'Structured attributes',
    headline: 'Specs as data. Or specs nowhere.',
    weight: '20%',
    weightPct: 0.2,
    looksFor:
      'Size, colour, material, dimensions exist as named metafields the agent can read directly.',
    commonMiss:
      'Specs live inside the description HTML. Agents cannot filter or compare your product against a query.',
    whatToDo:
      'Move every filterable attribute (size, colour, material, dimensions) out of free-text and into named metafields. Then audit your description for fields you can extract back into structured data.',
    image: '/marketing/pillars/02-structured-attributes.webp',
    imageAlt:
      'A stack of four small cream-coloured woven garment care labels, fanned slightly, soft daylight, warm cream backdrop.',
  },
  {
    name: 'Title & description quality',
    headline: "Spec sheets sell. Prose doesn't.",
    weight: '15%',
    weightPct: 0.15,
    looksFor:
      'Titles read like spec sheets — concrete materials, dimensions, model. Descriptions extend the spec, they do not pitch.',
    commonMiss:
      'Marketing prose dense with adjectives but no parsable spec. Agents have nothing to extract.',
    whatToDo:
      'Rewrite titles to lead with brand, product, key spec. Move marketing language to the end. Descriptions: facts first, story second.',
    image: '/marketing/pillars/03-title-quality.webp',
    imageAlt:
      'An open vintage hardcover ledger book showing neatly ruled cream pages with no text, soft daylight, warm cream backdrop.',
  },
  {
    name: 'Google category match',
    headline: 'Categorised, or invisible.',
    weight: '15%',
    weightPct: 0.15,
    looksFor:
      'Every product mapped to a Google Merchant Center taxonomy node, so the agent knows what category your product belongs in.',
    commonMiss:
      'Default or missing category. Your product is not classified for Google Shopping and falls out of the comparison set.',
    whatToDo:
      'Map every product to a specific Google Merchant taxonomy node — not the parent category, the leaf. The more specific, the more agents include you in their comparison set.',
    image: '/marketing/pillars/04-category-match.webp',
    imageAlt:
      'An old wooden library card-catalog drawer half pulled open, revealing densely packed cream index cards in alphabetical order.',
  },
  {
    name: 'Data consistency',
    headline: 'Sloppy reads as suspicious.',
    weight: '15%',
    weightPct: 0.15,
    looksFor:
      'Live images, in-stock active variants, alt text on every image, and prices that match between product pages and the feed.',
    commonMiss:
      '404 image URLs, ghost variants left active, or price drift between PDP and the feed. Agents read inconsistency as low quality.',
    whatToDo:
      'Run a weekly catalog audit: dead images, stale variants, price drift, missing alt text. Five minutes a week prevents being filtered out as low-quality data.',
    image: '/marketing/pillars/05-data-consistency.webp',
    imageAlt:
      'Three identical small cream ceramic jars in a neat horizontal row, the middle one with a tiny chip at the rim, on a wooden surface.',
  },
  {
    name: 'AI agent access',
    headline: 'Locked out, ranked out.',
    weight: '5%',
    weightPct: 0.05,
    looksFor:
      'robots.txt and sitemap permit the indexing your store needs; llms.txt declares scope for AI agents.',
    commonMiss:
      'Default robots.txt blocking AI user-agents you did not mean to block. The agent never reaches your catalog.',
    whatToDo:
      'Audit your robots.txt for accidental AI user-agent blocks. Publish llms.txt at the root with the catalog scope and rate-limit guidance. Submit your sitemap to Google Merchant.',
    image: '/marketing/pillars/06-agent-access.webp',
    imageAlt:
      'An antique tarnished brass key resting beside an open vintage iron padlock on a wooden surface.',
  },
  {
    name: 'Agent checkout readiness',
    headline: 'Reach the cart. Win the cart.',
    weight: '10%',
    weightPct: 0.1,
    looksFor:
      'Cart and checkout work without human-only steps. The end-to-end purchase path is reachable by an automated agent.',
    commonMiss:
      'SMS verification or human captcha at checkout. Agents reach the purchase step, then bounce off the wall.',
    whatToDo:
      'Audit your checkout for human-only steps. SMS verification, captchas, and required account creation all kill agent purchases. Use Shop Pay or guest checkout as the agent-accessible path.',
    image: '/marketing/pillars/07-checkout-readiness.webp',
    imageAlt:
      'A small empty woven wicker shopping basket with a worn leather handle, sitting on a wooden floor in soft daylight.',
  },
];

export default function MarketingHome() {
  return (
    <main id="main" className="flintmere-main">
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

      {/* Chapter 2 — Pillars (v7 — the Diagnostic Wheel, 2026-04-29).
          Spec: context/design/extravagant/2026-04-29-chapter-2-pillars-wheel.md.
          The seven pillars rendered as a weighted radial donut: each wedge
          angled by its weight (20% → 72°, 5% → 18°). The marketing page
          reuses the scanner's signature ScoreRing composition — annulus
          + hollow centre + ordinal numeral — so the merchant learns the
          diagnostic visual before ever running a scan. Click or arrow-key
          cycles the active wedge; the editorial panel updates to show
          "what we check" + "common miss" for the active pillar. Replaces
          v6 (linear Hodinkee list) — operator-rejected as default-reflex.
          Operator instruction: "extravagant means experiment use colour
          be bold be brave." */}
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
          {/* Chapter 2 headline — Apple-pattern word-cascade with beat
              (2026-04-29). Each word fades up independently with 120ms
              stagger on line 1 (medium weight, the assertion) and 150ms
              stagger on line 2 (bold weight, the punchline) with a 300ms
              pause between lines. Mimics Apple iPhone 17 Pro display-
              headline cadence — each word a footstep. The h2 itself is
              read as one phrase by screen readers; word spans are
              decorative-only via aria-hidden, so the audio narration
              stays clean prose. */}
          <h2
            id="pillars-heading"
            className="font-sans tracking-[-0.04em] leading-[0.92] max-w-[26ch] text-[color:var(--color-ink)]"
            style={{ fontSize: 'clamp(48px, 7vw, 112px)' }}
          >
            <span className="sr-only">
              An AI agent reads your catalog in seven passes. Fail one, lose the sale.
            </span>
            {(() => {
              const LINE_1 = 'An AI agent reads your catalog in seven passes.'.split(' ');
              const LINE_2 = 'Fail one, lose the sale.'.split(' ');
              const ENTRY_DELAY = 200;
              const STAGGER_1 = 120;
              const LINE_GAP = 300;
              const STAGGER_2 = 150;
              const line1Total = ENTRY_DELAY + LINE_1.length * STAGGER_1;
              return (
                <span aria-hidden="true">
                  <span className="block font-medium">
                    {LINE_1.map((word, i) => (
                      <span
                        key={`l1-${i}`}
                        data-reveal
                        style={{
                          display: 'inline-block',
                          marginRight: i < LINE_1.length - 1 ? '0.28em' : 0,
                          ['--reveal-delay' as string]: `${ENTRY_DELAY + i * STAGGER_1}ms`,
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </span>
                  <span className="block font-bold mt-2">
                    {LINE_2.map((word, i) => (
                      <span
                        key={`l2-${i}`}
                        data-reveal
                        style={{
                          display: 'inline-block',
                          marginRight: i < LINE_2.length - 1 ? '0.28em' : 0,
                          ['--reveal-delay' as string]: `${line1Total + LINE_GAP + i * STAGGER_2}ms`,
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </span>
                </span>
              );
            })()}
          </h2>
          {/* Decorative sage hairline anchor — structural-decorative use
              per ADR 0021 §Accent §Decorative. Sweeps in AFTER the
              headline cadence completes (~3000ms after section entry). */}
          <div
            aria-hidden="true"
            data-reveal
            className="mt-16 lg:mt-20"
            style={{
              height: '2px',
              width: 'clamp(160px, 14vw, 280px)',
              background: 'var(--color-accent-sage)',
              opacity: 0.85,
              ['--reveal-delay' as string]: '3000ms',
            }}
          />
        </div>

        {/* Section body — the diagnostic wheel, scroll-pinned (2026-04-29).
            Apple-pattern: wheel pins at viewport top inside a 450vh
            runway; scroll progress 0→1 advances the active pillar 0→6.
            Seven wedges angled by weight (20%→72°, 5%→18°), centre carries
            active ordinal, side panel shows "what we check" + "common miss"
            for the active pillar. Mirrors the scanner's ScoreRing.
            Reduced-motion users get the unpinned wheel with native click/
            keyboard interaction. */}
        <PillarWheelScrollPin pillars={PILLARS} />
        <p className="sr-only">
          Each pillar carries the weight shown. Your final score is a
          weighted average across the seven, out of 100.
        </p>
      </section>

      {/* Curtain pair — chapters 3 + 4 share a position:relative wrapper
          so chapter 3's sticky-bottom-0 unsticks at the wrapper's bottom
          (end of chapter 4) instead of all the way to <main>'s end.
          Without this bounded containing block, founder + footer (both at
          z:-1 sticky) collided at end of scroll and source-order painted
          the footer over the founder strip. See globals.css §Curtain-pair. */}
      <div className="flintmere-curtain-pair">
        {/* Chapter 3 — Founder strip (sticky reveal bounded by curtain-pair) */}
        <FounderStrip />

        {/* Chapter 4 — Manifesto chord (Batch B, 2026-04-29).
            Single bracketed thesis sentence on paper, one viewport, the chord
            before the footer curtain. Copy picked by claim-review:
            context/design/extravagant/2026-04-29-chapter-4-manifesto-claim-review.md */}
        <ManifestoChord />
      </div>

      {/* Chapter 5 — Footer (sticky-reveal mechanic; Batch B 2026-04-29).
          Pinned at viewport bottom (z:0) via .flintmere-footer-sticky;
          chapters 1–4 scroll over it on opaque paper (z:1). The wordmark
          weight bumped 500→700 (relaxation-axis legal per ADR 0021); the
          locked clamp(80,10vw,160) sizing is preserved. */}
      <SiteFooter />
      </ViewportReveal>
    </main>
  );
}

