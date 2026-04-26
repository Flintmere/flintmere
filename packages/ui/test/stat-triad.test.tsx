/**
 * Render-shape tests for StatTriad.
 *
 * Same SSR strategy as the rest of packages/ui/test — workspace has no
 * jsdom and Phase B forbids new dependencies. We assert structural
 * invariants on the SSR'd HTML.
 *
 * Coverage gap (declared, not hidden):
 *   - The intersection-observer scroll-reveal fade is global CSS + the
 *     consuming app's <ViewportReveal>; not exercised here.
 *   - True axe-core a11y pass is performed at the consuming-app layer
 *     (Phase B's Pa11y CI is the regression net).
 */

import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { StatTriad, type Stat } from '../src/StatTriad.js';

const HOMEPAGE_STATS: ReadonlyArray<Stat> = [
  {
    eyebrow: 'scan',
    numeral: '7',
    microLine: 'Checks we run on every scan.',
  },
  {
    eyebrow: 'time',
    numeral: '60s',
    microLine: 'Time the free scan takes on a 5,000-product store.',
    numeralAriaLabel: '60 seconds',
  },
  {
    eyebrow: 'paid',
    numeral: '£97',
    microLine: 'One-off concierge audit. Fix CSV + 30-day re-scan.',
    numeralAriaLabel: 'ninety-seven pounds',
  },
];

const FOUR_STATS: ReadonlyArray<Stat> = [
  ...HOMEPAGE_STATS,
  {
    eyebrow: 'verticals',
    numeral: '3',
    microLine: 'Food, beauty, apparel — food is the spearhead.',
  },
];

describe('StatTriad — render shape', () => {
  it('paper variant + symmetric (default): renders 3 cells with --line dividers', () => {
    const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} />);
    // <aside> root with default aria-label.
    expect(html).toContain('aria-label="Key facts"');
    expect(html).toContain('<aside');
    // Paper bg.
    expect(html).toContain('bg-[color:var(--color-paper)]');
    // 3 cells, role="group".
    const groups = html.match(/role="group"/g);
    expect(groups?.length).toBe(3);
    // Symmetric grid.
    expect(html).toContain('md:grid-cols-3');
    expect(html).not.toContain('md:grid-cols-[1fr_2fr_1fr]');
  });

  it('ink-slab + focalIndex=1 (homepage canonical): asymmetric 1fr 2fr 1fr', () => {
    const html = renderToString(
      <StatTriad stats={HOMEPAGE_STATS} surface="ink-slab" focalIndex={1} />,
    );
    expect(html).toContain('bg-[color:var(--color-ink)]');
    expect(html).toContain('text-[color:var(--color-paper)]');
    expect(html).toContain('md:grid-cols-[1fr_2fr_1fr]');
  });

  it('focal under-tick (Phase-C single amber moment) renders only on the focal cell', () => {
    const html = renderToString(
      <StatTriad stats={HOMEPAGE_STATS} surface="ink-slab" focalIndex={1} />,
    );
    // Exactly one under-tick span (1px hairline, 2px wide, --accent).
    const undertick = html.match(/bg-\[color:var\(--color-accent\)\]/g);
    expect(undertick?.length).toBe(1);
  });

  it('numeral renders in --paper on ink-slab (Phase-C amendment — NO amber on £97)', () => {
    const html = renderToString(
      <StatTriad stats={HOMEPAGE_STATS} surface="ink-slab" focalIndex={1} />,
    );
    // The numeral colour is --paper on ink-slab (NOT --accent for £97).
    expect(html).toContain('text-[color:var(--color-paper)]');
    // The £97 numeral text should be present.
    expect(html).toContain('£97');
    // No amber on the £97 numeral itself — the only --color-accent reference
    // is the under-tick (1 occurrence, asserted above).
  });

  it('numeral renders in --ink on paper variant (default accent ink)', () => {
    const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} />);
    expect(html).toContain('text-[color:var(--color-ink)]');
  });

  it('eyebrows render as plain mono labels — NO bracket characters (Phase-C amendment)', () => {
    const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} />);
    // The amendment cuts all bracket characters from eyebrows.
    expect(html).toContain('scan');
    expect(html).toContain('time');
    expect(html).toContain('paid');
    // No `[` immediately followed by mono eyebrow text (a quick negative check).
    expect(html).not.toContain('[ scan ]');
    expect(html).not.toContain('[scan]');
    expect(html).not.toContain('[ time ]');
    expect(html).not.toContain('[ paid ]');
  });

  it('per-cell composed aria-label combines numeralAriaLabel (or numeral) + microLine', () => {
    const html = renderToString(
      <StatTriad stats={HOMEPAGE_STATS} surface="ink-slab" focalIndex={1} />,
    );
    // Stat 0: no numeralAriaLabel → uses numeral "7".
    expect(html).toContain('aria-label="7 — Checks we run on every scan."');
    // Stat 1: numeralAriaLabel "60 seconds" overrides "60s".
    expect(html).toContain(
      'aria-label="60 seconds — Time the free scan takes on a 5,000-product store."',
    );
    // Stat 2: numeralAriaLabel "ninety-seven pounds".
    expect(html).toContain(
      'aria-label="ninety-seven pounds — One-off concierge audit. Fix CSV + 30-day re-scan."',
    );
  });

  it('numeral span is aria-hidden when numeralAriaLabel is provided (avoids double-announce)', () => {
    const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} focalIndex={1} />);
    // Two stats have numeralAriaLabel → two aria-hidden numeral spans.
    // (The under-tick decorative span is also aria-hidden; total ≥ 3.)
    const ariaHidden = html.match(/aria-hidden="true"/g);
    expect((ariaHidden?.length ?? 0)).toBeGreaterThanOrEqual(3);
  });

  it('flanker baseline shifts: idx<focal translate-y-[12px]; idx>focal -translate-y-[8px]', () => {
    const html = renderToString(
      <StatTriad stats={HOMEPAGE_STATS} surface="ink-slab" focalIndex={1} />,
    );
    expect(html).toContain('translate-y-[12px]');
    expect(html).toContain('-translate-y-[8px]');
  });

  it('symmetric layout (focalIndex null) — no baseline shifts, no asymmetric grid', () => {
    const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} />);
    expect(html).not.toContain('translate-y-[12px]');
    expect(html).not.toContain('-translate-y-[8px]');
    expect(html).not.toContain('md:grid-cols-[1fr_2fr_1fr]');
  });

  it('4-stat variant: 4-up grid (research / benchmark callsite shape)', () => {
    const html = renderToString(<StatTriad stats={FOUR_STATS} />);
    expect(html).toContain('lg:grid-cols-4');
    const groups = html.match(/role="group"/g);
    expect(groups?.length).toBe(4);
  });

  it('cells carry data-reveal + --reveal-delay stagger (80ms per index)', () => {
    const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} />);
    expect(html).toContain('data-reveal');
    // Style serialisation: --reveal-delay:0ms, 80ms, 160ms.
    expect(html).toContain('--reveal-delay:0ms');
    expect(html).toContain('--reveal-delay:80ms');
    expect(html).toContain('--reveal-delay:160ms');
  });

  it('first cell has no left-border; subsequent cells have md:border-l', () => {
    const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} />);
    // Three cells; two should carry md:border-l (cells 1 and 2).
    const dividers = html.match(/md:border-l/g);
    expect(dividers?.length).toBe(2);
  });

  it('warns at non-3/4 stats count (defensive)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      renderToString(
        <StatTriad
          stats={[
            { eyebrow: 'a', numeral: '1', microLine: 'one' },
            { eyebrow: 'b', numeral: '2', microLine: 'two' },
          ]}
        />,
      );
      expect(warnSpy).toHaveBeenCalled();
      const msg = warnSpy.mock.calls[0]?.[0];
      expect(msg).toContain('expected 3 or 4 stats');
    } finally {
      process.env.NODE_ENV = previousEnv;
      warnSpy.mockRestore();
    }
  });

  it('warns + falls back to symmetric when focalIndex out of range', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const html = renderToString(<StatTriad stats={HOMEPAGE_STATS} focalIndex={5} />);
      expect(warnSpy).toHaveBeenCalled();
      // Falls back to symmetric — no asymmetric grid.
      expect(html).not.toContain('md:grid-cols-[1fr_2fr_1fr]');
      // No under-tick (no focal cell).
      expect(html).not.toContain('bg-[color:var(--color-accent)]');
    } finally {
      process.env.NODE_ENV = previousEnv;
      warnSpy.mockRestore();
    }
  });

  it('amber-on-ink contrast: --accent (#F8BF24) vs --ink (#0A0A0B) ≥ 4.5 (AAA on display)', () => {
    // Direct contrast computation. Both tokens canonical from globals.css.
    const amber = { r: 0xf8, g: 0xbf, b: 0x24 };
    const ink = { r: 0x0a, g: 0x0a, b: 0x0b };
    const lum = (c: { r: number; g: number; b: number }) => {
      const rgb = [c.r, c.g, c.b].map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
    };
    const l1 = Math.max(lum(amber), lum(ink));
    const l2 = Math.min(lum(amber), lum(ink));
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    // Per spec: amber on ink at display scale ≈ 11:1 AAA. Even AA Normal
    // floor (4.5:1) is comfortably cleared.
    expect(ratio).toBeGreaterThan(4.5);
  });
});
