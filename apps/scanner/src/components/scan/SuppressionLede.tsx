'use client';

/**
 * The lead result block — surfaces the dead-inventory wedge ahead of the
 * score + pillar breakdown. Three states:
 *
 *   State 1 (revenue band available): "Roughly £X–£Y of annual demand at
 *           risk" — the v2 §7 hero framing. Renders for food catalogs
 *           with a priced-variant sample above the floor AND non-zero
 *           suppression.
 *   State 2 (suppression available, no revenue band): existing MVP
 *           SKU-count lede. Falls back for non-food catalogs, low
 *           sample, or older scans persisted before AOV shipped.
 *   State 3 (no suppression signal): renders nothing — don't manufacture
 *           a "you're losing nothing" line (per requirement Q-G).
 *
 * Per BUSINESS.md:19 council ruling 2026-04-27: when truncated AND scaled
 * estimates are present, prefer scaled (the merchant's full-catalog
 * projection) and swap disclosure to `sampledRevenueDisclosure`.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 (refactor
 * for the 600-line ceiling).
 */

import { Bracket } from '@flintmere/ui';
import {
  REVENUE_LEDE_DISCLOSURE,
  REVENUE_LEDE_EYEBROW,
  revenueLede,
  sampledRevenueDisclosure,
  SUPPRESSION_LEDE_EYEBROW,
  SUPPRESSION_LEDE_SUBHEAD,
  suppressionLede,
  suppressionSignalLine,
} from '@/lib/copy';
import type { RevenueEstimate, SuppressionEstimate } from '@flintmere/scoring';

export interface SuppressionLedeProps {
  estimate: SuppressionEstimate | undefined;
  productCount: number;
  revenueEstimate?: RevenueEstimate | null;
  /** Sampled-projected suppression — UI prefers this over `estimate` when present. */
  scaledEstimate?: SuppressionEstimate | null;
  /** Sampled-projected revenue — UI prefers this over `revenueEstimate` when present. */
  scaledRevenueEstimate?: RevenueEstimate | null;
  /** Sampling state for disclosure swap. */
  truncated?: boolean;
  actualProductCount?: number | null;
}

export function SuppressionLede({
  estimate,
  productCount,
  revenueEstimate,
  scaledEstimate,
  scaledRevenueEstimate,
  truncated,
  actualProductCount,
}: SuppressionLedeProps) {
  // Prefer scaled estimates when present (truncated catalogs with known total).
  const effectiveSuppression = scaledEstimate ?? estimate;
  const effectiveRevenue = scaledRevenueEstimate ?? revenueEstimate;

  // State 3: no suppression to surface.
  if (!effectiveSuppression || effectiveSuppression.high === 0) return null;

  const signalLine = suppressionSignalLine(effectiveSuppression.signals);

  // Disclosure: scaled-projection variant when sampling applied; raw otherwise.
  const disclosure =
    truncated && scaledRevenueEstimate
      ? sampledRevenueDisclosure({
          sampledCount: productCount,
          actualProductCount: actualProductCount ?? null,
        })
      : REVENUE_LEDE_DISCLOSURE;

  // State 1: revenue band available — lead with the £-figure.
  if (effectiveRevenue) {
    const headline = revenueLede({
      low: effectiveRevenue.low,
      high: effectiveRevenue.high,
    });
    return (
      <div className="mb-12 pb-12 border-b border-[color:var(--color-line)]">
        <p className="eyebrow mb-4">
          <Bracket>{REVENUE_LEDE_EYEBROW}</Bracket>
        </p>
        <h2 className="max-w-[40ch]">{headline}</h2>
        {signalLine ? (
          <p
            className="mt-6 max-w-[58ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 16, lineHeight: 1.55 }}
          >
            {signalLine}
          </p>
        ) : null}
        <p
          className="mt-4 max-w-[58ch]"
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--color-mute)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {disclosure}
        </p>
      </div>
    );
  }

  // State 2: SKU-count fallback. Uses scaled estimate when truncated +
  // scaled is present so a non-food catalog of 4,000 reads "Roughly 1,800
  // of your 4,000 products" not "Roughly 449 of your 1,000 products".
  // For the SKU-count lede, the full-catalog total is the merchant-facing
  // denominator — sampled count would feel wrong here.
  const ledeProductCount =
    truncated && scaledEstimate
      ? actualProductCount ?? productCount
      : productCount;
  const headline = suppressionLede({
    low: effectiveSuppression.low,
    high: effectiveSuppression.high,
    productCount: ledeProductCount,
  });
  return (
    <div className="mb-12 pb-12 border-b border-[color:var(--color-line)]">
      <p className="eyebrow mb-4">
        <Bracket>{SUPPRESSION_LEDE_EYEBROW}</Bracket>
      </p>
      <h2 className="max-w-[34ch]">{headline}</h2>
      {signalLine ? (
        <p
          className="mt-6 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 16, lineHeight: 1.55 }}
        >
          {signalLine}
        </p>
      ) : null}
      <p
        className="mt-4 max-w-[58ch]"
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--color-mute)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {truncated
          ? sampledRevenueDisclosure({
              sampledCount: productCount,
              actualProductCount: actualProductCount ?? null,
            })
          : SUPPRESSION_LEDE_SUBHEAD}
      </p>
    </div>
  );
}
