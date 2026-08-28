import { describe, expect, it, vi, afterEach } from 'vitest';

// Regression guard for ADR 0028 Shipment 2 Task A1 — DEFAULT_BASE_URL used
// to be its own literal ('https://audit.flintmere.com'); it now reads from
// SCANNER_HOST. Asserts against the literal host on purpose (per the
// shipment-2 plan: tests keep literal hosts).
describe('collectBriefState — approve-link base URL', () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;
  const originalBaseUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('../db');
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = originalSecret;
    if (originalBaseUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = originalBaseUrl;
  });

  it('builds the approve link on the scanner host when NEXT_PUBLIC_APP_URL is unset', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.ADMIN_SESSION_SECRET = 'test-secret';

    vi.resetModules();
    vi.doMock('../db', () => ({
      prisma: {
        outreachTarget: {
          groupBy: vi.fn().mockResolvedValue([
            { batchId: 'b1', _count: { _all: 3 }, _min: { updatedAt: new Date('2026-05-12') } },
          ]),
        },
        outreachSend: {
          count: vi.fn().mockResolvedValue(0),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        socialPost: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const { collectBriefState } = await import('./state');
    const state = await collectBriefState({ now: new Date('2026-05-13T08:00:00Z') });

    expect(state.approvals.pending).toHaveLength(1);
    expect(state.approvals.pending[0]?.approveUrl).toMatch(
      /^https:\/\/audit\.flintmere\.com\/api\/approve\?token=/,
    );
  });
});
