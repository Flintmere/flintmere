import type { CSSProperties } from 'react';
import { Bracket } from '@flintmere/ui';

/**
 * Pillar — single row in the seven-checks list on the marketing homepage.
 *
 * Chapter 2 v4 amplification (Order Form + Areena + Apartamento, 2026-04-29):
 *   Each row is an editorial spread, not a table row. THREE columns:
 *     [ NN ]  ←  ordinal on left, display-mono, weight 700, scales by weight
 *     ───┐
 *        │  pillar name (display-sans, weight 500, scales by weight)
 *        │  body copy (mute, body register, fixed scale — legibility floor)
 *     ───┘
 *               weight on right, display-mono, weight 700, scales by weight
 *               (was a small eyebrow + 1px amber chart-bar; bar removed —
 *                read as subordinate decoration not editorial)
 *
 *   - Ordinal AND percentage at clamp(60, 8vw, 120) × visual-scale.
 *     Two display events flank the editorial column. Areena's double-
 *     numeral pattern (`No. 14` + display caption); Order-Form magazine's
 *     explicit grid as design.
 *   - Visual-weight-by-data-weight scaling preserved + extended to vertical
 *     padding: paddingY = clamp(48, 6vw, 96) × visual-scale. The 5% pillar
 *     row now physically stands shorter than the 20% pillar rows. The
 *     Tufte information-design move reads as height, not just type-scale.
 *   - 1px amber weight-bar removed. The percentage-as-display-numeral is
 *     the weight visualization.
 *   - Hover-lift contract preserved (Pattern 2 — transform + shadow + sage
 *     border via data-hover-lift).
 *
 * Mobile (≤768px): the three-column grid stacks to single-column. Ordinal
 * sits top-left, name + body middle, weight bottom-right. Same elements,
 * vertical layout.
 */
export function Pillar({
  name,
  weight,
  desc,
  idx,
  weightPct,
}: {
  name: string;
  weight: string;
  desc: string;
  idx?: number;
  weightPct?: number;
}) {
  const weightLabel = `${weight.replace('%', ' percent')} of total score weight`;
  const visualScale =
    typeof weightPct !== 'number'
      ? 1
      : weightPct >= 0.2
      ? 1
      : weightPct >= 0.15
      ? 0.9
      : weightPct >= 0.1
      ? 0.82
      : 0.72;
  const rowStyle = {
    ...(typeof idx === 'number'
      ? { '--reveal-delay': `${idx * 80}ms` }
      : null),
    '--pillar-visual-scale': String(visualScale),
    paddingTop: 'calc(clamp(48px, 6vw, 96px) * var(--pillar-visual-scale, 1))',
    paddingBottom:
      'calc(clamp(48px, 6vw, 96px) * var(--pillar-visual-scale, 1))',
  } as CSSProperties;
  const idLabel =
    typeof idx === 'number' ? String(idx + 1).padStart(2, '0') : '00';
  // Strip the percentage sign — rendered as a small mono superscript on the
  // display numeral so the number itself reads at full editorial scale.
  const weightNumber = weight.replace('%', '');
  return (
    <li
      className="pillar-row grid grid-cols-[minmax(120px,14vw)_1fr_minmax(120px,14vw)] gap-x-8 lg:gap-x-12 items-center max-md:grid-cols-1 max-md:gap-y-6 px-2"
      data-reveal
      data-hover-lift
      style={rowStyle}
    >
      <span
        className="font-mono font-bold tracking-[-0.02em] leading-[0.85] text-[color:var(--color-ink)]"
        aria-hidden="true"
        style={{
          fontSize:
            'calc(clamp(60px, 8vw, 120px) * var(--pillar-visual-scale, 1))',
        }}
      >
        <Bracket>{idLabel}</Bracket>
      </span>
      <span className="grid grid-cols-1 gap-4 max-md:gap-3 max-w-[44ch]">
        <span
          className="pillar-name font-sans font-medium tracking-[-0.025em] leading-[1.05] text-[color:var(--color-ink)]"
          style={{
            fontSize:
              'calc(clamp(28px, 4vw, 56px) * var(--pillar-visual-scale, 1))',
          }}
        >
          {name}
        </span>
        <span
          className="pillar-desc text-[color:var(--color-mute)] leading-[1.55]"
          style={{ fontSize: 'clamp(15px, 1.2vw, 17px)' }}
        >
          {desc}
        </span>
      </span>
      <span
        className="font-mono font-bold tracking-[-0.02em] leading-[0.85] text-[color:var(--color-ink)] text-right max-md:text-left whitespace-nowrap"
        aria-label={weightLabel}
        style={{
          fontSize:
            'calc(clamp(60px, 8vw, 120px) * var(--pillar-visual-scale, 1))',
        }}
      >
        {weightNumber}
        <span
          className="font-mono font-medium inline-block align-top"
          aria-hidden="true"
          style={{ fontSize: '0.32em', marginLeft: '0.06em' }}
        >
          %
        </span>
      </span>
    </li>
  );
}
