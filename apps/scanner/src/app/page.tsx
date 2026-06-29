import Image from 'next/image';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';

// Mark the homepage statically renderable. The page has no dynamic data
// — no cookies, no headers reads, no per-request DB calls. Force-static
// + 24-hour revalidate caches the rendered HTML so every visit gets a
// pre-built response instead of re-rendering the React tree. Critical
// for mobile Coolify-CPU-bound TTFB.
export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata = {
  alternates: { canonical: '/' },
};
import { ViewportReveal } from '@/components/ViewportReveal';
import { MarketingStickyCta } from '@/components/MarketingStickyCta';
import { type PillarSpec } from '@/components/sections/PillarWheel';
import { SCAN_URL } from '@/lib/host-routing';

// Below-fold heavy client sections — lazy-mounted via next/dynamic to
// keep the homepage initial JS bundle small. Mobile PageSpeed
// (2026-05-05) showed TBT 1,570ms largely from PillarWheel +
// ManifestoChord parse/execute cost; this defers their JS until after
// first paint. SSR is disabled (Next.js 15 forbids ssr:false in Server
// Components, so the dynamic call lives inside a 'use client' wrapper).
// SEO is preserved because Googlebot executes JS. Each wrapper renders
// a height placeholder to prevent CLS while the chunk loads.
import { PillarWheelScrollPin } from '@/components/sections/LazyPillarWheelScrollPin';
import { FounderStrip } from '@/components/sections/LazyFounderStrip';
import { ManifestoChord } from '@/components/sections/LazyManifestoChord';
import { ScanCallout } from '@/components/sections/ScanCallout';
import { MerchantCenterSection } from '@/components/sections/MerchantCenterSection';

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
    <main id="main" className="flintmere-main flintmere-main--curtain">
      <a href="#hero" className="skip-link">Skip to content</a>
      <MarketingStickyCta href={SCAN_URL} label="Run a free scan" glyph="→" />
      <ViewportReveal>
      {/* Chapter 1 — Hero. Two compositions, one section:
          - Desktop (≥lg): Modern House split. Photo zone 58% left, paper
            zone 42% right with ink-on-paper headline. A24 bottom-left
            mono credit on the photo. No scrim — the colour-edge does the
            work. Sage hairline anchors the paper column.
          - Mobile (<lg): overlay composition. Photo fills the viewport;
            headline + lede + CTA sit on top, anchored to the bottom of
            the viewport, with a calibrated bottom-up scrim so paper-on-
            ink text reads at AA-floor contrast where it lives.

          Parallax removed 2026-05-11 — operator caught it post-deploy
          and called it wasted on the still image. Wrapper component
          (HeroParallaxFigure) remains in src/components/ but is no
          longer wired; safe to delete in a follow-up sweep.

          Spec source of truth:
          context/design/extravagant/2026-04-29-chapter-1-hero-modern-house-saks.md.

          References:
          - The Modern House (themodernhouse.com) — split-composition lead (desktop).
          - Pentagram Saks Fifth Avenue (case study) — logotype-scale typography.
          - A24 single-film overview pages — bottom-left mono credit register. */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative isolate overflow-hidden bg-[color:var(--color-paper)] grid grid-cols-1 lg:grid-cols-[58fr_42fr] lg:min-h-screen max-lg:h-[100svh] max-lg:min-h-[640px]"
      >
        {/* Photo zone — full-bleed wooden-tray AVIF. On mobile, this is
            the entire backdrop (the paper zone overlays via absolute
            positioning). On desktop, left 58% column. */}
        <div
          className="relative overflow-hidden bg-[color:var(--color-ink)]"
        >
          <div className="absolute inset-0 w-full h-full">
            {/* Explicit intrinsic width/height (1344×768 — the source AVIF
                dimensions) instead of `fill`. With `unoptimized` Next.js
                renders a bare <img>; squirrelscan's CLS rule (and Lighthouse)
                want width/height attributes on it to reserve layout space.
                Visual: w-full h-full + object-cover keeps full-bleed
                behaviour identical to the prior fill mode.

                fetchPriority + loading explicit. With `fill`, Next.js
                Image auto-emits fetchpriority="high" + loading="eager"
                on `priority` images. With explicit width/height +
                `unoptimized`, that auto-emit doesn't fire — the
                rendered <img> ships without LCP-priority hints. Caught
                2026-05-05 (operator screenshot): mobile PageSpeed
                regressed 99 → 95, LCP 2.0s → 2.6s, "fetchpriority/high
                should be applied" surfaced as the primary diagnostic.
                Setting both props explicitly restores the hints. */}
            <Image
              src="/marketing/hero/hero.avif"
              alt="A wooden compartmented tray displaying unbranded artisan goods — small jars, brass mortar, dried herbs — in warm afternoon side-light."
              width={1344}
              height={768}
              priority
              unoptimized
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover w-full h-full"
              style={{
                objectPosition: 'center',
                filter: 'var(--image-treatment-warm)',
              }}
            />
          </div>

          {/* Mobile-only scrim — bottom-up gradient. Calibrated for AA
              text contrast in the lower 55% of viewport (where the
              overlaid headline + lede + CTA sit) while letting the image
              breathe at the top. Opacity steps:
                bottom edge (CTA + lede region): 0.82 — paper-on-ink ≈6:1
                mid-low (headline lower half):   0.62 — large display reads fine
                mid-high (headline top + bracket): 0.32 — still legible at h1 scale
                top:                              0.00 — image clean
              Pure rgba on warm ink hex; could be color-mix(var(--color-ink))
              but RGBA blends predictably across browsers. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 lg:hidden pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(20, 18, 14, 0.88) 0%, rgba(20, 18, 14, 0.84) 42%, rgba(20, 18, 14, 0.55) 62%, rgba(20, 18, 14, 0.25) 80%, rgba(20, 18, 14, 0.08) 92%, transparent 100%)',
            }}
          />

          {/* A24 single-film bottom-left credit — desktop only. On mobile,
              the overlaid headline + lede + CTA stack already occupies the
              bottom region of the viewport, so this credit would collide.
              Paper-on-ink at #F0EFE8 over the photo's dark wooden-base
              region (mean luminance ~0.14) gives ≈7.8:1, AAA at small text. */}
          <p
            aria-label="Flintmere catalog data scan, 2026, takes 60 seconds, no install required"
            className="absolute font-mono uppercase max-lg:hidden"
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
            Flintmere · Catalog data scan · 2026 · 60 seconds, no install
          </p>
        </div>

        {/* Paper / text zone — two roles. Desktop: right 42% column on
            warm paper, ink-on-paper text, sage hairline anchor. Mobile:
            absolute overlay on top of the photo zone (covers the whole
            section, transparent background, paper-on-ink text colours),
            anchored to the bottom of the viewport via justify-end. */}
        <div
          className="relative flex flex-col lg:justify-center max-lg:absolute max-lg:inset-0 max-lg:justify-end max-lg:bg-transparent max-lg:z-10"
          style={{
            paddingLeft: 'clamp(24px, 5vw, 96px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(48px, 6vw, 96px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <ViewportReveal>
            <h1
              id="hero-heading"
              className="font-sans tracking-[-0.04em] leading-[0.88] max-w-[14ch] text-[color:var(--color-ink)] max-lg:text-[color:var(--color-paper-on-ink)]"
              style={{ fontSize: 'var(--scale-h1-anchor)', fontWeight: 700 }}
            >
              Which of your products are{' '}
              <Bracket size="saks">suppressed</Bracket>
              {' '}in Google Shopping today?
            </h1>
          </ViewportReveal>

          {/* Compressed lede (38 → 20 words). Geist Sans (NOT mono — mono at
              body scale reads as code-block). On paper: mute ≈ 6.3:1 AAA.
              On ink-scrim (mobile): mute-inv ≈ 5.6:1 AA at body scale. */}
          <p
            className="font-sans text-[color:var(--color-mute)] max-lg:text-[color:var(--color-paper-on-ink)]"
            style={{
              marginTop: 'clamp(28px, 3vw, 48px)',
              maxWidth: '42ch',
              fontSize: 'clamp(15px, 1.1vw, 17px)',
              lineHeight: 1.55,
              fontWeight: 400,
            }}
          >
            Paste your URL. We estimate how much annual demand is routing to
            competitors while these products stay suppressed — and show the
            catalog facts behind it.{' '}
            <span className="max-lg:hidden">
              Most fixes are food-specific: a wrong GTIN, a missing allergen, a
              field no channel can read off your description.
            </span>
          </p>

          {/* Single primary CTA — amber fill, mono uppercase 12px,
              tracking 0.14em. Visual identical across breakpoints; the
              amber-on-ink composition reads well on both paper and the
              scrim'd image. */}
          <div style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}>
            <Link
              href={SCAN_URL}
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
            >
              Run the scan
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Decorative sage hairline — desktop only. Anchors the paper
              column to the structural grid. On mobile the scrim is the
              structural anchor; an additional hairline would compete. */}
          <div
            aria-hidden="true"
            className="absolute h-[2px] max-lg:hidden"
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
            className="eyebrow-hero mb-12 lg:mb-16"
            style={{ ['--reveal-delay' as string]: '60ms' }}
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
            style={{ fontSize: 'clamp(36px, 6vw, 96px)' }}
          >
            <span className="sr-only">
              Catalog standardises the format. We fix the facts a food agent needs to transact.
            </span>
            {(() => {
              const LINE_1 = 'Catalog standardises the format.'.split(' ');
              // Bold punchline hard-authored into three sub-lines so wraps
              // fall on phrase boundaries — deterministic at every width
              // (no ragged reflow). One continuous cascade via a global index.
              const LINE_2 = [
                'We fix the facts'.split(' '),
                'a food agent'.split(' '),
                'needs to transact.'.split(' '),
              ];
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
                  {(() => {
                    let g = 0;
                    return LINE_2.map((line, li) => {
                      const block = (
                        <span
                          key={`l2-${li}`}
                          className={`block font-bold${li === 0 ? ' mt-2' : ''}`}
                        >
                          {line.map((word, i) => (
                            <span
                              key={`l2-${li}-${i}`}
                              data-reveal
                              style={{
                                display: 'inline-block',
                                marginRight: i < line.length - 1 ? '0.28em' : 0,
                                ['--reveal-delay' as string]: `${line1Total + LINE_GAP + (g + i) * STAGGER_2}ms`,
                              }}
                            >
                              {word}
                            </span>
                          ))}
                        </span>
                      );
                      g += line.length;
                      return block;
                    });
                  })()}
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

      {/* Chapter 2.5 — Post-Pillars scan re-invite. Operator caught
          2026-05-11 that the page had no free-scan CTA between the hero
          and the footer; the FounderStrip CTA points at the paid £197
          audit, not the free scan. This callout sits on opaque paper at
          z:1 (matching the curtain-pair). */}
      <ScanCallout
        eyebrow="// your turn"
        headline="Run the seven checks on your store."
      />

      {/* Chapter 2.9 — Ground truth (Merchant Center connection). Added
          2026-06-09 to satisfy Google OAuth verification homepage
          requirement #3 (the consent-screen homepage must describe the
          app's functionality — specifically the Google Merchant Center
          read-scope integration the verified OAuth app requests). In
          normal flow on opaque paper, NOT in the curtain-pair, so a
          reviewer scrolling reaches a plainly-rendered description.
          Component: components/sections/MerchantCenterSection.tsx. */}
      <MerchantCenterSection />

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

      {/* Chapter 4.5 — Post-Manifesto scan re-invite. Picks up the user
          where the chord left them ("this is what an AI agent reads on
          your store. The rest is invisible.") with the natural follow-up:
          see what's invisible on YOUR store. Sits between curtain-pair
          and the sticky footer reveal. */}
      <ScanCallout
        eyebrow="// now yours"
        headline="See what's invisible on your store."
      />

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

