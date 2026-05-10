import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled, normaliseShopDomain, revokeAtGoogle } from '@/lib/gmc/oauth';
import { openRefreshToken } from '@/lib/gmc/token-storage';
import { prisma } from '@/lib/db';
import { checkOauthFlowRateLimit } from '@/lib/rate-limit';

// Per ADR 0023 §slice 2 — OAuth disconnect. Behind FEATURE_GMC_OAUTH.
// Best-effort revoke at Google + zero ciphertext + set revokedAt.
// Row remains for audit trail. Idempotent: already-revoked rows return
// success without re-revoking.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Per-IP rate limit added 2026-05-10 (P2-M pre-launch audit).
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;
  const rl = checkOauthFlowRateLimit({ ip });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate-limited', retryAfterSec: rl.retryAfterSec },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      },
    );
  }

  const url = new URL(request.url);
  const auditId = url.searchParams.get('audit');
  if (!auditId) {
    return NextResponse.json({ error: 'missing-audit-param' }, { status: 400 });
  }

  const audit = await prisma.conciergeAudit.findUnique({ where: { id: auditId } });
  if (!audit) {
    return NextResponse.json({ error: 'audit-not-found' }, { status: 404 });
  }

  const normalisedDomain = normaliseShopDomain(audit.shopUrl);
  const conn = await prisma.merchantGmcConnection.findUnique({
    where: { normalisedDomain },
  });

  if (!conn || conn.revokedAt) {
    return NextResponse.json({ status: 'already-disconnected' });
  }

  try {
    const refreshToken = openRefreshToken({
      ciphertext: conn.refreshTokenCipher,
      iv: conn.refreshTokenIv,
      authTag: conn.refreshTokenAuthTag,
    });
    await revokeAtGoogle(refreshToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('gmc-disconnect: google-revoke-failed', message);
  }

  await prisma.merchantGmcConnection.update({
    where: { normalisedDomain },
    data: {
      refreshTokenCipher: Buffer.alloc(conn.refreshTokenCipher.length),
      refreshTokenIv: Buffer.alloc(conn.refreshTokenIv.length),
      refreshTokenAuthTag: Buffer.alloc(conn.refreshTokenAuthTag.length),
      revokedAt: new Date(),
    },
  });

  return NextResponse.json({ status: 'disconnected' });
}
