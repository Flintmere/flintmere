import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const update = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    merchantGmcConnection: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

import { fetchGmcGroundTruth, __testing } from './ground-truth';
import { GmcApiError, type ContentApiClient } from './content-api';
import { sealRefreshToken } from './token-storage';
import type { ProductStatusEntry } from './content-api';

const VALID_KEY = '0'.repeat(64);

function buildConn(overrides: Partial<Record<string, unknown>> = {}) {
  const sealed = sealRefreshToken('rt_real');
  return {
    id: 'conn_1',
    normalisedDomain: 'acme.com',
    gmcAccountId: null,
    gmcAccountName: null,
    refreshTokenCipher: sealed.ciphertext,
    refreshTokenIv: sealed.iv,
    refreshTokenAuthTag: sealed.authTag,
    scopes: ['https://www.googleapis.com/auth/content'],
    connectedAt: new Date(),
    lastSyncedAt: null,
    lastErrorCode: null,
    lastErrorAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function product(
  offerId: string,
  title: string,
  status: 'approved' | 'disapproved' | 'pending',
  issues: Array<Partial<ProductStatusEntry['itemLevelIssues'][number]>> = [],
): ProductStatusEntry {
  return {
    offerId,
    title,
    destinationStatuses: [{ destination: 'Shopping', status }],
    itemLevelIssues: issues.map((i) => ({
      code: i.code ?? 'unknown_code',
      description: i.description ?? '',
      severity: i.severity ?? 'unknown',
      attributeName: i.attributeName ?? null,
    })),
  };
}

function makeStubClient(opts: {
  accounts?: Array<{ accountId: string; accountName: string | null; websiteUrl: string | null }>;
  pages?: ProductStatusEntry[][];
  accountsThrows?: unknown;
  productsThrows?: unknown;
}): ContentApiClient {
  let pageIdx = 0;
  return {
    async listAccounts() {
      if (opts.accountsThrows) throw opts.accountsThrows;
      return opts.accounts ?? [{ accountId: '12345', accountName: null, websiteUrl: null }];
    },
    async listProductStatuses() {
      if (opts.productsThrows) throw opts.productsThrows;
      const pages = opts.pages ?? [[]];
      const page = pages[pageIdx] ?? [];
      const isLast = pageIdx >= pages.length - 1;
      pageIdx++;
      return {
        resources: page,
        nextPageToken: isLast ? null : `tok-${pageIdx}`,
      };
    },
  };
}

describe('fetchGmcGroundTruth', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset().mockResolvedValue({});
    process.env.GMC_TOKEN_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.GMC_TOKEN_KEY;
  });

  it('returns null when no connection row exists', async () => {
    findUnique.mockResolvedValue(null);
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () => makeStubClient({}),
    });
    expect(result).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('returns null when connection is revoked', async () => {
    findUnique.mockResolvedValue(buildConn({ revokedAt: new Date() }));
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () => makeStubClient({}),
    });
    expect(result).toBeNull();
  });

  it('records error and returns null when refresh token cannot decrypt', async () => {
    findUnique.mockResolvedValue(
      buildConn({
        refreshTokenCipher: Buffer.alloc(8),
        refreshTokenIv: Buffer.alloc(12),
        refreshTokenAuthTag: Buffer.alloc(16),
      }),
    );
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () => makeStubClient({}),
    });
    expect(result).toBeNull();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastErrorCode: 'unexpected' }),
      }),
    );
  });

  it('records no_account when authinfo returns empty list', async () => {
    findUnique.mockResolvedValue(buildConn());
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () => makeStubClient({ accounts: [] }),
    });
    expect(result).toBeNull();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastErrorCode: 'no_account' }),
      }),
    );
  });

  it('marks connection revoked on 401 invalid_grant', async () => {
    findUnique.mockResolvedValue(buildConn());
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () =>
        makeStubClient({ accountsThrows: new GmcApiError('invalid_grant', 'token revoked') }),
    });
    expect(result).toBeNull();
    const updates = update.mock.calls.map((c) => (c[0] as { data: Record<string, unknown> }).data);
    expect(updates.some((d) => d.lastErrorCode === 'invalid_grant')).toBe(true);
    expect(updates.some((d) => d.revokedAt instanceof Date)).toBe(true);
  });

  it('records quota and returns null on 403 quota error', async () => {
    findUnique.mockResolvedValue(buildConn());
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () =>
        makeStubClient({ accountsThrows: new GmcApiError('quota', 'rate limit') }),
    });
    expect(result).toBeNull();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastErrorCode: 'quota' }),
      }),
    );
  });

  it('returns ground-truth shape with mixed product states', async () => {
    findUnique.mockResolvedValue(buildConn());
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () =>
        makeStubClient({
          accounts: [{ accountId: '99999', accountName: null, websiteUrl: null }],
          pages: [
            [
              product('p1', 'Stock cubes', 'disapproved', [
                { code: 'missing_value', description: 'Missing GTIN', severity: 'error' },
              ]),
              product('p2', 'Beef stock', 'disapproved', [
                { code: 'missing_value', description: 'Missing GTIN', severity: 'error' },
                { code: 'invalid_value', description: 'Invalid weight', severity: 'warning' },
              ]),
              product('p3', 'Fish stock', 'approved'),
              product('p4', 'Veg stock', 'pending'),
            ],
          ],
        }),
    });

    expect(result).not.toBeNull();
    expect(result!.gmcAccountId).toBe('99999');
    expect(result!.totalProductsRead).toBe(4);
    expect(result!.destinationCounts.disapproved).toBe(2);
    expect(result!.destinationCounts.approved).toBe(1);
    expect(result!.destinationCounts.pending).toBe(1);
    expect(result!.truncated).toBe(false);

    const top = result!.topIssues;
    expect(top).toHaveLength(2);
    expect(top[0]!.code).toBe('missing_value');
    expect(top[0]!.productCount).toBe(2);
    expect(top[0]!.sampleProducts.map((s) => s.offerId)).toEqual(['p1', 'p2']);
    expect(top[1]!.code).toBe('invalid_value');
    expect(top[1]!.productCount).toBe(1);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastSyncedAt: expect.any(Date),
          lastErrorCode: null,
        }),
      }),
    );
  });

  it('paginates through multiple pages', async () => {
    findUnique.mockResolvedValue(buildConn({ gmcAccountId: '99999' }));
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: () =>
        makeStubClient({
          pages: [
            [product('p1', 'A', 'disapproved', [{ code: 'c1', severity: 'error' }])],
            [product('p2', 'B', 'disapproved', [{ code: 'c1', severity: 'error' }])],
            [product('p3', 'C', 'approved')],
          ],
        }),
    });

    expect(result!.totalProductsRead).toBe(3);
    expect(result!.topIssues[0]!.code).toBe('c1');
    expect(result!.topIssues[0]!.productCount).toBe(2);
    expect(result!.truncated).toBe(false);
  });

  it('skips accounts.list when gmcAccountId already persisted', async () => {
    findUnique.mockResolvedValue(buildConn({ gmcAccountId: '12345' }));
    const listAccountsSpy = vi.fn();
    const factory = (token: string): ContentApiClient => {
      const stub = makeStubClient({ pages: [[product('p1', 'A', 'approved')]] });
      return {
        listAccounts: async (...args) => {
          listAccountsSpy(...args);
          return stub.listAccounts(...args);
        },
        listProductStatuses: stub.listProductStatuses,
      };
    };
    await fetchGmcGroundTruth('acme.com', { clientFactory: factory });
    expect(listAccountsSpy).not.toHaveBeenCalled();
  });

  it('returns truncated:true when budget exhausts mid-pagination', async () => {
    findUnique.mockResolvedValue(buildConn({ gmcAccountId: '12345' }));
    let calls = 0;
    let mockNow = 1_000_000_000;
    const factory = (): ContentApiClient => ({
      listAccounts: async () => [{ accountId: '12345', accountName: null, websiteUrl: null }],
      listProductStatuses: async () => {
        calls++;
        // Burn ~12s of budget per call so the second iteration exceeds
        // the 30s deadline.
        mockNow += 12_000;
        return {
          resources: [product(`p${calls}`, `Title ${calls}`, 'approved')],
          nextPageToken: `tok-${calls}`,
        };
      },
    });
    const result = await fetchGmcGroundTruth('acme.com', {
      clientFactory: factory,
      now: () => mockNow,
    });
    expect(result).not.toBeNull();
    expect(result!.truncated).toBe(true);
    expect(result!.totalProductsRead).toBeGreaterThanOrEqual(1);
  });
});

describe('IssueAggregator', () => {
  it('counts unique products per code, not per issue line', () => {
    const agg = new __testing.IssueAggregator();
    agg.absorb({
      offerId: 'p1',
      title: 'A',
      destinationStatuses: [{ destination: 'Shopping', status: 'disapproved' as const }],
      itemLevelIssues: [
        { code: 'c1', description: 'd', severity: 'error' as const, attributeName: null },
        { code: 'c1', description: 'd', severity: 'error' as const, attributeName: 'gtin' },
      ],
    });
    const top = agg.topIssues(10, 5);
    expect(top[0]!.code).toBe('c1');
    expect(top[0]!.productCount).toBe(1);
  });

  it('sorts top issues by product count, descending', () => {
    const agg = new __testing.IssueAggregator();
    for (let i = 0; i < 3; i++) {
      agg.absorb({
        offerId: `p${i}`,
        title: '',
        destinationStatuses: [],
        itemLevelIssues: [{ code: 'rare', description: '', severity: 'error', attributeName: null }],
      });
    }
    for (let i = 3; i < 13; i++) {
      agg.absorb({
        offerId: `p${i}`,
        title: '',
        destinationStatuses: [],
        itemLevelIssues: [{ code: 'common', description: '', severity: 'error', attributeName: null }],
      });
    }
    const top = agg.topIssues(10, 5);
    expect(top[0]!.code).toBe('common');
    expect(top[0]!.productCount).toBe(10);
    expect(top[1]!.code).toBe('rare');
    expect(top[1]!.productCount).toBe(3);
  });

  it('caps sampleProducts per issue at the configured limit', () => {
    const agg = new __testing.IssueAggregator();
    for (let i = 0; i < 20; i++) {
      agg.absorb({
        offerId: `p${i}`,
        title: `Title ${i}`,
        destinationStatuses: [],
        itemLevelIssues: [{ code: 'c', description: '', severity: 'error', attributeName: null }],
      });
    }
    const top = agg.topIssues(10, 5);
    expect(top[0]!.sampleProducts).toHaveLength(5);
    expect(top[0]!.productCount).toBe(20);
  });
});

describe('pickAccount', () => {
  it('multi-account: matches by website url first', () => {
    const result = __testing.pickAccount(
      [
        { accountId: 'a1', accountName: null, websiteUrl: 'https://other.com' },
        { accountId: 'a2', accountName: 'Acme', websiteUrl: 'https://www.acme.com' },
      ],
      'acme.com',
    );
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      expect(result.accountId).toBe('a2');
    }
  });

  it('single-account: unambiguous — picks the only one even without website match', () => {
    const result = __testing.pickAccount(
      [{ accountId: 'a1', accountName: null, websiteUrl: 'https://other.com' }],
      'acme.com',
    );
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') {
      expect(result.accountId).toBe('a1');
    }
  });

  it('multi-account, no website match: returns ambiguous instead of silently picking first', () => {
    // The fail-closed change. Previously this silently returned a1 — wrong
    // for agencies / parent-sub setups. Now operator gets account_ambiguous
    // recorded on the connection and the read returns null.
    const result = __testing.pickAccount(
      [
        { accountId: 'a1', accountName: null, websiteUrl: 'https://other.com' },
        { accountId: 'a2', accountName: null, websiteUrl: 'https://different.com' },
      ],
      'acme.com',
    );
    expect(result.kind).toBe('ambiguous');
    if (result.kind === 'ambiguous') {
      expect(result.accountCount).toBe(2);
    }
  });

  it('multi-account, no website urls at all: returns ambiguous', () => {
    const result = __testing.pickAccount(
      [
        { accountId: 'a1', accountName: null, websiteUrl: null },
        { accountId: 'a2', accountName: null, websiteUrl: null },
      ],
      'acme.com',
    );
    expect(result.kind).toBe('ambiguous');
  });

  it('empty list: returns none', () => {
    expect(__testing.pickAccount([], 'acme.com').kind).toBe('none');
  });
});
