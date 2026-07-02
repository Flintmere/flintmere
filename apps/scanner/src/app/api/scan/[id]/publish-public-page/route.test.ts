import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const scanFindUnique = vi.fn();
const scanUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    scan: {
      findUnique: (...args: unknown[]) => scanFindUnique(...args),
      update: (...args: unknown[]) => scanUpdate(...args),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkScanActionRateLimit: () => ({ ok: true }),
}));

const revalidatePathMock = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { POST, DELETE } from './route';

const DOMAIN = 'meridian-coffee.myshopify.com';

function makePost(id: string): NextRequest {
  return new NextRequest(
    `http://localhost:3001/api/scan/${id}/publish-public-page`,
    { method: 'POST', headers: { 'content-type': 'application/json' } },
  );
}

function makeDelete(id: string): NextRequest {
  return new NextRequest(
    `http://localhost:3001/api/scan/${id}/publish-public-page`,
    { method: 'DELETE', headers: { 'content-type': 'application/json' } },
  );
}

const completeScan = {
  id: 'scn_1',
  status: 'complete' as const,
  score: 72,
  grade: 'B' as const,
  normalisedDomain: DOMAIN,
};

describe('POST /api/scan/:id/publish-public-page', () => {
  beforeEach(() => {
    scanFindUnique.mockReset();
    scanUpdate.mockReset();
    revalidatePathMock.mockReset();
  });

  afterEach(() => vi.clearAllMocks());

  it('returns 404 when the scan does not exist', async () => {
    scanFindUnique.mockResolvedValue(null);
    const res = await POST(makePost('scn_missing'), {
      params: Promise.resolve({ id: 'scn_missing' }),
    });
    expect(res.status).toBe(404);
    expect(scanUpdate).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('returns 409 not-publishable when the scan never completed', async () => {
    scanFindUnique.mockResolvedValue({
      ...completeScan,
      status: 'failed',
      score: null,
      grade: null,
      publishPublicPage: false,
    });
    const res = await POST(makePost('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('not-publishable');
    expect(scanUpdate).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('publishes and revalidates the score page + OG image', async () => {
    scanFindUnique.mockResolvedValue({ ...completeScan, publishPublicPage: false });
    scanUpdate.mockResolvedValue({});

    const res = await POST(makePost('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.alreadyPublished).toBe(false);
    expect(scanUpdate).toHaveBeenCalledWith({
      where: { id: 'scn_1' },
      data: expect.objectContaining({
        publishPublicPage: true,
        publicPageAt: expect.any(Date),
      }),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/score/${DOMAIN}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/score/${DOMAIN}/opengraph-image`,
    );
  });

  it('is idempotent — already-published does not update or revalidate', async () => {
    scanFindUnique.mockResolvedValue({ ...completeScan, publishPublicPage: true });
    const res = await POST(makePost('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).alreadyPublished).toBe(true);
    expect(scanUpdate).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/scan/:id/publish-public-page', () => {
  beforeEach(() => {
    scanFindUnique.mockReset();
    scanUpdate.mockReset();
    revalidatePathMock.mockReset();
  });

  afterEach(() => vi.clearAllMocks());

  it('revokes consent and revalidates the score page + OG image', async () => {
    scanFindUnique.mockResolvedValue({
      id: 'scn_1',
      publishPublicPage: true,
      normalisedDomain: DOMAIN,
    });
    scanUpdate.mockResolvedValue({});

    const res = await DELETE(makeDelete('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).alreadyOff).toBe(false);
    expect(scanUpdate).toHaveBeenCalledWith({
      where: { id: 'scn_1' },
      data: { publishPublicPage: false, publicPageAt: null },
    });
    // Consent withdrawal must take effect on the next request (#24).
    expect(revalidatePathMock).toHaveBeenCalledWith(`/score/${DOMAIN}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/score/${DOMAIN}/opengraph-image`,
    );
  });

  it('is idempotent — already-off does not update or revalidate', async () => {
    scanFindUnique.mockResolvedValue({
      id: 'scn_1',
      publishPublicPage: false,
      normalisedDomain: DOMAIN,
    });
    const res = await DELETE(makeDelete('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).alreadyOff).toBe(true);
    expect(scanUpdate).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the scan does not exist', async () => {
    scanFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeDelete('scn_missing'), {
      params: Promise.resolve({ id: 'scn_missing' }),
    });
    expect(res.status).toBe(404);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
