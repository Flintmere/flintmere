/**
 * VerticalRadiogroup — single-tab-stop radiogroup card grid.
 *
 * Spec source of truth (binding revision):
 *   context/design/components/2026-04-26-vertical-radiogroup-revision.md
 *   (original baseline: context/design/components/2026-04-26-vertical-radiogroup.md)
 *
 * Phase-C revision deltas (per amendment block at top of revision spec):
 *   - 4px under-tick (was 2px). See vertical-radiogroup-helpers.ts.
 *   - Eyebrow weight 600 + `--ink` on selected; weight 500 + `--mute-2` on unselected.
 *   - Subline `--ink` on selected; `--ink-2` on unselected.
 *   - Selected card on `--paper-2` (paper) / `--ink-3` (ink).
 *   - NO bracket on selected card name (amendment cuts upgrade f).
 *   - Asymmetric grid (default): selected card always in column 2; non-selected
 *     in source order in cols 1 and 3 via `lg:col-start-N`. DOM order =
 *     tab order = arrow-key cycle order.
 *   - `layout` variant (`asymmetric` default | `symmetric`) — canon escape hatch.
 *   - 200ms cross-fade animation on selection change (composited opacity only).
 *     Reduced-motion: instant via global `globals.css` block at `prefers-reduced-motion: reduce`.
 *
 * Consumers (binding):
 *   1. apps/scanner/src/components/HomepageVerticalPicker.tsx (3 cards, default size, asymmetric)
 *   2. apps/scanner/src/components/PricingVerticalTabs.tsx    (4 cards, compact size — symmetric implicitly)
 *
 * Design canon (binding):
 *   memory/design/tokens.md   — tokens, signature, amber-as-accent
 *   memory/design/accessibility.md — WAI-ARIA radiogroup pattern, focus rules
 *   memory/design/motion.md   — soft prefers-reduced-motion contract
 *
 * Dependency rule:
 *   Hand-rolled. Zero new npm dependencies. Variant matrix lives in
 *   vertical-radiogroup-helpers.ts as a pure function so it can be
 *   unit-tested in node env without jsdom.
 *
 * Framework:
 *   React 19. "use client" directive — keyboard handlers + ref imperative focus
 *   require client-side hydration. URL state coupling lives in the consumer
 *   page, not in this primitive (per spec — keeps packages/ui framework-agnostic
 *   beyond React itself).
 */

'use client';

import * as React from 'react';
import {
  cardClassName,
  cardEyebrowClassName,
  cardSublineClassName,
  computeCardColumnClass,
  containerClassName,
  isActivationKey,
  isNavigationKey,
  nextIndex,
  type Layout,
  type Size,
  type Surface,
} from './vertical-radiogroup-helpers.js';

export interface Vertical {
  /** URL-safe slug — e.g. "food", "beauty", "apparel", "bundle". */
  id: string;
  /** Display name in Geist Sans display weight. */
  label: string;
  /** Mono uppercase eyebrow above the label. */
  eyebrow: string;
  /** Single-sentence framing below the label. */
  subline: string;
}

export interface VerticalRadiogroupProps {
  /** 3 or 4 cards. Visual order = tab/arrow order (DOM order preserved). */
  verticals: ReadonlyArray<Vertical>;
  /** Controlled selection — must match one of verticals[i].id. */
  selected: string;
  /** Fired on click, Enter, Space, arrow-key cycle. */
  onChange: (id: string) => void;
  /** Group identifier (a11y). e.g. "homepage-vertical-picker". */
  name: string;
  /** Visible-context-aware label — e.g. "Pick your vertical". */
  ariaLabel: string;
  /** Inverts tokens for ink-canvas use. Default = "paper". */
  surface?: Surface;
  /** "compact" reduces padding/min-height (used on /pricing). Default = "default". */
  size?: Size;
  /**
   * Visual grid layout. "asymmetric" places the selected card in the wide
   * centre column (`1fr 1.5fr 1fr`), with non-selected cards in cols 1 and 3
   * in source order. "symmetric" reverts to even thirds. Default = "asymmetric".
   * `size="compact"` always renders symmetric 4-up regardless of this prop.
   */
  layout?: Layout;
  /** Pass-through to the radiogroup container. Cards are not externally restyleable. */
  className?: string;
}

// Cross-fade duration matches the helpers' `--duration-short` (220ms in
// globals.css). The card body's opacity dips to 0.45 then returns to 1 over
// the selection change, masking the column-swap. Reduced-motion is honoured
// by the global @media (prefers-reduced-motion: reduce) block which scales
// transition-duration to 0.01ms — the opacity dip becomes imperceptible.
const CROSSFADE_HALF_MS = 110;

export function VerticalRadiogroup({
  verticals,
  selected,
  onChange,
  name,
  ariaLabel,
  surface = 'paper',
  size = 'default',
  layout = 'asymmetric',
  className,
}: VerticalRadiogroupProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // The currently selected index drives where focus lands when the user
  // tabs into the group; falls back to 0 when the controlled `selected`
  // does not match any card (defensive — operator misuse).
  const selectedIndex = React.useMemo(() => {
    const i = verticals.findIndex((v) => v.id === selected);
    return i === -1 ? 0 : i;
  }, [verticals, selected]);

  // Cross-fade state: dip opacity briefly on selection change, then restore.
  // We use a single boolean toggled by an effect on `selected`. Composited
  // opacity transition only — no layout-affecting properties animated.
  const [isCrossfading, setIsCrossfading] = React.useState(false);
  const previousSelectedRef = React.useRef(selected);

  React.useEffect(() => {
    if (previousSelectedRef.current === selected) return;
    previousSelectedRef.current = selected;
    setIsCrossfading(true);
    const timer = setTimeout(() => setIsCrossfading(false), CROSSFADE_HALF_MS);
    return () => clearTimeout(timer);
  }, [selected]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (isActivationKey(event.key)) {
        event.preventDefault();
        const target = verticals[index];
        if (target) onChange(target.id);
        return;
      }
      if (isNavigationKey(event.key)) {
        event.preventDefault();
        const next = nextIndex(index, event.key, verticals.length);
        const target = verticals[next];
        if (!target) return;
        onChange(target.id);
        // Focus follows selection per WAI-ARIA APG. Defer past the React
        // commit so the ref array reflects the new selected/tabIndex state.
        queueMicrotask(() => {
          refs.current[next]?.focus();
        });
      }
      // Esc, Tab, Shift+Tab, every other key — intentional pass-through.
    },
    [verticals, onChange],
  );

  const containerClass = [
    containerClassName({ size, layout }),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-name={name}
      className={containerClass}
    >
      {verticals.map((v, i) => {
        const isSelected = v.id === selected;
        const columnClass = computeCardColumnClass({
          index: i,
          selectedIndex,
          length: verticals.length,
          size,
          layout,
        });
        const cardBase = cardClassName({ surface, size, selected: isSelected });
        // Composited opacity transition only. Reduced-motion safe via the
        // global @media block; no per-component override needed.
        const cardOpacityClass = isCrossfading ? 'opacity-60' : 'opacity-100';
        const cardClass = [
          cardBase,
          'transition-opacity',
          'duration-[var(--duration-short)]',
          'ease-[cubic-bezier(0.4,0,0.2,1)]',
          cardOpacityClass,
          columnClass,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={v.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={i === selectedIndex ? 0 : -1}
            onClick={() => onChange(v.id)}
            onKeyDown={(event) => handleKeyDown(event, i)}
            className={cardClass}
          >
            <span className={cardEyebrowClassName({ surface, selected: isSelected })}>
              {v.eyebrow}
            </span>
            <span className="mt-3 text-[28px] md:text-[32px] font-medium tracking-[-0.025em] leading-[1.05]">
              {v.label}
            </span>
            <span className={cardSublineClassName({ surface, selected: isSelected })}>
              {v.subline}
            </span>
          </button>
        );
      })}
    </div>
  );
}
