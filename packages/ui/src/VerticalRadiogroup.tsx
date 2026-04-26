/**
 * VerticalRadiogroup — single-tab-stop radiogroup card grid.
 *
 * Spec source of truth (binding):
 *   context/design/components/2026-04-26-vertical-radiogroup.md
 *
 * Consumers (binding):
 *   1. apps/scanner/src/components/HomepageVerticalPicker.tsx (3 cards, default size)
 *   2. apps/scanner/src/components/PricingVerticalTabs.tsx    (4 cards, compact size)
 *
 * Design canon (binding):
 *   memory/design/tokens.md   — tokens, signature, amber-as-accent
 *   memory/design/accessibility.md — WAI-ARIA radiogroup pattern, focus rules
 *   memory/design/motion.md   — soft prefers-reduced-motion contract
 *
 * Dependency rule:
 *   Hand-rolled. Zero new npm dependencies. Class-variance-authority is NOT used —
 *   variant matrix lives in vertical-radiogroup-helpers.ts as a pure function so
 *   it can be unit-tested in node env without jsdom.
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
  isActivationKey,
  isNavigationKey,
  nextIndex,
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
  /** 3 or 4 cards. Visual order = tab/arrow order. */
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
  /** Pass-through to the radiogroup container. Cards are not externally restyleable. */
  className?: string;
}

export function VerticalRadiogroup({
  verticals,
  selected,
  onChange,
  name,
  ariaLabel,
  surface = 'paper',
  size = 'default',
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

  const cols =
    size === 'compact'
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 lg:grid-cols-3';

  const containerClass = ['grid', 'gap-6', 'lg:gap-6', 'gap-4', cols, className]
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
            className={cardClassName({ surface, size, selected: isSelected })}
          >
            <span className={cardEyebrowClassName({ surface, selected: isSelected })}>
              {v.eyebrow}
            </span>
            <span className="mt-3 text-[28px] md:text-[32px] font-medium tracking-[-0.025em] leading-[1.05]">
              {v.label}
            </span>
            <span className={cardSublineClassName({ surface })}>{v.subline}</span>
          </button>
        );
      })}
    </div>
  );
}
