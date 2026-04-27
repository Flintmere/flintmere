import type { CSSProperties } from 'react';
import { Bracket } from '@flintmere/ui';

/**
 * Pillar — single row in the seven-checks list on the marketing homepage.
 *
 * Post-ADR-0021 redesign:
 *   - Leftmost column carries a `[ NN ]` bracket-ID per ADR 0021 axis 4
 *     (bracket budget per section, no page cap). Zero-padded two-digit
 *     IDs per operator Q8 lock.
 *   - Right column replaces the inline percentage with the percentage +
 *     a 1px amber weight-bar scaled to the pillar's weight (`--color-accent`).
 *     The bar is a structural visual cue per Sable P1 in the homepage critique.
 *   - Each row carries `data-hover-lift` (Pattern 2 — hover-lift via
 *     transform + shadow + sage border, with non-shadow signal so
 *     forced-colors and high-contrast users get the same affordance).
 *   - Reveal stagger and a11y `aria-label` semantics preserved verbatim.
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
  const staggerStyle =
    typeof idx === 'number'
      ? ({ '--reveal-delay': `${idx * 80}ms` } as CSSProperties)
      : undefined;
  // Bracketed IDs are derived from `idx` (0-indexed) → 01, 02, 03 ... per
  // operator Q8 lock. Zero-padded so brackets read evenly across rows.
  const idLabel =
    typeof idx === 'number' ? String(idx + 1).padStart(2, '0') : '00';
  // Bar width as a percentage of the bar's container — bar fills the right
  // column proportionally to the pillar weight. Linear scale: 20% weight → 100%
  // bar (max), 5% weight → 25% bar (min visible).
  const barPercent =
    typeof weightPct === 'number' && weightPct > 0
      ? Math.min(100, (weightPct / 0.2) * 100)
      : 0;
  return (
    <li
      className="pillar-row grid grid-cols-[80px_1fr_180px] gap-6 py-7 items-baseline max-md:grid-cols-1 max-md:gap-2 px-2"
      data-reveal
      data-hover-lift
      style={staggerStyle}
    >
      <span
        className="font-mono text-[13px] tracking-[0.04em] text-[color:var(--color-ink)]"
        aria-hidden="true"
      >
        <Bracket>{idLabel}</Bracket>
      </span>
      <span className="grid grid-cols-1 gap-1">
        <span className="pillar-name">{name}</span>
        <span className="pillar-desc text-[color:var(--color-mute)]">{desc}</span>
      </span>
      <span className="grid grid-cols-1 gap-2 max-md:gap-1">
        <span
          className="eyebrow text-right max-md:text-left"
          aria-label={weightLabel}
        >
          {weight}
        </span>
        <span
          aria-hidden="true"
          className="block h-[1px] justify-self-end max-md:justify-self-start"
          style={{
            width: `${barPercent}%`,
            background: 'var(--color-accent)',
          }}
        />
      </span>
    </li>
  );
}
