import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const verifyAndConsume = vi.fn()
vi.mock('@/lib/magic-link', () => ({
  verifyAndConsume: (...a: unknown[]) =>
    (verifyAndConsume as unknown as (...x: unknown[]) => unknown)(...a),
}))

import { GET } from './route'
import { ADMIN_COOKIE_NAME, verifySession } from '@/lib/admin-auth'

const ADMIN_EMAIL = 'info@eazyaccess.org'
const SECRET = 's'.repeat(48)
const ENV_KEYS = [
  'ADMIN_EMAIL',
  'ADMIN_SESSION_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const
const ORIGINAL_ENV: Record<string, string | undefined> = {}

function getRequest(token = ''): NextRequest {
  const url = `http://localhost/api/admin/magic-link/verify${token ? `?token=${encodeURIComponent(token)}` : ''}`
  return new NextRequest(url, { method: 'GET' })
}

beforeEach(() => {
  for (const k of ENV_KEYS) ORIGINAL_ENV[k] = process.env[k]
  process.env.ADMIN_EMAIL = ADMIN_EMAIL
  process.env.ADMIN_SESSION_SECRET = SECRET
  process.env.NEXT_PUBLIC_APP_URL = 'https://audit.flintmere.com'
  verifyAndConsume.mockReset()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (ORIGINAL_ENV[k] === undefined) delete process.env[k]
    else process.env[k] = ORIGINAL_ENV[k]
  }
})

describe('GET /api/admin/magic-link/verify', () => {
  it('issues session cookie + redirects to /admin/audit-draft on success', async () => {
    verifyAndConsume.mockResolvedValueOnce({ ok: true, email: ADMIN_EMAIL })
    const res = await GET(getRequest('valid-token'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(
      'https://audit.flintmere.com/admin/audit-draft',
    )
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain(`${ADMIN_COOKIE_NAME}=`)
    // Cookie attrs sanity:
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Strict')
    // Cookie payload verifies under the same secret:
    const value = setCookie.split(';')[0]!.split('=')[1]!
    const payload = verifySession(value, SECRET)
    expect(payload?.email).toBe(ADMIN_EMAIL)
  })

  it('redirects to error=invalid-link on unknown token', async () => {
    verifyAndConsume.mockResolvedValueOnce({ ok: false, reason: 'unknown' })
    const res = await GET(getRequest('junk'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=invalid-link')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('redirects to error=invalid-link on consumed token', async () => {
    verifyAndConsume.mockResolvedValueOnce({ ok: false, reason: 'consumed' })
    const res = await GET(getRequest('replay'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=invalid-link')
  })

  it('redirects to error=invalid-link on expired token', async () => {
    verifyAndConsume.mockResolvedValueOnce({ ok: false, reason: 'expired' })
    const res = await GET(getRequest('stale'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=invalid-link')
  })

  it('rejects when consumed email no longer matches allowlist', async () => {
    verifyAndConsume.mockResolvedValueOnce({
      ok: true,
      email: 'old-allowlist@example.com',
    })
    const res = await GET(getRequest('drift'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=invalid-link')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('redirects to error=server when env is misconfigured', async () => {
    delete process.env.ADMIN_SESSION_SECRET
    const res = await GET(getRequest('any'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=server')
    expect(verifyAndConsume).not.toHaveBeenCalled()
  })

  it('redirects to error=invalid-link on empty token', async () => {
    verifyAndConsume.mockResolvedValueOnce({ ok: false, reason: 'unknown' })
    const res = await GET(getRequest(''))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('error=invalid-link')
  })
})
