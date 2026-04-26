/**
 * Render-shape tests for VerticalRadiogroup.
 *
 * Why renderToString and not React Testing Library?
 *   The workspace has no jsdom and Phase B forbids new dependencies. We assert
 *   structural invariants on the SSR'd HTML — single tab stop (one tabindex=0,
 *   rest -1), aria-checked mirrors selected, role="radiogroup" + role="radio"
 *   semantics, and per-card label/eyebrow/subline render.
 *
 * Coverage gap (declared, not hidden):
 *   Keyboard cycling, click-fires-onChange, focus follow-on-arrow are NOT
 *   exercised here — they require a real DOM. The pure keyboard arithmetic
 *   is unit-tested in vertical-radiogroup-helpers.test.ts; the DOM-side glue
 *   is wired through a 5-line useCallback that defers to those helpers.
 */

import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { VerticalRadiogroup, type Vertical } from '../src/VerticalRadiogroup.js';

const THREE_VERTICALS: ReadonlyArray<Vertical> = [
  {
    id: 'food',
    label: 'Food + drink.',
    eyebrow: 'FOOD + DRINK',
    subline: 'FSA Big-14 + ISO + PDO + certifications. Spearhead vertical.',
  },
  {
    id: 'beauty',
    label: 'Beauty.',
    eyebrow: 'BEAUTY',
    subline: 'Standard in development. Free scan available.',
  },
  {
    id: 'apparel',
    label: 'Apparel.',
    eyebrow: 'APPAREL',
    subline: 'Standard in development. Free scan available.',
  },
];

const FOUR_VERTICALS: ReadonlyArray<Vertical> = [
  ...THREE_VERTICALS,
  {
    id: 'bundle',
    label: 'Food + Beauty bundle.',
    eyebrow: 'BUNDLE',
    subline: 'Single £159 / agency £499 — per ADR 0016.',
  },
];

describe('VerticalRadiogroup — render shape', () => {
  it('renders a radiogroup container with the supplied aria-label + name', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="homepage-vertical-picker"
        ariaLabel="Pick your vertical"
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Pick your vertical"');
    expect(html).toContain('data-name="homepage-vertical-picker"');
  });

  it('renders one button per vertical with role="radio"', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="homepage-vertical-picker"
        ariaLabel="Pick your vertical"
      />,
    );
    const radios = html.match(/role="radio"/g);
    expect(radios?.length).toBe(3);
  });

  it('renders 4 cards when given 4 verticals (pricing surface)', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={FOUR_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="pricing-vertical-tabs"
        ariaLabel="Pick a vertical"
        size="compact"
      />,
    );
    const radios = html.match(/role="radio"/g);
    expect(radios?.length).toBe(4);
  });

  it('selected card has aria-checked="true", others "false"', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="beauty"
        onChange={() => {}}
        name="t"
        ariaLabel="Pick your vertical"
      />,
    );
    // Beauty is selected — exactly one aria-checked="true".
    const trueChecks = html.match(/aria-checked="true"/g);
    const falseChecks = html.match(/aria-checked="false"/g);
    expect(trueChecks?.length).toBe(1);
    expect(falseChecks?.length).toBe(2);
  });

  it('single tab stop — exactly one tabIndex=0, the rest tabIndex=-1', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="t"
        ariaLabel="Pick your vertical"
      />,
    );
    const zeroes = html.match(/tabindex="0"/g);
    const negs = html.match(/tabindex="-1"/g);
    expect(zeroes?.length).toBe(1);
    expect(negs?.length).toBe(2);
  });

  it('falls back to first card as tab stop when selected id is unknown (defensive)', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="not-a-real-vertical"
        onChange={() => {}}
        name="t"
        ariaLabel="Pick your vertical"
      />,
    );
    const trueChecks = html.match(/aria-checked="true"/g);
    expect(trueChecks).toBeNull(); // no card matches → none checked
    // First card receives tabindex=0 fallback so the group is still reachable.
    const zeroes = html.match(/tabindex="0"/g);
    expect(zeroes?.length).toBe(1);
  });

  it('renders eyebrow + label + subline text content for each vertical', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="t"
        ariaLabel="Pick your vertical"
      />,
    );
    expect(html).toContain('FOOD + DRINK');
    expect(html).toContain('Food + drink.');
    expect(html).toContain('Spearhead vertical');
    expect(html).toContain('Beauty.');
    expect(html).toContain('Apparel.');
  });

  it('compact size consumer renders cards with p-6 (compact padding)', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={FOUR_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="t"
        ariaLabel="Pick a vertical"
        size="compact"
      />,
    );
    expect(html).toContain('p-6');
    expect(html).toContain('min-h-[160px]');
  });

  it('default size consumer renders cards with p-8 (default padding)', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="t"
        ariaLabel="Pick your vertical"
      />,
    );
    expect(html).toContain('p-8');
    expect(html).toContain('min-h-[200px]');
  });

  it('ink surface renders inverted background + paper text classes', () => {
    const html = renderToString(
      <VerticalRadiogroup
        verticals={THREE_VERTICALS}
        selected="food"
        onChange={() => {}}
        name="t"
        ariaLabel="Pick your vertical"
        surface="ink"
      />,
    );
    expect(html).toContain('bg-[color:var(--color-ink)]');
    expect(html).toContain('text-[color:var(--color-paper)]');
  });
});
