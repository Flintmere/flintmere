import type { CSSProperties } from 'react';

/**
 * Pillar — single row in the seven-checks list on the marketing homepage.
 *
 * Extracted from `apps/scanner/src/app/page.tsx` as part of the pre-emptive
 * homepage split (refactor only — no behaviour change). Each pillar carries
 * its own row in the `<ol>`; the parent provides `idx` so the reveal stagger
 * can offset per-row via `--reveal-delay`.
 *
 * Props contract preserved verbatim: `{ name, weight, desc, idx }`.
 */
export function Pillar({
  name,
  weight,
  desc,
  idx,
}: {
  name: string;
  weight: string;
  desc: string;
  idx?: number;
}) {
  const weightLabel = `${weight.replace('%', ' percent')} of total score weight`;
  const staggerStyle =
    typeof idx === 'number'
      ? ({ '--reveal-delay': `${idx * 80}ms` } as CSSProperties)
      : undefined;
  return (
    <li
      className="pillar-row grid grid-cols-[280px_1fr_100px] gap-6 py-7 items-baseline max-md:grid-cols-1 max-md:gap-2"
      data-reveal
      style={staggerStyle}
    >
      <span className="pillar-name">{name}</span>
      <span className="pillar-desc text-[color:var(--color-mute)]">{desc}</span>
      <span
        className="eyebrow text-right max-md:text-left"
        aria-label={weightLabel}
      >
        {weight}
      </span>
    </li>
  );
}
