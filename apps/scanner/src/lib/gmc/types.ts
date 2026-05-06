/**
 * Shared types for the GMC ground-truth track.
 *
 * Per ADR 0023, this shape extends `Scan.scoreJson` under the
 * reserved key `gmcGroundTruth`. Surfaces (audit-letter PDF,
 * report email, /score/[shop] dashboard panel) project from this
 * shape; it must stay backwards-compatible once a slice ships.
 */

export interface GmcIssue {
  /** Google's stable issue code, e.g. "missing_value", "invalid_value". */
  code: string;
  /** Google's human-readable description; we display verbatim. */
  description: string;
  /** Google's severity. "error" disapproves the product; "warning" doesn't. */
  severity: 'error' | 'warning' | 'unknown';
  /** How many products this issue affects in the read window. */
  productCount: number;
  /** First N matches; surfaced as "examples" in the deliverable. */
  sampleProducts: Array<{
    offerId: string;
    title: string;
  }>;
}

export interface GmcDestinationCounts {
  approved: number;
  disapproved: number;
  pending: number;
}

export interface GmcGroundTruth {
  /** ISO timestamp the read completed. */
  fetchedAt: string;
  /** Google's account ID — `accounts.list` resolution, persisted on first call. */
  gmcAccountId: string;
  /** Display name from Google; null if Google didn't surface one. */
  gmcAccountName: string | null;
  /** Number of products we read. May be < total catalog if `truncated`. */
  totalProductsRead: number;
  /** True when the read hit the 30s budget before Google's pagination ended. */
  truncated: boolean;
  destinationCounts: GmcDestinationCounts;
  /** Top issue codes by product-count, descending. Surfaces top 10. */
  topIssues: GmcIssue[];
}

export type GmcErrorCode =
  | 'invalid_grant'
  | 'quota'
  | 'account_suspended'
  | 'timeout'
  | 'no_account'
  | 'account_ambiguous'
  | 'unexpected';
