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
 * Council pre-flight (per binding 2026-04-28):
 *   - References: Apple iPhone product pages (camera capabilities split),
 *     Stripe documentation pages (sticky text + scrollable visuals),
 *     Pentagram Saks editorial spread
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
    sub: '14-day audit window · representative example',
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
    sub: 'Yours to keep, on day fourteen',
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
      <div
        className="mx-auto w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]"
        style={{
          gap: 'clamp(48px, 6vw, 96px)',
          paddingLeft: 'clamp(24px, 4vw, 48px)',
          paddingRight: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 14vh, 200px)',
        }}
      >
        {/* LEFT — founder voice. Pinned via .flintmere-founder-pinned at
            ≥lg viewports (CSS in globals.css §Founder pinned column). */}
        <div className="flintmere-founder-pinned">
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
            If you book the audit (from £197), the team writes the letter
            and the per-product CSV. If you email hello@flintmere.com, we
            reply — usually within two working days.
          </p>

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
              Book the concierge audit (from £197)
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* RIGHT — scrollable proof panels. Three stat cards stacked
            vertically; each ~80–100vh tall so the LEFT column has scroll
            runway to be pinned against. */}
        <ol
          aria-label="Audit outcomes — representative examples"
          className="flex flex-col list-none m-0 p-0"
          style={{
            gap: 'clamp(48px, 6vh, 96px)',
          }}
        >
          {PROOF_PANELS.map((panel, i) => (
            <li
              key={i}
              className="font-mono flintmere-founder-panel"
              style={{
                border: '1px solid var(--color-line-dark)',
                padding: 'clamp(24px, 3.5vw, 48px)',
                color: 'var(--color-paper-on-ink)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'clamp(16px, 3vw, 36px)',
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
                className="font-sans"
                style={{
                  fontSize: 'clamp(56px, 7.2vw, 112px)',
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
                  className="font-sans"
                  style={{
                    fontSize: 'clamp(17px, 1.4vw, 22px)',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: 'var(--color-paper-on-ink)',
                    marginBottom: 'clamp(8px, 1vw, 14px)',
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
              letterSpacing: '0.04em',
              lineHeight: 1.55,
              color: 'var(--color-mute-inv)',
              fontFamily: 'var(--font-mono)',
              marginTop: 'clamp(16px, 2vh, 32px)',
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
