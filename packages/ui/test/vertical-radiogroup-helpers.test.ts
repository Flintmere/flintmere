import { describe, expect, it } from 'vitest';
import {
  cardClassName,
  cardEyebrowClassName,
  cardSublineClassName,
  computeCardColumnClass,
  containerClassName,
  isActivationKey,
  isNavigationKey,
  nextIndex,
} from '../src/vertical-radiogroup-helpers.js';

describe('nextIndex — keyboard arithmetic for VerticalRadiogroup', () => {
  it('ArrowRight from index 0 in 3-card group → 1', () => {
    expect(nextIndex(0, 'ArrowRight', 3)).toBe(1);
  });
  it('ArrowDown from index 0 in 3-card group → 1 (Down equivalent to Right)', () => {
    expect(nextIndex(0, 'ArrowDown', 3)).toBe(1);
  });
  it('ArrowRight from last card wraps to 0 (3-card group)', () => {
    expect(nextIndex(2, 'ArrowRight', 3)).toBe(0);
  });
  it('ArrowRight from last card wraps to 0 (4-card group)', () => {
    expect(nextIndex(3, 'ArrowRight', 4)).toBe(0);
  });
  it('ArrowLeft from index 0 wraps to last (3-card group)', () => {
    expect(nextIndex(0, 'ArrowLeft', 3)).toBe(2);
  });
  it('ArrowUp from index 0 wraps to last (4-card group)', () => {
    expect(nextIndex(0, 'ArrowUp', 4)).toBe(3);
  });
  it('Home → 0 from any index', () => {
    expect(nextIndex(2, 'Home', 3)).toBe(0);
    expect(nextIndex(3, 'Home', 4)).toBe(0);
  });
  it('End → length-1 from any index', () => {
    expect(nextIndex(0, 'End', 3)).toBe(2);
    expect(nextIndex(1, 'End', 4)).toBe(3);
  });
  it('Esc / unrecognised key returns the current index unchanged', () => {
    expect(nextIndex(1, 'Escape', 3)).toBe(1);
    expect(nextIndex(2, 'a', 4)).toBe(2);
    expect(nextIndex(0, 'Tab', 3)).toBe(0);
  });
  it('zero-length group returns 0 for any key (defensive — primitive must not crash)', () => {
    expect(nextIndex(0, 'ArrowRight', 0)).toBe(0);
    expect(nextIndex(0, 'Home', 0)).toBe(0);
  });
});

describe('isActivationKey', () => {
  it('Enter activates', () => {
    expect(isActivationKey('Enter')).toBe(true);
  });
  it('Space activates (both " " and legacy "Spacebar")', () => {
    expect(isActivationKey(' ')).toBe(true);
    expect(isActivationKey('Spacebar')).toBe(true);
  });
  it('Esc does NOT activate (radiogroup is not a menu — Esc is inert per spec)', () => {
    expect(isActivationKey('Escape')).toBe(false);
  });
  it('Arrow keys are NOT activation keys', () => {
    expect(isActivationKey('ArrowRight')).toBe(false);
    expect(isActivationKey('ArrowLeft')).toBe(false);
  });
});

describe('isNavigationKey', () => {
  it('all four arrow keys are navigation', () => {
    expect(isNavigationKey('ArrowRight')).toBe(true);
    expect(isNavigationKey('ArrowLeft')).toBe(true);
    expect(isNavigationKey('ArrowUp')).toBe(true);
    expect(isNavigationKey('ArrowDown')).toBe(true);
  });
  it('Home + End are navigation', () => {
    expect(isNavigationKey('Home')).toBe(true);
    expect(isNavigationKey('End')).toBe(true);
  });
  it('Tab is NOT navigation (Tab exits the group per single-tab-stop contract)', () => {
    expect(isNavigationKey('Tab')).toBe(false);
  });
  it('Enter / Space are NOT navigation (they activate, not navigate)', () => {
    expect(isNavigationKey('Enter')).toBe(false);
    expect(isNavigationKey(' ')).toBe(false);
  });
});

describe('cardClassName — variant matrix (Phase-C revision)', () => {
  it('paper × default × unselected: --paper bg, ink text, default padding, under-tick scale-x-0', () => {
    const cls = cardClassName({ surface: 'paper', size: 'default', selected: false });
    expect(cls).toContain('bg-[color:var(--color-paper)]');
    expect(cls).toContain('text-[color:var(--color-ink)]');
    expect(cls).toContain('p-8');
    expect(cls).toContain('min-h-[200px]');
    expect(cls).toContain('before:scale-x-0');
    expect(cls).not.toContain('before:scale-x-100');
    // Phase-C: 4px under-tick (was 2px).
    expect(cls).toContain('before:h-[4px]');
    expect(cls).not.toContain('before:h-[2px]');
  });

  it('paper × default × selected: --paper-2 bg + under-tick scale-x-100 (the amber moment)', () => {
    const cls = cardClassName({ surface: 'paper', size: 'default', selected: true });
    expect(cls).toContain('before:scale-x-100');
    expect(cls).not.toContain('before:scale-x-0');
    // Phase-C delta g — selected card on --paper-2 (depth without shadow).
    expect(cls).toContain('bg-[color:var(--color-paper-2)]');
    expect(cls).not.toContain('bg-[color:var(--color-paper)]');
    // Border weight unchanged — selection signal is the under-tick + bg shift,
    // NOT a thicker border (CLS = 0 contract per spec).
    expect(cls).toContain('border-[color:var(--color-line)]');
  });

  it('compact size: smaller padding + min-height', () => {
    const cls = cardClassName({ surface: 'paper', size: 'compact', selected: false });
    expect(cls).toContain('p-6');
    expect(cls).toContain('min-h-[160px]');
    expect(cls).not.toContain('p-8');
    expect(cls).not.toContain('min-h-[200px]');
  });

  it('ink surface unselected: --ink bg + paper text + accent focus ring', () => {
    const cls = cardClassName({ surface: 'ink', size: 'default', selected: false });
    expect(cls).toContain('bg-[color:var(--color-ink)]');
    expect(cls).toContain('text-[color:var(--color-paper)]');
    expect(cls).toContain('border-[color:var(--color-line-dark)]');
    expect(cls).toContain('focus-visible:outline-[color:var(--color-accent)]');
  });

  it('ink surface selected: --ink-3 compound (ink-side analog of paper-2)', () => {
    const cls = cardClassName({ surface: 'ink', size: 'default', selected: true });
    expect(cls).toContain('bg-[color:var(--color-ink-3)]');
    expect(cls).not.toContain('bg-[color:var(--color-ink)] ');
    expect(cls).toContain('before:scale-x-100');
  });

  it('paper surface uses ink focus ring (per accessibility.md §Keyboard)', () => {
    const cls = cardClassName({ surface: 'paper', size: 'default', selected: false });
    expect(cls).toContain('focus-visible:outline-[color:var(--color-ink)]');
  });
});

describe('cardEyebrowClassName — Phase-C weight + colour deltas', () => {
  it('paper × unselected: --mute-2 + medium weight (was normal in original)', () => {
    const cls = cardEyebrowClassName({ surface: 'paper', selected: false });
    expect(cls).toContain('text-[color:var(--color-mute-2)]');
    expect(cls).toContain('font-medium');
  });
  it('paper × selected: --ink + semibold weight (Phase-C bump 500→600)', () => {
    const cls = cardEyebrowClassName({ surface: 'paper', selected: true });
    expect(cls).toContain('text-[color:var(--color-ink)]');
    expect(cls).toContain('font-semibold');
  });
  it('ink × unselected: --mute-inv + medium weight', () => {
    const cls = cardEyebrowClassName({ surface: 'ink', selected: false });
    expect(cls).toContain('text-[color:var(--color-mute-inv)]');
    expect(cls).toContain('font-medium');
  });
  it('ink × selected: --paper + semibold weight', () => {
    const cls = cardEyebrowClassName({ surface: 'ink', selected: true });
    expect(cls).toContain('text-[color:var(--color-paper)]');
    expect(cls).toContain('font-semibold');
  });
});

describe('cardSublineClassName — Phase-C selection-aware ink colour', () => {
  it('paper × unselected: --ink-2 (the original colour, retained)', () => {
    expect(cardSublineClassName({ surface: 'paper', selected: false })).toContain(
      'text-[color:var(--color-ink-2)]',
    );
  });
  it('paper × selected: --ink (Phase-C delta c — most readable text in source-of-attention)', () => {
    const cls = cardSublineClassName({ surface: 'paper', selected: true });
    expect(cls).toContain('text-[color:var(--color-ink)]');
    expect(cls).not.toContain('text-[color:var(--color-ink-2)]');
  });
  it('ink × unselected: --mute-inv', () => {
    expect(cardSublineClassName({ surface: 'ink', selected: false })).toContain(
      'text-[color:var(--color-mute-inv)]',
    );
  });
  it('ink × selected: --paper (full inversion read)', () => {
    const cls = cardSublineClassName({ surface: 'ink', selected: true });
    expect(cls).toContain('text-[color:var(--color-paper)]');
  });
});

describe('containerClassName — layout + size matrix', () => {
  it('default size + asymmetric (homepage default): 1fr 1.5fr 1fr at lg', () => {
    const cls = containerClassName({ size: 'default', layout: 'asymmetric' });
    expect(cls).toContain('lg:grid-cols-[1fr_1.5fr_1fr]');
    expect(cls).not.toContain('lg:grid-cols-3');
  });
  it('default size + symmetric (canon escape hatch): even thirds', () => {
    const cls = containerClassName({ size: 'default', layout: 'symmetric' });
    expect(cls).toContain('lg:grid-cols-3');
    expect(cls).not.toContain('1.5fr');
  });
  it('compact size: 4-up symmetric regardless of layout (pricing surface)', () => {
    const asymmetric = containerClassName({ size: 'compact', layout: 'asymmetric' });
    const symmetric = containerClassName({ size: 'compact', layout: 'symmetric' });
    expect(asymmetric).toContain('lg:grid-cols-4');
    expect(symmetric).toContain('lg:grid-cols-4');
    expect(asymmetric).not.toContain('1.5fr');
  });
});

describe('computeCardColumnClass — asymmetric grid placement', () => {
  it('selected card always lands in lg:col-start-2 (the wide centre slot)', () => {
    expect(
      computeCardColumnClass({
        index: 0,
        selectedIndex: 0,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-2');
    expect(
      computeCardColumnClass({
        index: 1,
        selectedIndex: 1,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-2');
    expect(
      computeCardColumnClass({
        index: 2,
        selectedIndex: 2,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-2');
  });

  it('selectedIndex=0 → DOM card 1 to col 1, DOM card 2 to col 3', () => {
    expect(
      computeCardColumnClass({
        index: 1,
        selectedIndex: 0,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-1');
    expect(
      computeCardColumnClass({
        index: 2,
        selectedIndex: 0,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-3');
  });

  it('selectedIndex=1 → DOM card 0 to col 1, DOM card 2 to col 3', () => {
    expect(
      computeCardColumnClass({
        index: 0,
        selectedIndex: 1,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-1');
    expect(
      computeCardColumnClass({
        index: 2,
        selectedIndex: 1,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-3');
  });

  it('selectedIndex=2 → DOM card 0 to col 1, DOM card 1 to col 3', () => {
    expect(
      computeCardColumnClass({
        index: 0,
        selectedIndex: 2,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-1');
    expect(
      computeCardColumnClass({
        index: 1,
        selectedIndex: 2,
        length: 3,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('lg:col-start-3');
  });

  it('symmetric layout returns empty string (no col-start overrides)', () => {
    expect(
      computeCardColumnClass({
        index: 0,
        selectedIndex: 1,
        length: 3,
        size: 'default',
        layout: 'symmetric',
      }),
    ).toBe('');
  });

  it('compact size returns empty string (pricing 4-up; no column stretching)', () => {
    expect(
      computeCardColumnClass({
        index: 0,
        selectedIndex: 1,
        length: 4,
        size: 'compact',
        layout: 'asymmetric',
      }),
    ).toBe('');
  });

  it('non-3-card group returns empty string (asymmetric is 3-card-only)', () => {
    expect(
      computeCardColumnClass({
        index: 0,
        selectedIndex: 1,
        length: 4,
        size: 'default',
        layout: 'asymmetric',
      }),
    ).toBe('');
  });
});
