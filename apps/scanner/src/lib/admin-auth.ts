// Admin auth — single-admin v0 for audit-assist. Session-cookie HMAC
// against ADMIN_EMAIL + ADMIN_SESSION_SECRET. Password verification via
// stdlib scrypt (no new dep — OWASP-recommended N=2^14, r=8, p=1).
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
//
// Extraction-clean: when a multi-admin auth provider lands (NextAuth /
// Lucia / WorkOS), the public surface (`requireAdmin`, `signSession`)
// stays the same — the implementation behind `requireAdmin` swaps.

import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { cookies as cookiesFn } from 'next/headers'

const SCRYPT_PARAMS = {
  // OWASP password storage cheat sheet (2024). Tunable upward as
  // hardware moves; 64MiB cost is enough to make GPU brute force
  // expensive without slowing legitimate login appreciably (~150ms).
  N: 16384, // 2^14
  r: 8,
  p: 1,
  keyLen: 64,
}

const COOKIE_NAME = 'flintmere_admin'
const SESSION_VERSION = 1
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 // 24h per plan D1 / OQ3

const scryptAsync = promisify<string, Buffer, number, Buffer>(scrypt)

// ---- Password hashing (scrypt) -------------------------------------

/**
 * Hashes a password for storage. Format:
 *   `scrypt$<N>$<r>$<p>$<salt-base64>$<hash-base64>`
 *
 * Generate once locally; store the result in Coolify as
 * ADMIN_LOGIN_PASSWORD_HASH. Never commit a hash; never log it.
 *
 * Helper script for operator convenience:
 *   node -e "const {hashPassword} = await import('./apps/scanner/src/lib/admin-auth.ts'); console.log(await hashPassword(process.argv[1]))" "your-password"
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 12) {
    throw new Error('password must be at least 12 characters')
  }
  const salt = randomBytes(16)
  const hash = (await scryptAsync(
    password,
    salt,
    SCRYPT_PARAMS.keyLen,
  )) as unknown as Buffer
  return [
    'scrypt',
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$')
}

/**
 * Verifies a password against a stored hash. Timing-safe.
 * Returns false on any malformed / mismatched input — never throws on
 * bad input (request handlers map false → 401, no diagnostic leak).
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (!password || !storedHash) return false
  const parts = storedHash.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, nStr, , , saltB64, hashB64] = parts
  const N = Number(nStr)
  if (!Number.isInteger(N) || N <= 0) return false
  let salt: Buffer
  let stored: Buffer
  try {
    salt = Buffer.from(saltB64!, 'base64')
    stored = Buffer.from(hashB64!, 'base64')
  } catch {
    return false
  }
  if (stored.length !== SCRYPT_PARAMS.keyLen) return false
  let computed: Buffer
  try {
    computed = (await scryptAsync(
      password,
      salt,
      SCRYPT_PARAMS.keyLen,
    )) as unknown as Buffer
  } catch {
    return false
  }
  return timingSafeEqual(computed, stored)
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
  ADMIN_LOGIN_PASSWORD_HASH?: string
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
