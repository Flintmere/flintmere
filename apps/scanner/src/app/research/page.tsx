import type { Metadata } from 'next';
import { SiteFooter } from '@flintmere/ui';
import { ViewportReveal } from '@/components/ViewportReveal';
import { loadBenchmark } from './data';
import { Cover } from './components/Cover';
import { BodyTop } from './components/BodyTop';
import { BodyBottom } from './components/BodyBottom';
import { CTA } from './components/CTA';

export const metadata: Metadata = {
  title: 'Research — State of Shopify Catalogs 2026',
  description:
    "The v1 Flintmere benchmark: Shopify catalogs scored against AI shopping agent requirements. Median scores, grade distributions, and the single biggest catalog mistake by vertical — scanned by FlintmereBot, aggregate-only, refreshed monthly.",
};

// Belt-and-braces: fully dynamic so the page never prerenders at build
// time (DB unreachable during Coolify build = broken deploy). The DB call
// is cheap and the route sits behind CDN caching at the edge anyway.
export const dynamic = 'force-dynamic';

/**
 * /research — State of Shopify Catalogs (research-report cover, 2026-04-30).
 *
 * Thin orchestrator. Fetches the benchmark via `loadBenchmark()` (see
 * ./data.ts) and renders eight chapters across four chapter-component
 * files, then the SiteFooter curtain.
 *
 * Council pre-flight (3 named references):
 *   - Pentagram research reports (Mailchimp Smarter, Slack data reports) —
 *     single hero metric as cover art, sage/ink palette, chapter structure.
 *   - Bloomberg Hyperdrive / Reuters Graphics — large numerals + small
 *     captions, inked distribution bars that draw on entry, methodology
 *     footer at the close.
 *   - The Modern House offering pages — sage hairline anchors, generous
 *     whitespace, one chord per chapter.
 *
 * Composition: eight chapters on paper, then the SiteFooter curtain.
 *   1. Cover            — Saks `[ X% ]` brand-mark + cascade sentence.    (Cover.tsx)
 *   2. Lede             — formal title + framing of the seven checks.     (BodyTop.tsx)
 *   3. Overall median   — the diagnostic chord.                           (BodyTop.tsx)
 *   4. Grade distrib.   — bars draw with `.research-bar-grow`.            (BodyTop.tsx)
 *   5. By vertical      — three editorial cards, cascade fade-in.         (BodyBottom.tsx)
 *   6. All verticals    — full grid (when present), cascade fade-in.      (BodyBottom.tsx)
 *   7. Methodology      — body + reach-note callout + methodology link.   (BodyBottom.tsx)
 *   8. CTA              — ink chord, dual CTA into /scan and /audit.      (CTA.tsx)
 *
 * Saks-scale bracket reserved for the cover ONLY (per outline-shimmer
 * canon: one heroic-scale anchor per surface). Other chapters use default-
 * size brackets. Bracket budget: ≤1 anchor bracket per section.
 *
 * Each section explicitly carries `bg-paper` (or `bg-ink` on the closing
 * CTA) so the universal sticky-footer curtain (engaged by `flintmere-main`)
 * is occluded until the user reaches the close.
 *
 * Choreography (mechanic #7 cascade fade-in, plus bar-draw on chapter 4):
 * a single `<ViewportReveal>` wraps the page; every `[data-reveal]` element
 * is observed individually with threshold 0.5. Cover elements cascade on
 * mount; downstream chapters cascade as they enter the viewport. Bars use
 * `.research-bar-grow` (scaleX 0→1, transform-origin left).
 *
 * Reduced-motion: the global `prefers-reduced-motion` block in globals.css
 * scales transition-duration to 0.01ms — every cascade endpoint and bar
 * lands instantly. No motion library, no JS animation loop.
 */
export default async function Research() {
  const data = await loadBenchmark();

  return (
    <main id="main" className="flintmere-main">
      <a href="#cover" className="skip-link">
        Skip to content
      </a>
      <ViewportReveal>
        <Cover data={data} />
        <BodyTop data={data} />
        <BodyBottom data={data} />
        <CTA />
        <SiteFooter />
      </ViewportReveal>
    </main>
  );
}
