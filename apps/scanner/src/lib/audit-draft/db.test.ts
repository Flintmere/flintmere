import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../../generated/prisma'
import type { AuditDraft } from './schema'

// Mock the Prisma client. Sized to exactly what db.ts calls.
const create = vi.fn()
const findUnique = vi.fn()
const update = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    auditDraft: {
      create: (args: unknown) => create(args),
      findUnique: (args: unknown) => findUnique(args),
      update: (args: unknown) => update(args),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

const RAW_DRAFT_FIXTURE = {
  meta: {
    shop: 'bluetokyo.co.uk',
    vertical: 'food',
    bandSlug: 'band-1',
    generatedAt: '2026-05-06T20:00:00.000Z',
    productSampleSize: 5,
    modelUsed: 'gemini-2.5-pro',
  },
  // Minimal — full shape lives in schema.test.ts; db.ts is opaque to it.
} as unknown as AuditDraft

const ROW_FIXTURE = {
  id: 'cuid-row-1',
  shop: 'bluetokyo.co.uk',
  vertical: 'food',
  bandSlug: 'band-1',
  scanId: null,
  status: 'draft',
  modelUsed: 'gemini-2.5-pro',
  latencyMs: 12_000,
  rawDraft: RAW_DRAFT_FIXTURE,
  editedDraft: null,
  generatedAt: new Date('2026-05-06T20:00:00.000Z'),
  editedAt: null,
  sentAt: null,
  createdAt: new Date('2026-05-06T20:00:01.000Z'),
  updatedAt: new Date('2026-05-06T20:00:01.000Z'),
}

describe('createAuditDraft', () => {
  it('persists with status=draft and the LLM telemetry fields', async () => {
    create.mockResolvedValue(ROW_FIXTURE)

    const { createAuditDraft } = await import('./db')
    const result = await createAuditDraft({
      shop: 'bluetokyo.co.uk',
      vertical: 'food',
      bandSlug: 'band-1',
      scanId: null,
      modelUsed: 'gemini-2.5-pro',
      latencyMs: 12_000,
      rawDraft: RAW_DRAFT_FIXTURE,
      generatedAt: new Date('2026-05-06T20:00:00.000Z'),
    })

    expect(create).toHaveBeenCalledTimes(1)
    const args = create.mock.calls[0][0]
    expect(args.data.shop).toBe('bluetokyo.co.uk')
    expect(args.data.vertical).toBe('food')
    expect(args.data.bandSlug).toBe('band-1')
    expect(args.data.modelUsed).toBe('gemini-2.5-pro')
    expect(args.data.latencyMs).toBe(12_000)
    // status not set on create — DB default 'draft' applies.
    expect(args.data.status).toBeUndefined()

    expect(result.id).toBe('cuid-row-1')
    expect(result.status).toBe('draft')
    expect(result.scanId).toBeNull()
  })

  it('passes through scanId when provided', async () => {
    create.mockResolvedValue({ ...ROW_FIXTURE, scanId: 'scan-cuid' })

    const { createAuditDraft } = await import('./db')
    await createAuditDraft({
      shop: 'bluetokyo.co.uk',
      vertical: 'food',
      bandSlug: 'band-2',
      scanId: 'scan-cuid',
      modelUsed: 'gemini-2.5-pro',
      latencyMs: 9_000,
      rawDraft: RAW_DRAFT_FIXTURE,
      generatedAt: new Date(),
    })

    const args = create.mock.calls[0][0]
    expect(args.data.scanId).toBe('scan-cuid')
  })
})

describe('getAuditDraft', () => {
  it('returns the row mapped to PersistedAuditDraft on hit', async () => {
    findUnique.mockResolvedValue(ROW_FIXTURE)

    const { getAuditDraft } = await import('./db')
    const result = await getAuditDraft('cuid-row-1')

    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'cuid-row-1' } })
    expect(result?.id).toBe('cuid-row-1')
    expect(result?.vertical).toBe('food')
    expect(result?.bandSlug).toBe('band-1')
  })

  it('returns null when the row does not exist', async () => {
    findUnique.mockResolvedValue(null)

    const { getAuditDraft } = await import('./db')
    expect(await getAuditDraft('missing-id')).toBeNull()
  })
})

describe('patchAuditDraft', () => {
  it('auto-advances status to "edited" when editedDraft lands without explicit status', async () => {
    update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...ROW_FIXTURE,
        editedDraft: data.editedDraft,
        editedAt: data.editedAt,
        status: data.status ?? ROW_FIXTURE.status,
      }),
    )

    const { patchAuditDraft } = await import('./db')
    const result = await patchAuditDraft('cuid-row-1', {
      editedDraft: RAW_DRAFT_FIXTURE,
    })

    const args = update.mock.calls[0][0]
    expect(args.where).toEqual({ id: 'cuid-row-1' })
    expect(args.data.status).toBe('edited')
    expect(args.data.editedAt).toBeInstanceOf(Date)
    expect(result?.status).toBe('edited')
  })

  it('auto-advances status to "sent" when sentAt is set without explicit status', async () => {
    update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...ROW_FIXTURE,
        sentAt: data.sentAt,
        status: data.status ?? ROW_FIXTURE.status,
      }),
    )

    const { patchAuditDraft } = await import('./db')
    const sentAt = new Date('2026-05-06T21:00:00.000Z')
    const result = await patchAuditDraft('cuid-row-1', { sentAt })

    const args = update.mock.calls[0][0]
    expect(args.data.status).toBe('sent')
    expect(args.data.sentAt).toBe(sentAt)
    expect(result?.status).toBe('sent')
  })

  it('respects explicit status over auto-advance', async () => {
    update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...ROW_FIXTURE,
        ...data,
      }),
    )

    const { patchAuditDraft } = await import('./db')
    await patchAuditDraft('cuid-row-1', {
      editedDraft: RAW_DRAFT_FIXTURE,
      status: 'draft', // operator wants to revert auto-advance
    })

    const args = update.mock.calls[0][0]
    expect(args.data.status).toBe('draft')
  })

  it('returns null when the row does not exist (P2025)', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
        code: 'P2025',
        clientVersion: '5.22.0',
      }),
    )

    const { patchAuditDraft } = await import('./db')
    expect(
      await patchAuditDraft('missing-id', { sentAt: new Date() }),
    ).toBeNull()
  })

  it('rethrows non-P2025 Prisma errors', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    )

    const { patchAuditDraft } = await import('./db')
    await expect(
      patchAuditDraft('cuid-row-1', { editedDraft: RAW_DRAFT_FIXTURE }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })
})
