import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { __resetRateLimitState } from '@/lib/rate-limit'

const createMagicLink = vi.fn(async () => ({
  rawToken: 'raw-token-fixture',
  expiresAt: new Date(Date.now() + 10 * 60_000),
}))
vi.mock('@/lib/magic-link', () => ({
  MAGIC_LINK_DEFAULT_TTL_MINUTES: 10,
  createMagicLink: (...a: unknown[]) =>
    (createMagicLink as unknown as (...x: unknown[]) => unknown)(...a),
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
  return new NextRequest('http://localhost/api/admin/magic-link/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function formRequest(email: string, headers: Record<string, string> = {}): NextRequest {
  const body = new URLSearchParams()
  body.set('email', email)
  return new NextRequest('http://localhost/api/admin/magic-link/request', {
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
  createMagicLink.mockClear()
  sendEmail.mockClear()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL_ENV[k] === undefined) delete process.env[k]
    else process.env[k] = ORIGINAL_ENV[k]
  }
})

describe('POST /api/admin/magic-link/request', () => {
  it('issues a link + sends email when submitted email matches allowlist', async () => {
    const res = await POST(jsonRequest({ email: ADMIN_EMAIL }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?check=email',
    )
    expect(createMagicLink).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const sendArg = sendEmail.mock.calls[0]![0] as {
      to: string
      subject: string
      html: string
      text: string
    }
    expect(sendArg.to).toBe(ADMIN_EMAIL)
    expect(sendArg.subject).toBe('Sign in — Flintmere')
    expect(sendArg.html).toContain('raw-token-fixture')
    expect(sendArg.text).toContain('raw-token-fixture')
  })

  it('accepts uppercase / whitespace input and matches case-insensitively', async () => {
    const res = await POST(jsonRequest({ email: '  Info@EazyAccess.ORG ' }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('check=email')
    expect(createMagicLink).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('does NOT issue link OR email for non-allowlisted address; same response', async () => {
    const res = await POST(jsonRequest({ email: 'attacker@evil.com' }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/login?check=email',
    )
    expect(createMagicLink).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('handles application/x-www-form-urlencoded too', async () => {
    const res = await POST(formRequest(ADMIN_EMAIL))
    expect(res.status).toBe(303)
    expect(createMagicLink).toHaveBeenCalledTimes(1)
  })

  it('redirects to error=server when ADMIN_EMAIL is unset', async () => {
    delete process.env.ADMIN_EMAIL
    const res = await POST(jsonRequest({ email: ADMIN_EMAIL }))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=server')
    expect(createMagicLink).not.toHaveBeenCalled()
  })

  it('redirects to error=rate-limited after burst exceeds policy', async () => {
    // Default policy: 10 per 10 minutes.
    let lastStatus = 0
    let lastLocation = ''
    for (let i = 0; i < 11; i++) {
      const res = await POST(
        jsonRequest({ email: ADMIN_EMAIL }, { 'x-forwarded-for': '1.2.3.4' }),
      )
      lastStatus = res.status
      lastLocation = res.headers.get('location') ?? ''
    }
    expect(lastStatus).toBe(303)
    expect(lastLocation).toContain('error=rate-limited')
  })

  it('redirects to error=bad-request on malformed JSON', async () => {
    const req = new NextRequest(
      'http://localhost/api/admin/magic-link/request',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{broken',
      },
    )
    const res = await POST(req)
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=bad-request')
  })
})
