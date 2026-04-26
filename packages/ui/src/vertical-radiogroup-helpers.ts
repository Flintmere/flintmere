/**
 * Pure helpers for VerticalRadiogroup.
 *
 * Extracted so the radiogroup keyboard arithmetic + class composition
 * can be unit-tested without a DOM (the workspace has no jsdom and
 * Phase B forbids new dependencies — see context/plans/2026-04-26-phase-b-vertical-picker.md).
 *
 * Spec source of truth: context/design/components/2026-04-26-vertical-radiogroup.md
 */

export type Surface = 'paper' | 'ink';
export type Size = 'default' | 'compact';

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
 * Selection signal = under-tick (::before scaleX) + (in `cardEyebrowClassName`)
 * eyebrow weight shift. Border weight unchanged in every state — CLS = 0.
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
    'before:h-[2px]',
    'before:bg-[color:var(--color-accent)]',
    'before:origin-left',
    'before:transition-transform',
    'before:duration-[var(--duration-short)]',
    'before:ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-colors',
    'duration-[var(--duration-instant)]',
    'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
  ];

  const surface =
    args.surface === 'paper'
      ? [
          'border-[color:var(--color-line)]',
          'bg-[color:var(--color-paper)]',
          'text-[color:var(--color-ink)]',
          'focus-visible:outline-[color:var(--color-ink)]',
        ]
      : [
          'border-[color:var(--color-line-dark)]',
          'bg-[color:var(--color-ink)]',
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
 * Selected state shifts to ink + medium weight (without changing the
 * font-variation — that would animate font-weight, which Idris's veto
 * forbids).
 */
export function cardEyebrowClassName(args: { surface: Surface; selected: boolean }): string {
  const base = ['font-mono', 'text-[11px]', 'uppercase', 'tracking-[0.14em]'];
  if (args.surface === 'paper') {
    base.push(
      args.selected
        ? 'text-[color:var(--color-ink)] font-medium'
        : 'text-[color:var(--color-mute-2)] font-normal',
    );
  } else {
    base.push(
      args.selected
        ? 'text-[color:var(--color-paper)] font-medium'
        : 'text-[color:var(--color-mute-inv)] font-normal',
    );
  }
  return base.join(' ');
}

/**
 * Compose the className for the subline span inside a card.
 */
export function cardSublineClassName(args: { surface: Surface }): string {
  return args.surface === 'paper'
    ? 'mt-3 text-[14px] leading-[1.55] text-[color:var(--color-ink-2)]'
    : 'mt-3 text-[14px] leading-[1.55] text-[color:var(--color-mute-inv)]';
}
