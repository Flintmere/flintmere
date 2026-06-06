/**
 * `fetchGmcGroundTruth(normalisedDomain)` — the orchestrator that
 * `runScanForShop` splices in. Returns null when no active connection
 * exists, when Google reports an error, or when the read budget is
 * exceeded. Records error state on `MerchantGmcConnection` so the
 * dashboard / disconnect flow / re-grant prompt can act on it.
 *
 * Per ADR 0023:
 *   - 30s total budget per scan (TOTAL_BUDGET_MS).
 *   - 10s per-call timeout (PER_CALL_TIMEOUT_MS).
 *   - Top issues aggregated to top 10 by product-count, descending.
 *   - On 401 invalid_grant: row stays in DB but lastErrorCode is set
 *     and the next scan returns null. Slice 2b will surface a re-grant
 *     CTA when this code appears.
 */

import type { MerchantGmcConnection } from '@/generated/prisma';
import { prisma } from '../db';
import {
  type GmcApiClient,
  GmcApiError,
  PER_CALL_TIMEOUT_MS,
  TOTAL_BUDGET_MS,
  createMerchantApiClient,
} from './merchant-api';
import { openRefreshToken } from './token-storage';
import type { GmcDestinationCounts, GmcGroundTruth, GmcIssue } from './types';

/** Top-N issue codes surfaced to the audit deliverable. */
const TOP_ISSUE_LIMIT = 10;
/** Sample products per issue code in the deliverable. */
const SAMPLE_PRODUCTS_PER_ISSUE = 5;

/**
 * Optional client factory injection for tests. Production code calls
 * `createContentApiClient`; tests inject a stub `ContentApiClient`.
 */
export interface GroundTruthDeps {
  clientFactory?: (refreshToken: string) => GmcApiClient;
  now?: () => number;
}

export async function fetchGmcGroundTruth(
  normalisedDomain: string,
  deps: GroundTruthDeps = {},
): Promise<GmcGroundTruth | null> {
  const conn = await prisma.merchantGmcConnection.findUnique({
    where: { normalisedDomain },
  });
  if (!conn || conn.revokedAt) {
    return null;
  }

  let refreshToken: string;
  try {
    refreshToken = openRefreshToken({
      ciphertext: conn.refreshTokenCipher,
      iv: conn.refreshTokenIv,
      authTag: conn.refreshTokenAuthTag,
    });
  } catch (err) {
    await recordError(conn.id, 'unexpected', `decrypt-failed: ${describe(err)}`);
    return null;
  }

  const factory = deps.clientFactory ?? createMerchantApiClient;
  const now = deps.now ?? Date.now;
  const client = factory(refreshToken);
  const deadline = now() + TOTAL_BUDGET_MS;

  let merchantId = conn.gmcAccountId ?? null;
  let merchantName: string | null = conn.gmcAccountName ?? null;

  if (!merchantId) {
    const accountController = makeController(deadline, now);
    if (!accountController) return await onTimeout(conn.id);
    let accounts;
    try {
      accounts = await client.listAccounts({ signal: accountController.signal });
    } catch (err) {
      return await handleApiError(conn.id, err);
    } finally {
      accountController.cleanup();
    }

    const matched = pickAccount(accounts, normalisedDomain);
    if (matched.kind === 'none') {
      await recordError(conn.id, 'no_account', 'accounts.list returned 0 accounts');
      return null;
    }
    if (matched.kind === 'ambiguous') {
      await recordError(
        conn.id,
        'account_ambiguous',
        `accounts.list returned ${matched.accountCount} accounts, none matching ${normalisedDomain} — picker UI required`,
      );
      return null;
    }
    merchantId = matched.accountId;
    merchantName = matched.accountName;
    await prisma.merchantGmcConnection.update({
      where: { id: conn.id },
      data: { gmcAccountId: merchantId, gmcAccountName: merchantName },
    });
  }

  const aggregator = new IssueAggregator();
  let pageToken: string | null = null;
  let truncated = false;

  while (true) {
    if (now() >= deadline) {
      truncated = true;
      break;
    }
    const controller = makeController(deadline, now);
    if (!controller) {
      truncated = true;
      break;
    }
    let page;
    try {
      page = await client.listProductStatuses({
        merchantId,
        pageToken,
        signal: controller.signal,
      });
    } catch (err) {
      controller.cleanup();
      if (err instanceof GmcApiError && err.code === 'timeout') {
        truncated = true;
        break;
      }
      return await handleApiError(conn.id, err);
    }
    controller.cleanup();

    for (const entry of page.resources) {
      aggregator.absorb(entry);
    }

    if (!page.nextPageToken) break;
    pageToken = page.nextPageToken;
  }

  await prisma.merchantGmcConnection.update({
    where: { id: conn.id },
    data: { lastSyncedAt: new Date(), lastErrorCode: null, lastErrorAt: null },
  });

  return {
    fetchedAt: new Date().toISOString(),
    gmcAccountId: merchantId,
    gmcAccountName: merchantName,
    totalProductsRead: aggregator.totalProducts,
    truncated,
    destinationCounts: aggregator.destinationCounts,
    topIssues: aggregator.topIssues(TOP_ISSUE_LIMIT, SAMPLE_PRODUCTS_PER_ISSUE),
  };

  async function onTimeout(connId: string): Promise<null> {
    await recordError(connId, 'timeout', 'budget exhausted before first call');
    return null;
  }

  async function handleApiError(connId: string, err: unknown): Promise<null> {
    if (err instanceof GmcApiError) {
      await recordError(connId, err.code, err.message);
      if (err.code === 'invalid_grant') {
        // Mark as effectively-revoked so the read path stops calling
        // Google with a dead token. Slice 2b will surface a re-grant CTA.
        await prisma.merchantGmcConnection.update({
          where: { id: connId },
          data: { revokedAt: new Date() },
        });
      }
    } else {
      await recordError(connId, 'unexpected', describe(err));
    }
    return null;
  }
}

async function recordError(
  connId: string,
  code: string,
  message: string,
): Promise<void> {
  await prisma.merchantGmcConnection.update({
    where: { id: connId },
    data: { lastErrorCode: code, lastErrorAt: new Date() },
  });
  // Structured log — `message` originates from Google Merchant API error
  // bodies, which can contain newlines / control chars that corrupt
  // log-aggregator output if interpolated raw. JSON.stringify normalises.
  console.warn(
    JSON.stringify({
      event: 'gmc-ground-truth.error',
      code,
      connId,
      message,
    }),
  );
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

interface DeadlineController {
  signal: AbortSignal;
  cleanup: () => void;
}

function makeController(
  deadline: number,
  now: () => number,
): DeadlineController | null {
  const remaining = deadline - now();
  if (remaining <= 0) return null;
  const perCall = Math.min(remaining, PER_CALL_TIMEOUT_MS);
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), perCall);
  return {
    signal: ac.signal,
    cleanup: () => clearTimeout(timeout),
  };
}

type PickAccountResult =
  | { kind: 'none' }
  | { kind: 'ambiguous'; accountCount: number }
  | { kind: 'matched'; accountId: string; accountName: string | null };

function pickAccount(
  accounts: Array<{ accountId: string; accountName: string | null; websiteUrl: string | null }>,
  normalisedDomain: string,
): PickAccountResult {
  if (accounts.length === 0) return { kind: 'none' };

  // Single-account case is unambiguous — vast majority of merchants.
  if (accounts.length === 1) {
    const only = accounts[0]!;
    return { kind: 'matched', accountId: only.accountId, accountName: only.accountName };
  }

  // Multi-account: only proceed when the merchant's website URL
  // unambiguously matches one account. Previously this fell through to
  // accounts[0] when no match — silently picking the wrong account when
  // the merchant has multiple GMC accounts (agencies, parent / sub-brand
  // setups). Fail-closed: surface account_ambiguous so the operator can
  // intervene; the picker UI will land when slice 2b's State C ships.
  const matched = accounts.find((a) => {
    if (!a.websiteUrl) return false;
    return a.websiteUrl
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '') === normalisedDomain;
  });
  if (matched) {
    return { kind: 'matched', accountId: matched.accountId, accountName: matched.accountName };
  }

  return { kind: 'ambiguous', accountCount: accounts.length };
}

class IssueAggregator {
  private products = 0;
  private counts: GmcDestinationCounts = { approved: 0, disapproved: 0, pending: 0 };
  private byCode = new Map<
    string,
    {
      description: string;
      severity: 'error' | 'warning' | 'unknown';
      productOfferIds: Set<string>;
      samples: GmcIssue['sampleProducts'];
    }
  >();

  absorb(entry: {
    offerId: string;
    title: string;
    destinationStatuses: Array<{ destination: string; status: 'approved' | 'pending' | 'disapproved' | 'unknown' }>;
    itemLevelIssues: Array<{
      code: string;
      description: string;
      severity: 'error' | 'warning' | 'unknown';
      attributeName: string | null;
    }>;
  }): void {
    this.products++;
    const productHas = { approved: false, disapproved: false, pending: false };
    for (const ds of entry.destinationStatuses) {
      if (ds.status in productHas) {
        (productHas as Record<string, boolean>)[ds.status] = true;
      }
    }
    if (productHas.disapproved) this.counts.disapproved++;
    else if (productHas.pending) this.counts.pending++;
    else if (productHas.approved) this.counts.approved++;

    for (const issue of entry.itemLevelIssues) {
      const bucket = this.byCode.get(issue.code) ?? {
        description: issue.description,
        severity: issue.severity,
        productOfferIds: new Set<string>(),
        samples: [],
      };
      // Latest description wins; Google occasionally tweaks copy.
      bucket.description = issue.description || bucket.description;
      if (!bucket.productOfferIds.has(entry.offerId)) {
        bucket.productOfferIds.add(entry.offerId);
        if (bucket.samples.length < SAMPLE_PRODUCTS_PER_ISSUE) {
          bucket.samples.push({ offerId: entry.offerId, title: entry.title });
        }
      }
      this.byCode.set(issue.code, bucket);
    }
  }

  get totalProducts(): number {
    return this.products;
  }

  get destinationCounts(): GmcDestinationCounts {
    return this.counts;
  }

  topIssues(limit: number, _samplesPerIssue: number): GmcIssue[] {
    const all: GmcIssue[] = Array.from(this.byCode.entries()).map(([code, b]) => ({
      code,
      description: b.description,
      severity: b.severity,
      productCount: b.productOfferIds.size,
      sampleProducts: b.samples,
    }));
    all.sort((a, b) => b.productCount - a.productCount);
    return all.slice(0, limit);
  }
}

// Re-export type so callers don't reach into ./types directly.
export type { GmcGroundTruth } from './types';
// Test-only export: exposed so unit tests can verify the aggregator
// in isolation without driving the full orchestrator.
export const __testing = {
  IssueAggregator,
  pickAccount,
  TOTAL_BUDGET_MS,
  PER_CALL_TIMEOUT_MS,
};

export type { MerchantGmcConnection };
