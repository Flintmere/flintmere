import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, isFeatureEnabled, verifyState } from '@/lib/gmc/oauth';
import { sealRefreshToken } from '@/lib/gmc/token-storage';
import { prisma } from '@/lib/db';
import { scannerOrigin } from '@/lib/host-url';
import { captureServerEvent } from '@/lib/analytics-server';

// Per ADR 0023 §slice 2 — OAuth callback. Behind FEATURE_GMC_OAUTH.
// Google redirects here with ?code= and ?state= after consent.
// We verify the state CSRF token, exchange the code for tokens,
// seal the refresh token at rest, upsert the MerchantGmcConnection,
// then redirect to the merchant-facing post-connect page.
//
// `gmcAccountId` is left null at create-time; slice 2a-3's Merchant API
// client backfills it on the first scan after connect by calling
// `accounts.list` (the merchant may have multiple accounts and the
// account picker happens server-side, not at consent).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_OAUTH_ERRORS = new Set([
  'access_denied',
  'invalid_request',
  'unauthorized_client',
  'unsupported_response_type',
  'invalid_scope',
  'server_error',
  'temporarily_unavailable',
  'admin_policy_enforced',
  'disallowed_useragent',
  'org_internal',
]);

function isAllowedOauthError(value: string): boolean {
  return ALLOWED_OAUTH_ERRORS.has(value);
}

export async function GET(request: NextRequest) {
  if (!isFeatureEnabled()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const url = new URL(request.url);
  // Public origin for redirect URI + browser redirects — behind Traefik,
  // `request.url` self-reports the container origin (0.0.0.0:3000).
  const origin = scannerOrigin(request.url);
  const errorParam = url.searchParams.get('error');
  if (errorParam) {
    // Allowlist Google's documented OAuth error codes. Anything off-list
    // becomes 'unknown' so a hostile or buggy IdP can't smuggle arbitrary
    // text into the merchant-visible /audit/connect?reason= surface.
    // Allowlist sourced from RFC 6749 §4.1.2.1 + Google's docs.
    const safeReason = isAllowedOauthError(errorParam) ? errorParam : 'unknown';
    // Funnel step (ADR 0023 §measurement, spec 2026-06-07): consent declined
    // or aborted at Google. `reason` is the allowlisted code only — never the
    // raw param — so the same redaction that protects the merchant-visible
    // surface protects the analytics property.
    await captureServerEvent('oauth_callback_denied', { reason: safeReason });
    const dest = new URL('/audit/connect', origin);
    dest.searchParams.set('status', 'denied');
    dest.searchParams.set('reason', safeReason);
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

  // Must byte-match the redirect_uri the start route sent to Google.
  const redirectUri = new URL('/api/auth/google/callback', origin).toString();

  let tokens;
  try {
    tokens = await exchangeCodeForTokens({ code, redirectUri });
  } catch (err) {
    // Don't log err.message — Google's ExchangeCodeForTokensError can
    // include partial code value, redirect_uri, or client_id in the
    // message string. The OAuth code is single-use and already spent
    // by the time the error fires, but redaction is the right log
    // discipline. Structured event tag is sufficient for alerting.
    void err;
    console.warn(
      JSON.stringify({ event: 'gmc-callback.exchange-failed' }),
    );
    // Funnel step (ADR 0023 §measurement, spec 2026-06-07): the consent
    // succeeded but the token exchange failed — a not-ok callback. Tagged
    // distinctly from a user-side denial so the funnel can separate
    // misconfiguration from merchant choice. No shop/domain: the exchange
    // failed before we trusted the state payload's binding.
    await captureServerEvent('oauth_callback_denied', {
      reason: 'exchange_failed',
    });
    const dest = new URL('/audit/connect', origin);
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

  // Funnel step 3 (ADR 0023 §measurement, spec 2026-06-07): the connection
  // is persisted — the OAuth round-trip cleared. `ground_truth_rendered` is
  // captured client-side downstream when a GMC panel actually paints.
  await captureServerEvent('oauth_callback_ok', {
    shop: state.normalisedDomain,
    audit_id: state.auditId,
  });

  // Connect-friction spec (2026-06-07) fix 1 — route to the auto-scan payoff
  // instead of the dead-end Connected card. The payoff page resolves the
  // merchant's ground-truth scan and renders it. Reverts in one line by
  // pointing back at `/audit/connect?status=ok`.
  const dest = new URL('/audit/connect/results', origin);
  dest.searchParams.set('audit', state.auditId);
  return NextResponse.redirect(dest);
}
