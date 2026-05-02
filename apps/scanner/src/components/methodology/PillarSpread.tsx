import type { Pillar } from '@/lib/methodology-data';

/**
 * PillarSpread — per-pillar editorial spread.
 *
 * Mechanic: Bloomberg Businessweek cover register — oversized index
 * numeral as load-bearing decoration occupying ~one column, body content
 * in the right column. Asymmetric grid; the numeral is allowed to bleed
 * into the typography's negative space.
 *
 * Reference: Bloomberg Businessweek covers — type-as-image, oversized
 * numerals; Pentagram project pages — single oversized character or
 * numeral fills 80% of the frame with thin caption.
 *
 * Choreography: cascade fade-in (canonical scroll choreography #7) — the
 * numeral, name, and three body paragraphs cascade in with stagger when
 * the spread enters the viewport. CSS animation tied to `data-spread="in"`
 * via IntersectionObserver in the parent layout. Reduced-motion: the
 * cascade resolves to opacity:1, no animation, via the soft global block
 * in globals.css.
 *
 * Each spread carries the bracket budget of one — the numeral itself is
 * the chapter anchor, satisfying ADR 0021 §4 "≤1 bracket per section"
 * (the numeral is bracket-equivalent in this context, the actual `[ ]`
 * brackets are reserved for the hero and the manifesto curtain).
 */

interface PillarSpreadProps {
  pillar: Pillar;
}

export function PillarSpread({ pillar }: PillarSpreadProps) {
  const headingId = `pillar-${pillar.id}-heading`;
  return (
    <section
      id={`pillar-${pillar.id}`}
      aria-labelledby={headingId}
      className="methodology-spread relative mx-auto max-w-[1200px]"
      style={{
        paddingLeft: 'clamp(24px, 4vw, 64px)',
        paddingRight: 'clamp(24px, 4vw, 64px)',
        paddingTop: 'clamp(64px, 9vw, 144px)',
        paddingBottom: 'clamp(64px, 9vw, 144px)',
      }}
    >
      <div className="grid md:grid-cols-[minmax(200px,_0.85fr)_2fr] gap-x-8 lg:gap-x-20 gap-y-10 items-start">
        {/* Left column — the oversized numeral as the chapter anchor.
            Static positioning (no sticky) — the pinned treemap above does
            the persistent-navigation job; this numeral is just the chapter
            anchor and should render fully + crisply at the top of its
            column without overlap. Padding-top added so the cascade-rise
            animation has room to land without being clipped by the pinned
            treemap as the section enters viewport. */}
        <div
          className="methodology-spread__index relative"
          style={{ paddingTop: 'clamp(8px, 1vw, 16px)' }}
        >
          <p
            aria-hidden="true"
            className="font-mono text-[color:var(--color-ink)] leading-[0.82]"
            style={{
              // Slightly tighter cap so the numeral fits in 2-row pin
              // configurations without visually clipping. Still heroic.
              fontSize: 'clamp(96px, 14vw, 220px)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              fontVariantNumeric: 'tabular-nums',
              // Force the glyph's full ascent + descent into the box so
              // the cascade animation never clips the top of '0' or '7'.
              display: 'block',
              paddingTop: '0.05em',
            }}
          >
            {pillar.n}
          </p>
          <p
            className="font-mono uppercase text-[color:var(--color-mute-2)]"
            style={{
              fontSize: 11,
              letterSpacing: '0.16em',
              marginTop: 20,
            }}
          >
            {pillar.weight}% of score
            {pillar.installGated ? ' — install-gated' : ''}
          </p>
        </div>

        {/* Right column — the editorial body. */}
        <div className="methodology-spread__body">
          <h3
            id={headingId}
            className="font-sans text-[color:var(--color-ink)]"
            style={{
              // Larger and bolder. The previous 32–64px ramp at font-medium
              // (500) was undersized against the hero + the new
              // unified-700 canon; bumped to 36–80px @ 700 to read as a
              // proper chapter heading.
              fontSize: 'clamp(36px, 5.2vw, 80px)',
              letterSpacing: '-0.03em',
              lineHeight: 0.96,
              fontWeight: 700,
            }}
          >
            {pillar.name}.
          </h3>

          <div className="methodology-spread__body-prose mt-10 max-w-[60ch] flex flex-col gap-6">
            <Section label="What it measures" body={pillar.measures} />
            <Section label="Why it matters" body={pillar.why} />
            <Section label="Sources" body={pillar.sources} small />
            <Section label="Not measured" body={pillar.notMeasured} small mute />
          </div>
        </div>
      </div>
    </section>
  );
}

interface SectionProps {
  label: string;
  body: string;
  small?: boolean;
  mute?: boolean;
}

function Section({ label, body, small, mute }: SectionProps) {
  return (
    <div>
      <p
        className="font-mono uppercase text-[color:var(--color-mute-2)]"
        style={{ fontSize: 11, letterSpacing: '0.16em', marginBottom: 8 }}
      >
        {label}
      </p>
      <p
        className={mute ? 'text-[color:var(--color-mute)]' : 'text-[color:var(--color-ink-2)]'}
        style={{
          fontSize: small ? 14 : 16,
          lineHeight: small ? 1.6 : 1.7,
        }}
      >
        {body}
      </p>
    </div>
  );
}
