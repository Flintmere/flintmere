/**
 * FounderStrip — chapter 3, #7 cascade fade-in (downgraded from #5
 * dual-column pin on 2026-09-10; see the mechanic note below).
 *
 * The founder voice (LEFT column) sits beside two proof panels (RIGHT
 * column) that cascade in on viewport entry:
 *   1. Score lift — 47 → 89 catalog readiness
 *   2. Deliverable — 1 letter + 1 CSV per product
 *
 * Reads as: editorial spread, everyday motion. The voice and the proof
 * land together rather than the voice persisting across a long runway.
 *
 * Mechanic note (2026-09-10, ADR 0030 §4). The recovery panel — "£3,240/mo
 * suppressed listings recovered" — was retired with the suppression wedge:
 * it illustrated a mechanism ADR 0029 premise 2 grades false. Operator
 * chose to drop to two panels rather than restate the figure, because no
 * third-party engagement exists and any replacement would be modelled,
 * which is what ADR 0030 retires.
 *
 * That drop breaks composition rule 4 (scroll-choreographies.md §Composition
 * rules): "#4 and #5 each need ≥2 viewport heights of scroll runway minimum.
 * Below that, downgrade to #7 cascade." Measured at 1440x900 with panels at
 * min-height clamp(360px, 60vh, 560px) = 540px and gap clamp(48px, 6vh, 96px)
 * = 54px:
 *   - 3 panels: 3x540 + 2x54 = 1728px = 1.92vh (already marginal; the
 *     original header's "3 panels x ~100vh = 300vh" was wrong — the panels
 *     were never 100vh)
 *   - 2 panels: 2x540 + 1x54 = 1134px = 1.26vh — fails the rule
 * So the pin is removed and the section downgrades to #7 per the rule. The
 * two-column grid is layout, not mechanic, and is retained.
 *
 * Mechanic chosen per skill workflow:
 *   - Composition rule 4: runway below 2vh → #7 cascade
 *   - Homepage variety budget unaffected: #7 is the default mechanic and
 *     does not count against the 3-5 distinct-mechanic target
 *   - Panels stagger via [data-reveal] + --reveal-delay on the canonical
 *     grammar (240ms first list item, +80ms each subsequent); the page-level
 *     ViewportReveal (page.tsx:161) already observes descendants
 *
 * Mobile pass (2026-06-21, frontend-design skill + Magic-inspired compact
 * ledger). On phones every size was inherited from the desktop scroll-pin
 * runway — 56px metric floor, 48px headline, 48–96px panel gaps, 14vh
 * section padding, plus the .flintmere-founder-panel min-height (fixed in
 * globals.css) — which stacked into a ~2.4-screen chain. Sizing is now
 * mobile-compact at the base and restored to the original desktop values
 * at `lg:`. The copy, the amber-second-fragment pattern and the legal
 * disclaimer are unchanged. The desktop panel min-height existed only as
 * pin runway and went with the pin (2026-09-10).
 *
 * Council pre-flight (per binding 2026-04-28):
 *   - References: A24 Films (a24films.com — ink-slab "moment of arrival",
 *     mono credits, controlled colour); Order Form (order-form.shop —
 *     grid-as-aesthetic for the proof ledger); Linear (linear.app —
 *     negative-space discipline, one dominant figure per beat). Earlier
 *     refs (Apple iPhone split, Stripe sticky-docs, Pentagram Saks) still
 *     inform the desktop pin.
 *   - Yann #6 (signature): bracketed [ Built in London ]-style nouns
 *     could anchor proof captions if needed; signature otherwise lives
 *     on the headline weight-shift
 *   - Noor #8 (a11y, VETO): all panels keyboard-reachable; mobile reflow
 *     stacks at <lg; AAA contrast paper-on-ink throughout
 *   - Marie #12 (motion): cascade is the default everyday motion; the
 *     global prefers-reduced-motion block in globals.css scales the
 *     transition to 0.01ms, so reduced-motion users land on the end-state
 *   - #9+#23+#24 Legal Council: figures marked "Representative example,
 *     actual results vary per merchant" — claim-review compliance
 */

import Link from 'next/link';

interface ProofPanel {
  metric: string;
  metricAccent?: string; // optional second-half rendered in amber
  label: string;
  sub: string;
}

const PROOF_PANELS: ProofPanel[] = [
  {
    metric: '47 →',
    metricAccent: '89',
    label: 'Catalog readiness score',
    sub: 'Three-working-day turnaround · representative example',
  },
  {
    metric: '1 letter · 1 CSV',
    label: 'Per-product write-up + structured data file',
    sub: 'Yours to keep, on day three',
  },
];

export function FounderStrip() {
  return (
    <section
      aria-labelledby="different-heading"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper-on-ink)',
        borderTop: '1px solid var(--color-accent-sage)',
      }}
    >
      {/* Padding + gap are mobile-compact at the base and restored to the
          original desktop clamps at lg: (mobile pass 2026-06-21). */}
      <div className="mx-auto w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 px-6 py-16 lg:gap-[clamp(48px,6vw,96px)] lg:px-[clamp(24px,4vw,48px)] lg:py-[clamp(96px,14vh,200px)]">
        {/* LEFT — founder voice. Static column since the #5 → #7 downgrade
            (2026-09-10); the grid is layout, the pin was the mechanic. */}
        <div>
          <p
            className="eyebrow"
            style={{
              color: 'var(--color-accent)',
              marginBottom: 'clamp(20px, 3vw, 40px)',
            }}
          >
            Who builds Flintmere
          </p>

          <h2
            id="different-heading"
            className="font-sans tracking-[-0.035em] text-[34px] lg:text-[clamp(48px,7vw,112px)]"
            style={{
              lineHeight: 0.98,
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
              We write every letter.
            </span>
          </h2>

          <p
            className="font-sans text-[16px] lg:text-[clamp(17px,1.4vw,22px)] mt-6 lg:mt-[clamp(28px,3vw,48px)]"
            style={{
              maxWidth: '54ch',
              lineHeight: 1.55,
              color: 'var(--color-paper-on-ink)',
            }}
          >
            If you book your catalog letter (from £197), the team writes it
            and the per-product CSV. If you email hello@flintmere.com, we
            reply — usually within two working days.
          </p>

          <p
            className="font-sans text-[21px] lg:text-[clamp(28px,3.5vw,52px)] mt-7 lg:mt-[clamp(32px,4vw,56px)]"
            style={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--color-paper-on-ink)',
            }}
          >
            {/* nowrap holds each statement on one line at lg+ where the pinned
                left column is wide enough. On phones the longest line
                ("No outsourced support queue." ≈398px at the 28px floor)
                overflowed the ~330px column and scrolled the page sideways, so
                below lg it wraps (design-critique 2026-06-13, Kael P1). */}
            <span className="block whitespace-normal lg:whitespace-nowrap">
              No outsourced support queue.
            </span>
            <span className="block whitespace-normal lg:whitespace-nowrap">
              No pitch.
            </span>
            <span className="block whitespace-normal lg:whitespace-nowrap">
              No sales call.
            </span>
          </p>

          <div className="mt-9 lg:mt-[clamp(40px,5vw,72px)]">
            <Link
              href="/catalog-letter#checkout"
              // Cross-host (marketing → audit.flintmere.com): Next prefetches this
              // relative Link, middleware 301s it cross-origin, and the CORS-mode
              // RSC fetch can't follow → "Failed to fetch RSC payload" console noise.
              // Suppress the doomed prefetch; the click still full-navigates.
              prefetch={false}
              className="inline-flex items-center gap-3 px-7 py-3.5 border border-[color:var(--color-paper-on-ink)] text-[color:var(--color-paper-on-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
            >
              Book your catalog letter (from £197)
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* RIGHT — proof panels. Content-driven height at every breakpoint
            since the pin runway went (2026-09-10); the gap + metric scale stay
            compressed on mobile so the pair reads as a tight ledger. */}
        <ol
          aria-label="Catalog letter outcomes — representative examples"
          className="flex flex-col list-none m-0 p-0 gap-6 lg:gap-[clamp(48px,6vh,96px)]"
        >
          {PROOF_PANELS.map((panel, i) => (
            <li
              key={i}
              data-reveal
              className="font-mono flintmere-founder-panel"
              style={{
                // Canonical delay grammar (globals.css §viewport reveal):
                // 240ms first list item, +80ms each subsequent.
                ['--reveal-delay' as string]: `${240 + i * 80}ms`,
                border: '1px solid var(--color-line-dark)',
                padding: 'clamp(20px, 3.5vw, 48px)',
                color: 'var(--color-paper-on-ink)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'clamp(14px, 3vw, 36px)',
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
                {`// 0${i + 1} · proof`}
              </p>

              <p
                className="font-sans text-[34px] lg:text-[clamp(56px,7.2vw,112px)]"
                style={{
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  lineHeight: 0.94,
                  color: 'var(--color-paper-on-ink)',
                }}
              >
                {panel.metric}
                {panel.metricAccent && (
                  <>
                    {' '}
                    <span style={{ color: 'var(--color-accent)' }}>
                      {panel.metricAccent}
                    </span>
                  </>
                )}
              </p>

              <div>
                <p
                  className="font-sans text-[16px] lg:text-[clamp(17px,1.4vw,22px)]"
                  style={{
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: 'var(--color-paper-on-ink)',
                    marginBottom: 'clamp(6px, 1vw, 14px)',
                  }}
                >
                  {panel.label}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.04em',
                    lineHeight: 1.55,
                    color: 'var(--color-mute-inv)',
                  }}
                >
                  {panel.sub}
                </p>
              </div>
            </li>
          ))}

          <li
            style={{
              fontSize: '11px',
              lineHeight: 1.55,
              color: 'var(--color-mute-inv)',
              fontFamily: 'var(--font-mono)',
              marginTop: 'clamp(8px, 2vh, 32px)',
            }}
          >
            Representative examples. Actual results vary per merchant,
            catalog size, and starting score. Anonymised composites — not
            named case studies.
          </li>
        </ol>
      </div>
    </section>
  );
}
