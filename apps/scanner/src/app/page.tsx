import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Bracket, SiteFooter, StatTriad, type Stat } from '@flintmere/ui';
import { ViewportReveal } from '@/components/ViewportReveal';
import { HomepageVerticalPicker } from '@/components/HomepageVerticalPicker';
import { HeroParallaxFigure } from '@/components/HeroParallaxFigure';
import { Pillar } from '@/components/sections/Pillar';
import { FounderStrip } from '@/components/sections/FounderStrip';
import { CompareSection } from '@/components/sections/CompareSection';
import { ManifestoSection } from '@/components/sections/ManifestoSection';
import { PricingStripPlaceholder } from '@/components/sections/PricingStripPlaceholder';
import { prisma } from '@/lib/db';
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary';

// Belt-and-braces: render per request so build never hits the DB. The
// live-sample line stays fresh without depending on a build-time crawl.
export const dynamic = 'force-dynamic';

/**
 * Homepage trust strip — Phase-C StatTriad data.
 *
 * Per amendment block in context/design/components/2026-04-26-stat-triad.md:
 *  - Eyebrows render as plain Mono labels (no brackets).
 *  - `60s` is the focal stat — gets the amber under-tick.
 *  - `£97` renders in --paper (ink-slab variant), NOT amber. The strip's
 *    single amber moment is the focal-numeral under-tick.
 *  - `numeralAriaLabel` provided where SR pronunciation is uncertain.
 *
 * MicroLines kept tight + sentence-case per amendment §upgrade b.
 */
const HOMEPAGE_STATS: ReadonlyArray<Stat> = [
  {
    eyebrow: 'scan',
    numeral: '7',
    microLine: 'Checks we run on every scan.',
  },
  {
    eyebrow: 'time',
    numeral: '60s',
    microLine: 'Time the free scan takes on a 5,000-product store.',
    numeralAriaLabel: '60 seconds',
  },
  {
    eyebrow: 'paid',
    numeral: '£97',
    microLine: 'One-off concierge audit. Fix CSV + 30-day re-scan.',
    numeralAriaLabel: 'ninety-seven pounds',
  },
];

async function loadLiveSample(): Promise<{
  show: boolean;
  median: number;
  n: number;
}> {
  const rows = await prisma.scan.findMany({
    where: {
      OR: [{ source: 'bot' }, { publishedToBenchmark: true }],
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    },
    select: { score: true, grade: true, vertical: true },
  });
  const typed: BenchmarkRow[] = rows.map((r) => ({
    score: r.score ?? 0,
    grade: r.grade ?? '',
    vertical: r.vertical,
  }));
  const summary = summariseBenchmark(typed);
  // Only surface on home once we clear the publish floor — below that
  // we quote the same numbers on /research as "early sample" but we
  // don't front-door them. Claim review (#9 + #23) — no median framing
  // at sub-publish-floor n.
  const show =
    summary.available &&
    !summary.preview &&
    summary.overall.medianScore !== null;
  return {
    show,
    median: summary.overall.medianScore ?? 0,
    n: summary.overall.n,
  };
}

export default async function MarketingHome() {
  const sample = await loadLiveSample();
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
              'linear-gradient(180deg, rgba(10,10,11,0.20) 0%, rgba(10,10,11,0.0) 28%, rgba(10,10,11,0.0) 60%, rgba(10,10,11,0.42) 100%)',
          }}
        />

        {/* Scrim layer 2 — horizontal strong ink fade left → transparent right.
            Provides AA contrast on overlay text; photo readable on the right. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(10,10,11,0.82) 0%, rgba(10,10,11,0.66) 30%, rgba(10,10,11,0.34) 58%, rgba(10,10,11,0.08) 82%, rgba(10,10,11,0) 100%)',
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
                  color: 'var(--color-accent-sage)',
                  fontWeight: 500,
                }}
              >
                // free scan · 60 seconds · no install
              </p>
              <ViewportReveal>
                <h1
                  className="font-bold tracking-[-0.045em] leading-[0.92] text-[clamp(56px,9vw,108px)] max-w-[18ch]"
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

      {/* Vertical picker + picker-driven content block (Phase B —
          context/design/specs/2026-04-26-homepage-food-first.md §3 + §4).
          Client component reads ?vertical= URL param and drives content swap
          via aria-live. Vertical names are NOT bracketed (cap stays at 2:
          hero h1 + audit £97). Suspense boundary required by Next.js 15 —
          useSearchParams forces a CSR boundary. */}
      <Suspense fallback={null}>
        <HomepageVerticalPicker />
      </Suspense>

      <hr className="rule" />

      {/* Numbers strip — Phase-C StatTriad primitive (ink-slab + focal=1).
          Per amendment: NO amber on £97; the strip's single amber moment is
          the focal-numeral under-tick on `60s`. Eyebrows are plain Mono
          labels (no brackets) — page bracket cap stays at 2.
          Per-stat numeralAriaLabel where SR pronunciation is uncertain. */}
      <StatTriad
        surface="ink-slab"
        focalIndex={1}
        ariaLabel="Key facts"
        stats={HOMEPAGE_STATS}
      />

      {sample.show ? (
        <section
          aria-label="Live sample"
          className="mx-auto max-w-[1280px] px-8 py-24 border-b border-[color:var(--color-line)]"
        >
          <p className="eyebrow mb-6 text-[color:var(--color-mute)]">
            Live · from our rolling sample
          </p>
          <div className="grid md:grid-cols-[auto_1fr] gap-12 items-end">
            <div>
              <p className="live-sample-numeral">
                {sample.median}
                <span aria-hidden="true" className="live-sample-undertick" />
              </p>
              <p className="live-sample-meta eyebrow mt-4 text-[color:var(--color-mute)]">
                / 100 · median
              </p>
            </div>
            <div className="pb-4">
              <p className="live-sample-lede max-w-[40ch]">
                The median score across {sample.n.toLocaleString()} mid-market
                Shopify catalogs in our rolling sample. Most fall short on the
                structured fields AI shopping agents actually filter on.
              </p>
              <p className="mt-6">
                <Link href="/research" className="underline eyebrow">
                  Read the full report →
                </Link>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Seven checks */}
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

      <hr className="rule" />

      {/* Before / After */}
      <section aria-labelledby="before-after-heading" className="grid md:grid-cols-2 border-b border-[color:var(--color-line)]">
        <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-[color:var(--color-line)]">
          <p className="eyebrow mb-6">How product pages used to work</p>
          <h3 id="before-after-heading" className="max-w-[18ch]">Titles written for Google. Humans did the rest.</h3>
          <p className="mt-6 text-[color:var(--color-ink-2)] max-w-[38ch]" style={{ fontSize: 16, lineHeight: 1.55 }}>
            Stuffed titles. Attributes buried in descriptions. Barcodes optional. Humans skimmed and filled in the gaps. The same catalog ranked fine in Google search for a decade.
          </p>
        </div>
        <div className="p-12 md:p-16">
          <p className="eyebrow mb-6">How they work now</p>
          <h3 className="max-w-[18ch]">Machines read every word and check every field.</h3>
          <p className="mt-6 text-[color:var(--color-ink-2)] max-w-[38ch]" style={{ fontSize: 16, lineHeight: 1.55 }}>
            ChatGPT, Perplexity and Claude don&rsquo;t skim. They verify barcodes, compare prices across pages, and reject products with missing fields. No field, no recommendation.
          </p>
        </div>
      </section>

      {/* What you get with the £97 audit */}
      <section
        aria-labelledby="audit-deep-heading"
        className="mx-auto max-w-[1280px] px-8 py-24"
      >
        <p className="eyebrow mb-6">What you get with the £97 audit</p>
        <h2 id="audit-deep-heading" className="max-w-[24ch]">
          A real scan. A real letter. A 30-day re-scan to prove it stuck.
        </h2>

        <div className="mt-12 grid md:grid-cols-[1.4fr_1fr] gap-12 items-start">
          {/* Audit screenshot anchor — proof of the £97 audit deliverable */}
          <figure
            className="audit-figure"
            data-reveal
            style={{ '--reveal-delay': '0ms' } as React.CSSProperties}
          >
            <Image
              src="/marketing/proof/audit-scan.avif"
              alt="Flintmere scanner results: a 49-out-of-100 score for a Shopify catalog where 1,000 of 1,000 products fail at least one AI-agent readiness check, with three top issues including missing barcodes."
              width={1200}
              height={638}
              sizes="(min-width: 768px) 60vw, 100vw"
              className="audit-image"
            />
            <figcaption className="audit-caption mt-3">
              A real Shopify catalog. The free scan in 60 seconds.
            </figcaption>
          </figure>

          {/* Deliverables list */}
          <div
            data-reveal
            style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
          >
            <p className="eyebrow mb-6 text-[color:var(--color-mute)]">
              For your <Bracket>£97</Bracket> — within three working days
            </p>
            <ul className="list-none p-0 m-0 space-y-8">
              <li>
                <p className="audit-item-name">A written audit letter</p>
                <p className="audit-item-copy">
                  One PDF. Plain English. The seven checks for your catalog,
                  ranked by how many products each one affects, with the exact
                  fix for each.
                </p>
              </li>
              <li>
                <p className="audit-item-name">A per-product fix CSV</p>
                <p className="audit-item-copy">
                  Every product that needs work, with the field that&rsquo;s
                  wrong and the value that should replace it. Import into
                  Shopify in one paste.
                </p>
              </li>
              <li>
                <p className="audit-item-name">A 30-day re-scan</p>
                <p className="audit-item-copy">
                  We rescan after you&rsquo;ve applied the fixes and tell you
                  what landed and what didn&rsquo;t — so you know the work
                  actually moved the score.
                </p>
              </li>
            </ul>
            <p className="mt-10">
              <Link href="/audit" className="btn btn-accent">
                Book the £97 audit →
              </Link>
            </p>
            <p className="audit-fineprint mt-4 text-[color:var(--color-mute)]">
              Or{' '}
              <Link href="/pricing" className="underline">
                see monthly Pro tiers
              </Link>{' '}
              for 100+ stores or recurring scans.
            </p>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {/* What makes us different */}
      <FounderStrip />

      {/* How we&rsquo;re different */}
      <CompareSection />

      {/* Pricing — slim placeholder while the per-vertical / per-channel
          pricing axis lands out-of-band per ADR 0016 + 2026-04-26 strategy
          ratification. The legacy 5-tier strip on this surface is RETIRED;
          /pricing keeps the legacy composition until the pricing-restructure
          phase. Page bracket cap stays at 2 (hero `[ last ]` + audit `[ £97 ]`). */}
      <PricingStripPlaceholder />

      {/* Manifesto — inverted ink block */}
      <ManifestoSection />

      {/* Footer */}
      <SiteFooter />
      </ViewportReveal>
    </main>
  );
}

