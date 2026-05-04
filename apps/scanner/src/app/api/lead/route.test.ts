import { describe, expect, it, vi, afterEach } from 'vitest';

// Shim that mirrors Prisma's PrismaClientKnownRequestError shape so that
// `err instanceof Prisma.PrismaClientKnownRequestError` in the route code
// resolves true when we throw + mock from the test side.
class PrismaClientKnownRequestErrorShim extends Error {
  code: string;
  constructor(message: string, opts: { code: string }) {
    super(message);
    this.code = opts.code;
  }
}

const ORIGINAL = {
  UNSUBSCRIBE_SECRET: process.env.UNSUBSCRIBE_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

describe('POST /api/lead', () => {
  afterEach(() => {
    for (const [k, v] of Object.entries(ORIGINAL)) {
      if (v !== undefined) process.env[k] = v;
      else delete process.env[k];
    }
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  function setupEnv() {
    process.env.UNSUBSCRIBE_SECRET = 'test-secret';
    process.env.RESEND_API_KEY = 're_test_dummy';
    process.env.NEXT_PUBLIC_APP_URL = 'https://audit.flintmere.com';
  }

  function makeRequest(body: unknown): import('next/server').NextRequest {
    return new Request('https://audit.flintmere.com/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }) as unknown as import('next/server').NextRequest;
  }

  it('returns 400 on a malformed body', async () => {
    setupEnv();
    vi.resetModules();
    vi.doMock('@/lib/db', () => ({
      prisma: { scan: { findUnique: vi.fn() }, lead: { create: vi.fn() } },
    }));
    vi.doMock('@/lib/resend', () => ({ sendEmail: vi.fn() }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ email: 'not-an-email', scanId: '' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('bad-request');

    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/resend');
  });

  it('returns 404 when scan id does not exist', async () => {
    setupEnv();
    vi.resetModules();
    vi.doMock('@/lib/db', () => ({
      prisma: {
        scan: { findUnique: vi.fn().mockResolvedValue(null) },
        lead: { create: vi.fn() },
      },
    }));
    vi.doMock('@/lib/resend', () => ({ sendEmail: vi.fn() }));

    const { POST } = await import('./route');
    const res = await POST(
      makeRequest({ email: 'merchant@store.com', scanId: 'scn_missing' }),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('scan-not-found');

    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/resend');
  });

  it('returns 409 when scan is incomplete', async () => {
    setupEnv();
    vi.resetModules();
    vi.doMock('@/lib/db', () => ({
      prisma: {
        scan: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'scn_pending',
            status: 'running',
            scoreJson: null,
          }),
        },
        lead: { create: vi.fn() },
      },
    }));
    vi.doMock('@/lib/resend', () => ({ sendEmail: vi.fn() }));

    const { POST } = await import('./route');
    const res = await POST(
      makeRequest({ email: 'merchant@store.com', scanId: 'scn_pending' }),
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('scan-not-ready');

    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/resend');
  });

  it('happy path — creates lead, sends report, marks reportSentAt, returns 201', async () => {
    setupEnv();
    vi.resetModules();
    const create = vi.fn().mockResolvedValue({ id: 'lead_new', reportSentAt: null });
    const update = vi.fn().mockResolvedValue({ id: 'lead_new', reportSentAt: new Date() });
    const sendEmail = vi.fn().mockResolvedValue({ sent: true });
    const buildReportEmail = vi.fn().mockReturnValue({
      subject: 'meridian-coffee.myshopify.com — Grade D',
      html: '<p>report</p>',
      text: 'report',
    });
    vi.doMock('@/lib/db', () => ({
      prisma: {
        scan: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'scn_done',
            status: 'complete',
            scoreJson: {
              composite: 47,
              grade: 'D',
              pillars: {},
              shopDomain: 'meridian-coffee.myshopify.com',
              productCount: 200,
              issues: [],
            },
          }),
        },
        lead: { create, update, findUnique: vi.fn() },
      },
    }));
    vi.doMock('@/lib/resend', () => ({ sendEmail }));
    vi.doMock('@/lib/report-email', () => ({ buildReportEmail }));

    const { POST } = await import('./route');
    const res = await POST(
      makeRequest({ email: 'merchant@store.com', scanId: 'scn_done' }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.leadId).toBe('lead_new');
    expect(body.reportSent).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead_new' },
        data: expect.objectContaining({ reportSentAt: expect.any(Date) }),
      }),
    );

    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/resend');
    vi.doUnmock('@/lib/report-email');
  });

  it('idempotent — repeat POST returns existing lead with alreadyRegistered, no second send', async () => {
    setupEnv();
    vi.resetModules();
    const reportSentAt = new Date('2026-05-01T00:00:00Z');
    const create = vi.fn().mockImplementation(() => {
      throw new PrismaClientKnownRequestErrorShim('Unique constraint violation', {
        code: 'P2002',
      });
    });
    const sendEmail = vi.fn();
    const findLeadUnique = vi
      .fn()
      .mockResolvedValue({ id: 'lead_existing', reportSentAt });

    vi.doMock('@/generated/prisma', () => ({
      Prisma: { PrismaClientKnownRequestError: PrismaClientKnownRequestErrorShim },
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: {
        scan: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'scn_done',
            status: 'complete',
            scoreJson: {
              composite: 47,
              grade: 'D',
              pillars: {},
              shopUrl: 'meridian-coffee.myshopify.com',
            },
          }),
        },
        lead: { create, findUnique: findLeadUnique, update: vi.fn() },
      },
    }));
    vi.doMock('@/lib/resend', () => ({ sendEmail }));

    const { POST } = await import('./route');
    const res = await POST(
      makeRequest({ email: 'merchant@store.com', scanId: 'scn_done' }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.leadId).toBe('lead_existing');
    expect(body.alreadyRegistered).toBe(true);
    expect(body.reportSent).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();

    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/resend');
    vi.doUnmock('@/generated/prisma');
  });
});
