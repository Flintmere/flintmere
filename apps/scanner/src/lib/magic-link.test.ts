import { beforeEach, describe, expect, it, vi } from 'vitest'

const rows: Array<{
  id: string
  tokenHash: Buffer
  email: string
  expiresAt: Date
  consumedAt: Date | null
  createdAt: Date
}> = []

vi.mock('@/lib/db', () => ({
  prisma: {
    magicLinkToken: {
      create: vi.fn(async ({ data }: { data: Omit<(typeof rows)[number], 'id' | 'createdAt' | 'consumedAt'> }) => {
        const row = {
          id: `mock-${rows.length + 1}`,
          createdAt: new Date(),
          consumedAt: null,
          ...data,
        }
        rows.push(row)
        return row
      }),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: {
            tokenHash: Buffer
            consumedAt: null
            expiresAt: { gt: Date }
          }
          data: { consumedAt: Date }
        }) => {
          const matched = rows.filter(
            (r) =>
              r.tokenHash.equals(where.tokenHash) &&
              r.consumedAt === null &&
              r.expiresAt > where.expiresAt.gt,
          )
          for (const r of matched) {
            r.consumedAt = data.consumedAt
          }
          return { count: matched.length }
        },
      ),
      findUnique: vi.fn(async ({ where }: { where: { tokenHash: Buffer } }) => {
        return rows.find((r) => r.tokenHash.equals(where.tokenHash)) ?? null
      }),
      findUniqueOrThrow: vi.fn(async ({ where }: { where: { tokenHash: Buffer } }) => {
        const row = rows.find((r) => r.tokenHash.equals(where.tokenHash))
        if (!row) throw new Error('not found')
        return row
      }),
    },
  },
}))

import {
  createMagicLink,
  generateRawToken,
  hashToken,
  verifyAndConsume,
} from './magic-link'

beforeEach(() => {
  rows.length = 0
})

describe('generateRawToken', () => {
  it('returns 43-char base64url (32 bytes → 43 chars unpadded)', () => {
    const t = generateRawToken()
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('returns distinct values across calls (entropy sanity)', () => {
    const a = generateRawToken()
    const b = generateRawToken()
    expect(a).not.toBe(b)
  })
})

describe('hashToken', () => {
  it('is deterministic over the same input', () => {
    const a = hashToken('abc')
    const b = hashToken('abc')
    expect(a.equals(b)).toBe(true)
    expect(a.length).toBe(32) // sha256 = 32 bytes
  })

  it('differs across distinct inputs', () => {
    expect(hashToken('a').equals(hashToken('b'))).toBe(false)
  })
})

describe('createMagicLink', () => {
  it('persists a hashed row and returns the raw token + expiry', async () => {
    const before = Date.now()
    const { rawToken, expiresAt } = await createMagicLink({
      email: 'Op@Example.Com  ',
    })
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.email).toBe('op@example.com')
    expect(rows[0]!.tokenHash.equals(hashToken(rawToken))).toBe(true)
    // default TTL 10 min — expiry within the expected window
    const ttlMs = expiresAt.getTime() - before
    expect(ttlMs).toBeGreaterThan(9 * 60_000)
    expect(ttlMs).toBeLessThan(11 * 60_000)
  })

  it('honours custom ttlMinutes', async () => {
    const before = Date.now()
    const { expiresAt } = await createMagicLink({
      email: 'op@example.com',
      ttlMinutes: 1,
    })
    const ttlMs = expiresAt.getTime() - before
    expect(ttlMs).toBeGreaterThan(50_000)
    expect(ttlMs).toBeLessThan(70_000)
  })
})

describe('verifyAndConsume', () => {
  it('returns ok + email on first verify, then consumed on replay', async () => {
    const { rawToken } = await createMagicLink({ email: 'op@example.com' })

    const first = await verifyAndConsume(rawToken)
    expect(first).toEqual({ ok: true, email: 'op@example.com' })

    const second = await verifyAndConsume(rawToken)
    expect(second).toEqual({ ok: false, reason: 'consumed' })
  })

  it('returns unknown for a token never persisted', async () => {
    const result = await verifyAndConsume(generateRawToken())
    expect(result).toEqual({ ok: false, reason: 'unknown' })
  })

  it('returns unknown for an empty / null token', async () => {
    const result = await verifyAndConsume('')
    expect(result).toEqual({ ok: false, reason: 'unknown' })
  })

  it('returns expired when expiresAt is in the past', async () => {
    const { rawToken } = await createMagicLink({ email: 'op@example.com' })
    rows[0]!.expiresAt = new Date(Date.now() - 1_000) // backdate

    const result = await verifyAndConsume(rawToken)
    expect(result).toEqual({ ok: false, reason: 'expired' })
  })

  it('returns consumed when row already has consumedAt', async () => {
    const { rawToken } = await createMagicLink({ email: 'op@example.com' })
    rows[0]!.consumedAt = new Date()

    const result = await verifyAndConsume(rawToken)
    expect(result).toEqual({ ok: false, reason: 'consumed' })
  })
})
