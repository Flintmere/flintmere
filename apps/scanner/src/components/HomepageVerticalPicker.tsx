'use client';

/**
 * HomepageVerticalPicker — the page's primary structural affordance below
 * the hero per context/design/specs/2026-04-26-homepage-food-first.md
 * §Section 3 (vertical picker) + §Section 4 (picker-driven content block).
 *
 * Responsibilities:
 *   - Render the 3-card VerticalRadiogroup primitive (food / beauty / apparel).
 *   - Bind selection to the ?vertical=… URL param via useHomepageVertical.
 *   - Render the picker-driven content block below the picker, with
 *     aria-live="polite" so screen readers announce vertical changes.
 *
 * Bracket-cap discipline: vertical names are NOT bracketed (per spec §Section 3).
 * No brackets are added by this component. Page-level cap stays at 2.
 */

import Link from 'next/link';
import { VerticalRadiogroup } from '@flintmere/ui';
import { useHomepageVertical } from '@/lib/use-vertical';
import {
  HOMEPAGE_VERTICALS,
  HOMEPAGE_VERTICAL_CONTENT,
  type HomepageVerticalId,
} from '@/lib/vertical';

export function HomepageVerticalPicker() {
  const { selected, setSelected } = useHomepageVertical();
  const content = HOMEPAGE_VERTICAL_CONTENT[selected];

  return (
    <>
      {/* Picker section */}
      <section
        aria-label="Pick your vertical"
        className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]"
      >
        <p className="eyebrow mb-6">Verticals</p>
        <h2 className="max-w-[24ch] mb-3">Which catalog are we scoring?</h2>
        <p className="max-w-[60ch] text-[color:var(--color-mute)] mb-12" style={{ fontSize: 15, lineHeight: 1.55 }}>
          We score food-first today. Beauty and apparel are in development — see our spearhead.
        </p>
        <VerticalRadiogroup
          verticals={HOMEPAGE_VERTICALS}
          selected={selected}
          onChange={(id) => setSelected(id as HomepageVerticalId)}
          name="homepage-vertical-picker"
          ariaLabel="Pick your vertical"
        />
      </section>

      {/* Picker-driven content block */}
      <section
        aria-live="polite"
        aria-label={`What changes for ${selected}`}
        className="mx-auto max-w-[1280px] px-8 py-20 border-t border-[color:var(--color-line)]"
      >
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-12 items-start">
          <div>
            <p className="eyebrow mb-6 text-[color:var(--color-mute-2)]">{content.eyebrow}</p>
            <h2 className="max-w-[24ch] mb-8">{content.heading}</h2>
            <ul className="list-none p-0 m-0 space-y-3 text-[color:var(--color-ink-2)]" style={{ fontSize: 15, lineHeight: 1.55 }}>
              {content.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span aria-hidden="true" className="text-[color:var(--color-mute-2)]">—</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pt-12">
            <Link href={content.ctaHref} className="btn">
              {content.ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
