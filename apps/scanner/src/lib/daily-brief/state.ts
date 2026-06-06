/**
 * Daily-brief state collection (ADR 0026).
 *
 * The brief reports live marketing-pipeline state: the social queue
 * (posted / scheduled / failed), outreach counters, outreach batches
 * awaiting approval, and — on Mondays only — a PostHog metrics rollup.
 *
 * Every collector runs through Promise.allSettled: a single failing
 * query degrades to an empty snapshot + a warning, never a silent brief
 * or a hard crash. The channel never goes dark.
 */

import { prisma } from '../db';
import { OUTREACH_STATUS } from '../outreach/db';
import { buildApproveUrl } from '../outreach/approval';
import { fetchPosthogRollup } from './posthog-rollup';
import type {
  BriefState,
  OutreachSnapshot,
  SocialSnapshot,
  ApprovalSnapshot,
  PosthogRollup,
} from './types';

const LONDON_TZ = 'Europe/London';
const DEFAULT_BASE_URL = 'https://audit.flintmere.com';

export interface CollectOptions {
  /** Override for tests. */
  now?: Date;
}

export async function collectBriefState(
  options: CollectOptions = {},
): Promise<BriefState> {
  const now = options.now ?? new Date();
  const warnings: string[] = [];
  const isMonday = formatLondonWeekday(now) === 'Mon';

  const [outreachResult, socialResult, approvalsResult, posthogResult] =
    await Promise.allSettled([
      snapshotOutreach(now),
      snapshotSocial(now),
      snapshotApprovals(),
      isMonday ? fetchPosthogRollup() : Promise.resolve(null),
    ]);

  const outreach: OutreachSnapshot =
    outreachResult.status === 'fulfilled'
      ? outreachResult.value
      : emptyOutreachSnapshot();
  if (outreachResult.status === 'rejected') {
    warnings.push(
      `outreach DB query failed — counters omitted: ${describe(outreachResult.reason)}`,
    );
  }

  const social: SocialSnapshot =
    socialResult.status === 'fulfilled' ? socialResult.value : emptySocialSnapshot();
  if (socialResult.status === 'rejected') {
    warnings.push(
      `social queue query failed — posts omitted: ${describe(socialResult.reason)}`,
    );
  }

  const approvals: ApprovalSnapshot =
    approvalsResult.status === 'fulfilled'
      ? approvalsResult.value
      : { pending: [] };
  if (approvalsResult.status === 'rejected') {
    warnings.push(
      `approval batch query failed — pending list omitted: ${describe(approvalsResult.reason)}`,
    );
  }

  let posthog: PosthogRollup | null = null;
  if (posthogResult.status === 'fulfilled') {
    posthog = posthogResult.value;
  } else if (isMonday) {
    posthog = { visitors7d: 0, scans7d: 0, available: false };
    warnings.push(`posthog rollup failed: ${describe(posthogResult.reason)}`);
  }
  if (isMonday && posthog && !posthog.available) {
    warnings.push('posthog rollup unavailable');
  }

  return {
    date: formatLondonDate(now),
    weekday: formatLondonWeekday(now),
    outreach,
    social,
    approvals,
    posthog,
    warnings,
  };
}

// ---- DB snapshots ----

async function snapshotOutreach(now: Date): Promise<OutreachSnapshot> {
  const todayStart = londonMidnight(now);

  const [statusGroups, todaysSends, lastSend] = await Promise.all([
    prisma.outreachTarget.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.outreachSend.count({
      where: { sentAt: { gte: todayStart } },
    }),
    prisma.outreachSend.findFirst({
      orderBy: { sentAt: 'desc' },
      select: { sentAt: true },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const row of statusGroups) {
    counts.set(row.status, row._count._all);
  }

  return {
    queued: counts.get('queued') ?? 0,
    sent: counts.get('sent') ?? 0,
    replied: counts.get('replied') ?? 0,
    bounced: counts.get('bounced') ?? 0,
    unsubscribed: counts.get('unsubscribed') ?? 0,
    lastSendAt: lastSend?.sentAt ?? null,
    todaysSends,
  };
}

async function snapshotSocial(now: Date): Promise<SocialSnapshot> {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [posted, queued, failed, newest] = await Promise.all([
    prisma.socialPost.findMany({
      where: { status: 'posted', postedAt: { gte: dayAgo } },
      select: { body: true, externalId: true },
    }),
    prisma.socialPost.findMany({
      where: { status: 'queued', scheduledAt: { lte: week } },
      orderBy: { scheduledAt: 'asc' },
      select: { body: true, scheduledAt: true },
    }),
    prisma.socialPost.findMany({
      where: { status: 'failed' },
      select: { body: true, errorMessage: true },
    }),
    prisma.socialPost.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);
  return {
    postedLast24h: posted,
    queuedNext7d: queued,
    failed,
    xCredentialsMissing: !process.env.X_API_KEY,
    lastAgentInsertAt: newest?.createdAt ?? null,
  };
}

async function snapshotApprovals(): Promise<ApprovalSnapshot> {
  const groups = await prisma.outreachTarget.groupBy({
    by: ['batchId'],
    where: { status: OUTREACH_STATUS.readyForApproval, batchId: { not: null } },
    _count: { _all: true },
    _min: { updatedAt: true },
  });
  const secret = process.env.ADMIN_SESSION_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_BASE_URL;
  return {
    pending: groups.map((g) => ({
      batchId: g.batchId!,
      count: g._count._all,
      oldestStagedAt: g._min.updatedAt ?? new Date(0),
      approveUrl: secret ? buildApproveUrl(g.batchId!, secret, baseUrl) : null,
    })),
  };
}

function emptyOutreachSnapshot(): OutreachSnapshot {
  return {
    queued: 0,
    sent: 0,
    replied: 0,
    bounced: 0,
    unsubscribed: 0,
    lastSendAt: null,
    todaysSends: 0,
  };
}

function emptySocialSnapshot(): SocialSnapshot {
  return {
    postedLast24h: [],
    queuedNext7d: [],
    failed: [],
    xCredentialsMissing: !process.env.X_API_KEY,
    lastAgentInsertAt: null,
  };
}

// ---- Date helpers ----

export function formatLondonDate(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: LONDON_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatLondonWeekday(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: LONDON_TZ,
    weekday: 'short',
  }).format(d);
}

function londonMidnight(now: Date): Date {
  const ymd = formatLondonDate(now);
  return new Date(`${ymd}T00:00:00Z`);
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
