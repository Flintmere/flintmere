/**
 * Copy + helpers for the GMC ground-truth render in the catalog letter
 * email and the public score page.
 *
 * Per ADR 0023, GMC ground-truth is rendered with Google's own language
 * for issue descriptions — no founder-speak translation. The deliverable
 * promises "we read your actual GMC", and Google's own copy is the
 * proof that we did.
 *
 * Two surfaces:
 *   - Email (private — sent only to the merchant): full panel including
 *     sample product titles per issue code.
 *   - Score page (public — merchant opted in to publishPublicPage): summary
 *     panel with counts + top-3 issue codes only. NO sample product titles
 *     (per #24 Data Protection — merchants opted in to publishing their
 *     score, not their failing SKU list).
 */

import type { GmcGroundTruth, GmcIssue } from './gmc/types';

export const GMC_EMAIL_BANNER_LABEL =
  'Currently disapproved · read directly from your Google Merchant Center';

export const GMC_PANEL_HEADING = 'Google Merchant Center';

export const GMC_PANEL_EYEBROW = 'Ground truth · read directly from Google';

export const GMC_TOP_ISSUES_LABEL =
  "Google's reasons, by product count";

export const GMC_PUBLIC_FOOTNOTE =
  "These counts are the merchant's own GMC data, opted in for publication. Issue descriptions are Google's verbatim language.";

export const GMC_EMAIL_FOOTNOTE =
  "Issue descriptions above are Google's verbatim language. Sample product titles are pulled from your Merchant Center feed at the time of scan.";

// --- Private post-connect payoff (connect-friction spec 2026-06-07) -------
// This data is rendered only to the connected merchant on their own results —
// never on a public surface. Public publication stays a separate, explicit
// opt-in (GmcPublicPageOptIn). Access is restricted to read-only at our
// call-site (never described as a "read-only scope" — Google's Content/Merchant
// API scope is write-capable; we restrict ourselves at the call-site).

export const GMC_PRIVATE_EYEBROW = 'Your account · read directly from Google';

export const GMC_PRIVATE_FOOTNOTE =
  "This is your own Merchant Center data, shown only to you. It stays private until you choose to publish it. Issue descriptions are Google's verbatim language.";

// Shown when the connection exists but Google returned no Merchant Center
// data yet (empty edge case) — honest, never a blank.
export const GMC_PRIVATE_EMPTY_HEADING = 'Connected — no Merchant Center data yet';
export const GMC_PRIVATE_EMPTY_BODY =
  "Your Google connection is live, but we didn't read any product data from your Merchant Center on this scan. This is normal if your account is new or your feed is still syncing. Your next scan will read it.";

// Shown when the ground-truth read errored — we degrade to the modelled
// estimate and label it honestly. We never fabricate ground truth (#24).
export const GMC_PRIVATE_DEGRADED_HEADING = 'Showing modelled estimates, not read';
export const GMC_PRIVATE_DEGRADED_BODY =
  "We couldn't read your Google Merchant Center on this scan, so the figures below are modelled from public signals — not read from your account. Your next scan will try the live read again.";

export function gmcLede(gmc: GmcGroundTruth): string {
  const total =
    gmc.destinationCounts.approved +
    gmc.destinationCounts.disapproved +
    gmc.destinationCounts.pending;
  const dis = gmc.destinationCounts.disapproved;
  const products = total === 1 ? 'product' : 'products';
  if (dis === 0) {
    return `${total.toLocaleString()} ${products} approved by Google`;
  }
  return `${dis.toLocaleString()} of ${total.toLocaleString()} ${products} disapproved`;
}

export function gmcSubline(gmc: GmcGroundTruth): string {
  const { approved, disapproved, pending } = gmc.destinationCounts;
  const parts = [
    `${approved.toLocaleString()} approved`,
    `${disapproved.toLocaleString()} disapproved`,
    `${pending.toLocaleString()} pending`,
  ];
  const stamp = formatFetchedAt(gmc.fetchedAt);
  const account = gmc.gmcAccountName ? ` · ${gmc.gmcAccountName}` : '';
  return `${parts.join(' · ')} · scanned ${stamp}${account}`;
}

export function formatFetchedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Public-safe issue summary — counts + code + Google's description, no
 * sample product titles. Surfaced on /score/[shop].
 */
export function publicSafeIssue(issue: GmcIssue): {
  code: string;
  description: string;
  severity: GmcIssue['severity'];
  productCount: number;
} {
  return {
    code: issue.code,
    description: issue.description,
    severity: issue.severity,
    productCount: issue.productCount,
  };
}

/**
 * Truncated-read disclosure. When the 30s budget exhausted before
 * Google's pagination ended, we render this so the merchant knows
 * the disapproval count is a floor, not the full picture.
 */
export function truncatedNote(gmc: GmcGroundTruth): string | null {
  if (!gmc.truncated) return null;
  return `We read ${gmc.totalProductsRead.toLocaleString()} products before Google's API budget ran out — your full catalog may include more.`;
}
