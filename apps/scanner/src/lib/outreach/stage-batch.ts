/**
 * Stage an outreach batch for operator approval — ADR 0026. Single
 * implementation shared by the local script (scripts/stage-outreach-batch.ts)
 * and the agent API route (/api/agent/stage-outreach).
 *
 * Flips up to N 'enriched' targets (oldest first, send-eligible data
 * guards) to 'ready_for_approval' under a fresh batchId. The daily
 * brief re-surfaces the approve link every day until clicked.
 */

import { prisma } from '../db';
import { OUTREACH_STATUS } from './db';

export const STAGE_LIMIT_MIN = 1;
export const STAGE_LIMIT_MAX = 30;

/** Narrow prisma surface so tests inject a fake (approval.ts pattern). */
export interface StageBatchPrisma {
  outreachTarget: {
    findMany(args: {
      where: {
        status: string;
        recipientEmail: { not: null };
        score: { not: null };
        grade: { not: null };
        productCount: { not: null };
      };
      orderBy: { createdAt: 'asc' };
      take: number;
      select: { id: true; shopDomain: true };
    }): Promise<Array<{ id: string; shopDomain: string }>>;
    updateMany(args: {
      where: { id: { in: string[] }; status: string };
      data: { status: string; batchId: string };
    }): Promise<{ count: number }>;
  };
}

export interface StageBatchResult {
  staged: number;
  /** Null when no enriched targets were available. */
  batchId: string | null;
  shopDomains: string[];
  /** Candidates whose status changed between select and update. */
  skipped: number;
}

export async function stageOutreachBatch(
  limit: number,
  client: StageBatchPrisma = prisma,
  now: Date = new Date(),
): Promise<StageBatchResult> {
  if (!Number.isInteger(limit) || limit < STAGE_LIMIT_MIN || limit > STAGE_LIMIT_MAX) {
    throw new Error(`limit must be ${STAGE_LIMIT_MIN}–${STAGE_LIMIT_MAX}`);
  }

  const candidates = await client.outreachTarget.findMany({
    where: {
      status: OUTREACH_STATUS.enriched,
      recipientEmail: { not: null },
      score: { not: null },
      grade: { not: null },
      productCount: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, shopDomain: true },
  });

  if (candidates.length === 0) {
    return { staged: 0, batchId: null, shopDomains: [], skipped: 0 };
  }

  const batchId = `batch-${now.toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  const { count } = await client.outreachTarget.updateMany({
    where: {
      id: { in: candidates.map((c) => c.id) },
      status: OUTREACH_STATUS.enriched,
    },
    data: { status: OUTREACH_STATUS.readyForApproval, batchId },
  });

  return {
    staged: count,
    batchId,
    shopDomains: candidates.map((c) => c.shopDomain),
    skipped: candidates.length - count,
  };
}
