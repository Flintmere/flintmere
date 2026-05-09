import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { issueSession, ADMIN_COOKIE_NAME } from '@/lib/admin-auth'
import { __resetRateLimitState } from '@/lib/rate-limit'

// ---- Mocks --------------------------------------------------------

// Mock next/headers cookies(): returns a thenable cookie store. The
// real next/headers requires a Next runtime; tests don't have one.
const mockCookieStore = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = mockCookieStore.get(name)
      return v !== undefined ? { name, value: v } : undefined
    },
  }),
}))

// Mock the orchestrator — the route's job is feature-flag, auth, rate-
// limit, body-parse, and error-code mapping. The orchestrator's job
// (catalog fetch, scan resolution, LLM call, persist) is unit-tested
// elsewhere via its own boundary mocks.
const generateAuditDraftForShop = vi.fn()
vi.mock('@/lib/audit-draft/generate', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/audit-draft/generate')
  >('@/lib/audit-draft/generate')
  return {
    ...actual,
    generateAuditDraftForShop: (
      ...args: Parameters<typeof actual.generateAuditDraftForShop>
    ) => generateAuditDraftForShop(...args),
  }
})

import { POST } from './route'
import { AuditDraftGenerationError } from '@/lib/audit-draft/generate'
import { PILLARS } from '@/lib/audit-draft/schema'
import type { AuditDraft } from '@/lib/audit-draft/schema'

// ---- Env --------------------------------------------------------

const SECRET = 's'.repeat(48)
const ADMIN_EMAIL = 'info@eazyaccess.org'

const ENV_KEYS = [
  'FEATURE_AUDIT_ASSIST',
  'ADMIN_EMAIL',
  'ADMIN_SESSION_SECRET',
] as const
const ORIGINAL_ENV: Record<string, string | undefined> = {}

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/audit-draft/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setAdminCookie() {
  const cookieValue = issueSession(ADMIN_EMAIL, SECRET)
  mockCookieStore.set(ADMIN_COOKIE_NAME, cookieValue)
}

const RAW_DRAFT_FIXTURE: AuditDraft = {
  meta: {
    shop: 'bluetokyo.co.uk',
    vertical: 'food',
    bandSlug: 'band-1',
    generatedAt: '2026-05-06T20:00:00.000Z',
    model: 'gemini-2.5-pro',
    latencyMs: 12_000,
  },
  executiveSummary: { headline: 'h', body: 'b', confidence: 0.9 },
  pillarFindings: PILLARS.map((p) => ({
    pillar: p,
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
    pillarRef: 'identifiers' as const,
    confidence: 0.8,
  })),
  estimatedRevenueImpact: { available: false, summary: 's' },
  operatorTodos: [],
}

const PERSISTED_DRAFT = {
  id: 'cuid-draft-1',
  shop: 'bluetokyo.co.uk',
  vertical: 'food' as const,
  bandSlug: 'band-1' as const,
  scanId: 'scan-1',
  status: 'draft' as const,
  modelUsed: 'gemini-2.5-pro',
  latencyMs: 12_000,
  rawDraft: RAW_DRAFT_FIXTURE,
  editedDraft: null,
  generatedAt: new Date(),
  editedAt: null,
  sentAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('POST /api/admin/audit-draft/generate', () => {
  beforeAll(() => {
    for (const k of ENV_KEYS) ORIGINAL_ENV[k] = process.env[k]
  })

  beforeEach(() => {
    __resetRateLimitState()
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

  it('404s when feature flag is unset (no existence leak)', async () => {
    delete process.env.FEATURE_AUDIT_ASSIST
    setAdminCookie()

    const res = await POST(
      jsonRequest({ shopUrl: 'bluetokyo.co.uk', bandSlug: 'band-1' }),
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('feature-off')
    expect(generateAuditDraftForShop).not.toHaveBeenCalled()
  })

  it('401s without admin cookie', async () => {
    const res = await POST(
      jsonRequest({ shopUrl: 'bluetokyo.co.uk', bandSlug: 'band-1' }),
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('unauth')
    expect(generateAuditDraftForShop).not.toHaveBeenCalled()
  })

  it('400s on malformed body', async () => {
    setAdminCookie()
    const res = await POST(jsonRequest({ shopUrl: 'x' })) // missing bandSlug

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('bad-request')
    expect(generateAuditDraftForShop).not.toHaveBeenCalled()
  })

  it('200s on happy path with the orchestrator-supplied draft id', async () => {
    setAdminCookie()
    generateAuditDraftForShop.mockResolvedValue(PERSISTED_DRAFT)

    const res = await POST(
      jsonRequest({
        shopUrl: 'bluetokyo.co.uk',
        bandSlug: 'band-1',
        vertical: 'food',
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.draftId).toBe('cuid-draft-1')
    expect(generateAuditDraftForShop).toHaveBeenCalledWith({
      shopUrl: 'bluetokyo.co.uk',
      bandSlug: 'band-1',
      vertical: 'food',
    })
  })

  it('maps no-recent-scan to 409', async () => {
    setAdminCookie()
    generateAuditDraftForShop.mockRejectedValue(
      new AuditDraftGenerationError('no-recent-scan', 'no scan'),
    )

    const res = await POST(
      jsonRequest({ shopUrl: 'bluetokyo.co.uk', bandSlug: 'band-1' }),
    )

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('no-recent-scan')
  })

  it('maps catalog-unfetchable to 503', async () => {
    setAdminCookie()
    generateAuditDraftForShop.mockRejectedValue(
      new AuditDraftGenerationError('catalog-unfetchable', '/products.json 404'),
    )

    const res = await POST(
      jsonRequest({ shopUrl: 'unreachable.example', bandSlug: 'band-2' }),
    )

    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe('catalog-unfetchable')
  })

  it('maps llm-schema-fail to 502', async () => {
    setAdminCookie()
    generateAuditDraftForShop.mockRejectedValue(
      new AuditDraftGenerationError('llm-schema-fail', 'twice'),
    )

    const res = await POST(
      jsonRequest({ shopUrl: 'bluetokyo.co.uk', bandSlug: 'band-1' }),
    )

    expect(res.status).toBe(502)
    expect((await res.json()).code).toBe('llm-schema-fail')
  })

  it('maps llm-unavailable to 503', async () => {
    setAdminCookie()
    generateAuditDraftForShop.mockRejectedValue(
      new AuditDraftGenerationError('llm-unavailable', 'rejected'),
    )

    const res = await POST(
      jsonRequest({ shopUrl: 'bluetokyo.co.uk', bandSlug: 'band-1' }),
    )

    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe('llm-unavailable')
  })

  it('rate-limits after 5 generations from the same cookie', async () => {
    setAdminCookie()
    generateAuditDraftForShop.mockResolvedValue(PERSISTED_DRAFT)

    for (let i = 0; i < 5; i += 1) {
      const ok = await POST(
        jsonRequest({ shopUrl: 'bluetokyo.co.uk', bandSlug: 'band-1' }),
      )
      expect(ok.status).toBe(200)
    }

    const blocked = await POST(
      jsonRequest({ shopUrl: 'bluetokyo.co.uk', bandSlug: 'band-1' }),
    )
    expect(blocked.status).toBe(429)
    expect((await blocked.json()).code).toBe('rate-limited')
  })
})
