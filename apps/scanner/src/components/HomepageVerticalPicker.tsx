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
// Final Mode (b) assets landed at apps/scanner/public/marketing/verticals/
// per the canonical sourcing brief in operator-locks 2026-04-28 (§A–§L).
// Each AVIF is operator-licensed, warm-treated, ≤100KB, no visible
// third-party logos / words / faces (Adobe Stock licence clause 4.7
// trademark exclusion + #9 Lawyer binding). Alt text descriptive per Noor.
const PICKER_SLOTS: Readonly<Record<HomepageVerticalId, PickerDrivenContent>> = {
  food: {
    h2: 'What changes for food?',
    headingBracket: 'food',
    bullets: HOMEPAGE_VERTICAL_CONTENT.food.bullets,
    ctaLabel: HOMEPAGE_VERTICAL_CONTENT.food.ctaLabel,
    ctaHref: HOMEPAGE_VERTICAL_CONTENT.food.ctaHref,
    imageSrc: '/marketing/verticals/food.avif',
    imageAlt:
      'Warm-lit food still life in late-afternoon side-light, bracketed under the heading "What changes for [ food ]?"',
  },
  beauty: {
    h2: 'What changes for beauty?',
    headingBracket: 'beauty',
    bullets: HOMEPAGE_VERTICAL_CONTENT.beauty.bullets,
    ctaLabel: HOMEPAGE_VERTICAL_CONTENT.beauty.ctaLabel,
    ctaHref: HOMEPAGE_VERTICAL_CONTENT.beauty.ctaHref,
    imageSrc: '/marketing/verticals/beauty.avif',
    imageAlt:
      'Warm-lit beauty still life in late-afternoon side-light, bracketed under the heading "What changes for [ beauty ]?"',
  },
  apparel: {
    h2: 'What changes for apparel?',
    headingBracket: 'apparel',
    bullets: HOMEPAGE_VERTICAL_CONTENT.apparel.bullets,
    ctaLabel: HOMEPAGE_VERTICAL_CONTENT.apparel.ctaLabel,
    ctaHref: HOMEPAGE_VERTICAL_CONTENT.apparel.ctaHref,
    imageSrc: '/marketing/verticals/apparel.avif',
    imageAlt:
      'Warm-lit apparel still life in late-afternoon side-light, bracketed under the heading "What changes for [ apparel ]?"',
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
