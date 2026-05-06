/**
 * Thin wrapper over `@googleapis/content` v2.1 — exposes only the
 * endpoints `fetchGmcGroundTruth` needs, behind a small interface that
 * tests can mock without touching the Google SDK.
 *
 * Per ADR 0023:
 *   - Per-call timeout: 10s (PER_CALL_TIMEOUT_MS).
 *   - Total budget per scan: 30s (enforced by caller via deadline).
 *   - Read-only scope `auth/content`.
 *
 * Errors map to a small enum (`GmcErrorCode`) the orchestrator
 * persists onto `MerchantGmcConnection.lastErrorCode`.
 */

import { content } from '@googleapis/content';
import { OAuth2Client } from 'google-auth-library';
import type { GmcErrorCode } from './types';

export const PER_CALL_TIMEOUT_MS = 10_000;
export const TOTAL_BUDGET_MS = 30_000;
export const PRODUCT_STATUSES_PAGE_SIZE = 250;

export interface AccountSummary {
  accountId: string;
  accountName: string | null;
  websiteUrl: string | null;
}

export interface ProductStatusItemIssue {
  code: string;
  description: string;
  severity: 'error' | 'warning' | 'unknown';
  attributeName: string | null;
}

export interface ProductStatusEntry {
  offerId: string;
  title: string;
  destinationStatuses: Array<{
    destination: string;
    status: 'approved' | 'pending' | 'disapproved' | 'unknown';
  }>;
  itemLevelIssues: ProductStatusItemIssue[];
}

export interface ProductStatusesPage {
  resources: ProductStatusEntry[];
  nextPageToken: string | null;
}

export interface ContentApiClient {
  listAccounts(opts: { signal: AbortSignal }): Promise<AccountSummary[]>;
  listProductStatuses(opts: {
    merchantId: string;
    pageToken?: string | null;
    signal: AbortSignal;
  }): Promise<ProductStatusesPage>;
}

export class GmcApiError extends Error {
  constructor(
    public readonly code: GmcErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GmcApiError';
  }
}

/**
 * Build a Google OAuth2 client primed with the merchant's refresh
 * token. Access tokens are rotated by the SDK on demand.
 */
export function createOAuth2Client(refreshToken: string): OAuth2Client {
  const client = new OAuth2Client(
    requireEnv('GOOGLE_OAUTH_CLIENT_ID'),
    requireEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
  );
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

/**
 * Build a Content API client wired for the merchant's OAuth state.
 * Tests substitute their own `ContentApiClient` rather than mocking
 * `@googleapis/content`.
 */
export function createContentApiClient(refreshToken: string): ContentApiClient {
  const auth = createOAuth2Client(refreshToken);
  const api = content({ version: 'v2.1', auth });

  return {
    async listAccounts({ signal }) {
      try {
        const res = await api.accounts.authinfo({}, { signal });
        const ids: Array<{ merchantId?: string | null; aggregatorId?: string | null }> =
          res.data?.accountIdentifiers ?? [];
        if (ids.length === 0) return [];
        // authinfo returns ids only; we lift the basic identity without
        // a second round-trip. websiteUrl + accountName are backfilled
        // by accounts.get in slice 4 if/when needed.
        return ids
          .map((id) => id.merchantId ?? id.aggregatorId ?? null)
          .filter((id): id is string => typeof id === 'string')
          .map((accountId) => ({
            accountId,
            accountName: null,
            websiteUrl: null,
          }));
      } catch (err) {
        throw mapGoogleError(err);
      }
    },

    async listProductStatuses({ merchantId, pageToken, signal }) {
      try {
        const res = await api.productstatuses.list(
          {
            merchantId,
            maxResults: PRODUCT_STATUSES_PAGE_SIZE,
            pageToken: pageToken ?? undefined,
          },
          { signal },
        );
        const resources = (res.data?.resources ?? []).map(normaliseProductStatus);
        return {
          resources,
          nextPageToken: res.data?.nextPageToken ?? null,
        };
      } catch (err) {
        throw mapGoogleError(err);
      }
    },
  };
}

function normaliseProductStatus(raw: unknown): ProductStatusEntry {
  const r = raw as Record<string, unknown>;
  const destinationStatuses = (r.destinationStatuses as unknown[] | undefined) ?? [];
  const itemLevelIssues = (r.itemLevelIssues as unknown[] | undefined) ?? [];
  return {
    offerId: typeof r.productId === 'string' ? r.productId : '',
    title: typeof r.title === 'string' ? r.title : '',
    destinationStatuses: destinationStatuses.map((d) => {
      const dd = d as Record<string, unknown>;
      const status = typeof dd.status === 'string' ? dd.status.toLowerCase() : 'unknown';
      return {
        destination: typeof dd.destination === 'string' ? dd.destination : 'unknown',
        status: normaliseStatus(status),
      };
    }),
    itemLevelIssues: itemLevelIssues.map((i) => {
      const ii = i as Record<string, unknown>;
      return {
        code: typeof ii.code === 'string' ? ii.code : 'unknown',
        description: typeof ii.description === 'string' ? ii.description : '',
        severity: normaliseSeverity(typeof ii.severity === 'string' ? ii.severity : ''),
        attributeName: typeof ii.attributeName === 'string' ? ii.attributeName : null,
      };
    }),
  };
}

function normaliseStatus(raw: string): 'approved' | 'pending' | 'disapproved' | 'unknown' {
  if (raw === 'approved' || raw === 'pending' || raw === 'disapproved') return raw;
  return 'unknown';
}

function normaliseSeverity(raw: string): 'error' | 'warning' | 'unknown' {
  const lc = raw.toLowerCase();
  if (lc === 'error' || lc === 'critical') return 'error';
  if (lc === 'warning' || lc === 'suggestion') return 'warning';
  return 'unknown';
}

/**
 * Convert googleapis SDK errors into our small `GmcApiError` enum.
 * The SDK throws `GaxiosError` with `.response.status` + `.response.data.error`.
 */
function mapGoogleError(err: unknown): GmcApiError {
  const e = err as {
    code?: number | string;
    response?: { status?: number; data?: { error?: { message?: string; status?: string } } };
    message?: string;
    name?: string;
  };
  const status =
    typeof e?.response?.status === 'number'
      ? e.response.status
      : typeof e?.code === 'number'
        ? e.code
        : null;
  const googleStatus = e?.response?.data?.error?.status;
  const message = e?.response?.data?.error?.message ?? e?.message ?? 'unknown';

  if (e?.name === 'AbortError' || message.toLowerCase().includes('aborted')) {
    return new GmcApiError('timeout', message);
  }
  if (status === 401) {
    return new GmcApiError('invalid_grant', message);
  }
  if (status === 403) {
    if (
      googleStatus === 'PERMISSION_DENIED' ||
      message.toLowerCase().includes('suspended')
    ) {
      return new GmcApiError('account_suspended', message);
    }
    return new GmcApiError('quota', message);
  }
  if (status === 429) {
    return new GmcApiError('quota', message);
  }
  return new GmcApiError('unexpected', message);
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} missing`);
  }
  return v;
}
