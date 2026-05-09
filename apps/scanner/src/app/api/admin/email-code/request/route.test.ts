import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { __resetRateLimitState } from '@/lib/rate-limit'

const createEmailOtp = vi.fn(async () => ({
  rawCode: '123456',
  expiresAt: new Date(Date.now() + 10 * 60_000),
}))
vi.mock('@/lib/email-otp', () => ({
  EMAIL_OTP_DEFAULT_TTL_MINUTES: 10,
  createEmailOtp: (...a: unknown[]) =>
    (createEmailOtp as unknown as (...x: unknown[]) => unknown)(...a),
}))

const sendEmail = vi.fn(async () => ({ id: 'sent-1', sent: true }))
vi.mock('@/lib/resend', () => ({
  sendEmail: (...a: unknown[]) =>
    (sendEmail as unknown as (...x: unknown[]) => unknown)(...a),
}))

import { POST } from './route'

const ADMIN_EMAIL = 'info@eazyaccess.org'
const ENV_KEYS = ['ADMIN_EMAIL', 'NEXT_PUBLIC_APP_URL'] as const
const ORIGINAL_ENV: Record<string, string | undefined> = {}

function jsonRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/admin/email-code/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function formRequest(email: string, headers: Record<string, string> = {}): NextRequest {
  const body = new URLSearchParams()
  body.set('email', email)
  return new NextRequest('http://localhost/api/admin/email-code/request', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: body.toString(),
  })
}

beforeEach(() => {
  __resetRateLimitState()
  for (const k of ENV_KEYS) ORIGINAL_ENV[k] = process.env[k]
  process.env.ADMIN_EMAIL = ADMIN_EMAIL
  process.env.NEXT_PUBLIC_APP_URL = 'https://audit.flintmere.com'
  createEmailOtp.mockClear()
  sendEmail.mockClear()
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

describe('POST /api/admin/email-code/request', () => {
  it('issues a code + sends email + sets pending-email cookie when allowlist matches', async () => {
    const res = await POST(jsonRequest({ email: ADMIN_EMAIL }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?step=code',
    )
    expect(createEmailOtp).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toMatch(/^flintmere_admin_pending_email=/)
    expect(setCookie).toMatch(/HttpOnly/)
    expect(setCookie).toMatch(/SameSite=Strict/)
    const sendArg = sendEmail.mock.calls[0]![0] as {
      to: string
      subject: string
      text: string
      html: string
    }
    expect(sendArg.to).toBe(ADMIN_EMAIL)
    expect(sendArg.subject).toContain('123456')
    expect(sendArg.text).toContain('123456')
    expect(sendArg.html).toContain('123456')
  })

  it('silently rejects non-allowlisted email (same redirect, no send, no cookie)', async () => {
    const res = await POST(jsonRequest({ email: 'attacker@example.com' }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?step=code',
    )
    expect(createEmailOtp).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('case-insensitive + whitespace-tolerant email match', async () => {
    const res = await POST(jsonRequest({ email: '  INFO@Eazyaccess.ORG  ' }))
    expect(res.status).toBe(303)
    expect(createEmailOtp).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('accepts a form-urlencoded body', async () => {
    const res = await POST(formRequest(ADMIN_EMAIL))
    expect(res.status).toBe(303)
    expect(createEmailOtp).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('303 to ?error=server when ADMIN_EMAIL unset', async () => {
    delete process.env.ADMIN_EMAIL
    const res = await POST(jsonRequest({ email: ADMIN_EMAIL }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?error=server',
    )
    expect(createEmailOtp).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('303 to ?error=rate-limited after exceeding the per-IP bucket', async () => {
    const headers = { 'x-forwarded-for': '198.51.100.7' }
    for (let i = 0; i < 10; i++) {
      await POST(jsonRequest({ email: ADMIN_EMAIL }, headers))
    }
    const res = await POST(jsonRequest({ email: ADMIN_EMAIL }, headers))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?error=rate-limited',
    )
  })
})
