import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const scanFindFirst = vi.fn();

vi.mock('./db', () => ({
  prisma: {
    scan: {
      findFirst: (...args: unknown[]) => scanFindFirst(...args),
    },
  },
}));

import { resolvePostConnectScan, REUSE_WINDOW_MS } from './post-connect-scan';

describe('resolvePostConnectScan', () => {
  beforeEach(() => {
    scanFindFirst.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses a recent completed scan that already carries GMC ground truth', async () => {
    // Cost optimisation: the recent row was run after a connection existed
    // (it carries ground truth), so reusing it skips a redundant GMC fetch.
    scanFindFirst.mockResolvedValue({
      id: 'scan_recent',
      normalisedDomain: 'acme.com',
      score: 71,
      grade: 'B',
      scoreJson: {
        gmcGroundTruth: { fetchedAt: '2026-06-07T00:00:00.000Z' },
      },
    });
    const runScan = vi.fn();

    const result = await resolvePostConnectScan('https://acme.com', 'acme.com', {
      runScan,
    });

    expect(runScan).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'ok',
      scanId: 'scan_recent',
      shopDomain: 'acme.com',
      score: 71,
      grade: 'B',
      reused: true,
    });
    expect(result.status === 'ok' && result.gmcGroundTruth).toBeTruthy();
  });

  it('queries inside the reuse window', async () => {
    scanFindFirst.mockResolvedValue(null);
    const runScan = vi.fn().mockResolvedValue({
      status: 'complete',
      scanId: 'scan_fresh',
      shopDomain: 'acme.com',
      score: 60,
      grade: 'C',
      gmcGroundTruth: null,
    });
    const now = 1_000_000_000_000;

    await resolvePostConnectScan('https://acme.com', 'acme.com', {
      now,
      runScan,
    });

    const where = scanFindFirst.mock.calls[0]![0].where;
    expect(where.normalisedDomain).toBe('acme.com');
    expect(where.status).toBe('complete');
    expect(where.completedAt.gte.getTime()).toBe(now - REUSE_WINDOW_MS);
  });

  it('runs a fresh scan when no recent row exists', async () => {
    scanFindFirst.mockResolvedValue(null);
    const runScan = vi.fn().mockResolvedValue({
      status: 'complete',
      scanId: 'scan_fresh',
      shopDomain: 'acme.com',
      score: 60,
      grade: 'C',
      gmcGroundTruth: { fetchedAt: '2026-06-07T00:00:00.000Z' },
    });

    const result = await resolvePostConnectScan('https://acme.com', 'acme.com', {
      runScan,
    });

    expect(runScan).toHaveBeenCalledOnce();
    expect(runScan).toHaveBeenCalledWith({
      shopUrl: 'https://acme.com',
      source: 'user',
    });
    expect(result).toMatchObject({
      status: 'ok',
      scanId: 'scan_fresh',
      reused: false,
    });
  });

  it('returns a retriable error when the fresh scan fails', async () => {
    scanFindFirst.mockResolvedValue(null);
    const runScan = vi.fn().mockResolvedValue({
      status: 'failed',
      scanId: 'scan_x',
      errorCode: 'timeout',
      errorMessage: 'slow',
    });

    const result = await resolvePostConnectScan('https://acme.com', 'acme.com', {
      runScan,
    });

    expect(result).toEqual({ status: 'error', errorCode: 'timeout' });
  });

  it('runs fresh (not reuse) when the recent row lacks GMC ground truth', async () => {
    // The primary journey: the merchant scanned from the audit email BEFORE
    // connecting, so the recent row has `gmcGroundTruth: null`. Reusing it
    // would render the payoff page without ground truth right after OAuth.
    // We must fall through to a fresh run that reads GMC via the live
    // connection — correctness beats the cost optimisation.
    scanFindFirst.mockResolvedValue({
      id: 'scan_preconnect',
      normalisedDomain: 'acme.com',
      score: 71,
      grade: 'B',
      scoreJson: { suppressionEstimate: { low: 1, high: 2 } },
    });
    const runScan = vi.fn().mockResolvedValue({
      status: 'complete',
      scanId: 'scan_fresh',
      shopDomain: 'acme.com',
      score: 64,
      grade: 'C',
      gmcGroundTruth: { fetchedAt: '2026-06-07T12:00:00.000Z' },
    });

    const result = await resolvePostConnectScan('https://acme.com', 'acme.com', {
      runScan,
    });

    expect(runScan).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      status: 'ok',
      scanId: 'scan_fresh',
      reused: false,
    });
    expect(result.status === 'ok' && result.gmcGroundTruth).toEqual({
      fetchedAt: '2026-06-07T12:00:00.000Z',
    });
  });
});
