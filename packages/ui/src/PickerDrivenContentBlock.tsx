/**
 * PickerDrivenContentBlock — companion primitive to VerticalRadiogroup.
 *
 * Spec source of truth (binding):
 *   context/design/components/2026-04-26-vertical-radiogroup-revision.md §Companion primitive
 *
 * Contract:
 *   - API: { selectedId, slots, ariaLabelTemplate, surface?, className? }.
 *   - Renders h2 + 3-bullet list + CTA per `slots[selectedId]`.
 *   - Cross-fade on `selectedId` change (120ms fade-out then 120ms fade-in;
 *     total ≤ 240ms perceived). Composited opacity only.
 *   - `aria-live="polite"` on the section so AT announces vertical changes
 *     without interrupting the radio's `aria-checked` announcement.
 *   - Renders `null` + dev-only console warn if `selectedId` doesn't match a slot key.
 *
 * Reduced-motion: opacity transition inherits the global
 * `@media (prefers-reduced-motion: reduce)` block in apps/scanner globals.css
 * (transition-duration scales to 0.01ms). NO per-component @media override.
 *
 * Dependency rule: hand-rolled. Zero new npm dependencies. Tokens via
 * `[color:var(--color-*)]` Tailwind utilities only.
 *
 * Framework: React 19. "use client" — useState/useEffect for cross-fade timer.
 */

'use client';

import * as React from 'react';

export interface PickerDrivenContent {
  /** Vertical-specific h2 text. */
  h2: string;
  /** 3 bullets per vertical (lint-enforced length 3 at the callsite). */
  bullets: ReadonlyArray<string>;
  /** CTA button text — Copy Council polish via web-implementation. */
  ctaLabel: string;
  /** Route target for the CTA. */
  ctaHref: string;
}

export interface PickerDrivenContentBlockProps {
  /** Controlled — must match a key in `slots`. */
  selectedId: string;
  /** Per-vertical content payload; missing key → null render + dev console warn. */
  slots: Readonly<Record<string, PickerDrivenContent>>;
  /** Returns the section's `aria-label`; receives the selected id. */
  ariaLabelTemplate: (id: string) => string;
  /** Inversion variant; no callsite uses ink at launch. Default = "paper". */
  surface?: 'paper' | 'ink';
  /** Pass-through to the section element. */
  className?: string;
}

// Cross-fade timing: 120ms fade-out, 120ms fade-in. Total perceived ≤ 240ms.
// We swap the rendered slot at the midpoint, after the fade-out completes.
const CROSSFADE_HALF_MS = 120;

const containerBaseClass =
  'mx-auto max-w-[1280px] px-8 py-20 border-y transition-opacity duration-[var(--duration-short)] ease-[cubic-bezier(0.4,0,0.2,1)]';

function surfaceClass(surface: 'paper' | 'ink'): string {
  return surface === 'paper'
    ? 'border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)]'
    : 'border-[color:var(--color-line-dark)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)]';
}

function bulletColourClass(surface: 'paper' | 'ink'): string {
  return surface === 'paper'
    ? 'text-[color:var(--color-ink-2)]'
    : 'text-[color:var(--color-mute-inv)]';
}

function ctaClass(surface: 'paper' | 'ink'): string {
  // Plain bordered button — matches the `.btn` pattern in scanner globals.css
  // (border + colour + on-hover invert), but inlined here so packages/ui has
  // no dependency on scanner CSS classes.
  if (surface === 'paper') {
    return [
      'inline-block px-6 py-3 border font-medium text-[16px]',
      'border-[color:var(--color-ink)] text-[color:var(--color-ink)]',
      'hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]',
      'transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)]',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ink)]',
    ].join(' ');
  }
  return [
    'inline-block px-6 py-3 border font-medium text-[16px]',
    'border-[color:var(--color-paper)] text-[color:var(--color-paper)]',
    'hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)]',
    'transition-colors duration-[var(--duration-instant)] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]',
  ].join(' ');
}

export function PickerDrivenContentBlock({
  selectedId,
  slots,
  ariaLabelTemplate,
  surface = 'paper',
  className,
}: PickerDrivenContentBlockProps) {
  // We render the *displayed* slot — which lags `selectedId` by the half
  // crossfade window so the swap happens behind the fade-out. The visible
  // slot updates inside the timer callback.
  const [displayedId, setDisplayedId] = React.useState(selectedId);
  const [opacity, setOpacity] = React.useState<1 | 0>(1);
  const previousIdRef = React.useRef(selectedId);

  React.useEffect(() => {
    if (previousIdRef.current === selectedId) return;
    previousIdRef.current = selectedId;
    // Fade-out → swap content → fade-in.
    setOpacity(0);
    const timer = setTimeout(() => {
      setDisplayedId(selectedId);
      setOpacity(1);
    }, CROSSFADE_HALF_MS);
    return () => clearTimeout(timer);
  }, [selectedId]);

  const content = slots[displayedId];

  if (!content) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `PickerDrivenContentBlock: no slot for "${displayedId}". Available keys: ${Object.keys(slots).join(', ')}`,
      );
    }
    return null;
  }

  const sectionClass = [
    containerBaseClass,
    surfaceClass(surface),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      aria-live="polite"
      aria-label={ariaLabelTemplate(selectedId)}
      className={sectionClass}
      style={{ opacity }}
    >
      <div className="grid lg:grid-cols-[3fr_2fr] gap-12 items-start">
        <div>
          <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[clamp(32px,5vw,44px)] max-w-[24ch]">
            {content.h2}
          </h2>
          <ul
            className={`mt-8 list-none p-0 m-0 space-y-3 text-[15px] leading-[1.55] max-w-[56ch] ${bulletColourClass(surface)}`}
          >
            {content.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">
                  —
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:pt-4">
          <a href={content.ctaHref} className={ctaClass(surface)}>
            {content.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
