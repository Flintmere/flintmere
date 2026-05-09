// Email-OTP sign-in primitives for the operator console at /admin/login.
//
// Replaces the magic-link flow (deleted 2026-05-09 — operator preference:
// stay on the page, type a 6-digit code, no link-click thrash). The
// underlying table is the same `scanner_magic_link_tokens` (kept for
// continuity — no destructive migration), repurposed to store
// hash(code | email) rows instead of hash(URL token) rows. The schema
// fits both shapes verbatim.
//
// Posture:
//   - Code is 6 digits (000000-999999, 1M space). Brute-force guarded by
//     per-IP rate limit (10 attempts / 10 min) → max 60/hr → ~6 weeks
//     of pure brute force per IP per code TTL window. Acceptable for a
//     single-operator internal tool.
//   - Hash is sha256(code).update(email) — binds the code to the email
//     so a stolen DB row can't be replayed against a different operator.
//   - One-shot consume — atomic UPDATE WHERE consumed_at IS NULL guards
//     against double-submit / replay.
//   - 10-minute TTL per OWASP OTP guidance.
//
// Invariant for callers: the raw code leaves this module exactly twice —
// in the email body and in the form input — and never persists.

import { createHash } from 'node:crypto'
import { prisma } from './db'

const CODE_DIGITS = 6
const DEFAULT_TTL_MINUTES = 10

export const EMAIL_OTP_DEFAULT_TTL_MINUTES = DEFAULT_TTL_MINUTES
export const EMAIL_OTP_CODE_DIGITS = CODE_DIGITS

/**
 * Generate a 6-digit numeric code as a zero-padded string. Uses
 * crypto.randomInt under the hood (cryptographically random, uniform
 * over [0, 1_000_000)).
 */
export function generateCode(): string {
  // Avoid Math.random — its distribution is not cryptographically
  // safe. Use rejection-sampling against randomBytes instead.
  // We pull 4 bytes (32 bits, range 0..2^32-1) and reject any value
  // ≥ floor(2^32 / 1_000_000) * 1_000_000 to keep the distribution
  // uniform over [0, 1_000_000).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomBytes } = require('node:crypto') as typeof import('node:crypto')
  const limit = Math.floor(0xffffffff / 1_000_000) * 1_000_000
  while (true) {
    const buf = randomBytes(4)
    const value = buf.readUInt32BE(0)
    if (value < limit) {
      return String(value % 1_000_000).padStart(CODE_DIGITS, '0')
    }
  }
}

/**
 * Hash the code, salted with the email. Binds code-rows to a specific
 * email so a stolen DB row can't be replayed by an attacker who knows
 * the code but submits a different email.
 */
export function hashCodeWithEmail(code: string, email: string): Buffer {
  return createHash('sha256')
    .update(code, 'utf8')
    .update(':', 'utf8')
    .update(email.toLowerCase().trim(), 'utf8')
    .digest()
}

export interface CreateEmailOtpArgs {
  email: string
  ttlMinutes?: number
}

export interface EmailOtpRecord {
  rawCode: string
  expiresAt: Date
}

/**
 * Generate + persist an email-OTP code. Returns the raw code + expiry.
 * Caller is responsible for emailing the raw code; never log it.
 */
export async function createEmailOtp(
  args: CreateEmailOtpArgs,
): Promise<EmailOtpRecord> {
  const rawCode = generateCode()
  const tokenHash = hashCodeWithEmail(rawCode, args.email)
  const ttlMinutes = args.ttlMinutes ?? DEFAULT_TTL_MINUTES
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000)
  await prisma.magicLinkToken.create({
    data: {
      tokenHash,
      email: args.email.toLowerCase().trim(),
      expiresAt,
    },
  })
  return { rawCode, expiresAt }
}

export type VerifyOtpReason = 'unknown' | 'consumed' | 'expired'

export interface VerifyOtpOk {
  ok: true
  email: string
}
export interface VerifyOtpFail {
  ok: false
  reason: VerifyOtpReason
}
export type VerifyOtpResult = VerifyOtpOk | VerifyOtpFail

export interface VerifyAndConsumeOtpArgs {
  email: string
  code: string
}

/**
 * Atomically verify + consume an email-OTP code. Returns the email on
 * success. The atomic claim wins any double-submit race — only one
 * caller sees count===1.
 */
export async function verifyAndConsumeOtp(
  args: VerifyAndConsumeOtpArgs,
): Promise<VerifyOtpResult> {
  if (!args.email || !args.code) return { ok: false, reason: 'unknown' }
  // Defensive shape check — only digit codes of the configured length
  // can ever match a row, so reject other shapes outright (saves a DB
  // round-trip for malformed input).
  if (!/^\d+$/.test(args.code)) return { ok: false, reason: 'unknown' }
  if (args.code.length !== CODE_DIGITS) return { ok: false, reason: 'unknown' }

  const tokenHash = hashCodeWithEmail(args.code, args.email)
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
