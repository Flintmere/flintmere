/**
 * Database helpers for the outreach pipeline. Thin wrapper around
 * Prisma queries — keeps `send.ts` focused on orchestration and lets
 * the admin UI / batch script share the same query surface.
 */

import { prisma } from '../db';
import type { OutreachTarget } from '../../generated/prisma';

export type { OutreachTarget };

/** Status flow constants. Kept here so all consumers reference the same names. */
export const OUTREACH_STATUS = {
  pending: 'pending',
  enriched: 'enriched',
  queued: 'queued',
  sent: 'sent',
  followedUp: 'followed_up',
  replied: 'replied',
  unsubscribed: 'unsubscribed',
  bounced: 'bounced',
  dropped: 'dropped',
} as const;

export type OutreachStatus = (typeof OUTREACH_STATUS)[keyof typeof OUTREACH_STATUS];

export async function getTargetById(id: string): Promise<OutreachTarget | null> {
  return prisma.outreachTarget.findUnique({ where: { id } });
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  const row = await prisma.outreachUnsubscribe.findUnique({
    where: { recipientEmail: email.toLowerCase().trim() },
  });
  return row !== null;
}

export async function recordUnsubscribe(
  email: string,
  source: 'list-unsubscribe-header' | 'reply' | 'manual',
): Promise<void> {
  const normalised = email.toLowerCase().trim();
  await prisma.outreachUnsubscribe.upsert({
    where: { recipientEmail: normalised },
    create: { recipientEmail: normalised, source },
    update: {}, // First-write wins; later events leave the original source.
  });
  // Also flip any matching targets to status='unsubscribed' so the admin
  // queue stops surfacing them.
  await prisma.outreachTarget.updateMany({
    where: { recipientEmail: normalised },
    data: { status: OUTREACH_STATUS.unsubscribed },
  });
}

/**
 * Pop up to `limit` targets ready for the given send kind. Targets are
 * eligible when:
 *   - kind='initial' AND status='queued'
 *   - kind='followup' AND status='sent' AND sent_at < now() - 5d
 * Ordered by createdAt to drain in upload order.
 */
export async function findEligibleTargets(
  kind: 'initial' | 'followup',
  limit: number,
  now: Date = new Date(),
): Promise<OutreachTarget[]> {
  if (kind === 'initial') {
    return prisma.outreachTarget.findMany({
      where: { status: OUTREACH_STATUS.queued },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
  // followup: 5+ days after initial sent, no reply, no unsubscribe
  const cutoff = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  return prisma.outreachTarget.findMany({
    where: {
      status: OUTREACH_STATUS.sent,
      sentAt: { lte: cutoff },
    },
    orderBy: { sentAt: 'asc' },
    take: limit,
  });
}

/** How many sends went out today (initial OR followup). Used by the cap-gating
 *  query in scripts/send-outreach-batch.ts so a manual click via the admin
 *  console counts toward the daily budget. */
export async function countSentSince(since: Date): Promise<number> {
  return prisma.outreachSend.count({
    where: { sentAt: { gte: since } },
  });
}
