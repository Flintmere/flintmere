import { describe, expect, it, vi, afterEach } from 'vitest';
import { signUnsubToken } from '@/lib/unsub-token';

const ORIGINAL_SECRET = process.env.UNSUBSCRIBE_SECRET;
const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

describe('unsubscribe [token] route', () => {
  afterEach(() => {
    if (ORIGINAL_SECRET !== undefined) process.env.UNSUBSCRIBE_SECRET = ORIGINAL_SECRET;
    else delete process.env.UNSUBSCRIBE_SECRET;
    if (ORIGINAL_APP_URL !== undefined) process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
    else delete process.env.NEXT_PUBLIC_APP_URL;
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  function setupEnv() {
    process.env.UNSUBSCRIBE_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_APP_URL = 'https://audit.flintmere.com';
  }

  async function callGet(token: string) {
    const { GET } = await import('./route');
    return GET(
      new Request(`https://audit.flintmere.com/api/unsubscribe/${token}`) as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ token }) },
    );
  }

  it('redirects to /unsubscribe?status=invalid on a malformed token', async () => {
    setupEnv();
    vi.resetModules();
    vi.doMock('@/lib/db', () => ({
      prisma: { lead: { findUnique: vi.fn(), update: vi.fn() } },
    }));
    const res = await callGet('not-a-real-token');
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/unsubscribe?status=invalid',
    );
    vi.doUnmock('@/lib/db');
  });

  it('redirects to /unsubscribe?status=invalid when lead is unknown', async () => {
    setupEnv();
    vi.resetModules();
    const findUnique = vi.fn().mockResolvedValue(null);
    const update = vi.fn();
    vi.doMock('@/lib/db', () => ({
      prisma: { lead: { findUnique, update } },
    }));

    const token = signUnsubToken('lead_missing');
    const res = await callGet(token);

    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/unsubscribe?status=invalid',
    );
    expect(update).not.toHaveBeenCalled();
    vi.doUnmock('@/lib/db');
  });

  it('flips unsubscribedAt and redirects to status=ok on a valid first call', async () => {
    setupEnv();
    vi.resetModules();
    const findUnique = vi.fn().mockResolvedValue({
      id: 'lead_real',
      unsubscribedAt: null,
    });
    const update = vi.fn().mockResolvedValue({ id: 'lead_real', unsubscribedAt: new Date() });
    vi.doMock('@/lib/db', () => ({
      prisma: { lead: { findUnique, update } },
    }));

    const token = signUnsubToken('lead_real');
    const res = await callGet(token);

    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/unsubscribe?status=ok',
    );
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'lead_real' } }),
    );
    vi.doUnmock('@/lib/db');
  });

  it('is idempotent — already-unsubscribed lead still returns status=ok with no second update', async () => {
    setupEnv();
    vi.resetModules();
    const alreadyDone = new Date('2026-04-01T00:00:00Z');
    const findUnique = vi.fn().mockResolvedValue({
      id: 'lead_done',
      unsubscribedAt: alreadyDone,
    });
    const update = vi.fn();
    vi.doMock('@/lib/db', () => ({
      prisma: { lead: { findUnique, update } },
    }));

    const token = signUnsubToken('lead_done');
    const res = await callGet(token);

    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/unsubscribe?status=ok',
    );
    expect(update).not.toHaveBeenCalled();
    vi.doUnmock('@/lib/db');
  });
});
