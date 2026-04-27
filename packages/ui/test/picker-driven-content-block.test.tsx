/**
 * Render-shape tests for PickerDrivenContentBlock.
 *
 * Same SSR strategy as VerticalRadiogroup tests — workspace has no jsdom
 * and Phase B forbids new dependencies. We assert structural invariants
 * on the SSR'd HTML.
 *
 * Coverage gap (declared, not hidden):
 *   - The 240ms cross-fade timing (useState + setTimeout) is NOT exercised
 *     here — it requires real DOM + timer mocks. The state machine is small
 *     enough (3 lines) that it's verified by manual review.
 *   - aria-live="polite" announce on selectedId change requires AT runtime.
 */

import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import {
  PickerDrivenContentBlock,
  type PickerDrivenContent,
} from '../src/PickerDrivenContentBlock.js';

const SLOTS: Readonly<Record<string, PickerDrivenContent>> = {
  food: {
    h2: 'What changes for food?',
    bullets: [
      'FSA Big-14 allergen mapping into Shopify metafields.',
      'ISO 3166-1 country-of-origin + PDO/PGI registry tracking.',
      'Certifications taxonomy — Soil Association, Red Tractor, Fairtrade.',
    ],
    ctaLabel: 'See food catalog readiness →',
    ctaHref: '/for/food-and-drink',
  },
  beauty: {
    h2: 'What changes for beauty?',
    bullets: [
      'Standard in development.',
      'Free scanner runs all seven cross-vertical checks today.',
      'Talk to the Flintmere team for cadence today.',
    ],
    ctaLabel: 'See beauty catalog readiness →',
    ctaHref: '/for/beauty',
  },
};

describe('PickerDrivenContentBlock — render shape', () => {
  it('renders h2 + 3 bullets + CTA matching slots[selectedId]', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => `What changes for ${id}`}
      />,
    );
    expect(html).toContain('What changes for food?');
    expect(html).toContain('FSA Big-14');
    expect(html).toContain('ISO 3166-1');
    expect(html).toContain('Certifications taxonomy');
    expect(html).toContain('See food catalog readiness');
    expect(html).toContain('href="/for/food-and-drink"');
  });

  it('section root has aria-live="polite" + aria-label from template', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="beauty"
        slots={SLOTS}
        ariaLabelTemplate={(id) => `Per-vertical content for ${id}`}
      />,
    );
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Per-vertical content for beauty"');
  });

  it('renders exactly 3 bullets per slot', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    const bullets = html.match(/<li/g);
    expect(bullets?.length).toBe(3);
  });

  it('returns null + dev-only console.warn when selectedId has no slot', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const html = renderToString(
        <PickerDrivenContentBlock
          selectedId="apparel"
          slots={SLOTS}
          ariaLabelTemplate={(id) => id}
        />,
      );
      // Empty render — no <section> output because the component returns null.
      expect(html).toBe('');
      expect(warnSpy).toHaveBeenCalledOnce();
      const callArgs = warnSpy.mock.calls[0]?.[0];
      expect(typeof callArgs).toBe('string');
      expect(callArgs).toContain('apparel');
    } finally {
      process.env.NODE_ENV = previousEnv;
      warnSpy.mockRestore();
    }
  });

  it('paper surface (default) renders --paper bg + --ink text', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    expect(html).toContain('bg-[color:var(--color-paper)]');
    expect(html).toContain('text-[color:var(--color-ink)]');
  });

  it('ink surface inverts to --ink bg + --paper text', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
        surface="ink"
      />,
    );
    expect(html).toContain('bg-[color:var(--color-ink)]');
    expect(html).toContain('text-[color:var(--color-paper)]');
  });

  it('does NOT render brackets when headingBracket is unset (default contract)', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // Default contract: plain h2 prose; no bracket signature on the heading.
    expect(html).not.toContain('class="bracket');
  });

  it('renders the bracket signature on the heading when headingBracket is set (post-ADR-0021)', () => {
    const slotsWithBracket: Readonly<Record<string, PickerDrivenContent>> = {
      food: {
        ...SLOTS.food!,
        headingBracket: 'food',
      },
    };
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={slotsWithBracket}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // Bracket co-occurrence per Q-A2 binding — heading carries the bracket.
    expect(html).toContain('class="bracket');
    expect(html).toContain('What changes for ');
    expect(html).toContain('food');
  });

  it('renders a paper-2 placeholder when imageSrc is unset (operator drops final asset later)', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // Placeholder div carries aria-hidden + paper-2 background.
    expect(html).toContain('var(--color-paper-2)');
    expect(html).toContain('aspect-ratio');
  });

  it('renders the photoreal image when imageSrc is set (Q-A2 Mode b)', () => {
    const slotsWithImage: Readonly<Record<string, PickerDrivenContent>> = {
      food: {
        ...SLOTS.food!,
        imageSrc: '/marketing/verticals/food.avif',
        imageAlt: 'A UK speciality food shelf with structured data overlaid.',
      },
    };
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={slotsWithImage}
        ariaLabelTemplate={(id) => id}
      />,
    );
    expect(html).toContain('src="/marketing/verticals/food.avif"');
    expect(html).toContain('A UK speciality food shelf');
  });

  it('initial mount uses opacity 1 (cross-fade only fires on selectedId change)', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // SSR opacity = 1 (initial useState). Inline style serialised as `opacity:1`.
    expect(html).toContain('opacity:1');
  });
});
