/**
 * StatTriad — n-stat (3 or 4) horizontal trust strip.
 *
 * Spec source of truth (binding):
 *   context/design/components/2026-04-26-stat-triad.md
 *   (amendment block at top of file binds; body is informational where it
 *   conflicts with the amendment.)
 *
 * Phase-C amendment deltas (binding):
 *   - Eyebrows render as plain Mono uppercase labels — NO bracket characters,
 *     NO `aria-hidden` bracket spans (upgrade c amended).
 *   - `numeralAccent="amber"` is a TYPE field; this primitive ships with no
 *     amber numerals on the homepage callsite. The strip's single amber
 *     moment is the focal-numeral under-tick (upgrade e). `£97` renders in
 *     `--ink` (paper) / `--paper` (ink-slab) — upgrade h amended.
 *   - Dividers stay vertical 1px `--line` (paper) / `--line-dark` (ink-slab).
 *     Diagonal 3deg dividers cut (upgrade i CUT).
 *   - Sentence-case Mono micro-line is permitted; "Annotation Mono" sub-role
 *     name dropped (upgrade b amended).
 *
 * Surface variants:
 *   - "paper" (default): `--paper` background, `--ink` text, vertical 1px
 *     `--line` cell dividers, top + bottom `--line` border.
 *   - "ink-slab": `--ink` background, `--paper` text, vertical 1px `--line-dark`
 *     cell dividers, no top/bottom border (full-bleed inverted block).
 *
 * Asymmetric grid (focalIndex non-null):
 *   - 3-stat: `1fr 2fr 1fr` (the focal stat owns the 2x centre column).
 *   - Optical baseline shifts on flankers: indices < focal `translate-y-[12px]`,
 *     indices > focal `-translate-y-[8px]`. Composited transforms only — CLS = 0.
 *
 * Focal stat under-tick:
 *   - 1px `--accent` hairline, 2px wide, centred under the focal numeral
 *     (upgrade e). The strip's single amber moment.
 *
 * Scroll-reveal:
 *   - Each numeral cell carries `data-reveal` + `--reveal-delay: ${i * 80}ms`.
 *   - Pairs with the existing global `[data-reveal]` CSS contract in
 *     apps/scanner globals.css (opacity + transform fade, intersection
 *     observer fires the `is-visible` class via ViewportReveal.tsx).
 *   - Reduced-motion: inherits the global `@media (prefers-reduced-motion: reduce)`
 *     scale-to-zero. End state visible.
 *
 * Accessibility:
 *   - Section root is `<aside aria-label={ariaLabel}>` (default "Key facts").
 *   - Each cell is `role="group"` with composed `aria-label` =
 *     `${numeralAriaLabel || numeral} — ${microLine}` so SR reads coherent
 *     context per stat.
 *   - When `numeralAriaLabel` is provided, the visual numeral span is
 *     `aria-hidden="true"` so SR reads aria-label only.
 *
 * Dependency rule: hand-rolled. Zero new npm dependencies. Tokens via
 * `[color:var(--color-*)]` Tailwind utilities only.
 *
 * Framework: React 19. Renderable as a Server Component — no client state
 * at the primitive level. `data-reveal` + the consuming app's
 * `<ViewportReveal>` + global CSS handle the scroll-reveal client-side.
 */

import * as React from 'react';
import { NumeralCountUp } from './NumeralCountUp.js';

export interface Stat {
  /** Mono uppercase eyebrow (no brackets). e.g. "scan", "time", "paid". */
  eyebrow: string;
  /** Display numeral. Short string. e.g. "7", "60s", "£97". Never multi-line. */
  numeral: string;
  /** Sentence-case Mono 12px annotation. Single sentence, ≤ 18 words. */
  microLine: string;
  /**
   * Per-stat numeral colour override. Default: ink on paper, paper on ink-slab.
   * On the homepage callsite the amendment binds NO amber numerals — the
   * field exists for future flexibility.
   */
  numeralAccent?: 'amber' | 'ink';
  /**
   * SR-friendly long form. Use when visual numeral pronunciation is uncertain
   * (e.g., "60 seconds" for "60s", "ninety-seven pounds" for "£97").
   */
  numeralAriaLabel?: string;
}

export interface StatTriadProps {
  /** Length 3 (canonical) or 4 (research surface). Runtime warn at other lengths. */
  stats: ReadonlyArray<Stat>;
  /** Inversion variant. Default = "paper". */
  surface?: 'paper' | 'ink-slab';
  /**
   * Index of the focal stat (gets 2x column width + amber under-tick).
   * Null/undefined → symmetric layout, no focal numeral. Default = null.
   */
  focalIndex?: number | null;
  /** Section-level aria-label. Default = "Key facts". */
  ariaLabel?: string;
  /** Pass-through to the section element. */
  className?: string;
}

function sectionClass(surface: 'paper' | 'ink-slab'): string {
  return surface === 'paper'
    ? 'mx-auto max-w-[1280px] border-y border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)]'
    : 'bg-[color:var(--color-ink)] text-[color:var(--color-paper)]';
}

function gridClass(length: number, focalIndex: number | null): string {
  if (length === 4) {
    return 'mx-auto max-w-[1280px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  }
  if (length === 3 && focalIndex !== null) {
    // Asymmetric — the focal stat owns the 2x centre column.
    return 'mx-auto max-w-[1280px] grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr]';
  }
  // Symmetric — 3 even thirds.
  return 'mx-auto max-w-[1280px] grid grid-cols-1 md:grid-cols-3';
}

function cellClass(surface: 'paper' | 'ink-slab', isFirst: boolean): string {
  // Vertical 1px hairline divider on every cell except the first (left edge).
  // Token by surface — `--line` on paper, `--line-dark` on ink-slab.
  const base = 'p-8 flex flex-col items-start';
  if (isFirst) return base;
  return surface === 'paper'
    ? `${base} md:border-l md:border-[color:var(--color-line)]`
    : `${base} md:border-l md:border-[color:var(--color-line-dark)]`;
}

function eyebrowClass(surface: 'paper' | 'ink-slab'): string {
  const base = 'font-mono text-[11px] uppercase tracking-[0.14em] mb-3';
  return surface === 'paper'
    ? `${base} text-[color:var(--color-mute-2)]`
    : `${base} text-[color:var(--color-mute-inv)]`;
}

function numeralClass(args: {
  surface: 'paper' | 'ink-slab';
  accent: 'amber' | 'ink';
  isFocal: boolean;
}): string {
  // Per ADR 0021 axis 6 + the homepage redesign spec: focal numeral uses
  // the canon-ceiling clamp(88px, 14vw, 220px) at weight 700 (display
  // moments only — body weight rules unchanged). Non-focal numerals scale
  // to 60% (clamp(56px, 9vw, 132px)) at weight 500 — supporting numerals
  // read as supporting, not as competing focal moments. (Council ruling
  // Q11: 60% beats 50% on mobile readability — #7 Maren + #37 Consumer
  // psychologist + #34 Maya unanimous.)
  const tracking = 'tracking-[-0.045em] leading-[0.92]';
  const sized = args.isFocal
    ? `font-bold ${tracking} text-[clamp(88px,14vw,220px)] tabular-nums`
    : `font-medium ${tracking} text-[clamp(56px,9vw,132px)]`;
  if (args.accent === 'amber') {
    return `${sized} text-[color:var(--color-accent)]`;
  }
  return args.surface === 'paper'
    ? `${sized} text-[color:var(--color-ink)]`
    : `${sized} text-[color:var(--color-paper)]`;
}

function microLineClass(surface: 'paper' | 'ink-slab'): string {
  const base = 'font-mono text-[12px] tracking-[0.04em] mt-3 max-w-[28ch]';
  return surface === 'paper'
    ? `${base} text-[color:var(--color-mute)]`
    : `${base} text-[color:var(--color-mute-inv)]`;
}

/**
 * Optical baseline shift for flanker stats in the asymmetric layout.
 * - Indices BEFORE focal: `translate-y-[12px]` (nudge down).
 * - Indices AFTER focal: `-translate-y-[8px]` (nudge up).
 * - Focal stat itself: no transform.
 * - Symmetric layout (focalIndex null): no transform.
 */
function baselineShiftClass(args: { index: number; focalIndex: number | null }): string {
  if (args.focalIndex === null) return '';
  if (args.index < args.focalIndex) return 'translate-y-[12px]';
  if (args.index > args.focalIndex) return '-translate-y-[8px]';
  return '';
}

export function StatTriad({
  stats,
  surface = 'paper',
  focalIndex = null,
  ariaLabel = 'Key facts',
  className,
}: StatTriadProps) {
  if (
    stats.length !== 3 &&
    stats.length !== 4 &&
    process.env.NODE_ENV !== 'production'
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      `StatTriad: expected 3 or 4 stats, got ${stats.length}. Rendering best-effort.`,
    );
  }
  if (
    focalIndex !== null &&
    (focalIndex < 0 || focalIndex >= stats.length) &&
    process.env.NODE_ENV !== 'production'
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      `StatTriad: focalIndex ${focalIndex} out of range for ${stats.length} stats. Falling back to symmetric layout.`,
    );
  }
  // Defensive — normalise out-of-range focalIndex so layout doesn't break.
  const safeFocalIndex =
    focalIndex !== null && focalIndex >= 0 && focalIndex < stats.length
      ? focalIndex
      : null;

  const wrapperClass = [sectionClass(surface), 'py-16', className]
    .filter(Boolean)
    .join(' ');

  return (
    <aside aria-label={ariaLabel} className={wrapperClass}>
      <div className={gridClass(stats.length, safeFocalIndex)}>
        {stats.map((s, i) => {
          const isFocal = i === safeFocalIndex;
          const accent: 'amber' | 'ink' = s.numeralAccent ?? 'ink';
          const composedAriaLabel = [s.numeralAriaLabel ?? s.numeral, '—', s.microLine].join(
            ' ',
          );
          const numeralBaseClass = numeralClass({ surface, accent, isFocal });
          const shift = baselineShiftClass({ index: i, focalIndex: safeFocalIndex });
          const numeralWrapperClass = ['inline-block', 'relative', shift]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={i}
              role="group"
              aria-label={composedAriaLabel}
              className={cellClass(surface, i === 0)}
              data-reveal
              style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
            >
              <span className={eyebrowClass(surface)}>{s.eyebrow}</span>
              <span className={numeralWrapperClass}>
                {isFocal ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute"
                    style={{
                      inset: '-20% -20%',
                      background: 'var(--gradient-amber-radial)',
                      zIndex: 0,
                    }}
                  />
                ) : null}
                {isFocal ? (
                  <NumeralCountUp
                    value={s.numeral}
                    className={`${numeralBaseClass} relative z-[1]`}
                  />
                ) : (
                  <span
                    className={numeralBaseClass}
                    aria-hidden={s.numeralAriaLabel ? 'true' : undefined}
                  >
                    {s.numeral}
                  </span>
                )}
                {isFocal ? (
                  <span
                    aria-hidden="true"
                    className="block h-[1px] w-[2px] mx-auto mt-2 bg-[color:var(--color-accent)] relative z-[1]"
                  />
                ) : null}
              </span>
              <span className={microLineClass(surface)}>{s.microLine}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
