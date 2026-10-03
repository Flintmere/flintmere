import { describe, expect, it } from 'vitest'

import { enrichmentCandidateWhere } from './db'

// September 2026: this cron billed ~119M Gemini input tokens because an
// unresolvable target never left the pending pool. Two bounds stop that
// — one spaces retries out, one ends them. Both are pinned here because
// losing either is invisible in review and only shows up on an invoice.
describe('enrichmentCandidateWhere', () => {
  const now = new Date('2026-09-15T12:00:00.000Z')
  const where = enrichmentCandidateWhere(now)

  it('only considers pending targets that still need an email', () => {
    expect(where.status).toBe('pending')
    expect(where.recipientEmail).toBeNull()
  })

  it('spaces retries at least 24h apart', () => {
    const retry = where.OR?.[1] as { enrichmentAttemptedAt: { lt: Date } }
    expect(retry.enrichmentAttemptedAt.lt).toEqual(
      new Date('2026-09-14T12:00:00.000Z'),
    )
  })

  it('still admits targets that have never been attempted', () => {
    expect(where.OR?.[0]).toEqual({ enrichmentAttemptedAt: null })
  })

  // The bound whose absence caused the incident.
  it('gives up on targets older than a week', () => {
    const createdAt = where.createdAt as { gt: Date }
    expect(createdAt.gt).toEqual(new Date('2026-09-08T12:00:00.000Z'))
  })

  it('bounds total attempts per target to roughly one week of daily runs', () => {
    const createdAt = where.createdAt as { gt: Date }
    const retry = where.OR?.[1] as { enrichmentAttemptedAt: { lt: Date } }
    const lifetimeMs = now.getTime() - createdAt.gt.getTime()
    const spacingMs = now.getTime() - retry.enrichmentAttemptedAt.lt.getTime()
    expect(lifetimeMs / spacingMs).toBeLessThanOrEqual(7)
  })
})
