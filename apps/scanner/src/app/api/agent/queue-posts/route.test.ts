import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const queuePostsMock = vi.fn()

const VALID_POST = {
  body: 'GTIN coverage is the first thing Google checks. We measured 312 UK food stores.',
  utmCampaign: 'gtin-coverage',
  scheduledAt: '2026-06-11T10:00:00Z',
}

describe('POST /api/agent/queue-posts', () => {
  let original: string | undefined

  beforeEach(() => {
    queuePostsMock.mockReset()
    original = process.env.CRON_SECRET
    process.env.CRON_SECRET = 'a'.repeat(40)
  })

  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  async function post(headerValue: string | null, body: string) {
    vi.resetModules()
    vi.doMock('next/headers', () => ({
      headers: async () => ({
        get: (k: string) =>
          k.toLowerCase() === 'x-cron-secret' ? headerValue : null,
      }),
    }))
    vi.doMock('@/lib/social/queue-posts', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@/lib/social/queue-posts')>()),
      queuePosts: (...args: unknown[]) => queuePostsMock(...args),
    }))
    const mod = await import('./route')
    return mod.POST(
      new Request('http://localhost/api/agent/queue-posts', {
        method: 'POST',
        body,
      }),
    )
  }

  it('returns 403 when X-Cron-Secret is missing', async () => {
    const res = await post(null, JSON.stringify([VALID_POST]))
    expect(res.status).toBe(403)
    expect(queuePostsMock).not.toHaveBeenCalled()
  })

  it('returns 400 on malformed JSON', async () => {
    const res = await post('a'.repeat(40), 'not json')
    expect(res.status).toBe(400)
    expect(queuePostsMock).not.toHaveBeenCalled()
  })

  it('returns 422 with issue detail on a banned phrase', async () => {
    const res = await post(
      'a'.repeat(40),
      JSON.stringify([{ ...VALID_POST, body: 'Leverage your catalog' }]),
    )
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('validation')
    expect(String(body.issues)).toContain('banned phrase "leverage"')
    expect(queuePostsMock).not.toHaveBeenCalled()
  })

  it('returns 200 + queued count on valid posts', async () => {
    queuePostsMock.mockResolvedValueOnce(2)
    const res = await post(
      'a'.repeat(40),
      JSON.stringify([VALID_POST, { ...VALID_POST, scheduledAt: '2026-06-13T10:00:00Z' }]),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ event: 'agent-queue-posts', queued: 2 })
    expect(queuePostsMock).toHaveBeenCalledOnce()
  })

  it('returns 500 when the insert fails', async () => {
    queuePostsMock.mockRejectedValueOnce(new Error('db down'))
    const res = await post('a'.repeat(40), JSON.stringify([VALID_POST]))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toMatchObject({ event: 'agent-queue-posts-failed', code: 'internal-error' })
  })
})
