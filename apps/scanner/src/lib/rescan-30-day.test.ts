import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---- Mocks ----
// Prisma — sized to exactly what runDay30Rescans calls.
const conciergeFindMany = vi.fn();
const conciergeUpdate = vi.fn();
const scanFindUnique = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    conciergeAudit: {
      findMany: (args: unknown) => conciergeFindMany(args),
      update: (args: unknown) => conciergeUpdate(args),
    },
    scan: {
      findUnique: (args: unknown) => scanFindUnique(args),
    },
  },
}));

// runScanForShop — the cron's only side effect against Shopify.
const runScanForShop = vi.fn();
vi.mock('@/lib/run-scan', () => ({
  runScanForShop: (input: unknown) => runScanForShop(input),
}));

// sendDay30RescanEmail — Resend boundary.
const sendDay30RescanEmail = vi.fn();
vi.mock('@/lib/rescan-email', () => ({
  sendDay30RescanEmail: (input: unknown) => sendDay30RescanEmail(input),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Lazy import after mocks are wired so the module sees the mocked deps.
async function runner() {
  return (await import('./rescan-30-day')).runDay30Rescans;
}

const FIXED_NOW = new Date('2026-06-05T04:00:00.000Z');

const baselineScoreJson = {
  score: 62,
  grade: 'C',
  pillars: [
    { pillar: 'identifiers', score: 30, maxScore: 50 },
    { pillar: 'titles', score: 20, maxScore: 30 },
  ],
};

const freshScoreJson = {
  score: 78,
  grade: 'B',
  pillars: [
    { pillar: 'identifiers', score: 45, maxScore: 50 },
    { pillar: 'titles', score: 25, maxScore: 30 },
  ],
};

function makeAudit(overrides: Record<string, unknown> = {}) {
  return {
    id: 'audit-1',
    email: 'merchant@example.com',
    shopUrl: 'shop.example.com',
    stripePaymentIntentId: 'pi_test',
    status: 'delivered',
    deliveredAt: new Date('2026-05-05T00:00:00.000Z'),
    rescanDueAt: new Date('2026-06-04T00:00:00.000Z'),
    rescanCompletedAt: null,
    rescanScanId: null,
    rescanEmailSentAt: null,
    baselineScoreJson,
    ...overrides,
  };
}

describe('runDay30Rescans', () => {
  it('no due rows → dueCount=0, no scans, no emails', async () => {
    conciergeFindMany.mockResolvedValueOnce([]);
    const run = await runner();
    const result = await run({ now: FIXED_NOW });

    expect(result.dueCount).toBe(0);
    expect(result.scannedCount).toBe(0);
    expect(result.emailedCount).toBe(0);
    expect(runScanForShop).not.toHaveBeenCalled();
    expect(sendDay30RescanEmail).not.toHaveBeenCalled();
  });

  it('queries with deliveredAt+rescanDueAt+rescanEmailSentAt gates', async () => {
    conciergeFindMany.mockResolvedValueOnce([]);
    const run = await runner();
    await run({ now: FIXED_NOW });

    expect(conciergeFindMany).toHaveBeenCalledTimes(1);
    const callArg = conciergeFindMany.mock.calls[0]![0] as {
      where: Record<string, unknown>;
    };
    expect(callArg.where).toEqual(
      expect.objectContaining({
        deliveredAt: { not: null },
        rescanDueAt: { lte: FIXED_NOW, not: null },
        rescanEmailSentAt: null,
      }),
    );
  });

  it('happy path — runs scan, persists rescan id, sends email, marks email sent', async () => {
    conciergeFindMany.mockResolvedValueOnce([makeAudit()]);
    runScanForShop.mockResolvedValueOnce({
      status: 'complete',
      scanId: 'scan-fresh-1',
      scoreJson: freshScoreJson,
    });
    sendDay30RescanEmail.mockResolvedValueOnce({ sent: true, id: 'email-1' });

    const run = await runner();
    const result = await run({
      now: FIXED_NOW,
      scannerOrigin: 'https://audit.flintmere.com',
    });

    expect(runScanForShop).toHaveBeenCalledWith({
      shopUrl: 'shop.example.com',
      source: 'rescan_30_day',
    });
    // First update — persist rescan ids; second update — mark email sent.
    expect(conciergeUpdate).toHaveBeenCalledTimes(2);
    expect(conciergeUpdate.mock.calls[0]![0]).toEqual(
      expect.objectContaining({
        where: { id: 'audit-1' },
        data: expect.objectContaining({
          rescanScanId: 'scan-fresh-1',
        }),
      }),
    );
    expect(conciergeUpdate.mock.calls[1]![0]).toEqual(
      expect.objectContaining({
        where: { id: 'audit-1' },
        data: expect.objectContaining({
          rescanEmailSentAt: expect.any(Date),
        }),
      }),
    );
    expect(sendDay30RescanEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'merchant@example.com',
        shopUrl: 'shop.example.com',
        rescanScanId: 'scan-fresh-1',
        baseline: baselineScoreJson,
        current: freshScoreJson,
        scannerOrigin: 'https://audit.flintmere.com',
      }),
    );
    expect(result).toMatchObject({
      dueCount: 1,
      scannedCount: 1,
      emailedCount: 1,
      scanFailedCount: 0,
      emailFailedCount: 0,
    });
  });

  it('scan failure records error and does not send email', async () => {
    conciergeFindMany.mockResolvedValueOnce([makeAudit()]);
    runScanForShop.mockResolvedValueOnce({
      status: 'failed',
      scanId: 'scan-failed-1',
      errorCode: 'not-shopify',
      errorMessage: 'not a shopify store',
    });

    const run = await runner();
    const result = await run({ now: FIXED_NOW });

    expect(sendDay30RescanEmail).not.toHaveBeenCalled();
    expect(conciergeUpdate).not.toHaveBeenCalled();
    expect(result.scanFailedCount).toBe(1);
    expect(result.errors).toEqual([
      { shopUrl: 'shop.example.com', reason: 'scan-failed:not-shopify' },
    ]);
  });

  it('email failure leaves rescanCompletedAt set but rescanEmailSentAt null', async () => {
    conciergeFindMany.mockResolvedValueOnce([makeAudit()]);
    runScanForShop.mockResolvedValueOnce({
      status: 'complete',
      scanId: 'scan-fresh-2',
      scoreJson: freshScoreJson,
    });
    sendDay30RescanEmail.mockResolvedValueOnce({
      sent: false,
      reason: 'resend-bounced',
    });

    const run = await runner();
    const result = await run({ now: FIXED_NOW });

    // Only the rescan-id update fires; the email-sent update does not.
    expect(conciergeUpdate).toHaveBeenCalledTimes(1);
    expect(conciergeUpdate.mock.calls[0]![0]).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ rescanScanId: 'scan-fresh-2' }),
      }),
    );
    expect(result.scannedCount).toBe(1);
    expect(result.emailedCount).toBe(0);
    expect(result.emailFailedCount).toBe(1);
    expect(result.errors[0]!.reason).toBe('email-failed:resend-bounced');
  });

  it('email-only retry path — scan already done, only re-sends email', async () => {
    const stale = makeAudit({
      rescanCompletedAt: new Date('2026-06-04T05:00:00.000Z'),
      rescanScanId: 'scan-already-1',
    });
    conciergeFindMany.mockResolvedValueOnce([stale]);
    scanFindUnique.mockResolvedValueOnce({ scoreJson: freshScoreJson });
    sendDay30RescanEmail.mockResolvedValueOnce({ sent: true, id: 'email-2' });

    const run = await runner();
    const result = await run({ now: FIXED_NOW });

    expect(runScanForShop).not.toHaveBeenCalled();
    expect(scanFindUnique).toHaveBeenCalledWith({
      where: { id: 'scan-already-1' },
      select: { scoreJson: true },
    });
    expect(sendDay30RescanEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        rescanScanId: 'scan-already-1',
        current: freshScoreJson,
      }),
    );
    expect(result.scannedCount).toBe(0); // didn't re-scan
    expect(result.emailedCount).toBe(1);
  });

  it('processes multiple rows and tallies independently', async () => {
    conciergeFindMany.mockResolvedValueOnce([
      makeAudit({ id: 'audit-A', email: 'a@example.com', shopUrl: 'a.example.com' }),
      makeAudit({ id: 'audit-B', email: 'b@example.com', shopUrl: 'b.example.com' }),
    ]);
    runScanForShop
      .mockResolvedValueOnce({
        status: 'complete',
        scanId: 'scan-A',
        scoreJson: freshScoreJson,
      })
      .mockResolvedValueOnce({
        status: 'failed',
        scanId: 'scan-B',
        errorCode: 'timeout',
        errorMessage: 'gone',
      });
    sendDay30RescanEmail.mockResolvedValueOnce({ sent: true, id: 'email-A' });

    const run = await runner();
    const result = await run({ now: FIXED_NOW });

    expect(result.dueCount).toBe(2);
    expect(result.scannedCount).toBe(1);
    expect(result.emailedCount).toBe(1);
    expect(result.scanFailedCount).toBe(1);
    expect(sendDay30RescanEmail).toHaveBeenCalledTimes(1);
  });
});
