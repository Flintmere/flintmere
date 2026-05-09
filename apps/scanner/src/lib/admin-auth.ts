// Admin auth — single-admin v0 for audit-assist. Session-cookie HMAC
// against ADMIN_EMAIL + ADMIN_SESSION_SECRET. Sign-in front door is the
// magic-link flow at /api/admin/magic-link/{request,verify} (replaced the
// scrypt-password flow on 2026-05-09).
//
// Posture (plan §Council self-review #4):
//   - HttpOnly + Secure (prod) + SameSite=Strict cookie. SameSite-Strict
//     gives CSRF immunity by browser policy — no token plumbing needed.
//   - Cookie payload signed with HMAC-SHA256 over the base64url payload.
//     Tampered payload → HMAC verify fails → reject.
//   - Payload carries explicit `exp` (unix ms). Expired → reject.
//   - Allowlist email check after HMAC + expiry pass. A valid signed
//     cookie with the wrong email is forbidden, not unauthenticated.
//   - All comparisons use crypto.timingSafeEqual.
//   - Smoke-token side-channel: `X-Admin-Smoke-Token` header carrying
//     hex(HMAC-SHA256(secret, "smoke-v1")) authenticates laptop-side
//     scripts (operator's smoke-audit-draft-direct.mjs) without going
//     through the magic-link flow. Same blast radius as the existing
//     ADMIN_SESSION_SECRET — leak it and an attacker forges sessions
//     either way.
//
// Extraction-clean: when a multi-admin auth provider lands (NextAuth /
// Lucia / WorkOS), the public surface (`requireAdmin`, `signSession`)
// stays the same — the implementation behind `requireAdmin` swaps.

import { createHmac, timingSafeEqual } from 'node:crypto'
import type { cookies as cookiesFn } from 'next/headers'

const COOKIE_NAME = 'flintmere_admin'
const SESSION_VERSION = 1
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 // 24h per plan D1 / OQ3
const SMOKE_TOKEN_TAG = 'smoke-v1'

// ---- Session cookie (HMAC) -----------------------------------------

export interface SessionPayload {
  email: string
  exp: number // unix ms
  v: number
}

/**
 * Signs a session payload. Format:
 *   `<base64url(JSON payload)>.<base64url(HMAC-SHA256)>`
 *
 * `secret` must be ≥32 random bytes (operator generates with
 * `openssl rand -hex 32` and stores as ADMIN_SESSION_SECRET).
 */
export function signSession(
  payload: SessionPayload,
  secret: string,
): string {
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters')
  }
  const json = JSON.stringify(payload)
  const payloadB64 = base64UrlEncode(Buffer.from(json, 'utf8'))
  const hmac = createHmac('sha256', secret).update(payloadB64).digest()
  return `${payloadB64}.${base64UrlEncode(hmac)}`
}

/**
 * Verifies a signed cookie value. Returns the parsed payload on success,
 * null on any failure. Failure modes (all → null):
 *   - malformed cookie shape
 *   - tampered payload (HMAC mismatch)
 *   - expired (exp <= now)
 *   - unknown version
 */
export function verifySession(
  cookieValue: string,
  secret: string,
): SessionPayload | null {
  if (!cookieValue || !secret) return null
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, hmacB64] = parts
  if (!payloadB64 || !hmacB64) return null

  let providedHmac: Buffer
  try {
    providedHmac = base64UrlDecode(hmacB64)
  } catch {
    return null
  }
  const expectedHmac = createHmac('sha256', secret)
    .update(payloadB64)
    .digest()
  if (providedHmac.length !== expectedHmac.length) return null
  if (!timingSafeEqual(providedHmac, expectedHmac)) return null

  let payload: unknown
  try {
    const json = base64UrlDecode(payloadB64).toString('utf8')
    payload = JSON.parse(json)
  } catch {
    return null
  }
  if (!isSessionPayload(payload)) return null
  if (payload.v !== SESSION_VERSION) return null
  if (payload.exp <= Date.now()) return null

  return payload
}

function isSessionPayload(x: unknown): x is SessionPayload {
  if (!x || typeof x !== 'object') return false
  const p = x as Record<string, unknown>
  return (
    typeof p.email === 'string' &&
    typeof p.exp === 'number' &&
    typeof p.v === 'number'
  )
}

// ---- Server-side cookie helpers ------------------------------------

// Compatible with `process.env` (NodeJS.ProcessEnv extends a string
// dict) so callers can pass it without explicit narrowing.
export type AdminAuthEnv = Record<string, string | undefined> & {
  ADMIN_SESSION_SECRET?: string
  ADMIN_EMAIL?: string
}

export function buildCookieAttributes(
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const attrs = [
    `Path=/`,
    `Max-Age=${ttlSeconds}`,
    'HttpOnly',
    'SameSite=Strict',
  ]
  if (process.env.NODE_ENV === 'production') {
    attrs.push('Secure')
  }
  return attrs.join('; ')
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME
export const ADMIN_SESSION_VERSION = SESSION_VERSION

/**
 * Issues a fresh session token for `email`, valid for `ttlSeconds`.
 * Caller is responsible for setting it on the response (cookie
 * attribute string from `buildCookieAttributes`).
 */
export function issueSession(
  email: string,
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  return signSession(
    {
      email,
      exp: Date.now() + ttlSeconds * 1000,
      v: SESSION_VERSION,
    },
    secret,
  )
}

/**
 * Server-side admin gate. Reads the cookie, verifies, checks email
 * against ADMIN_EMAIL allowlist. Returns the admin email on success,
 * null on any failure.
 *
 * Caller wraps in route-handler logic — typically returning a 401
 * with `{ ok: false, code: 'unauth' }` or redirecting to /admin/login
 * on null.
 *
 * Pass the bound `cookies` from `next/headers` so this stays testable
 * (we don't pull `next/headers` at module load — that would force a
 * Next runtime in unit tests). Production callers do:
 *
 *   import { cookies } from 'next/headers'
 *   const admin = await requireAdmin(cookies, process.env)
 */
export async function requireAdmin(
  cookieGetter: typeof cookiesFn,
  env: AdminAuthEnv = process.env,
): Promise<{ email: string } | null> {
  const secret = env.ADMIN_SESSION_SECRET
  const allowlistedEmail = env.ADMIN_EMAIL
  if (!secret || !allowlistedEmail) return null

  const store = await cookieGetter()
  const cookie = store.get(COOKIE_NAME)
  if (!cookie?.value) return null

  const payload = verifySession(cookie.value, secret)
  if (!payload) return null

  // Allowlist check — timing-safe to avoid a side-channel between
  // "valid cookie, wrong email" and "valid cookie, right email." Pad
  // both sides to a fixed length so the compare cost is constant.
  const a = Buffer.alloc(128)
  const b = Buffer.alloc(128)
  Buffer.from(payload.email.toLowerCase(), 'utf8').copy(a)
  Buffer.from(allowlistedEmail.toLowerCase(), 'utf8').copy(b)
  if (!timingSafeEqual(a, b)) return null

  return { email: payload.email }
}

// ---- Smoke-token side-channel --------------------------------------

/**
 * Compute the X-Admin-Smoke-Token value for a given secret. Operator
 * laptop scripts call this with their local copy of ADMIN_SESSION_SECRET
 * to derive the header value before hitting the API.
 *
 * Design: HMAC-SHA256 over the literal "smoke-v1" tag, hex-encoded. The
 * domain-separation tag prevents this token from being mistaken for a
 * session-cookie HMAC (which signs base64url payloads). The token is
 * static for the lifetime of the secret — leak it and any caller can
 * authenticate as admin until the secret rotates. Same blast radius as
 * the existing session HMAC.
 */
export function computeSmokeToken(secret: string): string {
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters')
  }
  return createHmac('sha256', secret).update(SMOKE_TOKEN_TAG).digest('hex')
}

/**
 * Verify an `X-Admin-Smoke-Token` header against the configured secret +
 * ADMIN_EMAIL allowlist. Returns the admin email on success, null on any
 * failure. Used by audit-draft route handlers as the side-channel that
 * lets laptop-side smoke scripts skip the magic-link flow.
 *
 * Pass `req.headers` (or any `Headers`-shaped object); the function pulls
 * the header itself.
 */
export function verifyAdminSmokeToken(
  headers: Headers,
  env: AdminAuthEnv = process.env,
): { email: string } | null {
  const secret = env.ADMIN_SESSION_SECRET
  const adminEmail = env.ADMIN_EMAIL
  if (!secret || !adminEmail) return null

  const provided = headers.get('x-admin-smoke-token')
  if (!provided) return null

  let expected: string
  try {
    expected = computeSmokeToken(secret)
  } catch {
    return null
  }
  if (provided.length !== expected.length) return null
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (!timingSafeEqual(a, b)) return null

  return { email: adminEmail }
}

// ---- base64url helpers ---------------------------------------------

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(s: string): Buffer {
  const padded = s.replaceAll('-', '+').replaceAll('_', '/')
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return Buffer.from(padded + padding, 'base64')
}
