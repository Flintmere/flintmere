// Admin auth — single-admin v0 for audit-assist. Session-cookie HMAC
// against ADMIN_EMAIL + ADMIN_SESSION_SECRET. Sign-in front door is a
// long-random password at /api/admin/login (replaced the magic-link flow
// on 2026-05-09 — operator preference + Coolify env-mount fragility).
//
// Password posture: ADMIN_PASSWORD is a 32-char openssl-random string,
// stored in Coolify alongside ADMIN_SESSION_SECRET (same trust level —
// either leaking is game-over). Compared timing-safe against the
// submitted value; no hashing because hashing adds zero security when
// the cookie-signing secret is at the same blast radius.
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
//     hex(HMAC-SHA256(secret, "smoke-v2:<hour-bucket>")) authenticates
//     laptop-side scripts (operator's smoke-audit-draft-direct.mjs +
//     dump-audit-markdown.ts) without going through the password flow.
//     The hourly bucket rotation means a leaked token expires within
//     ~1-2h (verifier accepts current OR previous bucket), reducing
//     the leak-window vs the ADMIN_SESSION_SECRET itself. Operators
//     who hold the secret can mint fresh tokens any time; cleartext
//     leak of a single token has bounded blast radius.
//
// Extraction-clean: when a multi-admin auth provider lands (NextAuth /
// Lucia / WorkOS), the public surface (`requireAdmin`, `signSession`)
// stays the same — the implementation behind `requireAdmin` swaps.

import { readFileSync } from 'node:fs'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { cookies as cookiesFn } from 'next/headers'

const COOKIE_NAME = 'flintmere_admin'
const SESSION_VERSION = 1
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 // 24h per plan D1 / OQ3

// Smoke-token rotates with a 1-hour bucket so a leaked token expires
// within ~1-2 hours without rotating ADMIN_SESSION_SECRET. v1 was a
// static HMAC over the literal 'smoke-v1' — token never expired. v2
// HMACs over `smoke-v2:<hour-bucket>` so the token rotates hourly.
// Verifier accepts current OR previous bucket → 1-2h validity (depends
// on phase), giving the operator headroom on long-running scripts.
// Tightened 2026-05-09 pre-launch audit P0-1.
const SMOKE_TOKEN_TAG_PREFIX = 'smoke-v2'
const SMOKE_TOKEN_WINDOW_MS = 60 * 60 * 1000 // 1h

/**
 * Read a secret from the env, with a `_FILE` mount fallback. Coolify
 * mounts file-secrets at a path stored in `${NAME}_FILE`; raw env-var
 * shell-expansion was broken in the deploy that introduced this path.
 * Same pattern as /api/admin/login route helper.
 *
 * `env` defaults to `process.env`; tests can pass synthetic envs that
 * use the direct key form, the _FILE form, or both.
 */
function readSecret(env: AdminAuthEnv, name: string): string {
  const filePath = env[`${name}_FILE`]
  if (filePath) {
    try {
      return readFileSync(filePath, 'utf8').trim()
    } catch (err) {
      // Surface the failure so an operator debugging a silent admin
      // lockout sees why. Without this, requireAdmin returns null and
      // the route 401s with no log trail — caught 2026-05-09 audit.
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'admin-auth.secret-file-read-failed',
          name,
          filePath,
          message: err instanceof Error ? err.message : String(err),
        }),
      )
      return ''
    }
  }
  return env[name] ?? ''
}

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
  // Secure on every HTTPS context — production AND Coolify previews/staging.
  // Gating on NODE_ENV='production' alone leaked cookies on Coolify staging
  // where NODE_ENV is unset but the deploy serves HTTPS (caught 2026-05-09
  // pre-launch audit). NEXT_PUBLIC_APP_URL declares the deployment scheme,
  // so it is the right signal here.
  if ((process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https:')) {
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
  const secret = readSecret(env, 'ADMIN_SESSION_SECRET')
  const allowlistedEmail = readSecret(env, 'ADMIN_EMAIL')
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
 * Compute the canonical token value for a given (secret, hour-bucket).
 * Bucket = floor(unix-ms / SMOKE_TOKEN_WINDOW_MS). Internal helper used
 * by both compute (current bucket) + verify (current ± previous bucket).
 */
function computeSmokeTokenForBucket(secret: string, bucket: number): string {
  return createHmac('sha256', secret)
    .update(`${SMOKE_TOKEN_TAG_PREFIX}:${bucket}`)
    .digest('hex')
}

/**
 * Compute the X-Admin-Smoke-Token value for a given secret + clock.
 * Operator laptop scripts call this with their local copy of
 * ADMIN_SESSION_SECRET (and the system clock) to derive the header
 * value at request time.
 *
 * Design: HMAC-SHA256 over `smoke-v2:<hour-bucket>`, hex-encoded. The
 * domain-separation prefix prevents this token from being mistaken for
 * a session-cookie HMAC (which signs base64url payloads). The token
 * rotates hourly automatically — a leaked token expires within ~1-2h
 * (verifier window) without an explicit ADMIN_SESSION_SECRET rotation.
 *
 * `now` is overridable for testability; production callers omit it.
 */
export function computeSmokeToken(secret: string, now: number = Date.now()): string {
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters')
  }
  const bucket = Math.floor(now / SMOKE_TOKEN_WINDOW_MS)
  return computeSmokeTokenForBucket(secret, bucket)
}

/**
 * Verify an `X-Admin-Smoke-Token` header against the configured secret +
 * ADMIN_EMAIL allowlist + current/previous hour bucket. Returns the
 * admin email on success, null on any failure.
 *
 * Accepting current OR previous bucket gives the operator a 1-2h
 * validity window (depends on phase — token computed at minute-58 of
 * hour H is valid through hour H+1). Long-running smoke scripts that
 * compute the token once at start and run for tens of minutes don't
 * race the rotation boundary.
 *
 * Pass `req.headers` (or any `Headers`-shaped object).
 * `now` is overridable for testability.
 */
export function verifyAdminSmokeToken(
  headers: Headers,
  env: AdminAuthEnv = process.env,
  now: number = Date.now(),
): { email: string } | null {
  const secret = readSecret(env, 'ADMIN_SESSION_SECRET')
  const adminEmail = readSecret(env, 'ADMIN_EMAIL')
  if (!secret || !adminEmail) return null
  if (secret.length < 32) return null

  const provided = headers.get('x-admin-smoke-token')
  if (!provided) return null

  // SHA-256 hex = 64 chars. Reject other lengths early so we don't pass
  // mismatched-length buffers into timingSafeEqual (which throws).
  if (provided.length !== 64) return null

  const currentBucket = Math.floor(now / SMOKE_TOKEN_WINDOW_MS)
  const providedBuf = Buffer.from(provided, 'utf8')

  // Loop both buckets to keep timing similar across "match-current"
  // and "match-previous" paths. Don't early-return on first match.
  let matched = false
  for (const bucket of [currentBucket, currentBucket - 1]) {
    const expected = computeSmokeTokenForBucket(secret, bucket)
    const expectedBuf = Buffer.from(expected, 'utf8')
    if (timingSafeEqual(providedBuf, expectedBuf)) {
      matched = true
    }
  }

  return matched ? { email: adminEmail } : null
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
