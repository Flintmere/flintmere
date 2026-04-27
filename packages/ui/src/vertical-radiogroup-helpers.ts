/**
 * Pure helpers for VerticalRadiogroup.
 *
 * Extracted so the radiogroup keyboard arithmetic + class composition
 * can be unit-tested without a DOM (the workspace has no jsdom and
 * Phase B forbids new dependencies — see context/plans/2026-04-26-phase-b-vertical-picker.md).
 *
 * Spec source of truth (revision binding):
 *   context/design/components/2026-04-26-vertical-radiogroup-revision.md
 *
 * Phase-C revision deltas (binding amendment block at top of revision spec):
 *   - 4px under-tick (was 2px).
 *   - Selected eyebrow: weight 600 + `--ink` colour; unselected: weight 500 + `--mute-2`.
 *   - Selected subline: `--ink`; unselected: `--ink-2`.
 *   - Selected card on `--paper-2` background (paper surface) / `--ink-3` (ink surface).
 *   - NO bracket on selected card name. Plain Geist Sans 500 in every state.
 *   - Asymmetric grid (lg:grid-cols-[1fr_1.5fr_1fr]) with selected card always in column 2;
 *     non-selected in source order in cols 1 and 3 via `lg:col-start-N`.
 *   - Symmetric variant (`layout="symmetric"`) preserves canon escape hatch.
 */

export type Surface = 'paper' | 'ink';
export type Size = 'default' | 'compact';
export type Layout = 'asymmetric' | 'symmetric';

/**
 * Compute the next selected index given the current index, the keyboard key,
 * and the total number of cards.
 *
 * Returns the SAME index when the key is not a navigation key — callers can
 * treat "unchanged" as "no-op." Wraps with modulo arithmetic for ArrowRight /
 * ArrowDown / ArrowLeft / ArrowUp; jumps to bounds for Home / End.
 *
 * Per WAI-ARIA Authoring Practices radiogroup pattern + spec §Accessibility.
 */
export function nextIndex(currentIndex: number, key: string, length: number): number {
  if (length <= 0) return 0;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (currentIndex + 1 + length) % length;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (currentIndex - 1 + length) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return currentIndex;
  }
}

/**
 * Returns true when the given key should activate the focused card
 * (re-fires onChange even if already selected — preserves keyboard
 * expectation per WAI-ARIA APG).
 */
export function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
}

/**
 * Returns true when the given key should be considered for navigation
 * (caller should preventDefault to avoid page-scroll on Arrow / Home / End).
 */
export function isNavigationKey(key: string): boolean {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'ArrowDown':
    case 'Home':
    case 'End':
      return true;
    default:
      return false;
  }
}

/**
 * Compose the className string for a single radiogroup card.
 *
 * Variant matrix per spec:
 *   surface: paper | ink
 *   size:    default | compact
 *   selected: true | false
 *
 * Selection signal (Phase-C revision):
 *   - 4px under-tick (::before scaleX) in `--accent`.
 *   - Selected card on `--paper-2` (paper) / `--ink-3` (ink).
 *   - Eyebrow weight 600 + ink colour on selected (in `cardEyebrowClassName`).
 *   - Subline `--ink` on selected (in `cardSublineClassName`).
 *   - Border weight unchanged in every state — CLS = 0.
 */
export function cardClassName(args: {
  surface: Surface;
  size: Size;
  selected: boolean;
}): string {
  const base = [
    'group',
    'relative',
    'flex',
    'flex-col',
    'text-left',
    'border',
    'cursor-pointer',
    "before:content-['']",
    'before:absolute',
    'before:inset-x-6',
    'before:bottom-0',
    'before:h-[4px]',
    'before:bg-[color:var(--color-accent)]',
    'before:origin-left',
    'before:transition-transform',
    'before:duration-[var(--duration-short)]',
    'before:ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-colors',
    'duration-[var(--duration-short)]',
    'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
  ];

  // Selected card carries a 1px sage hairline at the bottom edge (decorative
  // affordance per ADR 0021 axis 1). Sage is decorative-only (paired with
  // aria-checked + the under-tick + the paper-2 background — never colour
  // alone). Selected card also carries `--shadow-paper-1` permanently so it
  // sits visually elevated above the unselected siblings.
  const surface =
    args.surface === 'paper'
      ? [
          'border-[color:var(--color-line)]',
          args.selected ? 'border-b-[color:var(--color-accent-sage)]' : '',
          args.selected ? 'shadow-[var(--shadow-paper-1)]' : '',
          // Paper surface: --paper unselected, --paper-2 selected (depth without shadow).
          args.selected
            ? 'bg-[color:var(--color-paper-2)]'
            : 'bg-[color:var(--color-paper)]',
          'text-[color:var(--color-ink)]',
          'focus-visible:outline-[color:var(--color-ink)]',
        ]
      : [
          'border-[color:var(--color-line-dark)]',
          args.selected ? 'border-b-[color:var(--color-accent-sage)]' : '',
          args.selected ? 'shadow-[var(--shadow-paper-1)]' : '',
          // Ink surface compound: --ink unselected, --ink-3 selected.
          args.selected
            ? 'bg-[color:var(--color-ink-3)]'
            : 'bg-[color:var(--color-ink)]',
          'text-[color:var(--color-paper)]',
          'focus-visible:outline-[color:var(--color-accent)]',
        ];

  const size =
    args.size === 'default' ? ['p-8', 'min-h-[200px]'] : ['p-6', 'min-h-[160px]'];

  const selection = args.selected ? ['before:scale-x-100'] : ['before:scale-x-0'];

  return [...base, ...surface, ...size, ...selection].join(' ');
}

/**
 * Compose the className for the eyebrow span inside a card.
 *
 * Phase-C revision (binding):
 *   - Selected (paper): `--ink` + font-semibold (weight 600).
 *   - Unselected (paper): `--mute-2` + font-medium (weight 500).
 *   - Selected (ink): `--paper` + font-semibold.
 *   - Unselected (ink): `--mute-inv` + font-medium.
 */
export function cardEyebrowClassName(args: { surface: Surface; selected: boolean }): string {
  const base = ['font-mono', 'text-[11px]', 'uppercase', 'tracking-[0.14em]'];
  if (args.surface === 'paper') {
    base.push(
      args.selected
        ? 'text-[color:var(--color-ink)] font-semibold'
        : 'text-[color:var(--color-mute-2)] font-medium',
    );
  } else {
    base.push(
      args.selected
        ? 'text-[color:var(--color-paper)] font-semibold'
        : 'text-[color:var(--color-mute-inv)] font-medium',
    );
  }
  return base.join(' ');
}

/**
 * Compose the className for the subline span inside a card.
 *
 * Phase-C revision (binding):
 *   - Selected (paper): `--ink` (the most readable text in source-of-attention).
 *   - Unselected (paper): `--ink-2` (was original behaviour for all).
 *   - Selected (ink): `--paper`.
 *   - Unselected (ink): `--mute-inv`.
 */
export function cardSublineClassName(args: { surface: Surface; selected: boolean }): string {
  const base = 'mt-3 text-[14px] leading-[1.55]';
  if (args.surface === 'paper') {
    return args.selected
      ? `${base} text-[color:var(--color-ink)]`
      : `${base} text-[color:var(--color-ink-2)]`;
  }
  return args.selected
    ? `${base} text-[color:var(--color-paper)]`
    : `${base} text-[color:var(--color-mute-inv)]`;
}

/**
 * Compose the container className for the radiogroup grid.
 *
 * Layout:
 *   - asymmetric (default): `lg:grid-cols-[1fr_1.5fr_1fr]`. Selected card always
 *     in column 2 (via per-card `computeCardColumnClass`); non-selected cards in
 *     source order in cols 1 and 3. DOM order = tab order = arrow-key cycle order;
 *     only visual columns swap.
 *   - symmetric: `lg:grid-cols-3` (or 4-up for compact size). Canon escape hatch.
 *
 * Compact size uses 4-up symmetric grid regardless of `layout` (the asymmetric
 * 1.5fr-centre treatment is for 3-card homepage; 4-card pricing uses symmetric).
 */
export function containerClassName(args: { size: Size; layout: Layout }): string {
  if (args.size === 'compact') {
    // Pricing surface — 4 cards, always symmetric.
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6';
  }
  if (args.layout === 'asymmetric') {
    return 'grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-4 lg:gap-6';
  }
  return 'grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6';
}

/**
 * Compute the per-card column-start class for the asymmetric grid.
 *
 * Contract:
 *   - Selected card → always `lg:col-start-2` (the wide centre slot).
 *   - Non-selected cards fill cols 1 and 3 in DOM order. With 3 verticals:
 *       * If selected is index 0 → card 1 (DOM second) → col 1, card 2 → col 3.
 *       * If selected is index 1 → card 0 → col 1, card 2 → col 3.
 *       * If selected is index 2 → card 0 → col 1, card 1 → col 3.
 *
 * Returns empty string when:
 *   - layout is symmetric (no col-start overrides).
 *   - size is compact (pricing 4-up; column stretching not used).
 *
 * Rationale (per spec §Asymmetric grid auto-shift behaviour):
 *   `grid-column-start` change preserves DOM order = tab order = arrow-key
 *   cycle order — visual order changes; logical order does not. WAI-ARIA
 *   recommended pattern for visual reorder of grid content.
 */
export function computeCardColumnClass(args: {
  index: number;
  selectedIndex: number;
  length: number;
  size: Size;
  layout: Layout;
}): string {
  if (args.size === 'compact') return '';
  if (args.layout !== 'asymmetric') return '';
  if (args.length !== 3) return '';

  if (args.index === args.selectedIndex) return 'lg:col-start-2';

  // Non-selected cards fill cols 1 and 3 in DOM order. The first non-selected
  // card we encounter (lowest DOM index that isn't selected) goes to col 1;
  // the second goes to col 3.
  const nonSelectedRank = args.index < args.selectedIndex ? args.index : args.index - 1;
  return nonSelectedRank === 0 ? 'lg:col-start-1' : 'lg:col-start-3';
}
