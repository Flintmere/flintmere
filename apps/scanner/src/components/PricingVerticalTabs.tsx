'use client';

/**
 * PricingVerticalTabs — 4-tab vertical selector for /pricing per
 * context/design/specs/2026-04-26-pricing-food-first.md §Section 3.
 *
 * Phase B scope per operator brief:
 *   - Selector + URL state machinery only.
 *   - Tier-card rebuild (composition + content) lands in web-implementation.
 *   - This component renders the selector + an aria-live region that announces
 *     the current vertical, but does NOT alter the legacy 5-tier render below
 *     the picker (preserved until Copy Council ships final pricing copy).
 *   - Bundle handling: when ?vertical=bundle, the live-region copy makes the
 *     bundle context explicit so the user sees the system acknowledge their
 *     selection even though the tier grid below has not yet been rebuilt to
 *     show the bundle-specific tiers (ADR 0016 §Phase 3).
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
  bundle: 'Showing Food + Beauty bundle pricing — single £159 / agency £499 (per ADR 0016).',
};

export function PricingVerticalTabs() {
  const { selected, setSelected } = usePricingVertical();

  return (
    <section
      aria-label="Pick a vertical"
      className="mx-auto max-w-[1280px] px-8 py-12 border-y border-[color:var(--color-line)]"
    >
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
        className="mt-6 text-[color:var(--color-mute)]"
        style={{ fontSize: 13, lineHeight: 1.55 }}
      >
        {VERTICAL_LIVE_LABEL[selected]}
        {' '}
        Tier-card content for non-food verticals lands in the next pricing
        update. The tier grid below shows the current cross-vertical ladder.
      </p>
    </section>
  );
}
