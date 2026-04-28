/**
 * Shared types for the scan-results page family of components.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 as part of
 * the pre-emptive 600-line ceiling refactor (memory/PROCESS.md §2).
 *
 * No runtime — pure type module. Imported by the page orchestrator + every
 * scan-results sub-component (Results, SuppressionLede, etc).
 */

import type {
  AovEstimate,
  RevenueEstimate,
  SuppressionEstimate,
} from '@flintmere/scoring';

export type ScanState =
  | { phase: 'idle' }
  | { phase: 'scanning'; url: string }
  | { phase: 'complete'; result: ScanResult }
  | { phase: 'error'; message: string };

export interface ScanResult {
  id: string;
  shopDomain: string;
  score: number;
  grade: string;
  gtinlessCeiling: number;
  productCount: number;
  /**
   * Sampling-honesty fields per BUSINESS.md:19 council ruling 2026-04-27.
   * Optional for backwards compatibility — pre-2026-04-27 scans missing.
   */
  truncated?: boolean;
  actualProductCount?: number | null;
  /**
   * Optional for backwards compatibility — older scans persisted before
   * the dead-inventory wedge shipped won't carry this field.
   */
  suppressionEstimate?: SuppressionEstimate;
  /**
   * Sample-projected suppression. Present when truncated AND actualProductCount
   * is known and exceeds the sampled count. UI prefers this over raw when
   * present. Null otherwise.
   */
  scaledSuppressionEstimate?: SuppressionEstimate | null;
  /**
   * AOV inference (wedge finish arc). Null for non-food catalogs and
   * below-sample-floor catalogs. Older persisted scans won't carry it.
   */
  aovEstimate?: AovEstimate | null;
  /**
   * Annual-demand-at-risk band. Null when suppression.high === 0 OR when
   * `aovEstimate` itself is null.
   */
  revenueEstimate?: RevenueEstimate | null;
  /**
   * Sample-projected revenue band. Same scaling logic as
   * scaledSuppressionEstimate. Null when no scaling applies.
   */
  scaledRevenueEstimate?: RevenueEstimate | null;
  pillars: Array<{
    pillar: string;
    score: number;
    maxScore: number;
    locked: boolean;
    lockedReason?: string;
  }>;
  issues: Array<{
    code: string;
    severity: string;
    title: string;
    description: string;
    affectedCount: number;
  }>;
}
