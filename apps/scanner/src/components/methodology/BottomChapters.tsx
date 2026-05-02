import Link from 'next/link';
import { DashLi } from './page-helpers';

/**
 * The four closing chapters of /methodology, extracted from page.tsx to
 * honour the 600-line limit on the page composition file:
 *
 *   1. Limitations — quiet-luxury restraint (Margaret Howell register)
 *   2. Conflicts — quiet ledger row, restraint as design
 *   3. Manifesto curtain — sticky-bottom curtain reveal (#3); the page's
 *      "If we got your score wrong" moment, ink-slab on amber-bracket
 *   4. Bottom CTA — paper close
 *
 * These chapters share the same chapter-spread skeleton (eyebrow + giant
 * h2 + body), so factoring also lets future surface-level refactors update
 * one place. The manifesto stays distinct because it inverts to ink-slab
 * and carries the curtain-rise choreography.
 */

export function LimitationsChapter() {
  return (
    <section
      id="limitations"
      aria-labelledby="limitations-heading"
      className="bg-[color:var(--color-paper)] border-b border-[color:var(--color-line)]"
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
        <p className="eyebrow mb-4">Limitations</p>
        <h2
          id="limitations-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[22ch]"
          style={{
            fontSize: 'clamp(36px, 5vw, 72px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.0,
            fontWeight: 700,
          }}
        >
          What the score does not measure.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[64ch]"
          style={{
            marginTop: 'clamp(24px, 3vw, 40px)',
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          Being explicit about what we do not measure is what separates an honest score from a black-box marketing number. The Flintmere score does not measure:
        </p>
        <ul className="methodology-list">
          <DashLi>Marketing copy quality, tone-of-voice, or brand strength.</DashLi>
          <DashLi>SEO ranking outside identifier and title structural concerns.</DashLi>
          <DashLi>Image aesthetic quality (we measure presence, alt-text, and structured-data linkage; we do not judge composition or lighting).</DashLi>
          <DashLi>Conversion-rate optimisation. A high score does not guarantee sales; it reduces the rate at which catalogs lose impressions to data quality.</DashLi>
          <DashLi>Customer-service quality, returns handling, fulfilment speed.</DashLi>
          <DashLi>The truthfulness of regulatory claims (we measure presence and structure of declarations; we do not lab-test the product).</DashLi>
        </ul>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[64ch]"
          style={{
            marginTop: 'clamp(28px, 4vw, 40px)',
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          Things we cannot yet measure but are tracked as next-quarter targets:
        </p>
        <ul className="methodology-list">
          <DashLi>Real-time GMC suppression status (requires merchant authentication; on roadmap).</DashLi>
          <DashLi>Amazon Fresh listing status (no public API; partnership track).</DashLi>
          <DashLi>AI-shopping-channel inclusion (channels not standardised across providers).</DashLi>
        </ul>
      </div>
    </section>
  );
}

export function ConflictsChapter() {
  return (
    <section
      id="conflicts"
      aria-labelledby="conflicts-heading"
      className="bg-[color:var(--color-paper-2)] border-b border-[color:var(--color-line)]"
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
        <p className="eyebrow mb-4">Conflicts of interest</p>
        <h2
          id="conflicts-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[22ch]"
          style={{
            fontSize: 'clamp(36px, 5vw, 72px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.0,
            fontWeight: 700,
          }}
        >
          What we sell and what we don&rsquo;t.
        </h2>
        <ul className="methodology-list" style={{ marginTop: 'clamp(28px, 4vw, 48px)' }}>
          <DashLi>Flintmere is <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>not affiliated with GS1</strong>. We do not sell GTINs. We route merchants to their local GS1 office (GS1 UK for UK-based merchants).</DashLi>
          <DashLi>Flintmere does <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>not take affiliate commissions</strong> from certification bodies, regulatory consultants, GS1 offices, or platform integrations. We monetise via subscriptions, audits, and embedded apps only.</DashLi>
          <DashLi>Flintmere is a trading name of <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>Eazy Access Ltd</strong>, Companies House 13205428, registered office 71&ndash;75 Shelton Street, Covent Garden, London, WC2H 9JQ. Accountable director: John Morris. Eazy Access Ltd is not VAT-registered, so prices shown are the full price.</DashLi>
          <DashLi>The standard is published openly. Anyone may cite it without permission; anyone may build a competing scoring tool against the same regulatory sources. We do not own the regulations; we curate the structure.</DashLi>
        </ul>
      </div>
    </section>
  );
}

/**
 * Manifesto curtain — sticky-bottom curtain reveal (canonical scroll
 * choreography #3). The headline rises into the viewport as you scroll
 * into it; ink-slab variant for contrast against the paper sections
 * above. Per saved memory `feedback_outline_shimmer_canon`, a heroic-
 * scale anchor on ink uses amber for the bracket. The curtain animation
 * is wired in styles.ts (`.methodology-curtain h2`).
 */
export function ChallengeManifesto() {
  return (
    <section
      id="challenge"
      aria-labelledby="challenge-heading"
      className="methodology-curtain relative bg-[color:var(--color-ink)]"
    >
      <div
        className="mx-auto max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 64px)',
          paddingRight: 'clamp(24px, 4vw, 64px)',
          paddingTop: 'clamp(96px, 14vw, 240px)',
          paddingBottom: 'clamp(96px, 14vw, 240px)',
        }}
      >
        <p
          className="eyebrow"
          style={{ color: 'var(--color-mute-2)', marginBottom: 'clamp(40px, 6vw, 80px)' }}
        >
          How to challenge a score
        </p>
        <h2
          id="challenge-heading"
          className="font-medium text-[color:var(--color-paper-on-ink)] max-w-[16ch]"
          style={{
            fontSize: 'clamp(48px, 9vw, 168px)',
            letterSpacing: '-0.04em',
            lineHeight: 0.92,
            fontWeight: 700,
          }}
        >
          If we got your score{' '}
          {/* `.bracket-inline` provides the [ ] glyphs as ::before/::after
              per the canonical bracket-spacing utility (0.16em em-margin).
              Don't render literal brackets here — that produced the
              double-bracket bug operator caught 2026-05-02.
              The bracket span + trailing period are wrapped in a
              white-space:nowrap atom so the "." cannot widow onto its own
              line when the headline wraps on narrow viewports (operator
              caught 2026-05-02 mobile — full stop alone on a new line). */}
          <span style={{ whiteSpace: 'nowrap' }}>
            <span
              className="font-mono inline-block bracket-inline methodology-curtain__anchor"
            >
              wrong
            </span>
            .
          </span>
        </h2>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-[1080px]" style={{ marginTop: 'clamp(48px, 6vw, 96px)' }}>
          <p
            className="text-[color:var(--color-mute-inv)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 19px)', lineHeight: 1.55 }}
          >
            Email{' '}
            <a
              href="mailto:hello@flintmere.com?subject=Score%20challenge"
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                textUnderlineOffset: 4,
                fontWeight: 500,
              }}
            >
              hello@flintmere.com
            </a>
            {' '}with your store, the disputed pillar, and your reasoning. We respond within five business days with the underlying data we read and the rule we applied.
          </p>
          <p
            className="text-[color:var(--color-mute-inv)]"
            style={{ fontSize: 'clamp(16px, 1.4vw, 19px)', lineHeight: 1.55 }}
          >
            If we agree we got it wrong, the score updates and the underlying rule updates. The change appears in the public change log so other merchants benefit from your challenge. If we disagree, the rule and the reasoning stay published; you can decide whether the disagreement is material.
          </p>
        </div>
      </div>
    </section>
  );
}

export function BottomCta() {
  return (
    <section
      aria-label="Run a free scan"
      className="bg-[color:var(--color-paper)] border-t border-[color:var(--color-line)]"
    >
      <div
        className="mx-auto max-w-[1024px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 48px)',
          paddingRight: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(80px, 10vw, 128px)',
          paddingBottom: 'clamp(80px, 10vw, 128px)',
        }}
      >
        <h2
          className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
          style={{
            fontSize: 'clamp(32px, 4.4vw, 56px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
            fontWeight: 700,
          }}
        >
          Now run the scan and see your score.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[58ch]"
          style={{
            marginTop: 'clamp(20px, 2.4vw, 32px)',
            fontSize: 16,
            lineHeight: 1.55,
          }}
        >
          You read how we measure. The scan takes 60 seconds and reads the four public-source pillars without an install. The full seven-pillar score lands when you install the Shopify app.
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4"
          style={{ marginTop: 'clamp(28px, 3vw, 40px)' }}
        >
          <Link href="/scan" className="btn btn-accent whitespace-nowrap">
            Run a free scan &rarr;
          </Link>
          <a
            href="mailto:hello@flintmere.com?subject=Methodology%20question"
            className="btn whitespace-nowrap"
          >
            Email regulatory affairs &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
