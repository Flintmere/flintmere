import { describe, expect, it } from 'vitest';
import {
  cardClassName,
  cardEyebrowClassName,
  cardSublineClassName,
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

describe('cardClassName — variant matrix', () => {
  it('paper × default × unselected: paper bg, ink text, default padding, under-tick scale-x-0', () => {
    const cls = cardClassName({ surface: 'paper', size: 'default', selected: false });
    expect(cls).toContain('bg-[color:var(--color-paper)]');
    expect(cls).toContain('text-[color:var(--color-ink)]');
    expect(cls).toContain('p-8');
    expect(cls).toContain('min-h-[200px]');
    expect(cls).toContain('before:scale-x-0');
    expect(cls).not.toContain('before:scale-x-100');
  });

  it('paper × default × selected: under-tick scale-x-100 (the amber moment)', () => {
    const cls = cardClassName({ surface: 'paper', size: 'default', selected: true });
    expect(cls).toContain('before:scale-x-100');
    expect(cls).not.toContain('before:scale-x-0');
    // Border weight unchanged — selection signal is the under-tick + eyebrow
    // weight, NOT a thicker border (CLS = 0 contract per spec).
    expect(cls).toContain('border-[color:var(--color-line)]');
  });

  it('compact size: smaller padding + min-height', () => {
    const cls = cardClassName({ surface: 'paper', size: 'compact', selected: false });
    expect(cls).toContain('p-6');
    expect(cls).toContain('min-h-[160px]');
    expect(cls).not.toContain('p-8');
    expect(cls).not.toContain('min-h-[200px]');
  });

  it('ink surface: inverted bg + paper text + accent focus ring', () => {
    const cls = cardClassName({ surface: 'ink', size: 'default', selected: false });
    expect(cls).toContain('bg-[color:var(--color-ink)]');
    expect(cls).toContain('text-[color:var(--color-paper)]');
    expect(cls).toContain('border-[color:var(--color-line-dark)]');
    expect(cls).toContain('focus-visible:outline-[color:var(--color-accent)]');
  });

  it('paper surface uses ink focus ring (per accessibility.md §Keyboard)', () => {
    const cls = cardClassName({ surface: 'paper', size: 'default', selected: false });
    expect(cls).toContain('focus-visible:outline-[color:var(--color-ink)]');
  });
});

describe('cardEyebrowClassName — selected vs unselected weight + colour', () => {
  it('paper × unselected: mute-2 + normal weight', () => {
    const cls = cardEyebrowClassName({ surface: 'paper', selected: false });
    expect(cls).toContain('text-[color:var(--color-mute-2)]');
    expect(cls).toContain('font-normal');
  });
  it('paper × selected: ink + medium weight (the typographic shift)', () => {
    const cls = cardEyebrowClassName({ surface: 'paper', selected: true });
    expect(cls).toContain('text-[color:var(--color-ink)]');
    expect(cls).toContain('font-medium');
  });
  it('ink × unselected: mute-inv + normal weight', () => {
    const cls = cardEyebrowClassName({ surface: 'ink', selected: false });
    expect(cls).toContain('text-[color:var(--color-mute-inv)]');
    expect(cls).toContain('font-normal');
  });
  it('ink × selected: paper + medium weight', () => {
    const cls = cardEyebrowClassName({ surface: 'ink', selected: true });
    expect(cls).toContain('text-[color:var(--color-paper)]');
    expect(cls).toContain('font-medium');
  });
});

describe('cardSublineClassName — text colour by surface', () => {
  it('paper subline → ink-2', () => {
    expect(cardSublineClassName({ surface: 'paper' })).toContain(
      'text-[color:var(--color-ink-2)]',
    );
  });
  it('ink subline → mute-inv', () => {
    expect(cardSublineClassName({ surface: 'ink' })).toContain(
      'text-[color:var(--color-mute-inv)]',
    );
  });
});
