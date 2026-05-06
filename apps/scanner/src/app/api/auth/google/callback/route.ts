import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, isFeatureEnabled, verifyState } from '@/lib/gmc/oauth';
import { sealRefreshToken } from '@/lib/gmc/token-storage';
import { prisma } from '@/lib/db';

// Per ADR 0023 §slice 2 — OAuth callback. Behind FEATURE_GMC_OAUTH.
// Google redirects here with ?code= and ?state= after consent.
// We verify the state CSRF token, exchange the code for tokens,
// seal the refresh token at rest, upsert the MerchantGmcConnection,
// then redirect to the merchant-facing post-connect page.
//
// `gmcAccountId` is left null at create-time; slice 2a-3's Content API
// client backfills it on the first scan after connect by calling
// `accounts.list` (the merchant may have multiple accounts and the
// account picker happens server-side, not at consent).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isFeatureEnabled()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const url = new URL(request.url);
  const errorParam = url.searchParams.get('error');
  if (errorParam) {
    const dest = new URL('/audit/connect', url);
    dest.searchParams.set('status', 'denied');
    dest.searchParams.set('reason', errorParam);
    return NextResponse.redirect(dest);
  }

  const code = url.searchParams.get('code');
  const stateToken = url.searchParams.get('state');
  if (!code || !stateToken) {
    return NextResponse.json({ error: 'missing-params' }, { status: 400 });
  }

  const state = verifyState(stateToken);
  if (!state) {
    return NextResponse.json({ error: 'invalid-state' }, { status: 400 });
  }

  const redirectUri = new URL('/api/auth/google/callback', url).toString();

  let tokens;
  try {
    tokens = await exchangeCodeForTokens({ code, redirectUri });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'exchange-failed';
    console.warn('gmc-callback: exchange-failed', message);
    const dest = new URL('/audit/connect', url);
    dest.searchParams.set('status', 'exchange-failed');
    return NextResponse.redirect(dest);
  }

  const sealed = sealRefreshToken(tokens.refreshToken);

  await prisma.merchantGmcConnection.upsert({
    where: { normalisedDomain: state.normalisedDomain },
    create: {
      normalisedDomain: state.normalisedDomain,
      gmcAccountId: null,
      refreshTokenCipher: sealed.ciphertext,
      refreshTokenIv: sealed.iv,
      refreshTokenAuthTag: sealed.authTag,
      scopes: tokens.scopes,
      connectedAt: new Date(),
    },
    update: {
      gmcAccountId: null,
      gmcAccountName: null,
      refreshTokenCipher: sealed.ciphertext,
      refreshTokenIv: sealed.iv,
      refreshTokenAuthTag: sealed.authTag,
      scopes: tokens.scopes,
      connectedAt: new Date(),
      revokedAt: null,
      lastErrorCode: null,
      lastErrorAt: null,
    },
  });

  const dest = new URL('/audit/connect', url);
  dest.searchParams.set('status', 'ok');
  dest.searchParams.set('audit', state.auditId);
  return NextResponse.redirect(dest);
}
