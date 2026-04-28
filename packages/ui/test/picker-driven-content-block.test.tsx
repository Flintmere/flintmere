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
 *   - Parallax IntersectionObserver + scroll handlers require real DOM.
 *     Logic mirrors HeroParallaxFigure (which has its own integration shape).
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

  it('paper surface (default) puts paper-bg + line border on the section root', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    expect(html).toContain('bg-[color:var(--color-paper)]');
    expect(html).toContain('border-[color:var(--color-line)]');
  });

  it('ink surface inverts to ink-bg + line-dark border on the section root', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
        surface="ink"
      />,
    );
    expect(html).toContain('bg-[color:var(--color-ink)]');
    expect(html).toContain('border-[color:var(--color-line-dark)]');
  });

  it('overlay text uses paper-on-ink colour regardless of surface (scrim covers image)', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // Heading + bullets render in paper-on-ink because they sit over the
    // ink-toned scrim, not on the section's underlying paper bg.
    expect(html).toContain('text-[color:var(--color-paper-on-ink)]');
  });

  it('does NOT render brackets when headingBracket is unset (default contract)', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // Default contract: plain h2 prose; no keyword bracket on the heading.
    // (Numeric enumeration brackets `[ 01 ]–[ 03 ]` always render — see
    // separate test below.)
    expect(html).not.toContain('class="bracket');
  });

  it('renders the keyword bracket on the heading when headingBracket is set', () => {
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
    // Bracket co-occurrence per Q-A2 binding — heading carries the keyword bracket.
    expect(html).toContain('class="bracket');
    expect(html).toContain('What changes for ');
    expect(html).toContain('food');
  });

  it('renders the sage mono eyebrow `// {keyword} catalog` when headingBracket is set', () => {
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
    expect(html).toContain('// food catalog');
    expect(html).toContain('var(--color-accent-sage)');
  });

  it('renders bracketed numeral markers [ 01 ] [ 02 ] [ 03 ] on the bullet list', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // ADR 0021 axis 4 enumeration precedent (matches the pillar [ 01 ]–[ 07 ]
    // pattern in tokens.md §Signature §Examples). Numerals are aria-hidden;
    // the <ol> + <li> semantics carry the enumeration for AT users.
    expect(html).toContain('[ 01 ]');
    expect(html).toContain('[ 02 ]');
    expect(html).toContain('[ 03 ]');
  });

  it('renders a decorative sage hairline anchor in the section', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // The bottom-left sage hairline + the bullet list border use the sage
    // accent token — at least two occurrences expected.
    const matches = html.match(/var\(--color-accent-sage\)/g);
    expect((matches?.length ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('renders a paper-2 placeholder when imageSrc is unset', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // Placeholder div carries paper-2 background + aria-hidden — the layout
    // shape comes from the section's min-height, not aspect-ratio.
    expect(html).toContain('var(--color-paper-2)');
    expect(html).toContain('aria-hidden="true"');
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

  it('initial mount uses opacity 1 on the inner overlay (cross-fade target)', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // SSR opacity = 1 (initial useState). Inline style serialised. The
    // 2026-04-28 redesign moved the opacity target FROM the section root
    // TO the inner content overlay div so swaps don't flicker the image
    // and scrims.
    expect(html).toContain('opacity:1');
  });

  it('section sets a hero-class height (~80vh with min-height fallback)', () => {
    const html = renderToString(
      <PickerDrivenContentBlock
        selectedId="food"
        slots={SLOTS}
        ariaLabelTemplate={(id) => id}
      />,
    );
    // The section reserves dramatic vertical real-estate so the photoreal
    // image dominates the viewport.
    expect(html).toContain('min(85vh, 780px)');
    expect(html).toContain('min-height:560px');
  });
});
