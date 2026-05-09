import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { issueSession, ADMIN_COOKIE_NAME } from '@/lib/admin-auth'

const mockCookieStore = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = mockCookieStore.get(name)
      return v !== undefined ? { name, value: v } : undefined
    },
  }),
}))

const getAuditDraftMock = vi.fn()
const patchAuditDraftMock = vi.fn()
vi.mock('@/lib/audit-draft/db', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/audit-draft/db')
  >('@/lib/audit-draft/db')
  return {
    ...actual,
    getAuditDraft: (id: string) => getAuditDraftMock(id),
    patchAuditDraft: (
      id: string,
      input: Parameters<typeof actual.patchAuditDraft>[1],
    ) => patchAuditDraftMock(id, input),
  }
})

import { GET, PATCH } from './route'

const SECRET = 's'.repeat(48)
const ADMIN_EMAIL = 'info@eazyaccess.org'

const ENV_KEYS = [
  'FEATURE_AUDIT_ASSIST',
  'ADMIN_EMAIL',
  'ADMIN_SESSION_SECRET',
] as const
const ORIGINAL_ENV: Record<string, string | undefined> = {}

function setAdminCookie() {
  mockCookieStore.set(ADMIN_COOKIE_NAME, issueSession(ADMIN_EMAIL, SECRET))
}

const FIXTURE = {
  id: 'cuid-1',
  shop: 'bluetokyo.co.uk',
  vertical: 'food' as const,
  bandSlug: 'band-1' as const,
  scanId: null,
  status: 'draft' as const,
  modelUsed: 'gemini-2.5-pro',
  latencyMs: 12_000,
  rawDraft: {} as never,
  editedDraft: null,
  generatedAt: new Date('2026-05-06T20:00:00.000Z'),
  editedAt: null,
  sentAt: null,
  createdAt: new Date('2026-05-06T20:00:01.000Z'),
  updatedAt: new Date('2026-05-06T20:00:01.000Z'),
}

const VALID_DRAFT_BODY = {
  meta: {
    shop: 'bluetokyo.co.uk',
    vertical: 'food' as const,
    bandSlug: 'band-1' as const,
    generatedAt: '2026-05-06T20:00:00.000Z',
    model: 'gemini-2.5-pro' as const,
    latencyMs: 12_000,
  },
  executiveSummary: { headline: 'h', body: 'b', confidence: 0.9 },
  pillarFindings: [
    'identifiers',
    'titles',
    'consistency',
    'crawlability',
    'attributes',
    'mapping',
    'checkout-eligibility',
  ].map((p) => ({
    pillar: p as never,
    score: 70,
    rating: 'B' as const,
    observations: 'o',
    actionableFixes: [],
    confidence: 0.8,
  })),
  topPriorities: [1, 2, 3, 4, 5].map((rank) => ({
    rank: rank as 1 | 2 | 3 | 4 | 5,
    title: 't',
    rationale: 'r',
    pillarRef: 'identifiers' as never,
    confidence: 0.8,
  })),
  estimatedRevenueImpact: { available: false, summary: 's' },
  operatorTodos: [],
}

describe('GET /api/admin/audit-draft/[id]', () => {
  beforeAll(() => {
    for (const k of ENV_KEYS) ORIGINAL_ENV[k] = process.env[k]
  })

  beforeEach(() => {
    mockCookieStore.clear()
    vi.clearAllMocks()
    process.env.FEATURE_AUDIT_ASSIST = 'true'
    process.env.ADMIN_EMAIL = ADMIN_EMAIL
    process.env.ADMIN_SESSION_SECRET = SECRET
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    for (const [k, v] of Object.entries(ORIGINAL_ENV)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    vi.restoreAllMocks()
  })

  it('404s when feature flag is unset', async () => {
    delete process.env.FEATURE_AUDIT_ASSIST
    setAdminCookie()
    const res = await GET(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1'),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('feature-off')
  })

  it('401s without admin cookie', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1'),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('unauth')
  })

  it('returns the draft on hit', async () => {
    setAdminCookie()
    getAuditDraftMock.mockResolvedValue(FIXTURE)

    const res = await GET(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1'),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.draft.id).toBe('cuid-1')
    expect(getAuditDraftMock).toHaveBeenCalledWith('cuid-1')
  })

  it('404s when the draft does not exist', async () => {
    setAdminCookie()
    getAuditDraftMock.mockResolvedValue(null)

    const res = await GET(
      new NextRequest('http://localhost/api/admin/audit-draft/missing'),
      { params: Promise.resolve({ id: 'missing' }) },
    )
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('not-found')
  })
})

describe('PATCH /api/admin/audit-draft/[id]', () => {
  beforeEach(() => {
    mockCookieStore.clear()
    vi.clearAllMocks()
    process.env.FEATURE_AUDIT_ASSIST = 'true'
    process.env.ADMIN_EMAIL = ADMIN_EMAIL
    process.env.ADMIN_SESSION_SECRET = SECRET
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    for (const [k, v] of Object.entries(ORIGINAL_ENV)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    vi.restoreAllMocks()
  })

  it('401s without admin cookie', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'edited' }),
      }),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )
    expect(res.status).toBe(401)
  })

  it('400s when no fields supplied', async () => {
    setAdminCookie()
    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('bad-request')
  })

  it('400s on schema-invalid editedDraft', async () => {
    setAdminCookie()
    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editedDraft: { broken: true } }),
      }),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )
    expect(res.status).toBe(400)
  })

  it('200s on a valid edited body and propagates to db', async () => {
    setAdminCookie()
    patchAuditDraftMock.mockResolvedValue({ ...FIXTURE, status: 'edited' })

    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editedDraft: VALID_DRAFT_BODY }),
      }),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.draft.status).toBe('edited')
    expect(patchAuditDraftMock).toHaveBeenCalled()
  })

  it('200s on a status-only patch', async () => {
    setAdminCookie()
    patchAuditDraftMock.mockResolvedValue({ ...FIXTURE, status: 'sent' })

    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/audit-draft/cuid-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      }),
      { params: Promise.resolve({ id: 'cuid-1' }) },
    )
    expect(res.status).toBe(200)
    const args = patchAuditDraftMock.mock.calls[0]
    expect(args[1]).toEqual({ status: 'sent' })
  })

  it('404s when the draft does not exist', async () => {
    setAdminCookie()
    patchAuditDraftMock.mockResolvedValue(null)

    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/audit-draft/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    )
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('not-found')
  })
})
