/**
 * Thin wrapper over the Merchant API (`merchantapi.googleapis.com`, v1)
 * — exposes only the endpoints `fetchGmcGroundTruth` needs, behind a
 * small interface that tests can mock without touching Google transport.
 *
 * Replaces the Content API for Shopping client (`@googleapis/content`
 * v2.1) per ADR 0023 §Amendment 2026-05-21 — Google sunsets the Content
 * API on 2026-08-18. The OAuth scope is unchanged (`auth/content`);
 * read-only use is enforced at this call-site, as before.
 *
 * Per ADR 0023:
 *   - Per-call timeout: 10s (PER_CALL_TIMEOUT_MS).
 *   - Total budget per scan: 30s (enforced by caller via deadline).
 *
 * Errors map to a small enum (`GmcErrorCode`) the orchestrator
 * persists onto `MerchantGmcConnection.lastErrorCode`.
 */

import { OAuth2Client } from 'google-auth-library';
import type { GmcErrorCode } from './types';

export const PER_CALL_TIMEOUT_MS = 10_000;
export const TOTAL_BUDGET_MS = 30_000;
export const PRODUCT_STATUSES_PAGE_SIZE = 250;
const ACCOUNTS_PAGE_SIZE = 500; // accounts.list documented maximum

const ACCOUNTS_BASE = 'https://merchantapi.googleapis.com/accounts/v1';
const PRODUCTS_BASE = 'https://merchantapi.googleapis.com/products/v1';

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

export interface GmcApiClient {
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
 * token. Access tokens are rotated by the client on demand.
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
 * Transport seam — production wires `OAuth2Client.request` (which
 * carries the rotated access token); tests inject their own.
 */
export type RequestFn = (opts: {
  url: string;
  signal: AbortSignal;
}) => Promise<{ data: unknown }>;

function defaultRequestFn(refreshToken: string): RequestFn {
  const auth = createOAuth2Client(refreshToken);
  return ({ url, signal }) => auth.request({ url, signal });
}

/**
 * Build a Merchant API client wired for the merchant's OAuth state.
 * Orchestrator tests substitute a whole `GmcApiClient`; client tests
 * here inject `requestFn` to drive pagination + error mapping.
 */
export function createMerchantApiClient(
  refreshToken: string,
  requestFn?: RequestFn,
): GmcApiClient {
  const request = requestFn ?? defaultRequestFn(refreshToken);

  return {
    async listAccounts({ signal }) {
      try {
        const accounts: AccountSummary[] = [];
        let pageToken: string | null = null;
        do {
          const url = new URL(`${ACCOUNTS_BASE}/accounts`);
          url.searchParams.set('pageSize', String(ACCOUNTS_PAGE_SIZE));
          if (pageToken) url.searchParams.set('pageToken', pageToken);
          const res = await request({ url: url.toString(), signal });
          const data = res.data as Record<string, unknown>;
          for (const raw of (data.accounts as unknown[] | undefined) ?? []) {
            const summary = normaliseAccount(raw);
            if (summary) accounts.push(summary);
          }
          pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : null;
        } while (pageToken);
        return accounts;
      } catch (err) {
        throw mapGoogleError(err);
      }
    },

    async listProductStatuses({ merchantId, pageToken, signal }) {
      try {
        const url = new URL(
          `${PRODUCTS_BASE}/accounts/${encodeURIComponent(merchantId)}/products`,
        );
        url.searchParams.set('pageSize', String(PRODUCT_STATUSES_PAGE_SIZE));
        if (pageToken) url.searchParams.set('pageToken', pageToken);
        const res = await request({ url: url.toString(), signal });
        const data = res.data as Record<string, unknown>;
        const resources = ((data.products as unknown[] | undefined) ?? []).map(
          normaliseProduct,
        );
        return {
          resources,
          nextPageToken:
            typeof data.nextPageToken === 'string' ? data.nextPageToken : null,
        };
      } catch (err) {
        throw mapGoogleError(err);
      }
    },
  };
}

/**
 * `Account.name` is `accounts/{id}` — the `{id}` is the same numeric
 * Merchant Center id the Content API path stored in `gmcAccountId`,
 * so existing rows stay valid. Unlike `accounts.authinfo`, the
 * Merchant API list returns `accountName` inline; website URL would
 * need a per-account `homepage` GET and stays null (parity with the
 * previous client — `pickAccount` already handles null).
 */
function normaliseAccount(raw: unknown): AccountSummary | null {
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === 'string' ? r.name : '';
  const accountId = name.startsWith('accounts/') ? name.slice('accounts/'.length) : name;
  if (!accountId) return null;
  return {
    accountId,
    accountName: typeof r.accountName === 'string' ? r.accountName : null,
    websiteUrl: null,
  };
}

function normaliseProduct(raw: unknown): ProductStatusEntry {
  const r = raw as Record<string, unknown>;
  const attributes = (r.productAttributes as Record<string, unknown> | undefined) ?? {};
  const status = (r.productStatus as Record<string, unknown> | undefined) ?? {};
  const destinationStatuses = (status.destinationStatuses as unknown[] | undefined) ?? [];
  const itemLevelIssues = (status.itemLevelIssues as unknown[] | undefined) ?? [];

  return {
    offerId: typeof r.offerId === 'string' ? r.offerId : '',
    title: typeof attributes.title === 'string' ? attributes.title : '',
    destinationStatuses: destinationStatuses.map((d) => {
      const dd = d as Record<string, unknown>;
      return {
        destination:
          typeof dd.reportingContext === 'string' ? dd.reportingContext : 'unknown',
        status: deriveDestinationStatus(dd),
      };
    }),
    itemLevelIssues: itemLevelIssues.map((i) => {
      const ii = i as Record<string, unknown>;
      return {
        code: typeof ii.code === 'string' ? ii.code : 'unknown',
        description: typeof ii.description === 'string' ? ii.description : '',
        severity: normaliseSeverity(typeof ii.severity === 'string' ? ii.severity : ''),
        attributeName: typeof ii.attribute === 'string' ? ii.attribute : null,
      };
    }),
  };
}

/**
 * Merchant API folds approval state into per-country arrays on each
 * destination. Any disapproved country marks the destination
 * disapproved (worst-state-wins, matching how the v2.1 single status
 * behaved for single-country merchants).
 */
function deriveDestinationStatus(
  dd: Record<string, unknown>,
): 'approved' | 'pending' | 'disapproved' | 'unknown' {
  const nonEmpty = (k: string) => Array.isArray(dd[k]) && (dd[k] as unknown[]).length > 0;
  if (nonEmpty('disapprovedCountries')) return 'disapproved';
  if (nonEmpty('pendingCountries')) return 'pending';
  if (nonEmpty('approvedCountries')) return 'approved';
  return 'unknown';
}

/**
 * Merchant API severity enum: SEVERITY_UNSPECIFIED | NOT_IMPACTED |
 * DEMOTED | DISAPPROVED. Mapped onto the domain's error/warning split
 * (`error` disapproves the product; `warning` doesn't — see types.ts).
 */
function normaliseSeverity(raw: string): 'error' | 'warning' | 'unknown' {
  const uc = raw.toUpperCase();
  if (uc === 'DISAPPROVED') return 'error';
  if (uc === 'DEMOTED' || uc === 'NOT_IMPACTED') return 'warning';
  return 'unknown';
}

/**
 * Convert transport errors into our small `GmcApiError` enum. The
 * OAuth2Client request path throws `GaxiosError` with
 * `.response.status` + `.response.data.error` — same shape the
 * googleapis SDK produced, so the mapping carries over unchanged.
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

  if (e?.name === 'AbortError' || message.toLowerCase().includes('abort')) {
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

// Test-only export: pure normalisers + error mapper, verifiable
// without driving the transport seam.
export const __testing = {
  normaliseAccount,
  normaliseProduct,
  deriveDestinationStatus,
  normaliseSeverity,
  mapGoogleError,
};
