// Magic-link sign-in primitives for the operator console at /admin/login.
//
// Replaces the scrypt-password flow (deleted 2026-05-09). Operator enters
// their email; if it matches the ADMIN_EMAIL allowlist (timing-safe), we
// generate a 32-byte random token, persist its sha256 hash to
// `scanner_magic_link_tokens`, and email the operator a link carrying the
// raw token. Click the link → verify-and-consume → session cookie issued
// via the existing admin-auth.ts HMAC primitives. Default TTL 10 minutes.
//
// Security posture:
//   - Raw token never persisted; sha256 hash only. DB leak cannot forge.
//   - One-shot consume — atomic UPDATE WHERE consumed_at IS NULL guards
//     against double-click / replay.
//   - 10-minute TTL per OWASP magic-link guidance.
//   - Allowlist enforcement happens at request-time (no email sent to
//     non-allowlisted addresses) AND at consume-time (defence in depth).
//   - Token entropy: 32 bytes = 256 bits. base64url-encoded for URL use.
//
// Invariant for callers: the raw token leaves this module exactly twice —
// in the email body and in the URL query param — and never persists.

import { createHash, randomBytes } from 'node:crypto'
import { prisma } from './db'

const TOKEN_BYTES = 32
const DEFAULT_TTL_MINUTES = 10

export const MAGIC_LINK_DEFAULT_TTL_MINUTES = DEFAULT_TTL_MINUTES

export function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url')
}

export function hashToken(rawToken: string): Buffer {
  return createHash('sha256').update(rawToken, 'utf8').digest()
}

export interface CreateMagicLinkArgs {
  email: string
  ttlMinutes?: number
}

export interface MagicLinkRecord {
  rawToken: string
  expiresAt: Date
}

/**
 * Generate + persist a magic-link token. Returns the raw token + expiry.
 * Caller is responsible for emailing the raw token; never log it.
 */
export async function createMagicLink(
  args: CreateMagicLinkArgs,
): Promise<MagicLinkRecord> {
  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const ttlMinutes = args.ttlMinutes ?? DEFAULT_TTL_MINUTES
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000)
  await prisma.magicLinkToken.create({
    data: {
      tokenHash,
      email: args.email.toLowerCase().trim(),
      expiresAt,
    },
  })
  return { rawToken, expiresAt }
}

export type VerifyReason = 'unknown' | 'consumed' | 'expired'

export interface VerifyOk {
  ok: true
  email: string
}
export interface VerifyFail {
  ok: false
  reason: VerifyReason
}
export type VerifyResult = VerifyOk | VerifyFail

/**
 * Atomically verify + consume a token. Returns the email on success.
 *
 * The atomic claim (`updateMany` with `consumed_at: null` + `expires_at >
 * now` guard) wins any double-click race — only one caller sees count===1.
 * The diagnostic re-read on miss is best-effort logging only; an attacker
 * with a junk token still gets a generic failure.
 */
export async function verifyAndConsume(
  rawToken: string,
): Promise<VerifyResult> {
  if (!rawToken) return { ok: false, reason: 'unknown' }
  const tokenHash = hashToken(rawToken)
  const now = new Date()

  const result = await prisma.magicLinkToken.updateMany({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: { consumedAt: now },
  })

  if (result.count !== 1) {
    const row = await prisma.magicLinkToken.findUnique({ where: { tokenHash } })
    if (!row) return { ok: false, reason: 'unknown' }
    if (row.consumedAt) return { ok: false, reason: 'consumed' }
    if (row.expiresAt <= now) return { ok: false, reason: 'expired' }
    return { ok: false, reason: 'unknown' }
  }

  const row = await prisma.magicLinkToken.findUniqueOrThrow({
    where: { tokenHash },
  })
  return { ok: true, email: row.email }
}
