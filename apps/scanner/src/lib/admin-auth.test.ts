import { describe, expect, it } from 'vitest'
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_VERSION,
  buildCookieAttributes,
  computeSmokeToken,
  issueSession,
  requireAdmin,
  signSession,
  verifyAdminSmokeToken,
  verifySession,
  type SessionPayload,
} from './admin-auth'

const SECRET = 'a'.repeat(48)

function fixedPayload(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    email: 'info@eazyaccess.org',
    exp: Date.now() + 60_000,
    v: ADMIN_SESSION_VERSION,
    ...overrides,
  }
}

// Build a Next-shaped cookie store stand-in so requireAdmin tests can
// run without `next/headers`.
function buildCookieStub(value?: string) {
  return async () => ({
    get: (name: string) =>
      name === ADMIN_COOKIE_NAME && value !== undefined
        ? { name, value }
        : undefined,
  })
}

// Tamper by flipping the FIRST character, never the last.
//
// Both assertions below used to do `slice(0, -1) + 'A'`, which reds CI on
// 6.29% of runs — about 1 in 16, measured over 20,000 signings. The obvious
// reading is "appending 'A' is a no-op when the value already ends in 'A'",
// and that is true, but it is not the whole defect.
//
// The real reason is that the LAST character of a base64url HMAC carries
// almost no information. HMAC-SHA256 is 32 bytes = 256 bits, which encodes
// as 43 base64url characters = 258 bits. The final character therefore holds
// only 4 significant bits; its low 2 bits are padding that the decoder
// discards. So ANY edit confined to that character can leave the decoded
// bytes identical — the string differs, the HMAC does not, and
// verifySession correctly returns a session.
//
// That is a trap: replacing 'A' with 'B' there (index 0 -> index 1) changes
// only a discarded bit and fails in precisely the same 1-in-16 case. The
// first character has all 6 bits significant, so flipping it always changes
// the decoded bytes.
//
// Measured on the old code: the HMAC's last character takes 16 distinct
// values and is 'A' 6.29% of the time. The payload's last character takes
// exactly ONE value across 20,000 signings and is never 'A' — so the payload
// assertion never actually failed. It was latently wrong, and would have
// started failing the day the payload's length changed.
//
// Same family as the OTP entropy check fixed in #128 (04ca7b4): an assertion
// whose input is only usually what it claims to be.
function tamperFirstChar(value: string): string {
  return (value.startsWith('A') ? 'B' : 'A') + value.slice(1)
}

describe('signSession + verifySession', () => {
  it('round-trips a payload', () => {
    const payload = fixedPayload()
    const cookie = signSession(payload, SECRET)
    const verified = verifySession(cookie, SECRET)
    expect(verified).toEqual(payload)
  })

  it('rejects a tampered payload', () => {
    const cookie = signSession(fixedPayload(), SECRET)
    const [payloadB64, hmac] = cookie.split('.')
    // Flip one char of the payload — HMAC should no longer match.
    const tampered = `${tamperFirstChar(payloadB64!)}.${hmac}`
    expect(tampered).not.toBe(cookie)
    expect(verifySession(tampered, SECRET)).toBeNull()
  })

  it('rejects a tampered HMAC', () => {
    const cookie = signSession(fixedPayload(), SECRET)
    const [payload, hmac] = cookie.split('.')
    const tampered = `${payload}.${tamperFirstChar(hmac!)}`
    expect(tampered).not.toBe(cookie)
    expect(verifySession(tampered, SECRET)).toBeNull()
  })

  it('rejects a cookie signed with a different secret', () => {
    const cookie = signSession(fixedPayload(), SECRET)
    expect(verifySession(cookie, 'b'.repeat(48))).toBeNull()
  })

  it('rejects an expired cookie', () => {
    const cookie = signSession(fixedPayload({ exp: Date.now() - 1 }), SECRET)
    expect(verifySession(cookie, SECRET)).toBeNull()
  })

  it('rejects an unknown session version', () => {
    const cookie = signSession(fixedPayload({ v: 999 }), SECRET)
    expect(verifySession(cookie, SECRET)).toBeNull()
  })

  it('rejects malformed cookies', () => {
    expect(verifySession('', SECRET)).toBeNull()
    expect(verifySession('no-dot-separator', SECRET)).toBeNull()
    expect(verifySession('a.b.c', SECRET)).toBeNull()
    expect(verifySession('!!!.!!!', SECRET)).toBeNull()
  })

  it('throws when the secret is too short (config error, fail-loud)', () => {
    expect(() => signSession(fixedPayload(), 'short')).toThrow(/32 characters/)
  })
})

describe('issueSession', () => {
  it('issues a session that verifies for the given email', () => {
    const cookie = issueSession('info@eazyaccess.org', SECRET, 60)
    const verified = verifySession(cookie, SECRET)
    expect(verified?.email).toBe('info@eazyaccess.org')
    expect(verified?.v).toBe(ADMIN_SESSION_VERSION)
  })

  it('honours the ttlSeconds parameter', () => {
    const before = Date.now()
    const cookie = issueSession('info@eazyaccess.org', SECRET, 600)
    const verified = verifySession(cookie, SECRET)!
    expect(verified.exp).toBeGreaterThanOrEqual(before + 600 * 1000 - 100)
    expect(verified.exp).toBeLessThanOrEqual(before + 600 * 1000 + 100)
  })
})

describe('buildCookieAttributes', () => {
  it('emits the canonical attribute string', () => {
    const attrs = buildCookieAttributes(60)
    expect(attrs).toContain('Path=/')
    expect(attrs).toContain('Max-Age=60')
    expect(attrs).toContain('HttpOnly')
    expect(attrs).toContain('SameSite=Strict')
  })

  it('omits Secure outside production', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'
    expect(buildCookieAttributes()).not.toContain('Secure')
    process.env.NODE_ENV = original
  })
})

describe('requireAdmin', () => {
  const env = {
    ADMIN_SESSION_SECRET: SECRET,
    ADMIN_EMAIL: 'info@eazyaccess.org',
  }

  it('returns the email on a valid cookie', async () => {
    const cookie = issueSession('info@eazyaccess.org', SECRET, 600)
    const result = await requireAdmin(buildCookieStub(cookie), env)
    expect(result).toEqual({ email: 'info@eazyaccess.org' })
  })

  it('returns null when no cookie is present', async () => {
    const result = await requireAdmin(buildCookieStub(undefined), env)
    expect(result).toBeNull()
  })

  it('returns null when the cookie is tampered', async () => {
    const cookie = issueSession('info@eazyaccess.org', SECRET, 600)
    // Tamper the first char of the payload (full 6 bits, no base64
    // padding ambiguity — flipping it always changes the decoded
    // bytes, so the HMAC mismatch is deterministic).
    const replacement = cookie[0] === 'X' ? 'Y' : 'X'
    const tampered = replacement + cookie.slice(1)
    const result = await requireAdmin(buildCookieStub(tampered), env)
    expect(result).toBeNull()
  })

  it('returns null when the cookie email does not match ADMIN_EMAIL', async () => {
    const cookie = issueSession('intruder@example.com', SECRET, 600)
    const result = await requireAdmin(buildCookieStub(cookie), env)
    expect(result).toBeNull()
  })

  it('email match is case-insensitive', async () => {
    const cookie = issueSession('INFO@EAZYACCESS.ORG', SECRET, 600)
    const result = await requireAdmin(buildCookieStub(cookie), env)
    expect(result?.email).toBe('INFO@EAZYACCESS.ORG')
  })

  it('returns null when ADMIN_SESSION_SECRET is unset', async () => {
    const cookie = issueSession('info@eazyaccess.org', SECRET, 600)
    const result = await requireAdmin(buildCookieStub(cookie), {
      ADMIN_EMAIL: 'info@eazyaccess.org',
    })
    expect(result).toBeNull()
  })

  it('returns null when ADMIN_EMAIL is unset', async () => {
    const cookie = issueSession('info@eazyaccess.org', SECRET, 600)
    const result = await requireAdmin(buildCookieStub(cookie), {
      ADMIN_SESSION_SECRET: SECRET,
    })
    expect(result).toBeNull()
  })

  it('returns null on an expired cookie', async () => {
    // Issue with past expiry.
    const expired = signSession(
      { email: 'info@eazyaccess.org', exp: Date.now() - 1, v: ADMIN_SESSION_VERSION },
      SECRET,
    )
    const result = await requireAdmin(buildCookieStub(expired), env)
    expect(result).toBeNull()
  })
})

describe('computeSmokeToken + verifyAdminSmokeToken', () => {
  const env = {
    ADMIN_SESSION_SECRET: SECRET,
    ADMIN_EMAIL: 'info@eazyaccess.org',
  }

  function headersWith(token: string | null): Headers {
    const h = new Headers()
    if (token !== null) h.set('x-admin-smoke-token', token)
    return h
  }

  // Pinned clock so bucket arithmetic is deterministic. Bucket =
  // floor(now / 3_600_000). Pick a `now` that's mid-bucket so neither
  // current nor previous is on a boundary.
  const NOW = 1_715_270_400_000 // 2024-05-09 18:00:00 UTC + offset → mid-hour
  const HOUR_MS = 60 * 60 * 1000

  it('round-trips: token from computeSmokeToken verifies under same secret', () => {
    const token = computeSmokeToken(SECRET, NOW)
    expect(token).toMatch(/^[0-9a-f]{64}$/) // hex-encoded sha256
    const result = verifyAdminSmokeToken(headersWith(token), env, NOW)
    expect(result).toEqual({ email: 'info@eazyaccess.org' })
  })

  it('accepts a token from the previous hour-bucket (rollover headroom)', () => {
    const previous = computeSmokeToken(SECRET, NOW - HOUR_MS)
    const result = verifyAdminSmokeToken(headersWith(previous), env, NOW)
    expect(result).toEqual({ email: 'info@eazyaccess.org' })
  })

  it('rejects a token older than the previous bucket', () => {
    const stale = computeSmokeToken(SECRET, NOW - 2 * HOUR_MS)
    expect(verifyAdminSmokeToken(headersWith(stale), env, NOW)).toBeNull()
  })

  it('rejects a token from a future hour-bucket', () => {
    const future = computeSmokeToken(SECRET, NOW + 2 * HOUR_MS)
    expect(verifyAdminSmokeToken(headersWith(future), env, NOW)).toBeNull()
  })

  it('returns null when header missing', () => {
    expect(verifyAdminSmokeToken(headersWith(null), env, NOW)).toBeNull()
  })

  it('returns null when token signed under a different secret', () => {
    const wrong = computeSmokeToken('b'.repeat(48), NOW)
    expect(verifyAdminSmokeToken(headersWith(wrong), env, NOW)).toBeNull()
  })

  it('returns null when token is gibberish', () => {
    expect(verifyAdminSmokeToken(headersWith('not-hex'), env, NOW)).toBeNull()
    expect(verifyAdminSmokeToken(headersWith(''), env, NOW)).toBeNull()
  })

  it('returns null when ADMIN_SESSION_SECRET is unset', () => {
    const token = computeSmokeToken(SECRET, NOW)
    expect(
      verifyAdminSmokeToken(
        headersWith(token),
        { ADMIN_EMAIL: 'info@eazyaccess.org' },
        NOW,
      ),
    ).toBeNull()
  })

  it('returns null when ADMIN_EMAIL is unset', () => {
    const token = computeSmokeToken(SECRET, NOW)
    expect(
      verifyAdminSmokeToken(
        headersWith(token),
        { ADMIN_SESSION_SECRET: SECRET },
        NOW,
      ),
    ).toBeNull()
  })

  it('throws on a too-short secret at compute time (config error)', () => {
    expect(() => computeSmokeToken('short', NOW)).toThrow(/32 characters/)
  })
})

