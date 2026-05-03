/**
 * Hard-delete resolved contact-form threads older than the retention
 * horizon. Phase 4 of the contact-form rollout — implements the policy
 * promise made in /privacy clause 04 (resolved threads kept up to 24
 * months from last contact, then purged).
 *
 * Eligibility: status ∈ {responded, archived, spam} AND updatedAt
 * older than the cutoff. Open threads (new, acknowledged) are never
 * touched, regardless of age — those still need a reply.
 *
 * "Last contact" proxy: `updatedAt`, which Prisma bumps on every status
 * change (ack → respond → archive) and on any operator edit. A long-
 * dormant `new` thread will not be purged (right answer — that means
 * we owe a reply); only resolved threads age out.
 *
 * Designed to be called daily from a host-level scheduled task. Runs
 * are idempotent: a re-run after a successful purge is a no-op.
 */

import type { ContactStatus } from '@/generated/prisma';

export const RESOLVED_CONTACT_STATUSES: readonly ContactStatus[] = [
  'responded',
  'archived',
  'spam',
] as const;

export const DEFAULT_CONTACT_RETENTION_MONTHS = 24;

export interface ContactPurgeArgs {
  /** Prisma-shaped client. Real `prisma` in the script; mocked in tests. */
  prisma: ContactPurgePrisma;
  /** Wall-clock to measure age against. Defaults to `new Date()`. */
  now?: Date;
  /** Months of retention after `updatedAt`. Defaults to 24. */
  cutoffMonths?: number;
  /** When true, count eligible rows but do not delete. */
  dryRun?: boolean;
}

export interface ContactPurgeResult {
  cutoffAt: Date;
  eligibleCount: number;
  deletedCount: number;
  /** Oldest `updatedAt` among rows we kept (open threads + still-fresh resolved). */
  oldestPreservedAt: Date | null;
  dryRun: boolean;
}

export interface ContactPurgePrisma {
  contactMessage: {
    count(args: {
      where: {
        status: { in: ContactStatus[] };
        updatedAt: { lt: Date };
      };
    }): Promise<number>;
    deleteMany(args: {
      where: {
        status: { in: ContactStatus[] };
        updatedAt: { lt: Date };
      };
    }): Promise<{ count: number }>;
    findFirst(args: {
      where: { id?: never };
      orderBy: { updatedAt: 'asc' };
      select: { updatedAt: true };
    }): Promise<{ updatedAt: Date } | null>;
  };
}

export async function purgeResolvedContactThreads(
  args: ContactPurgeArgs,
): Promise<ContactPurgeResult> {
  const now = args.now ?? new Date();
  const cutoffMonths = args.cutoffMonths ?? DEFAULT_CONTACT_RETENTION_MONTHS;
  const dryRun = args.dryRun ?? false;

  const cutoffAt = new Date(now);
  cutoffAt.setMonth(cutoffAt.getMonth() - cutoffMonths);

  const where = {
    status: { in: [...RESOLVED_CONTACT_STATUSES] },
    updatedAt: { lt: cutoffAt },
  };

  const eligibleCount = await args.prisma.contactMessage.count({ where });

  let deletedCount = 0;
  if (!dryRun && eligibleCount > 0) {
    const result = await args.prisma.contactMessage.deleteMany({ where });
    deletedCount = result.count;
  }

  const oldest = await args.prisma.contactMessage.findFirst({
    where: {},
    orderBy: { updatedAt: 'asc' },
    select: { updatedAt: true },
  });

  return {
    cutoffAt,
    eligibleCount,
    deletedCount,
    oldestPreservedAt: oldest?.updatedAt ?? null,
    dryRun,
  };
}
