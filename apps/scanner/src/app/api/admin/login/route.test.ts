import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  hashPassword,
  verifySession,
} from '@/lib/admin-auth'
import { __resetRateLimitState } from '@/lib/rate-limit'
import { POST } from './route'

// Captured during beforeAll so each test pays the scrypt cost once.
const PASSWORD = 'correct horse battery staple'
const SECRET = 's'.repeat(48)
const ADMIN_EMAIL = 'info@eazyaccess.org'
let passwordHash: string

const URL = 'http://localhost/api/admin/login'

function jsonRequest(
  body: unknown,
  extraHeaders: Record<string, string> = {},
): NextRequest {
  return new NextRequest(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  })
}

function formRequest(fields: Record<string, string>): NextRequest {
  const form = new URLSearchParams(fields)
  return new NextRequest(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
}

function setEnv(overrides: Partial<NodeJS.ProcessEnv>) {
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) {
      delete process.env[k]
    } else {
      process.env[k] = v
    }
  }
}

const ENV_KEYS = [
  'ADMIN_EMAIL',
  'ADMIN_LOGIN_PASSWORD_HASH',
  'ADMIN_SESSION_SECRET',
] as const
const ORIGINAL_ENV: Record<string, string | undefined> = {}

describe('POST /api/admin/login', () => {
  beforeAll(async () => {
    passwordHash = await hashPassword(PASSWORD)
    for (const k of ENV_KEYS) ORIGINAL_ENV[k] = process.env[k]
  })

  beforeEach(() => {
    __resetRateLimitState()
    // Default to a fully-configured environment; individual tests
    // override or unset specific keys.
    setEnv({
      ADMIN_EMAIL,
      ADMIN_LOGIN_PASSWORD_HASH: passwordHash,
      ADMIN_SESSION_SECRET: SECRET,
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    setEnv(ORIGINAL_ENV)
    vi.restoreAllMocks()
  })

  it('303s back to /admin/login?error=server when env is missing', async () => {
    setEnv({ ADMIN_LOGIN_PASSWORD_HASH: undefined })

    const res = await POST(jsonRequest({ password: PASSWORD }))

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'http://localhost/admin/login?error=server',
    )
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('303s back with error=invalid on wrong password', async () => {
    const res = await POST(jsonRequest({ password: 'wrong-password' }))

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'http://localhost/admin/login?error=invalid',
    )
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('303s back with error=invalid on missing password field', async () => {
    const res = await POST(jsonRequest({}))

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'http://localhost/admin/login?error=invalid',
    )
  })

  it('issues a session cookie + redirects to /admin/audit-draft on form-encoded success', async () => {
    const res = await POST(formRequest({ password: PASSWORD }))

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'http://localhost/admin/audit-draft',
    )

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).not.toBeNull()
    expect(setCookie).toContain(`${ADMIN_COOKIE_NAME}=`)
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Strict')
    expect(setCookie).toContain('Path=/')

    // Cookie value must be a valid signed session for ADMIN_EMAIL.
    const value = setCookie!.split(';')[0]!.split('=')[1]!
    const payload = verifySession(value, SECRET)
    expect(payload).not.toBeNull()
    expect(payload!.email).toBe(ADMIN_EMAIL)
  })

  it('accepts application/json bodies and issues a session', async () => {
    const res = await POST(jsonRequest({ password: PASSWORD }))

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'http://localhost/admin/audit-draft',
    )
    expect(res.headers.get('set-cookie')).toContain(`${ADMIN_COOKIE_NAME}=`)
  })

  it('303s with error=bad-request on malformed JSON', async () => {
    const req = new NextRequest(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    })

    const res = await POST(req)

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'http://localhost/admin/login?error=bad-request',
    )
  })

  it('rate-limits after 10 attempts from the same IP', async () => {
    const ip = '198.51.100.42'

    // Burn the bucket. Each wrong-password attempt consumes one token;
    // the 11th must be rate-limited before the password is even checked.
    for (let i = 0; i < 10; i += 1) {
      const res = await POST(
        jsonRequest({ password: 'wrong' }, { 'x-forwarded-for': ip }),
      )
      expect(res.headers.get('location')).toBe(
        'http://localhost/admin/login?error=invalid',
      )
    }

    const blocked = await POST(
      jsonRequest({ password: PASSWORD }, { 'x-forwarded-for': ip }),
    )

    expect(blocked.status).toBe(303)
    expect(blocked.headers.get('location')).toBe(
      'http://localhost/admin/login?error=rate-limited',
    )
    // Importantly: even though the password is correct, no cookie is
    // issued — the rate-limit gate fires before password verification.
    expect(blocked.headers.get('set-cookie')).toBeNull()
  })

  it('rate-limit is per-IP — a different IP still has tokens', async () => {
    const burnIp = '198.51.100.10'
    for (let i = 0; i < 10; i += 1) {
      await POST(
        jsonRequest({ password: 'wrong' }, { 'x-forwarded-for': burnIp }),
      )
    }

    const freshIp = '198.51.100.99'
    const res = await POST(
      jsonRequest({ password: PASSWORD }, { 'x-forwarded-for': freshIp }),
    )

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'http://localhost/admin/audit-draft',
    )
  })
})
