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
  createEmailOtp,
  EMAIL_OTP_CODE_DIGITS,
  generateCode,
  hashCodeWithEmail,
  verifyAndConsumeOtp,
} from './email-otp'

beforeEach(() => {
  rows.length = 0
})

describe('generateCode', () => {
  it(`returns a ${EMAIL_OTP_CODE_DIGITS}-digit zero-padded numeric string`, () => {
    for (let i = 0; i < 50; i++) {
      const c = generateCode()
      expect(c).toMatch(new RegExp(`^\\d{${EMAIL_OTP_CODE_DIGITS}}$`))
    }
  })

  it('returns distinct values across calls (entropy sanity)', () => {
    const codes = Array.from({ length: 100 }, () => generateCode())
    const set = new Set(codes)

    // The previous assertion was `toBe(100)` with the note "100 from 1M
    // space — duplicates astronomically rare". That reasons per CODE
    // (1-in-a-million) when the risk is per PAIR: 100 draws make
    // C(100,2) = 4,950 pairs, so collisions are Poisson with
    // lambda = 4950 / 1e6 = 0.00495 and
    //   P(at least one duplicate) = 1 - e^-lambda ~= 0.494%.
    // That is one red run in roughly 202 — the birthday paradox, not
    // astronomy. It went red during the 2026-10-31 scoring work and
    // passed on every re-run, which is exactly how this wastes time.
    //
    // 98 tolerates up to two collisions: P(>=3) ~= lambda^3/6 ~= 2e-8,
    // about one run in 49 million. A constant or tiny-space generator
    // still fails outright.
    expect(set.size).toBeGreaterThanOrEqual(98)

    // Catches what a distinctness count alone cannot: a generator stuck
    // in a narrow band. Values below 100,000 zero-pad, so a 5-digit
    // generator would put '0' in front of every code while still
    // returning 100 distinct values. Over 100 uniform draws, missing two
    // or more leading digits has probability ~ C(10,2) * 0.8^100 ~= 9e-9.
    const leadingDigits = new Set(codes.map((c) => c[0]))
    expect(leadingDigits.size).toBeGreaterThanOrEqual(8)
  })
})

describe('hashCodeWithEmail', () => {
  it('is deterministic over the same (code, email)', () => {
    const a = hashCodeWithEmail('123456', 'info@eazyaccess.org')
    const b = hashCodeWithEmail('123456', 'info@eazyaccess.org')
    expect(a.equals(b)).toBe(true)
    expect(a.length).toBe(32)
  })

  it('differs across distinct codes (same email)', () => {
    expect(
      hashCodeWithEmail('111111', 'a@b.com').equals(
        hashCodeWithEmail('222222', 'a@b.com'),
      ),
    ).toBe(false)
  })

  it('differs across distinct emails (same code) — DB-row binding', () => {
    expect(
      hashCodeWithEmail('123456', 'a@b.com').equals(
        hashCodeWithEmail('123456', 'c@d.com'),
      ),
    ).toBe(false)
  })

  it('lowercases + trims email before hashing', () => {
    const canonical = hashCodeWithEmail('123456', 'info@eazyaccess.org')
    const messy = hashCodeWithEmail('123456', '  INFO@Eazyaccess.org  ')
    expect(canonical.equals(messy)).toBe(true)
  })
})

describe('createEmailOtp', () => {
  it('persists a hashed row and returns raw code + expiry', async () => {
    const before = Date.now()
    const { rawCode, expiresAt } = await createEmailOtp({
      email: 'info@eazyaccess.org',
    })
    expect(rawCode).toMatch(/^\d{6}$/)
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 9 * 60_000)
    expect(expiresAt.getTime()).toBeLessThanOrEqual(before + 11 * 60_000)
    expect(rows).toHaveLength(1)
    // Persisted hash matches what the verifier will compute.
    expect(
      rows[0]!.tokenHash.equals(
        hashCodeWithEmail(rawCode, 'info@eazyaccess.org'),
      ),
    ).toBe(true)
    expect(rows[0]!.email).toBe('info@eazyaccess.org')
    expect(rows[0]!.consumedAt).toBeNull()
  })

  it('honours a custom ttlMinutes', async () => {
    const before = Date.now()
    const { expiresAt } = await createEmailOtp({
      email: 'info@eazyaccess.org',
      ttlMinutes: 30,
    })
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 29 * 60_000)
    expect(expiresAt.getTime()).toBeLessThanOrEqual(before + 31 * 60_000)
  })
})

describe('verifyAndConsumeOtp', () => {
  it('verifies + consumes a fresh row, returns the email', async () => {
    const { rawCode } = await createEmailOtp({ email: 'info@eazyaccess.org' })
    const result = await verifyAndConsumeOtp({
      email: 'info@eazyaccess.org',
      code: rawCode,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.email).toBe('info@eazyaccess.org')
    expect(rows[0]!.consumedAt).toBeInstanceOf(Date)
  })

  it('rejects a second verify of the same code (consumed)', async () => {
    const { rawCode } = await createEmailOtp({ email: 'info@eazyaccess.org' })
    await verifyAndConsumeOtp({
      email: 'info@eazyaccess.org',
      code: rawCode,
    })
    const second = await verifyAndConsumeOtp({
      email: 'info@eazyaccess.org',
      code: rawCode,
    })
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.reason).toBe('consumed')
  })

  it('rejects an unknown code with reason="unknown"', async () => {
    const result = await verifyAndConsumeOtp({
      email: 'info@eazyaccess.org',
      code: '999999',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('unknown')
  })

  it('rejects a code submitted with the wrong email (DB-row binding)', async () => {
    const { rawCode } = await createEmailOtp({ email: 'info@eazyaccess.org' })
    const result = await verifyAndConsumeOtp({
      email: 'attacker@example.com',
      code: rawCode,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('unknown')
    expect(rows[0]!.consumedAt).toBeNull()
  })

  it('rejects an expired code', async () => {
    const { rawCode } = await createEmailOtp({
      email: 'info@eazyaccess.org',
      ttlMinutes: 10,
    })
    rows[0]!.expiresAt = new Date(Date.now() - 1)
    const result = await verifyAndConsumeOtp({
      email: 'info@eazyaccess.org',
      code: rawCode,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
  })

  it('rejects malformed code (non-digit / wrong length) without DB hit', async () => {
    expect(
      (await verifyAndConsumeOtp({ email: 'a@b.com', code: 'abcdef' })).ok,
    ).toBe(false)
    expect(
      (await verifyAndConsumeOtp({ email: 'a@b.com', code: '12345' })).ok,
    ).toBe(false)
    expect(
      (await verifyAndConsumeOtp({ email: 'a@b.com', code: '1234567' })).ok,
    ).toBe(false)
    expect(
      (await verifyAndConsumeOtp({ email: 'a@b.com', code: '' })).ok,
    ).toBe(false)
  })
})
