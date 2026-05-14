import { prisma } from '@/lib/db';
import type { SignalResult } from './types';

const DASHBOARD_URL = '/admin/outreach';

// "Stuck" = a target sitting in the `queued` status for >24h without
// being picked up by the send batch. Uses `createdAt` (the column the
// outreach page already orders by) — if the schema later gains a
// reliable `queuedAt`, swap to that.
export async function fetchOutreachCounts(): Promise<
  SignalResult<{
    queued: number;
    sent: number;
    replied: number;
    stuck: number;
  }>
> {
  const fetchedAt = new Date().toISOString();
  try {
    const grouped = await prisma.outreachTarget.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts: Record<string, number> = {};
    for (const row of grouped) counts[row.status] = row._count._all;

    const queued = counts.queued ?? 0;
    const sent = counts.sent ?? 0;
    const replied = counts.replied ?? 0;

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stuck = await prisma.outreachTarget.count({
      where: { status: 'queued', createdAt: { lt: dayAgo } },
    });

    return {
      status: stuck > 0 ? 'warn' : 'ok',
      metric:
        stuck > 0
          ? `${stuck} stuck >24h · ${queued} queued · ${sent} sent · ${replied} replied`
          : `${queued} queued · ${sent} sent · ${replied} replied`,
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
      data: { queued, sent, replied, stuck },
    };
  } catch (e) {
    return {
      status: 'unknown',
      metric: 'DB query failed',
      fetchedAt,
      sourceUrl: DASHBOARD_URL,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}
