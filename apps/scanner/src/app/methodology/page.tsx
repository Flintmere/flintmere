import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import {
  DATA_SOURCES,
  LAST_UPDATED,
  PILLARS,
  STANDARD_TARGET,
  STANDARD_VERSION,
  TOTAL_PUBLIC_WEIGHT,
} from '@/lib/methodology-data';
import { PillarTreemap } from '@/components/methodology/PillarTreemap';
import { PillarSpread } from '@/components/methodology/PillarSpread';
import { MaintenanceTimeline } from '@/components/methodology/MaintenanceTimeline';
import {
  CadenceRow,
  HeroStat,
  StatusCell,
} from '@/components/methodology/page-helpers';
import {
  BottomCta,
  ChallengeManifesto,
  ConflictsChapter,
  LimitationsChapter,
} from '@/components/methodology/BottomChapters';
import { methodologyStyles } from '@/components/methodology/styles';

/**
 * /methodology — How Flintmere scores catalogs and maintains the food
 * standard. Substantiation gate for /pricing's "We maintain it" claim.
 *
 * Council pre-flight (binding per `reference-register.md` 2026-04-28):
 *   1. Hodinkee Reference Points — chapter cadence, ONE decorative anchor
 *      per chapter, restraint elsewhere.
 *   2. Bloomberg Businessweek covers — oversized index numerals as
 *      load-bearing decoration; type-as-image; deliberate asymmetry.
 *   3. The Pudding (pudding.cool) — data IS the typography; pillar weights
 *      become surface area, not numbers in a column.
 *
 * Choreography map (canonical scroll choreographies):
 *   - Hero: static lead.
 *   - Pillar treemap + spreads: pinned scroll-driven state (#4) — the
 *     treemap pins as you scroll the chapter; an IntersectionObserver
 *     lights up the matching tile as each spread enters viewport. The
 *     navigation IS the data viz.
 *   - Per-spread: cascade fade-in (#7) on numeral, name, body.
 *   - Maintenance timeline: static lead with version-axis SVG.
 *   - Challenge manifesto: sticky-bottom curtain reveal (#3) — the
 *     "If we got your score wrong" headline rises into view.
 *
 * Bracket budget (ADR 0021 §4 + operator binding 2026-04-29 "≤1 per
 * section, no page cap"):
 *   - Hero h1: [ standard ] Saks chord — continuity with /pricing hero.
 *   - Manifesto curtain: [ wrong ] outline-shimmer canon utility — the
 *     anchor moment per saved memory `feedback_outline_shimmer_canon`.
 *   - Pillar spreads: oversized numeral as bracket-equivalent — the
 *     numeral IS the chapter anchor in this register.
 */

export const metadata: Metadata = {
  title: 'Methodology — How Flintmere scores and maintains',
  description:
    'How Flintmere computes the seven-pillar catalog readiness score, where the regulatory data comes from, how the food catalog standard is maintained, and what the score does not measure.',
  alternates: { canonical: 'https://flintmere.com/methodology' },
};

export default function Methodology() {
  return (
    <main
      id="main"
      className="flintmere-main bg-[color:var(--color-paper)]"
    >
      {/* Page-scoped choreography styles. Lives here because the cascade +
          curtain mechanics are unique to this page — no need to pollute
          globals.css. The soft prefers-reduced-motion contract still
          applies via the global block. */}
      <style>{methodologyStyles}</style>

      {/* Hero — bracket-1 Saks chord on [ standard ] for continuity with
          /pricing hero. Amber-radial atmosphere blooms behind. Static lead
          choreography (no scroll mechanic — the title page is the entry). */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative isolate overflow-hidden bg-[color:var(--color-paper)]"
      >
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background: 'var(--gradient-amber-radial)',
            transform: 'translate(0, -10%) scale(1.15)',
            opacity: 0.85,
          }}
        />

        <div
          className="relative mx-auto max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(72px, 9vw, 144px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-10">Methodology</p>
          <h1
            id="hero-heading"
            className="font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)] max-w-[18ch]"
            style={{ fontSize: 'clamp(40px, 7.6vw, 128px)', fontWeight: 700 }}
          >
            How we compute the score and maintain the{' '}
            <Bracket size="saks">standard</Bracket>.
          </h1>
          <p
            className="font-sans"
            style={{
              marginTop: 'clamp(32px, 4vw, 56px)',
              maxWidth: '60ch',
              fontSize: 'clamp(15px, 1.1vw, 17px)',
              lineHeight: 1.55,
              fontWeight: 400,
              color: 'var(--color-mute)',
            }}
          >
            Seven pillars, weighted to sum to 100. Source-cited regulatory references. Half-yearly publication of the food catalog standard with a public change log between. Last updated {LAST_UPDATED}.
          </p>

          {/* Numerals strip — the "100" total + breakdown 55 / 45 read as
              a typographic anchor at the foot of the hero. Numerals are
              the chapter signature (per Bloomberg-cover register). */}
          <dl
            className="grid grid-cols-3 gap-x-8 gap-y-4 max-w-[640px] border-t border-[color:var(--color-line)]"
            style={{ marginTop: 'clamp(48px, 6vw, 88px)', paddingTop: 28 }}
          >
            <HeroStat label="Composite weight" value="100" suffix="" />
            <HeroStat label="Public-source pillars" value={String(TOTAL_PUBLIC_WEIGHT)} suffix="%" />
            <HeroStat label="Install-gated" value={String(100 - TOTAL_PUBLIC_WEIGHT)} suffix="%" />
          </dl>
        </div>
      </section>

      {/* Pillar chapter — opens with treemap as chapter cover, then drops
          into per-pillar spreads. The treemap is sticky and tracks which
          spread is in view (mechanic #4: pinned scroll-driven state). */}
      <section
        id="pillars"
        aria-labelledby="pillars-heading"
        className="relative bg-[color:var(--color-paper)] border-t border-[color:var(--color-line)]"
      >
        <div
          className="mx-auto max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(72px, 9vw, 144px)',
            paddingBottom: 'clamp(40px, 5vw, 64px)',
          }}
        >
          <p className="eyebrow mb-4">The seven pillars</p>
          <h2
            id="pillars-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(36px, 5vw, 72px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              fontWeight: 700,
            }}
          >
            Each pillar measures a different way a catalog can break.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 'clamp(24px, 3vw, 40px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            The composite score is a weighted average of the seven pillars below. Public scans (no Shopify install) measure the four pillars that read from public sources — identifiers, titles, consistency, and crawlability — and report a partial score against {TOTAL_PUBLIC_WEIGHT}% of the weight. The remaining {100 - TOTAL_PUBLIC_WEIGHT}% (attributes, mapping, checkout eligibility) is reachable only after the Shopify app is installed, since those signals come from authenticated Admin-API reads.
          </p>
        </div>

        {/* Pinned treemap. position: sticky lives on this wrapper; on small
            viewports the sticky is harmless because the treemap shrinks
            with the layout. The treemap tile-active state is driven by
            IntersectionObserver inside the component. */}
        <div
          className="methodology-treemap-pin"
          aria-label="Pinned navigation treemap of the seven pillars"
        >
          <div
            className="mx-auto max-w-[1280px]"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 64px)',
              paddingRight: 'clamp(24px, 4vw, 64px)',
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <PillarTreemap pillars={PILLARS} />
          </div>
        </div>

        {/* Each pillar gets its own spread. The spread component owns the
            Bloomberg-cover layout (oversized numeral + body column) plus
            the cascade-fade-in choreography on entrance. */}
        <div className="border-t border-[color:var(--color-line-soft)]">
          {PILLARS.map((pillar) => (
            <PillarSpread key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </section>

      {/* The standard — chapter cover. */}
      <section
        id="standard"
        aria-labelledby="standard-heading"
        className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
      >
        <div
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(80px, 10vw, 144px)',
            paddingBottom: 'clamp(80px, 10vw, 144px)',
          }}
        >
          <p className="eyebrow mb-4">The food catalog standard</p>
          <h2
            id="standard-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
            style={{
              fontSize: 'clamp(40px, 6vw, 88px)',
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
              fontWeight: 700,
            }}
          >
            What the standard actually is.
          </h2>

          {/* Status row — version + target + status reads as a ledger row
              under the headline. */}
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-[720px] border-y border-[color:var(--color-line)]"
            style={{ marginTop: 'clamp(40px, 5vw, 64px)', padding: '28px 0' }}
          >
            <StatusCell label="Version" value={STANDARD_VERSION} mono />
            <StatusCell label="Publication target" value={STANDARD_TARGET} mono />
            <StatusCell label="Status" value="Subdomain provisioned" />
          </div>

          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 'clamp(28px, 4vw, 48px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            The food catalog standard is a JSON Schema plus a human-readable spec defining what a complete food product record looks like for UK Shopify merchants pushing to Google Merchant Center, Amazon Fresh, Ocado, Deliveroo, and emerging AI shopping channels. Fields, types, allowed values, regulatory citations, and version history. It publishes at <span className="font-mono" style={{ fontSize: '0.92em' }}>standards.flintmere.com/food/v1</span>.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 16,
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            <strong style={{ fontWeight: 500 }}>Why a standard, not a checklist:</strong> a checklist is a list of things to do; a standard is a versioned, dated, citation-backed contract. A standard can be referenced by trade journalists, regulatory consultants, and other vertical PIM tools. A checklist cannot. The standard is the moat we are building, not the scanner.
          </p>
          <p
            className="text-[color:var(--color-mute)] max-w-[64ch]"
            style={{
              marginTop: 16,
              fontSize: 14,
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            Until {STANDARD_TARGET}, this page describes the artefact; the artefact itself does not yet exist in published form. We will not pretend otherwise.
          </p>
        </div>
      </section>

      {/* Data sources — citation table; live cascade highlight (#8) on
          hover only, not on scroll, so the page doesn't go strobe-y. */}
      <section
        id="data-sources"
        aria-labelledby="data-sources-heading"
        className="bg-[color:var(--color-paper)] border-b border-[color:var(--color-line)]"
      >
        <div
          className="mx-auto max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(80px, 10vw, 144px)',
            paddingBottom: 'clamp(64px, 8vw, 112px)',
          }}
        >
          <p className="eyebrow mb-4">Data sources</p>
          <h2
            id="data-sources-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
            style={{
              fontSize: 'clamp(36px, 5vw, 72px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              fontWeight: 700,
            }}
          >
            Every claim links to its primary source.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 'clamp(24px, 3vw, 40px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            We read from primary regulators, not from second-hand summaries. If we cite a rule, the citation links to the regulator&rsquo;s own published page.
          </p>

          <ul
            className="methodology-sources list-none p-0 m-0 border-y border-[color:var(--color-line)]"
            style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}
          >
            {DATA_SOURCES.map((src) => (
              <li
                key={src.url}
                className="methodology-sources__row group grid md:grid-cols-[200px_1.4fr_2fr] gap-6 py-7 border-t border-[color:var(--color-line-soft)] first:border-t-0 items-baseline"
              >
                <p
                  className="font-mono uppercase text-[color:var(--color-mute-2)]"
                  style={{ fontSize: 11, letterSpacing: '0.16em' }}
                >
                  {src.domain}
                </p>
                <p style={{ fontSize: 17, fontWeight: 500 }}>
                  <a
                    href={src.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="methodology-sources__link"
                  >
                    {src.source}
                    <span aria-hidden="true" className="methodology-sources__arrow">&rarr;</span>
                  </a>
                </p>
                <p
                  className="text-[color:var(--color-ink-2)]"
                  style={{ fontSize: 14, lineHeight: 1.55 }}
                >
                  {src.purpose}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Maintenance cadence — version timeline as the chapter anchor. */}
      <section
        id="maintenance"
        aria-labelledby="maintenance-heading"
        className="bg-[color:var(--color-paper-2)] border-b border-[color:var(--color-line)]"
      >
        <div
          className="mx-auto max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(80px, 10vw, 144px)',
            paddingBottom: 'clamp(80px, 10vw, 144px)',
          }}
        >
          <p className="eyebrow mb-4">Maintenance cadence</p>
          <h2
            id="maintenance-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
            style={{
              fontSize: 'clamp(36px, 5vw, 72px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              fontWeight: 700,
            }}
          >
            How &ldquo;we maintain it&rdquo; works.
          </h2>

          <MaintenanceTimeline />

          <dl
            className="grid md:grid-cols-[180px_1fr] gap-x-8 gap-y-7 border-t border-[color:var(--color-line)]"
            style={{ marginTop: 32, paddingTop: 32 }}
          >
            <CadenceRow
              label="Cadence"
              body={<><strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>Half-yearly publication</strong> of the major standard version (v1, v1.1, v2). This is the load-bearing commitment.</>}
            />
            <CadenceRow
              label="Between publications"
              body={<>A <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>public change log</strong> tracks every regulatory update we observe between major publications. Each entry: source URL, observed date, scope of change, action we took.</>}
            />
            <CadenceRow
              label="Monitoring"
              body={<>An automated cron monitors regulator RSS feeds, the EU Official Journal, DEFRA updates, and certification-body announcements. Surfacing is AI-assisted (Vertex AI / Gemini 2.5 Pro on EU residency); decisions are human.</>}
            />
            <CadenceRow
              label="Review"
              body={<>Every change is reviewed by the council&rsquo;s <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>Regulatory Affairs</strong> seat before merging into the public change log. The seat holds a binding veto on standards-publication accuracy.</>}
            />
            <CadenceRow
              label="Versioning"
              body={<>Major versions (v1, v2) are breaking; minor versions (v1.1, v1.2) are additive. Every published version stays accessible at its versioned URL. Breaking changes never silently rewrite history.</>}
            />
          </dl>
        </div>
      </section>

      <LimitationsChapter />
      <ConflictsChapter />
      <ChallengeManifesto />
      <BottomCta />

      <SiteFooter />
    </main>
  );
}
