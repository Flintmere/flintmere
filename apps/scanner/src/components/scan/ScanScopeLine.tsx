'use client';

/**
 * Scope row above SuppressionLede — gives merchant calibration on the
 * sample BEFORE the £-figure lands. Per BUSINESS.md:19 council ruling
 * 2026-04-27 #3: trust-anchor sits ahead of the headline.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 (refactor
 * for the 600-line ceiling).
 */

import { scanScopeLine } from '@/lib/copy-scan-scope';

export interface ScanScopeLineProps {
  sampledCount: number;
  actualProductCount: number | null;
  truncated: boolean;
  barcodesRead?: number | null;
}

export function ScanScopeLine({
  sampledCount,
  actualProductCount,
  truncated,
  barcodesRead,
}: ScanScopeLineProps) {
  return (
    <p
      className="eyebrow mb-6 text-[color:var(--color-mute)]"
      style={{ letterSpacing: '0.12em' }}
    >
      {scanScopeLine({ sampledCount, actualProductCount, truncated, barcodesRead })}
    </p>
  );
}
