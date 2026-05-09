import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { __resetRateLimitState } from '@/lib/rate-limit'

const verifyAndConsumeOtp = vi.fn(
  async (_args: { email: string; code: string }) => ({
    ok: true as const,
    email: 'info@eazyaccess.org',
  }),
)
vi.mock('@/lib/email-otp', () => ({
  verifyAndConsumeOtp: (...a: unknown[]) =>
    (verifyAndConsumeOtp as unknown as (...x: unknown[]) => unknown)(...a),
}))

import { POST } from './route'

const SECRET = 'a'.repeat(48)
const ADMIN_EMAIL = 'info@eazyaccess.org'
const ENV_KEYS = [
  'ADMIN_SESSION_SECRET',
  'ADMIN_EMAIL',
  'NEXT_PUBLIC_APP_URL',
] as const
const ORIGINAL_ENV: Record<string, string | undefined> = {}

function jsonRequest(
  body: unknown,
  cookieValue: string | null,
  headers: Record<string, string> = {},
): NextRequest {
  const reqHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...headers,
  }
  if (cookieValue !== null) {
    reqHeaders.cookie = `flintmere_admin_pending_email=${encodeURIComponent(cookieValue)}`
  }
  return new NextRequest('http://localhost/api/admin/email-code/verify', {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  __resetRateLimitState()
  for (const k of ENV_KEYS) ORIGINAL_ENV[k] = process.env[k]
  process.env.ADMIN_SESSION_SECRET = SECRET
  process.env.ADMIN_EMAIL = ADMIN_EMAIL
  process.env.NEXT_PUBLIC_APP_URL = 'https://audit.flintmere.com'
  verifyAndConsumeOtp.mockReset()
  verifyAndConsumeOtp.mockResolvedValue({
    ok: true,
    email: ADMIN_EMAIL,
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL_ENV[k] === undefined) delete process.env[k]
    else process.env[k] = ORIGINAL_ENV[k]
  }
  vi.restoreAllMocks()
})

describe('POST /api/admin/email-code/verify', () => {
  it('issues session cookie + clears pending cookie + 303 to /admin/audit-draft on success', async () => {
    const res = await POST(jsonRequest({ code: '123456' }, ADMIN_EMAIL))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/audit-draft',
    )
    expect(verifyAndConsumeOtp).toHaveBeenCalledWith({
      email: ADMIN_EMAIL,
      code: '123456',
    })
    const setCookies = res.headers
      .getSetCookie()
      .map((c) => c.split(';')[0]!)
    expect(setCookies.some((c) => c.startsWith('flintmere_admin='))).toBe(
      true,
    )
    // Pending-email cookie cleared (Max-Age=0).
    const allHeaders = res.headers.getSetCookie().join('\n')
    expect(allHeaders).toMatch(/flintmere_admin_pending_email=;.*Max-Age=0/)
  })

  it('strips whitespace from a copy-pasted code', async () => {
    const res = await POST(jsonRequest({ code: '  123 456  ' }, ADMIN_EMAIL))
    expect(res.status).toBe(303)
    expect(verifyAndConsumeOtp).toHaveBeenCalledWith({
      email: ADMIN_EMAIL,
      code: '123456',
    })
  })

  it('303 to ?error=session-expired when pending-email cookie missing', async () => {
    const res = await POST(jsonRequest({ code: '123456' }, null))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?error=session-expired',
    )
    expect(verifyAndConsumeOtp).not.toHaveBeenCalled()
  })

  it('303 to ?step=code&error=invalid on wrong code', async () => {
    verifyAndConsumeOtp.mockResolvedValueOnce({
      ok: false,
      reason: 'unknown',
    })
    const res = await POST(jsonRequest({ code: '999999' }, ADMIN_EMAIL))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?step=code&error=invalid',
    )
  })

  it('303 to ?step=code&error=invalid on consumed code', async () => {
    verifyAndConsumeOtp.mockResolvedValueOnce({
      ok: false,
      reason: 'consumed',
    })
    const res = await POST(jsonRequest({ code: '123456' }, ADMIN_EMAIL))
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?step=code&error=invalid',
    )
  })

  it('303 to ?step=code&error=invalid on expired code', async () => {
    verifyAndConsumeOtp.mockResolvedValueOnce({
      ok: false,
      reason: 'expired',
    })
    const res = await POST(jsonRequest({ code: '123456' }, ADMIN_EMAIL))
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?step=code&error=invalid',
    )
  })

  it('303 to ?error=session-expired when verified email no longer matches allowlist', async () => {
    // Allowlist drift: cookie has an old email, server has rotated.
    process.env.ADMIN_EMAIL = 'someone-else@example.com'
    verifyAndConsumeOtp.mockResolvedValueOnce({
      ok: true,
      email: ADMIN_EMAIL, // old email — doesn't match the new allowlist
    })
    const res = await POST(jsonRequest({ code: '123456' }, ADMIN_EMAIL))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?error=session-expired',
    )
  })

  it('303 to ?error=server when ADMIN_SESSION_SECRET unset', async () => {
    delete process.env.ADMIN_SESSION_SECRET
    const res = await POST(jsonRequest({ code: '123456' }, ADMIN_EMAIL))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?error=server',
    )
  })

  it('303 to ?error=server when ADMIN_EMAIL unset', async () => {
    delete process.env.ADMIN_EMAIL
    const res = await POST(jsonRequest({ code: '123456' }, 'a@b.com'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?error=server',
    )
  })

  it('303 to ?step=code&error=rate-limited after exceeding bucket', async () => {
    const headers = { 'x-forwarded-for': '198.51.100.99' }
    for (let i = 0; i < 10; i++) {
      await POST(jsonRequest({ code: '999999' }, ADMIN_EMAIL, headers))
    }
    const res = await POST(jsonRequest({ code: '123456' }, ADMIN_EMAIL, headers))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?step=code&error=rate-limited',
    )
  })
})
