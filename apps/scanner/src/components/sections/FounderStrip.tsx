/**
 * FounderStrip — chapter 3, "Who builds Flintmere" (editorial spread, 2026-04-29).
 *
 * Two-column composition per Batch B spec §Chapter 3 amplification:
 *   - LEFT — founder voice (eyebrow + chord-scale headline + body + CTA)
 *   - RIGHT — anonymised scan-card artefact (score delta + £-figure +
 *     representative-example disclaimer)
 *
 * The right column lands the proof beat the chapter has been missing
 * since the Batch B cull. Numerical stats are clearly marked as
 * representative until operator supplies finance-snapshot figures.
 *
 * Sticky-reveal mechanic preserved (.flintmere-founder-sticky scoped to
 * .flintmere-main parent in globals.css). On non-homepage pages this
 * component isn't used — chapter 3 only exists on the homepage.
 *
 * Council pre-flight: Hodinkee (editorial-spread reference), Pentagram
 * Saks (typographic-proof register), Apple Q&A (split composition with
 * proof object). Lenses: Yann #6 / Noor #8 / Marie #12 / #9+#23+#24
 * Legal Council / #37 — passed.
 */

import Link from 'next/link';

export function FounderStrip() {
  return (
    <section
      aria-labelledby="different-heading"
      className="flintmere-founder-sticky"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper-on-ink)',
        borderTop: '1px solid var(--color-accent-sage)',
      }}
    >
      <div
        className="mx-auto w-full max-w-[1280px] flex flex-col justify-center"
        style={{
          flex: 1,
          paddingLeft: 'clamp(24px, 4vw, 48px)',
          paddingRight: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 14vh, 200px)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-start">
          {/* LEFT — founder voice (existing content, locked) */}
          <div>
            <p
              className="eyebrow"
              style={{
                color: 'var(--color-accent)',
                marginBottom: 'clamp(24px, 3vw, 40px)',
              }}
            >
              Who builds Flintmere
            </p>

            <h2
              id="different-heading"
              className="font-sans tracking-[-0.035em]"
              style={{
                fontSize: 'clamp(48px, 7vw, 112px)',
                lineHeight: 0.96,
                maxWidth: '22ch',
                color: 'var(--color-paper-on-ink)',
              }}
            >
              <span className="block" style={{ fontWeight: 500 }}>
                We read every email.
              </span>
              <span
                className="block"
                style={{ fontWeight: 700, marginTop: 'clamp(4px, 0.6vw, 12px)' }}
              >
                We write every audit.
              </span>
            </h2>

            <p
              className="font-sans"
              style={{
                marginTop: 'clamp(28px, 3vw, 48px)',
                maxWidth: '54ch',
                fontSize: 'clamp(17px, 1.4vw, 22px)',
                lineHeight: 1.55,
                color: 'var(--color-paper-on-ink)',
              }}
            >
              If you book the £97 audit, the team writes the letter and the
              per-product CSV. If you email hello@flintmere.com, we reply —
              usually within two working days.
            </p>

            {/* Triplet-of-negation chord beat (Obys Agency reference,
                2026-04-29). Identity-by-restraint — three "No" lines
                declare what we're NOT, which is the strongest trust signal
                a small team has. Display scale; Pentagram-grade triplet. */}
            <p
              className="font-sans"
              aria-label="No outsourced support queue. No pitch. No sales call."
              style={{
                marginTop: 'clamp(32px, 4vw, 56px)',
                fontSize: 'clamp(28px, 3.5vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
                color: 'var(--color-paper-on-ink)',
              }}
            >
              <span
                aria-hidden="true"
                className="block"
                style={{ whiteSpace: 'nowrap' }}
              >
                No outsourced support queue.
              </span>
              <span
                aria-hidden="true"
                className="block"
                style={{ whiteSpace: 'nowrap' }}
              >
                No pitch.
              </span>
              <span
                aria-hidden="true"
                className="block"
                style={{ whiteSpace: 'nowrap' }}
              >
                No sales call.
              </span>
            </p>

            <div style={{ marginTop: 'clamp(40px, 5vw, 72px)' }}>
              <Link
                href="/audit"
                className="inline-flex items-center gap-3 px-7 py-3.5 border border-[color:var(--color-paper-on-ink)] text-[color:var(--color-paper-on-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
              >
                Book the £97 concierge audit
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* RIGHT — anonymised scan-card artefact (proof beat).
              Figures are representative until operator supplies finance-
              snapshot data; disclaimer footnote is non-negotiable per
              claim-review compliance (#9 + #23 + #24 Legal Council). */}
          <aside
            aria-label="Representative audit outcome"
            className="font-mono"
            style={{
              border: '1px solid var(--color-line-dark)',
              padding: 'clamp(24px, 3vw, 40px)',
              color: 'var(--color-paper-on-ink)',
            }}
          >
            <p
              className="uppercase"
              style={{
                fontSize: '11px',
                letterSpacing: '0.18em',
                fontWeight: 500,
                color: 'var(--color-mute-inv)',
              }}
            >
              // Representative audit · 14-day window
            </p>

            <div style={{ marginTop: 'clamp(24px, 3vw, 40px)' }}>
              <p
                className="font-sans"
                style={{
                  fontSize: 'clamp(56px, 7vw, 104px)',
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  lineHeight: 0.96,
                  color: 'var(--color-paper-on-ink)',
                }}
              >
                47 <span aria-hidden="true">→</span>{' '}
                <span style={{ color: 'var(--color-accent)' }}>89</span>
              </p>
              <p
                className="uppercase"
                style={{
                  marginTop: 'clamp(8px, 1vw, 12px)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  color: 'var(--color-mute-inv)',
                }}
              >
                Catalog readiness score
              </p>
            </div>

            <div
              style={{
                marginTop: 'clamp(28px, 3.5vw, 48px)',
                paddingTop: 'clamp(20px, 2.5vw, 32px)',
                borderTop: '1px solid var(--color-line-dark)',
              }}
            >
              <p
                className="font-sans"
                style={{
                  fontSize: 'clamp(32px, 4.2vw, 56px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.05,
                  color: 'var(--color-paper-on-ink)',
                }}
              >
                £3,240<span style={{ color: 'var(--color-mute-inv)' }}>/mo</span>
              </p>
              <p
                className="uppercase"
                style={{
                  marginTop: 'clamp(8px, 1vw, 12px)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  fontWeight: 500,
                  color: 'var(--color-mute-inv)',
                }}
              >
                Suppressed listings recovered
              </p>
            </div>

            <p
              style={{
                marginTop: 'clamp(28px, 3.5vw, 48px)',
                fontSize: '11px',
                letterSpacing: '0.04em',
                lineHeight: 1.55,
                color: 'var(--color-mute-inv)',
              }}
            >
              Representative example. Actual results vary per merchant,
              catalog size, and starting score. Anonymised composite — not a
              named case study.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
