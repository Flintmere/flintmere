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

import { POST, DELETE } from './route';

function makePost(id: string): NextRequest {
  return new NextRequest(
    `http://localhost:3001/api/scan/${id}/publish-gmc-on-public-page`,
    { method: 'POST', headers: { 'content-type': 'application/json' } },
  );
}

function makeDelete(id: string): NextRequest {
  return new NextRequest(
    `http://localhost:3001/api/scan/${id}/publish-gmc-on-public-page`,
    { method: 'DELETE', headers: { 'content-type': 'application/json' } },
  );
}

const completeScanBase = {
  id: 'scn_1',
  status: 'complete' as const,
  score: 64,
  grade: 'C' as const,
  normalisedDomain: 'meridian-coffee.myshopify.com',
};

function makeGmcScoreJson() {
  return {
    gmcGroundTruth: {
      fetchedAt: '2026-05-08T09:30:00Z',
      destinationCounts: { approved: 312, disapproved: 47, pending: 53 },
      topIssues: [],
    },
  };
}

describe('POST /api/scan/:id/publish-gmc-on-public-page', () => {
  beforeEach(() => {
    scanFindUnique.mockReset();
    scanUpdate.mockReset();
  });

  afterEach(() => vi.clearAllMocks());

  it('returns 404 when the scan does not exist', async () => {
    scanFindUnique.mockResolvedValue(null);
    const res = await POST(makePost('scn_missing'), {
      params: Promise.resolve({ id: 'scn_missing' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('not-found');
  });

  it('returns 409 not-publishable when the scan never completed', async () => {
    scanFindUnique.mockResolvedValue({
      ...completeScanBase,
      status: 'failed',
      score: null,
      grade: null,
      publishPublicPage: true,
      publishGmcOnPublicPage: false,
      scoreJson: makeGmcScoreJson(),
    });
    const res = await POST(makePost('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('not-publishable');
  });

  it('returns 409 parent-consent-required when publishPublicPage=false', async () => {
    // The new precondition unique to this endpoint: caller must enable
    // the parent score page first before layering GMC counts on top.
    scanFindUnique.mockResolvedValue({
      ...completeScanBase,
      publishPublicPage: false,
      publishGmcOnPublicPage: false,
      scoreJson: makeGmcScoreJson(),
    });
    const res = await POST(makePost('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('parent-consent-required');
    expect(scanUpdate).not.toHaveBeenCalled();
  });

  it('returns 409 no-gmc-data when scoreJson carries no gmcGroundTruth', async () => {
    scanFindUnique.mockResolvedValue({
      ...completeScanBase,
      publishPublicPage: true,
      publishGmcOnPublicPage: false,
      scoreJson: { pillars: [] }, // no gmcGroundTruth field
    });
    const res = await POST(makePost('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('no-gmc-data');
    expect(scanUpdate).not.toHaveBeenCalled();
  });

  it('writes the consent + timestamp when all preconditions pass', async () => {
    scanFindUnique.mockResolvedValue({
      ...completeScanBase,
      publishPublicPage: true,
      publishGmcOnPublicPage: false,
      scoreJson: makeGmcScoreJson(),
    });
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
        publishGmcOnPublicPage: true,
        publishGmcOnPublicPageAt: expect.any(Date),
      }),
    });
  });

  it('is idempotent — already-published returns 200 with alreadyPublished=true', async () => {
    scanFindUnique.mockResolvedValue({
      ...completeScanBase,
      publishPublicPage: true,
      publishGmcOnPublicPage: true,
      scoreJson: makeGmcScoreJson(),
    });

    const res = await POST(makePost('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).alreadyPublished).toBe(true);
    expect(scanUpdate).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/scan/:id/publish-gmc-on-public-page', () => {
  beforeEach(() => {
    scanFindUnique.mockReset();
    scanUpdate.mockReset();
  });

  it('clears the consent + timestamp when on', async () => {
    scanFindUnique.mockResolvedValue({
      id: 'scn_1',
      publishGmcOnPublicPage: true,
    });
    scanUpdate.mockResolvedValue({});

    const res = await DELETE(makeDelete('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).alreadyOff).toBe(false);
    expect(scanUpdate).toHaveBeenCalledWith({
      where: { id: 'scn_1' },
      data: { publishGmcOnPublicPage: false, publishGmcOnPublicPageAt: null },
    });
  });

  it('is idempotent — already-off returns 200 with alreadyOff=true', async () => {
    scanFindUnique.mockResolvedValue({
      id: 'scn_1',
      publishGmcOnPublicPage: false,
    });

    const res = await DELETE(makeDelete('scn_1'), {
      params: Promise.resolve({ id: 'scn_1' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).alreadyOff).toBe(true);
    expect(scanUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 when the scan does not exist', async () => {
    scanFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeDelete('scn_missing'), {
      params: Promise.resolve({ id: 'scn_missing' }),
    });
    expect(res.status).toBe(404);
  });
});
