/**
 * GMC OAuth flow primitives — state signing, auth URL building, token
 * exchange, revocation, feature flag, domain canonicalisation.
 *
 * Per ADR 0023, the OAuth scope is read-only `auth/content` (Google
 * Content API for Shopping). Refresh tokens persist via
 * `lib/gmc/token-storage.ts`; access tokens never persist.
 *
 * State CSRF model: signed HMAC-SHA256 over a base64url'd JSON payload.
 * Same shape as `lib/unsub-token.ts`. State carries the merchant
 * binding (`normalisedDomain` + `auditId`) so the callback can persist
 * the connection without trusting query params. TTL 10 minutes.
 *
 * Feature flag: `FEATURE_GMC_OAUTH=true` enables the routes;
 * default is off, routes 404. Per ADR 0023 §Rollout slice 2,
 * Scenario A2 ships backend behind the flag while Google reviews
 * `auth/content` scope addition (1–3 weeks variable).
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

export const GMC_SCOPES = ['https://www.googleapis.com/auth/content'] as const;
export const GMC_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GMC_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
export const STATE_TTL_MS = 10 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

export interface GmcOAuthStatePayload {
  normalisedDomain: string;
  auditId: string;
}

export interface GmcOAuthState extends GmcOAuthStatePayload {
  nonce: string;
  issuedAt: number;
}

export function signState(payload: GmcOAuthStatePayload, now = Date.now()): string {
  const full: GmcOAuthState = {
    ...payload,
    nonce: randomBytes(8).toString('hex'),
    issuedAt: now,
  };
  const payloadB64 = Buffer.from(JSON.stringify(full), 'utf8').toString('base64url');
  const sig = createHmac('sha256', stateSecret()).update(payloadB64).digest('hex');
  return `${payloadB64}.${sig}`;
}

export function verifyState(token: string, now = Date.now()): GmcOAuthState | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sigHex = token.slice(dot + 1);
  if (!/^[0-9a-f]+$/i.test(sigHex)) return null;

  const expected = createHmac('sha256', stateSecret()).update(payloadB64).digest('hex');
  if (sigHex.length !== expected.length) return null;
  let match = false;
  try {
    match = timingSafeEqual(Buffer.from(sigHex, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return null;
  }
  if (!match) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!isStateShape(parsed)) return null;

  if (parsed.issuedAt > now + CLOCK_SKEW_MS) return null;
  if (now - parsed.issuedAt > STATE_TTL_MS) return null;

  return parsed;
}

function isStateShape(v: unknown): v is GmcOAuthState {
  if (v === null || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.normalisedDomain === 'string' &&
    typeof o.auditId === 'string' &&
    typeof o.nonce === 'string' &&
    typeof o.issuedAt === 'number' &&
    Number.isFinite(o.issuedAt)
  );
}

export function buildAuthUrl(opts: { state: string; redirectUri: string }): string {
  const params = new URLSearchParams({
    client_id: requireEnv('GOOGLE_OAUTH_CLIENT_ID'),
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: GMC_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: opts.state,
  });
  return `${GMC_AUTH_URL}?${params.toString()}`;
}

export interface ExchangedTokens {
  refreshToken: string;
  accessToken: string;
  expiryDate: number | null;
  scopes: string[];
}

export async function exchangeCodeForTokens(args: {
  code: string;
  redirectUri: string;
}): Promise<ExchangedTokens> {
  const client = new OAuth2Client(
    requireEnv('GOOGLE_OAUTH_CLIENT_ID'),
    requireEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
    args.redirectUri,
  );
  const { tokens } = await client.getToken(args.code);
  if (!tokens.refresh_token) {
    throw new Error(
      'gmc-oauth: Google returned no refresh_token. Ensure access_type=offline + prompt=consent on the auth URL, and that the merchant has not previously granted this client without revoke.',
    );
  }
  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token ?? '',
    expiryDate: tokens.expiry_date ?? null,
    scopes: (tokens.scope ?? '').split(' ').filter(Boolean),
  };
}

export async function revokeAtGoogle(refreshToken: string): Promise<void> {
  const url = `${GMC_REVOKE_URL}?token=${encodeURIComponent(refreshToken)}`;
  const res = await fetch(url, { method: 'POST' });
  // 400 with `invalid_token` means already revoked or unknown — idempotent.
  if (!res.ok && res.status !== 400) {
    throw new Error(`gmc-oauth: revoke failed ${res.status}`);
  }
}

export function isFeatureEnabled(): boolean {
  return process.env.FEATURE_GMC_OAUTH === 'true';
}

/**
 * Canonicalise a merchant-supplied shop URL to the bare domain form.
 *   "https://www.acme.com/products" → "acme.com"
 *   "Acme.com"                       → "acme.com"
 *   "  acme.com/  "                  → "acme.com"
 *
 * Mirrors the post-fetch shape that `runScanForShop` writes into
 * `Scan.normalisedDomain` (via `catalog.shopDomain`). Used to bind a
 * `MerchantGmcConnection` to a known scan/audit identity without a
 * second catalog fetch.
 */
export function normaliseShopDomain(shopUrl: string): string {
  return shopUrl
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
}

function stateSecret(): string {
  return requireEnv('GMC_STATE_SECRET');
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} missing. Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  return v;
}
