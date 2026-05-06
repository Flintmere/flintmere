import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auditFindUnique = vi.fn();
const connFindUnique = vi.fn();
const connUpdate = vi.fn();
const revoke = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    conciergeAudit: {
      findUnique: (...args: unknown[]) => auditFindUnique(...args),
    },
    merchantGmcConnection: {
      findUnique: (...args: unknown[]) => connFindUnique(...args),
      update: (...args: unknown[]) => connUpdate(...args),
    },
  },
}));

vi.mock('@/lib/gmc/oauth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gmc/oauth')>();
  return {
    ...actual,
    revokeAtGoogle: (...args: unknown[]) => revoke(...args),
  };
});

import { POST } from './route';
import { sealRefreshToken } from '@/lib/gmc/token-storage';

function makeRequest(qs = ''): NextRequest {
  return new NextRequest(`http://localhost:3001/api/auth/google/disconnect${qs}`, {
    method: 'POST',
  });
}

describe('POST /api/auth/google/disconnect', () => {
  beforeEach(() => {
    auditFindUnique.mockReset();
    connFindUnique.mockReset();
    connUpdate.mockReset().mockResolvedValue({});
    revoke.mockReset().mockResolvedValue(undefined);
    process.env.FEATURE_GMC_OAUTH = 'true';
    process.env.GMC_TOKEN_KEY = '0'.repeat(64);
  });

  afterEach(() => {
    delete process.env.FEATURE_GMC_OAUTH;
    delete process.env.GMC_TOKEN_KEY;
  });

  it('returns 404 when feature flag is off', async () => {
    delete process.env.FEATURE_GMC_OAUTH;
    const res = await POST(makeRequest('?audit=aud_1'));
    expect(res.status).toBe(404);
  });

  it('returns 400 when audit param missing', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('returns 404 when audit not found', async () => {
    auditFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest('?audit=aud_missing'));
    expect(res.status).toBe(404);
  });

  it('returns already-disconnected when no connection row', async () => {
    auditFindUnique.mockResolvedValue({ id: 'aud_1', shopUrl: 'https://acme.com' });
    connFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest('?audit=aud_1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'already-disconnected' });
    expect(revoke).not.toHaveBeenCalled();
    expect(connUpdate).not.toHaveBeenCalled();
  });

  it('returns already-disconnected when row already revoked', async () => {
    auditFindUnique.mockResolvedValue({ id: 'aud_1', shopUrl: 'https://acme.com' });
    connFindUnique.mockResolvedValue({
      normalisedDomain: 'acme.com',
      revokedAt: new Date(),
      refreshTokenCipher: Buffer.alloc(0),
      refreshTokenIv: Buffer.alloc(0),
      refreshTokenAuthTag: Buffer.alloc(0),
    });
    const res = await POST(makeRequest('?audit=aud_1'));
    expect(await res.json()).toEqual({ status: 'already-disconnected' });
    expect(revoke).not.toHaveBeenCalled();
  });

  it('revokes at Google + zeros ciphertext on active connection', async () => {
    const sealed = sealRefreshToken('rt_real');
    auditFindUnique.mockResolvedValue({ id: 'aud_1', shopUrl: 'https://acme.com' });
    connFindUnique.mockResolvedValue({
      normalisedDomain: 'acme.com',
      revokedAt: null,
      refreshTokenCipher: sealed.ciphertext,
      refreshTokenIv: sealed.iv,
      refreshTokenAuthTag: sealed.authTag,
    });

    const res = await POST(makeRequest('?audit=aud_1'));

    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke.mock.calls[0]![0]).toBe('rt_real');
    expect(connUpdate).toHaveBeenCalledOnce();
    const updateArg = connUpdate.mock.calls[0]![0] as {
      data: {
        refreshTokenCipher: Buffer;
        revokedAt: Date;
      };
    };
    expect(updateArg.data.refreshTokenCipher.length).toBe(sealed.ciphertext.length);
    expect(updateArg.data.refreshTokenCipher.every((b: number) => b === 0)).toBe(true);
    expect(updateArg.data.revokedAt).toBeInstanceOf(Date);
    expect(await res.json()).toEqual({ status: 'disconnected' });
  });

  it('still zeros ciphertext if Google revoke throws', async () => {
    const sealed = sealRefreshToken('rt_real');
    auditFindUnique.mockResolvedValue({ id: 'aud_1', shopUrl: 'https://acme.com' });
    connFindUnique.mockResolvedValue({
      normalisedDomain: 'acme.com',
      revokedAt: null,
      refreshTokenCipher: sealed.ciphertext,
      refreshTokenIv: sealed.iv,
      refreshTokenAuthTag: sealed.authTag,
    });
    revoke.mockRejectedValue(new Error('network-down'));

    const res = await POST(makeRequest('?audit=aud_1'));

    expect(connUpdate).toHaveBeenCalledOnce();
    expect(await res.json()).toEqual({ status: 'disconnected' });
  });
});
