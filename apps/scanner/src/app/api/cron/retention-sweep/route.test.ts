import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const runSweep = vi.fn()

vi.mock('@/lib/retention-sweep', () => ({
  runRetentionSweep: (...args: unknown[]) => runSweep(...args),
}))

describe('POST /api/cron/retention-sweep', () => {
  let original: string | undefined

  beforeEach(() => {
    runSweep.mockReset()
    original = process.env.CRON_SECRET
    process.env.CRON_SECRET = 'a'.repeat(40)
  })

  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  async function postWithHeader(headerValue: string | null) {
    vi.resetModules()
    vi.doMock('next/headers', () => ({
      headers: async () => ({
        get: (k: string) =>
          k.toLowerCase() === 'x-cron-secret' ? headerValue : null,
      }),
    }))
    const mod = await import('./route')
    return mod.POST()
  }

  it('returns 403 when X-Cron-Secret is missing', async () => {
    const res = await postWithHeader(null)
    expect(res.status).toBe(403)
    expect(runSweep).not.toHaveBeenCalled()
  })

  it('returns 403 when X-Cron-Secret mismatches', async () => {
    const res = await postWithHeader('b'.repeat(40))
    expect(res.status).toBe(403)
    expect(runSweep).not.toHaveBeenCalled()
  })

  it('returns 200 + counts on successful sweep', async () => {
    runSweep.mockResolvedValueOnce({
      unsubscribedLeadsDeleted: 1,
      expiredScanLeadsDeleted: 2,
      expiredScansDeleted: 3,
      expiredStripeEventsDeleted: 4,
    })
    const res = await postWithHeader('a'.repeat(40))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      event: 'retention-sweep',
      unsubscribedLeadsDeleted: 1,
      expiredScansDeleted: 3,
    })
  })

  it('returns generic error on sweep failure (no err.message leak)', async () => {
    runSweep.mockRejectedValueOnce(new Error('connection refused at 10.0.0.5:5432'))
    const res = await postWithHeader('a'.repeat(40))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({
      event: 'retention-sweep-failed',
      code: 'internal-error',
    })
    expect(JSON.stringify(body)).not.toContain('10.0.0.5')
  })
})
