'use client';

/**
 * HomepageVerticalPicker — the page's primary structural affordance below
 * the hero per context/design/specs/2026-04-26-homepage-food-first.md
 * §Section 3 (vertical picker) + §Section 4 (picker-driven content block).
 *
 * Phase C — composes the revised VerticalRadiogroup (asymmetric layout
 * default) with the new PickerDrivenContentBlock primitive. Both share
 * the same `selectedId` (URL-coupled via useHomepageVertical), and the
 * 200ms cross-fade choreography is honoured by both primitives.
 *
 * Bracket-cap discipline: vertical names are NOT bracketed (per spec
 * §Section 3 + Phase-C amendment which CUT the dynamic-slot bracket).
 * Page-level cap stays at 2 (hero `[ last ]` + audit `[ £97 ]`).
 */

import {
  PickerDrivenContentBlock,
  VerticalRadiogroup,
  type PickerDrivenContent,
} from '@flintmere/ui';
import { useHomepageVertical } from '@/lib/use-vertical';
import {
  HOMEPAGE_VERTICALS,
  HOMEPAGE_VERTICAL_CONTENT,
  type HomepageVerticalId,
} from '@/lib/vertical';

/**
 * Adapter: map the per-app HomepageVerticalContent shape to the
 * primitive's PickerDrivenContent shape (h2 + bullets + CTA).
 *
 * Why an adapter:
 *  - The per-app content carries an `eyebrow` field used in the previous
 *    inline render. The primitive does NOT carry an eyebrow (per
 *    PickerDrivenContent type) — h2 is the load-bearing heading.
 *  - The primitive normalises h2 wording to the spec direction
 *    "What changes for {vertical}?" — Copy Council polish lands in
 *    web-implementation; we ship the spec-direction-level placeholder.
 */
// Per-vertical photoreal hero slots — Q-A2 Mode (b) lock.
//
// Initial commit ships placeholder imagery: food borrows the existing
// hero `jar.avif` (warm-treated, on-canon, ≤100KB) so the food slot has
// real-world weight; beauty + apparel land as paper-2 solid blocks until
// operator licenses + drops Adobe Stock candidates per the operator-locks
// doc §"Operator next-step on imagery." Final assets land at:
//   apps/scanner/public/marketing/verticals/{food|beauty|apparel}.avif
const PICKER_SLOTS: Readonly<Record<HomepageVerticalId, PickerDrivenContent>> = {
  food: {
    h2: 'What changes for food?',
    headingBracket: 'food',
    bullets: HOMEPAGE_VERTICAL_CONTENT.food.bullets,
    ctaLabel: HOMEPAGE_VERTICAL_CONTENT.food.ctaLabel,
    ctaHref: HOMEPAGE_VERTICAL_CONTENT.food.ctaHref,
    // Placeholder until operator drops /marketing/verticals/food.avif.
    imageSrc: '/marketing/hero/jar.avif',
    imageAlt:
      'A UK speciality food shelf with structured data overlaid — placeholder; operator drops the licensed kitchen-context AVIF here.',
  },
  beauty: {
    h2: 'What changes for beauty?',
    headingBracket: 'beauty',
    bullets: HOMEPAGE_VERTICAL_CONTENT.beauty.bullets,
    ctaLabel: HOMEPAGE_VERTICAL_CONTENT.beauty.ctaLabel,
    ctaHref: HOMEPAGE_VERTICAL_CONTENT.beauty.ctaHref,
    // No imageSrc — primitive renders a paper-2 placeholder block.
  },
  apparel: {
    h2: 'What changes for apparel?',
    headingBracket: 'apparel',
    bullets: HOMEPAGE_VERTICAL_CONTENT.apparel.bullets,
    ctaLabel: HOMEPAGE_VERTICAL_CONTENT.apparel.ctaLabel,
    ctaHref: HOMEPAGE_VERTICAL_CONTENT.apparel.ctaHref,
    // No imageSrc — primitive renders a paper-2 placeholder block.
  },
};

const VERTICAL_DISPLAY_LABEL: Readonly<Record<HomepageVerticalId, string>> = {
  food: 'food',
  beauty: 'beauty',
  apparel: 'apparel',
};

export function HomepageVerticalPicker() {
  const { selected, setSelected } = useHomepageVertical();

  return (
    <>
      {/* Picker section */}
      <section
        aria-label="Pick your vertical"
        className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]"
      >
        <p className="eyebrow mb-6">Verticals</p>
        <h2 className="max-w-[24ch] mb-3">Which catalog are we scoring?</h2>
        <p
          className="max-w-[60ch] text-[color:var(--color-mute)] mb-12"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          We score food-first today. Beauty and apparel are in development — see
          our spearhead.
        </p>
        <VerticalRadiogroup
          verticals={HOMEPAGE_VERTICALS}
          selected={selected}
          onChange={(id) => setSelected(id as HomepageVerticalId)}
          name="homepage-vertical-picker"
          ariaLabel="Pick your vertical"
        />
      </section>

      {/* Picker-driven content block — primitive (Phase C). aria-live="polite"
          + 240ms cross-fade synchronised with the picker's selection signal. */}
      <PickerDrivenContentBlock
        selectedId={selected}
        slots={PICKER_SLOTS}
        ariaLabelTemplate={(id) =>
          `What changes for ${VERTICAL_DISPLAY_LABEL[id as HomepageVerticalId] ?? id}`
        }
      />
    </>
  );
}
