'use client';

/**
 * PricingVerticalTabs — 4-tab vertical selector for /pricing.
 *
 * Spec: context/design/specs/2026-05-01-pricing-magnitudes-pending-delta.md
 *       (inherits 2026-04-26-pricing-food-first.md §Section 3).
 *
 * Owns selector + URL state via usePricingVertical(); renders an aria-live
 * region that announces vertical changes. The tier-grid composition lives in
 * `apps/scanner/src/app/pricing/PricingTiersGrid.tsx` (sibling client
 * component, reads the same hook).
 *
 * Bracket-cap discipline: vertical tabs are NOT bracketed.
 */

import { VerticalRadiogroup } from '@flintmere/ui';
import { usePricingVertical } from '@/lib/use-vertical';
import { PRICING_VERTICALS, type PricingVerticalId } from '@/lib/vertical';

const VERTICAL_LIVE_LABEL: Record<PricingVerticalId, string> = {
  food: 'Showing food pricing.',
  beauty: 'Showing beauty pricing — standard in development.',
  apparel: 'Showing apparel pricing — standard in development.',
  bundle: 'Showing Food + Beauty bundle — pricing arrives once the beauty cadence is committed.',
};

export function PricingVerticalTabs() {
  const { selected, setSelected } = usePricingVertical();

  return (
    <section
      aria-label="Pick a vertical"
      className="bg-[color:var(--color-paper)] border-y border-[color:var(--color-line)]"
    ><div className="mx-auto max-w-[1280px] px-8 py-12">
      <p className="eyebrow mb-6">Vertical</p>
      <VerticalRadiogroup
        verticals={PRICING_VERTICALS}
        selected={selected}
        onChange={(id) => setSelected(id as PricingVerticalId)}
        name="pricing-vertical-tabs"
        ariaLabel="Pick a vertical"
        size="compact"
      />
      <p
        aria-live="polite"
        className="sr-only"
      >
        {VERTICAL_LIVE_LABEL[selected]}
      </p>
      </div>
    </section>
  );
}
