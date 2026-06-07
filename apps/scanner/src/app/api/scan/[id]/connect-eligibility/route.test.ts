import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const scanFindUnique = vi.fn();
const auditFindMany = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    scan: { findUnique: (...a: unknown[]) => scanFindUnique(...a) },
    conciergeAudit: { findMany: (...a: unknown[]) => auditFindMany(...a) },
  },
}));

import { GET } from './route';

function makeRequest(): NextRequest {
  return new NextRequest(
    'http://localhost:3001/api/scan/scan_1/connect-eligibility',
    { method: 'GET' },
  );
}

const params = Promise.resolve({ id: 'scan_1' });

describe('GET /api/scan/[id]/connect-eligibility', () => {
  beforeEach(() => {
    scanFindUnique.mockReset();
    auditFindMany.mockReset();
    process.env.FEATURE_GMC_OAUTH = 'true';
  });

  afterEach(() => {
    delete process.env.FEATURE_GMC_OAUTH;
  });

  it('404s when the feature flag is off (ships dark)', async () => {
    delete process.env.FEATURE_GMC_OAUTH;
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(404);
  });

  it('reports eligible + auditId when the domain owns a paid audit', async () => {
    scanFindUnique.mockResolvedValue({ normalisedDomain: 'acme.com' });
    auditFindMany.mockResolvedValue([
      { id: 'aud_1', shopUrl: 'https://www.acme.com/', createdAt: new Date() },
    ]);
    const res = await GET(makeRequest(), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, eligible: true, auditId: 'aud_1' });
  });

  it('reports not eligible (no reason leaked) when no audit matches the domain', async () => {
    scanFindUnique.mockResolvedValue({ normalisedDomain: 'acme.com' });
    auditFindMany.mockResolvedValue([
      { id: 'aud_2', shopUrl: 'https://other.com', createdAt: new Date() },
    ]);
    const res = await GET(makeRequest(), { params });
    const body = await res.json();
    expect(body).toEqual({ ok: true, eligible: false });
  });

  it('reports not eligible when the scan does not exist', async () => {
    scanFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    const body = await res.json();
    expect(body).toEqual({ ok: true, eligible: false });
    expect(auditFindMany).not.toHaveBeenCalled();
  });

  it('only considers paid/delivered audits', async () => {
    scanFindUnique.mockResolvedValue({ normalisedDomain: 'acme.com' });
    auditFindMany.mockResolvedValue([]);
    await GET(makeRequest(), { params });
    const where = auditFindMany.mock.calls[0]![0].where;
    expect(where.status).toEqual({ in: ['paid', 'delivered'] });
  });
});
