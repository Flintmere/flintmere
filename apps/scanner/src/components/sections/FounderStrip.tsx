/**
 * FounderStrip — chapter 3, #5 dual-column pin + scrollable companion
 * (2026-04-29 redesign per design-scroll-choreography skill).
 *
 * The founder voice (LEFT column) pins at viewport top while three proof
 * panels (RIGHT column) scroll past in sequence:
 *   1. Score lift — 47 → 89 catalog readiness
 *   2. Recovery — £3,240/mo suppressed listings recovered
 *   3. Deliverable — 1 letter + 1 CSV per product
 *
 * Reads as: editorial spread. *"Stay-and-see."* The voice persists; the
 * proof beats advance.
 *
 * Mechanic chosen per skill workflow:
 *   - Decision matrix: persistent voice + varying companion → #5
 *   - Composition rule check: ≥2 viewport heights of right-col runway
 *     (3 panels × ~100vh ≈ 300vh) — passes
 *   - Mobile: pin disabled below lg breakpoint via @media in globals.css;
 *     columns stack, content reads top-to-bottom naturally
 *
 * Mobile pass (2026-06-21, frontend-design skill + Magic-inspired compact
 * ledger). On phones every size was inherited from the desktop scroll-pin
 * runway — 56px metric floor, 48px headline, 48–96px panel gaps, 14vh
 * section padding, plus the .flintmere-founder-panel min-height (fixed in
 * globals.css) — which stacked into a ~2.4-screen chain. Sizing is now
 * mobile-compact at the base and restored to the original desktop values
 * at `lg:`. The pin, the copy, the amber-second-fragment pattern and the
 * legal disclaimer are unchanged.
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
 *   - Noor #8 (a11y, VETO): all panels keyboard-reachable; pin is
 *     structural CSS, no animation; mobile reflow stacks at <lg; AAA
 *     contrast paper-on-ink throughout
 *   - Marie #12 (motion): pin is content-revelation, not gratuitous;
 *     reduced-motion users get the same structural pin (it's CSS, no
 *     animation involvement)
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
    sub: 'Three-working-day audit window · representative example',
  },
  {
    metric: '£3,240',
    metricAccent: '/mo',
    label: 'Suppressed listings recovered',
    sub: 'to Google Shopping + Merchant Center',
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
      className="flintmere-founder-sticky"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper-on-ink)',
        borderTop: '1px solid var(--color-accent-sage)',
      }}
    >
      {/* Padding + gap are mobile-compact at the base and restored to the
          original desktop clamps at lg: (mobile pass 2026-06-21). */}
      <div className="mx-auto w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 px-6 py-16 lg:gap-[clamp(48px,6vw,96px)] lg:px-[clamp(24px,4vw,48px)] lg:py-[clamp(96px,14vh,200px)]">
        {/* LEFT — founder voice. Pinned via .flintmere-founder-pinned at
            ≥lg viewports (CSS in globals.css §Founder pinned column). */}
        <div className="flintmere-founder-pinned">
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
              We write every audit.
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
            If you book the audit (from £197), the team writes the letter
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
              href="/audit#checkout"
              // Cross-host (marketing → audit.flintmere.com): Next prefetches this
              // relative Link, middleware 301s it cross-origin, and the CORS-mode
              // RSC fetch can't follow → "Failed to fetch RSC payload" console noise.
              // Suppress the doomed prefetch; the click still full-navigates.
              prefetch={false}
              className="inline-flex items-center gap-3 px-7 py-3.5 border border-[color:var(--color-paper-on-ink)] text-[color:var(--color-paper-on-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper-on-ink)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
            >
              Book the concierge audit (from £197)
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* RIGHT — proof panels. On desktop each is ~80–100vh tall so the
            LEFT column has scroll runway to be pinned against; on mobile the
            min-height is released (globals.css) and the gap + metric scale
            are compressed so the three read as a tight ledger, not a void
            chain. */}
        <ol
          aria-label="Audit outcomes — representative examples"
          className="flex flex-col list-none m-0 p-0 gap-6 lg:gap-[clamp(48px,6vh,96px)]"
        >
          {PROOF_PANELS.map((panel, i) => (
            <li
              key={i}
              className="font-mono flintmere-founder-panel"
              style={{
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
