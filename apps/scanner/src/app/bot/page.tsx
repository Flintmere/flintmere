import type { Metadata } from 'next';
import { SiteFooter } from '@flintmere/ui';
import { ViewportReveal } from '@/components/ViewportReveal';
import { Cover } from './components/Cover';
import { Passport } from './components/Passport';
import { LiveCascade } from './components/LiveCascade';
import { InkConstraints } from './components/InkConstraints';
import { Limits } from './components/Limits';
import { BlockSnippet } from './components/BlockSnippet';
import { Aggregates } from './components/Aggregates';

export const metadata: Metadata = {
  title: 'FlintmereBot — the Flintmere catalog scanner',
  description:
    'FlintmereBot scans public Shopify catalogs to build anonymous, aggregate benchmarks of AI-agent readiness. The user-agent it carries, what it reads, what it ignores, the rate limits, and how to opt out.',
  robots: { index: true, follow: true },
};

/**
 * /bot — FlintmereBot transparency page (extravagant pass + live cascade,
 * 2026-04-30).
 *
 * Thin orchestrator. Eight chapters on paper (one ink-slab inversion as
 * the negative-space chord), then the SiteFooter curtain.
 *
 * Council pre-flight (3 named references):
 *   - Pentagram Saks Fifth Avenue case-study cover — Saks `[ FlintmereBot ]`
 *     bracket as the page's brand mark; third Saks-bracket page after
 *     /audit `[ for you ]` and /research `[ X% ]`.
 *   - Stripe documentation typography — JetBrains-Mono inline tokens in
 *     prose; basis for the live cascade Chapter 3 where structured-data
 *     tokens light up amber as a parser walks them.
 *   - A24 single-film overview — bottom-left mono credit "Flintmere ·
 *     FlintmereBot · v1.0", moment-of-arrival composition for the robots.txt
 *     poster.
 *
 * Composition: eight chapters + SiteFooter.
 *   1. Cover           — Saks `[ FlintmereBot ]` brand-mark + word-cascade.
 *   2. Passport        — the user-agent string as editorial display.
 *   3. Live cascade ⭐ — pinned 400vh; three example documents; tokens
 *                        light up amber as the parser walks them. (#4 + #8)
 *   4. Ink-slab        — what we never touch. Paper-on-ink, four declarative
 *                        rows, sage hairline anchor.
 *   5. Limits          — three Bloomberg-cover numerals (NumeralCountUp).
 *   6. Block snippet   — robots.txt opt-out as the typographic image.
 *   7. Aggregates      — the closing argument; default-size bracket on
 *                        `[ store's name ]`.
 *   8. SiteFooter      — universal sticky-bottom curtain reveal (#3).
 *
 * Each section explicitly carries `bg-paper` (or `bg-ink` on Chapter 4) so
 * the universal sticky-footer curtain (engaged by `flintmere-main`) is
 * occluded until the user reaches the close.
 *
 * Choreography (5 distinct featured mechanics):
 *   #1 cover · #4+#8 live cascade · ink-slab #7 · numerals #7 · #3 footer.
 *   Default #7 cascade fade-in connects the rest.
 *
 * Reduced-motion: the global prefers-reduced-motion block in globals.css
 * scales transition-duration to 0.01ms — every cascade endpoint, hairline,
 * and word-stagger lands instantly. The Chapter 3 LiveCascade island has
 * its own component-level reduced-motion branch (all 3 examples stacked
 * statically with tokens pre-fired, no pin, no rAF listener).
 *
 * Spec source of truth (binding):
 *   context/design/extravagant/2026-04-30-bot-page-spec.md
 */
export default function BotPage() {
  return (
    <main id="main" className="flintmere-main">
      <a href="#cover" className="skip-link">
        Skip to content
      </a>
      <ViewportReveal>
        <Cover />
        <Passport />
        <LiveCascade />
        <InkConstraints />
        <Limits />
        <BlockSnippet />
        <Aggregates />
        <SiteFooter />
      </ViewportReveal>
    </main>
  );
}
