import { Bracket } from '@flintmere/ui';
import {
  buildWedges,
  CENTER,
  SAGE_RING_INNER,
  SAGE_RING_OUTER,
  VIEW,
  type PillarSpec,
} from './PillarWheel';

/**
 * PillarAccordion — mobile (<lg) pillar section.
 *
 * Replaces the radial wheel + fullscreen modal on phones. The wheel's wedges
 * are poor tap targets and the modal opened off-screen / "hard to read"
 * (operator, 2026-06-21). This is the mobile-native form: the iconic wheel
 * kept as a small NON-interactive weight visual on top, then the seven
 * pillars as a native <details name="pillars"> accordion — exclusive (opening
 * one closes the rest), keyboard-accessible, zero JS, and the detail expands
 * INLINE so nothing lands off-screen.
 *
 * Each row's detail carries the same content the desktop spotlight/modal
 * shows: headline + looks-for / common-miss / what-to-do. Smooth open where
 * supported (Chrome ::details-content + interpolate-size); graceful instant
 * toggle elsewhere (iOS Safari). Reduced-motion inherits the global block.
 *
 * References (council pre-flight, lead #7 Maren): order-form.shop (grid-as-
 * ledger rows + weight column), Areena index numerals (bracket numerals as
 * row anchors), linear.app (one figure per row, minimal chrome).
 */
export function PillarAccordion({ pillars }: { pillars: PillarSpec[] }) {
  const wedges = buildWedges(pillars);

  return (
    <div className="pillar-acc">
      {/* Compact static wheel — the weight motif at a glance. Decorative;
          the accordion below carries every pillar's name + weight to AT. */}
      <div className="pillar-acc-wheel" aria-hidden="true">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="pillar-acc-wheel__svg"
          role="presentation"
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={SAGE_RING_OUTER}
            fill="none"
            stroke="var(--color-accent-sage)"
            strokeWidth={1.5}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={SAGE_RING_INNER}
            fill="none"
            stroke="var(--color-accent-sage)"
            strokeWidth={1.5}
          />
          {wedges.map((w) => (
            <path
              key={w.idx}
              d={w.path}
              fill="var(--color-paper)"
              stroke="var(--color-line)"
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>
      <p className="pillar-acc-caption font-mono">
        <span aria-hidden="true">// </span>seven pillars · 360° = 100% of score
      </p>

      {/* Native accordion — name="pillars" makes the rows mutually exclusive. */}
      <div className="pillar-acc-list">
        {pillars.map((p, i) => {
          const id = String(i + 1).padStart(2, '0');
          return (
            <details key={i} name="pillars" className="pillar-acc-item">
              <summary className="pillar-acc-summary">
                <span className="pillar-acc-num font-mono">
                  <Bracket>{id}</Bracket>
                </span>
                <span className="pillar-acc-name font-sans">{p.name}</span>
                <span className="pillar-acc-weight font-mono">{p.weight}</span>
              </summary>
              <div className="pillar-acc-detail">
                <p className="pillar-acc-headline font-sans">{p.headline}</p>
                <dl className="pillar-acc-dl">
                  <dt className="font-mono">Looks for</dt>
                  <dd className="font-sans">{p.looksFor}</dd>
                  <dt className="font-mono">Common miss</dt>
                  <dd className="font-sans">{p.commonMiss}</dd>
                  <dt className="font-mono">What to do</dt>
                  <dd className="font-sans">{p.whatToDo}</dd>
                </dl>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
