import { describe, expect, it, vi } from 'vitest'

const leadDeleteMany = vi.fn()
const scanDeleteMany = vi.fn()
const stripeDeleteMany = vi.fn()

vi.mock('./db', () => ({
  prisma: {
    lead: { deleteMany: (...args: unknown[]) => leadDeleteMany(...args) },
    scan: { deleteMany: (...args: unknown[]) => scanDeleteMany(...args) },
    stripeProcessedEvent: {
      deleteMany: (...args: unknown[]) => stripeDeleteMany(...args),
    },
  },
}))

import { runRetentionSweep } from './retention-sweep'

const NOW = new Date('2026-05-10T00:00:00.000Z')
const MS_PER_DAY = 24 * 60 * 60 * 1000

describe('runRetentionSweep', () => {
  it('runs all four sweeps and returns counts', async () => {
    leadDeleteMany.mockResolvedValueOnce({ count: 3 }).mockResolvedValueOnce({ count: 2 })
    scanDeleteMany.mockResolvedValueOnce({ count: 7 })
    stripeDeleteMany.mockResolvedValueOnce({ count: 11 })

    const result = await runRetentionSweep(NOW)

    expect(result).toEqual({
      unsubscribedLeadsDeleted: 3,
      expiredScanLeadsDeleted: 2,
      expiredScansDeleted: 7,
      expiredStripeEventsDeleted: 11,
    })
  })

  it('uses 30-day cutoff for unsubscribed leads', async () => {
    leadDeleteMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 })
    scanDeleteMany.mockResolvedValueOnce({ count: 0 })
    stripeDeleteMany.mockResolvedValueOnce({ count: 0 })

    await runRetentionSweep(NOW)

    const firstCall = leadDeleteMany.mock.calls[0][0] as {
      where: { unsubscribedAt: { lt: Date } }
    }
    const expected = new Date(NOW.getTime() - 30 * MS_PER_DAY)
    expect(firstCall.where.unsubscribedAt.lt).toEqual(expected)
  })

  it('uses 90-day cutoff for scans + their leads', async () => {
    leadDeleteMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 })
    scanDeleteMany.mockResolvedValueOnce({ count: 0 })
    stripeDeleteMany.mockResolvedValueOnce({ count: 0 })

    await runRetentionSweep(NOW)

    const scanLeadsCall = leadDeleteMany.mock.calls[1][0] as {
      where: { scan: { createdAt: { lt: Date } } }
    }
    const scanCall = scanDeleteMany.mock.calls[0][0] as {
      where: { createdAt: { lt: Date } }
    }
    const expected = new Date(NOW.getTime() - 90 * MS_PER_DAY)
    expect(scanLeadsCall.where.scan.createdAt.lt).toEqual(expected)
    expect(scanCall.where.createdAt.lt).toEqual(expected)
  })

  it('uses 30-day cutoff for stripe processed-events', async () => {
    leadDeleteMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 })
    scanDeleteMany.mockResolvedValueOnce({ count: 0 })
    stripeDeleteMany.mockResolvedValueOnce({ count: 0 })

    await runRetentionSweep(NOW)

    const stripeCall = stripeDeleteMany.mock.calls[0][0] as {
      where: { processedAt: { lt: Date } }
    }
    const expected = new Date(NOW.getTime() - 30 * MS_PER_DAY)
    expect(stripeCall.where.processedAt.lt).toEqual(expected)
  })

  it('runs the leads-of-aged-scans sweep BEFORE the scan delete (FK ordering)', async () => {
    const order: string[] = []
    leadDeleteMany.mockImplementation(() => {
      order.push('lead')
      return { count: 0 }
    })
    scanDeleteMany.mockImplementation(() => {
      order.push('scan')
      return { count: 0 }
    })
    stripeDeleteMany.mockImplementation(() => {
      order.push('stripe')
      return { count: 0 }
    })

    await runRetentionSweep(NOW)

    expect(order).toEqual(['lead', 'lead', 'scan', 'stripe'])
  })
})
