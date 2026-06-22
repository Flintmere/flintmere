import Image from 'next/image';
import { Bracket } from '@flintmere/ui';
import { type PillarSpec } from './PillarWheel';

/**
 * PillarAccordion — mobile (<lg) pillar section.
 *
 * Replaces the radial wheel + fullscreen modal on phones. The wheel's wedges
 * are poor tap targets and the modal opened off-screen / "hard to read"
 * (operator, 2026-06-21).
 *
 * At-a-glance is a WEIGHTED BAR, not a decorative circle (operator, 2026-06-22:
 * "a random circle makes 0 sense"). Seven segments sized by each pillar's score
 * weight (20/20/15/15/15/5/10 = 100%) show how the score actually splits — the
 * thing the equal-looking wedges hid. Below it, the seven pillars are a native
 * <details name="pillars"> accordion — exclusive (opening one closes the rest),
 * keyboard-accessible, zero JS, expanding INLINE so nothing lands off-screen.
 *
 * Each row's detail carries what the desktop spotlight showed: the pillar's
 * warm-treated still-life (PillarSpec.image, --image-treatment-warm, lazy so it
 * loads only on expand) + headline + looks-for / common-miss / what-to-do.
 * Smooth open where supported (Chrome ::details-content + interpolate-size);
 * graceful instant toggle elsewhere (iOS Safari). Reduced-motion inherits the
 * global block.
 *
 * References (council pre-flight, lead #7 Maren): order-form.shop (explicit grid
 * as data language — the weighted bar), apartamentomagazine.com (warm
 * single-subject still-life cadence — the pillar photos), margarethowell.co.uk
 * (single photo + mono caption + restraint — the per-row composition).
 */
export function PillarAccordion({ pillars }: { pillars: PillarSpec[] }) {
  const weightLabel = pillars.map((p) => `${p.name} ${p.weight}`).join(', ');

  return (
    <div className="pillar-acc">
      {/* Weighted bar — seven segments sized by score weight, summing to 100%.
          role=img with a full label; the rows below carry the semantic content. */}
      <div
        className="pillar-acc-bar"
        role="img"
        aria-label={`The seven scoring pillars by weight: ${weightLabel}. Together 100% of the score.`}
      >
        {pillars.map((p, i) => (
          <div
            key={i}
            className="pillar-acc-bar__seg"
            style={{ flexGrow: p.weightPct, flexBasis: 0 }}
          >
            <span className="pillar-acc-bar__num font-mono" aria-hidden="true">
              {Math.round(p.weightPct * 100)}
            </span>
          </div>
        ))}
      </div>
      <p className="pillar-acc-caption font-mono">
        <span aria-hidden="true">// </span>seven pillars &middot; weighted to 100% of score
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
                {/* Warm-treated still-life — matches the desktop spotlight
                    treatment. Lazy by default: in a closed <details> the frame
                    is display:none, so the browser defers the fetch until the
                    row opens. */}
                <figure className="pillar-acc-figure">
                  <div className="pillar-acc-figure__frame">
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      fill
                      sizes="(max-width: 1023px) 100vw, 50vw"
                      className="object-cover"
                      style={{ filter: 'var(--image-treatment-warm)' }}
                    />
                  </div>
                  <figcaption className="pillar-acc-figure__cap font-mono">
                    <span aria-hidden="true">// </span>figure <Bracket>{id}</Bracket>{' '}
                    &middot; {p.name}
                  </figcaption>
                </figure>
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
