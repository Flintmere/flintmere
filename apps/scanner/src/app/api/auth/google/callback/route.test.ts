import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const upsert = vi.fn();
const exchange = vi.fn();
const captureServerEvent = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    merchantGmcConnection: {
      upsert: (...args: unknown[]) => upsert(...args),
    },
  },
}));

vi.mock('@/lib/analytics-server', () => ({
  captureServerEvent: (...args: unknown[]) => captureServerEvent(...args),
}));

vi.mock('@/lib/gmc/oauth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gmc/oauth')>();
  return {
    ...actual,
    exchangeCodeForTokens: (...args: unknown[]) => exchange(...args),
  };
});

import { GET } from './route';
import { signState } from '@/lib/gmc/oauth';

function makeRequest(qs: string): NextRequest {
  return new NextRequest(`http://localhost:3001/api/auth/google/callback${qs}`, {
    method: 'GET',
  });
}

describe('GET /api/auth/google/callback', () => {
  beforeEach(() => {
    upsert.mockReset().mockResolvedValue({});
    exchange.mockReset();
    captureServerEvent.mockReset().mockResolvedValue(undefined);
    process.env.FEATURE_GMC_OAUTH = 'true';
    process.env.GMC_STATE_SECRET = 'test-state-secret';
    process.env.GMC_TOKEN_KEY = '0'.repeat(64);
  });

  afterEach(() => {
    delete process.env.FEATURE_GMC_OAUTH;
    delete process.env.GMC_STATE_SECRET;
    delete process.env.GMC_TOKEN_KEY;
  });

  it('returns 404 when feature flag is off', async () => {
    delete process.env.FEATURE_GMC_OAUTH;
    const res = await GET(makeRequest('?code=c&state=s'));
    expect(res.status).toBe(404);
  });

  it('redirects to denied page when Google returns ?error=', async () => {
    const res = await GET(makeRequest('?error=access_denied'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/audit/connect');
    expect(location).toContain('status=denied');
    expect(location).toContain('reason=access_denied');
    expect(captureServerEvent).toHaveBeenCalledWith('oauth_callback_denied', {
      reason: 'access_denied',
    });
  });

  it('replaces an off-allowlist ?error= with reason=unknown', async () => {
    // Hostile / buggy IdP smuggling arbitrary text through the error
    // param should never reach the merchant-visible reason= surface.
    const res = await GET(
      makeRequest(
        '?error=' + encodeURIComponent('<script>alert(1)</script>'),
      ),
    );
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('reason=unknown');
    expect(location).not.toContain('script');
  });

  it('returns 400 when code missing', async () => {
    const state = signState({ normalisedDomain: 'acme.com', auditId: 'aud_1' });
    const res = await GET(makeRequest(`?state=${encodeURIComponent(state)}`));
    expect(res.status).toBe(400);
  });

  it('returns 400 when state missing', async () => {
    const res = await GET(makeRequest('?code=abc'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when state is invalid', async () => {
    const res = await GET(makeRequest('?code=abc&state=tampered.deadbeef'));
    expect(res.status).toBe(400);
  });

  it('upserts connection on successful exchange', async () => {
    exchange.mockResolvedValue({
      refreshToken: 'rt_real',
      accessToken: 'at_real',
      expiryDate: Date.now() + 3600_000,
      scopes: ['https://www.googleapis.com/auth/content'],
    });
    const state = signState({ normalisedDomain: 'acme.com', auditId: 'aud_1' });
    const res = await GET(makeRequest(`?code=abc&state=${encodeURIComponent(state)}`));
    expect(exchange).toHaveBeenCalledOnce();
    expect(upsert).toHaveBeenCalledOnce();
    const upsertArg = upsert.mock.calls[0]![0] as {
      where: { normalisedDomain: string };
      create: { scopes: string[]; refreshTokenCipher: Buffer };
    };
    expect(upsertArg.where.normalisedDomain).toBe('acme.com');
    expect(upsertArg.create.scopes).toEqual(['https://www.googleapis.com/auth/content']);
    expect(upsertArg.create.refreshTokenCipher.length).toBeGreaterThan(0);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('status=ok');
    expect(captureServerEvent).toHaveBeenCalledWith('oauth_callback_ok', {
      shop: 'acme.com',
      audit_id: 'aud_1',
    });
  });

  it('redirects to exchange-failed when token exchange throws', async () => {
    exchange.mockRejectedValue(new Error('invalid_grant'));
    const state = signState({ normalisedDomain: 'acme.com', auditId: 'aud_1' });
    const res = await GET(makeRequest(`?code=abc&state=${encodeURIComponent(state)}`));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('status=exchange-failed');
    expect(upsert).not.toHaveBeenCalled();
    expect(captureServerEvent).toHaveBeenCalledWith('oauth_callback_denied', {
      reason: 'exchange_failed',
    });
    expect(captureServerEvent).not.toHaveBeenCalledWith(
      'oauth_callback_ok',
      expect.anything(),
    );
  });

  it('does not leak raw off-allowlist error text into the denied event', async () => {
    await GET(
      makeRequest('?error=' + encodeURIComponent('<script>alert(1)</script>')),
    );
    expect(captureServerEvent).toHaveBeenCalledWith('oauth_callback_denied', {
      reason: 'unknown',
    });
  });
});
