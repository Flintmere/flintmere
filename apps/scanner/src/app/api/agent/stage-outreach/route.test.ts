import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const stageMock = vi.fn()

describe('POST /api/agent/stage-outreach', () => {
  let originalCron: string | undefined
  let originalAdmin: string | undefined

  beforeEach(() => {
    stageMock.mockReset()
    originalCron = process.env.AGENT_API_SECRET
    originalAdmin = process.env.ADMIN_SESSION_SECRET
    process.env.AGENT_API_SECRET = 'a'.repeat(40)
    process.env.ADMIN_SESSION_SECRET = 'b'.repeat(40)
  })

  afterEach(() => {
    if (originalCron === undefined) delete process.env.AGENT_API_SECRET
    else process.env.AGENT_API_SECRET = originalCron
    if (originalAdmin === undefined) delete process.env.ADMIN_SESSION_SECRET
    else process.env.ADMIN_SESSION_SECRET = originalAdmin
  })

  async function post(headerValue: string | null, body: string) {
    vi.resetModules()
    vi.doMock('next/headers', () => ({
      headers: async () => ({
        get: (k: string) =>
          k.toLowerCase() === 'x-agent-secret' ? headerValue : null,
      }),
    }))
    vi.doMock('@/lib/outreach/stage-batch', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@/lib/outreach/stage-batch')>()),
      stageOutreachBatch: (...args: unknown[]) => stageMock(...args),
    }))
    const mod = await import('./route')
    return mod.POST(
      new Request('http://localhost/api/agent/stage-outreach', {
        method: 'POST',
        body,
      }),
    )
  }

  it('returns 403 when X-Agent-Secret is missing', async () => {
    const res = await post(null, '{"limit":20}')
    expect(res.status).toBe(403)
    expect(stageMock).not.toHaveBeenCalled()
  })

  it('returns 422 on an out-of-range limit', async () => {
    const res = await post('a'.repeat(40), '{"limit":31}')
    expect(res.status).toBe(422)
    expect(stageMock).not.toHaveBeenCalled()
  })

  it('defaults the limit to 20 on an empty body', async () => {
    stageMock.mockResolvedValueOnce({ staged: 0, batchId: null, shopDomains: [], skipped: 0 })
    const res = await post('a'.repeat(40), '')
    expect(res.status).toBe(200)
    expect(stageMock).toHaveBeenCalledWith(20)
    const body = await res.json()
    expect(body).toMatchObject({ event: 'agent-stage-outreach', staged: 0, batchId: null })
    expect(body.approveUrl).toBeNull()
  })

  it('returns batch detail + approve URL on a staged batch', async () => {
    stageMock.mockResolvedValueOnce({
      staged: 2,
      batchId: 'batch-2026-06-07-abc123',
      shopDomains: ['alpha.example.com', 'beta.example.com'],
      skipped: 0,
    })
    const res = await post('a'.repeat(40), '{"limit":2}')
    expect(res.status).toBe(200)
    expect(stageMock).toHaveBeenCalledWith(2)
    const body = await res.json()
    expect(body).toMatchObject({
      event: 'agent-stage-outreach',
      staged: 2,
      batchId: 'batch-2026-06-07-abc123',
      shopDomains: ['alpha.example.com', 'beta.example.com'],
    })
    expect(body.approveUrl).toContain('/api/approve?token=')
  })

  it('returns 500 when staging fails', async () => {
    stageMock.mockRejectedValueOnce(new Error('db down'))
    const res = await post('a'.repeat(40), '{"limit":5}')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toMatchObject({ event: 'agent-stage-outreach-failed', code: 'internal-error' })
  })
})
