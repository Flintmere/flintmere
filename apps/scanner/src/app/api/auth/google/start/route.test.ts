import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auditFindUnique = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    conciergeAudit: {
      findUnique: (...args: unknown[]) => auditFindUnique(...args),
    },
  },
}));

import { GET } from './route';

function makeRequest(qs = ''): NextRequest {
  return new NextRequest(`http://localhost:3001/api/auth/google/start${qs}`, {
    method: 'GET',
  });
}

describe('GET /api/auth/google/start', () => {
  beforeEach(() => {
    auditFindUnique.mockReset();
    process.env.FEATURE_GMC_OAUTH = 'true';
    process.env.GMC_STATE_SECRET = 'test-state-secret';
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
  });

  afterEach(() => {
    delete process.env.FEATURE_GMC_OAUTH;
    delete process.env.GMC_STATE_SECRET;
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
  });

  it('returns 404 when feature flag is off', async () => {
    delete process.env.FEATURE_GMC_OAUTH;
    const res = await GET(makeRequest('?audit=aud_1'));
    expect(res.status).toBe(404);
  });

  it('returns 400 when audit param missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it('returns 404 when audit row not found', async () => {
    auditFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest('?audit=aud_missing'));
    expect(res.status).toBe(404);
  });

  it('returns 403 when audit is refunded', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_r',
      shopUrl: 'https://acme.com',
      status: 'refunded',
    });
    const res = await GET(makeRequest('?audit=aud_r'));
    expect(res.status).toBe(403);
  });

  it('returns 403 when audit is disputed', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_d',
      shopUrl: 'https://acme.com',
      status: 'disputed',
    });
    const res = await GET(makeRequest('?audit=aud_d'));
    expect(res.status).toBe(403);
  });

  it('redirects to Google for paid audit', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_paid',
      shopUrl: 'https://www.acme.com/',
      status: 'paid',
    });
    const res = await GET(makeRequest('?audit=aud_paid'));
    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(location).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcontent');
    expect(location).toContain('access_type=offline');
    expect(location).toContain('prompt=consent');
    expect(location).toContain('client_id=test-client-id');
    expect(location).toMatch(/state=[^&]+/);
  });

  it('redirects to Google for delivered audit', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_d',
      shopUrl: 'https://acme.com',
      status: 'delivered',
    });
    const res = await GET(makeRequest('?audit=aud_d'));
    expect(res.status).toBe(302);
  });
});
