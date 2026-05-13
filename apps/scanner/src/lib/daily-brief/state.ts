/**
 * Daily-brief state collection.
 *
 * Cadence content travels with every build via the bundled snapshot
 * (apps/scanner/src/lib/daily-brief/cadence-snapshot.ts) — generated
 * by `pnpm sync-cadence`. No runtime fs read for cadence; it's a TS
 * import.
 *
 * Playbook content is operator-local (context/operator-daily-playbook.md
 * is gitignored). In the prod container the file isn't present, the
 * read is silently absent (`playbookContent` is empty, no warning).
 * In local dev the read succeeds and the LLM gets richer context.
 *
 * The DB snapshot is unchanged: counts by status, today's sends,
 * last-send timestamp.
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { stat } from 'node:fs/promises';
import { prisma } from '../db';
import {
  cadenceMarkdown,
  cadenceFilename,
  cadenceSnapshotAt,
} from './cadence-snapshot';
import type { BriefState, OutreachSnapshot } from './types';

const PLAYBOOK_PATH_FROM_ROOT = 'context/operator-daily-playbook.md';
const LONDON_TZ = 'Europe/London';

export interface CollectOptions {
  /** Override for tests. */
  now?: Date;
  /** Override repo root for tests. */
  repoRoot?: string;
}

export async function collectBriefState(
  options: CollectOptions = {},
): Promise<BriefState> {
  const now = options.now ?? new Date();
  const warnings: string[] = [];

  const repoRoot = options.repoRoot ?? (await findRepoRoot(process.cwd()));

  const [playbookResult, outreachResult] = await Promise.allSettled([
    readPlaybook(repoRoot),
    snapshotOutreach(now),
  ]);

  let playbookContent = '';
  if (playbookResult.status === 'fulfilled') {
    playbookContent = playbookResult.value;
  } else if (!isEnoent(playbookResult.reason)) {
    // ENOENT is the expected prod case — silent. Anything else is a
    // real surprise that the operator should see.
    warnings.push(`playbook read failed: ${describe(playbookResult.reason)}`);
  }

  const outreach: OutreachSnapshot =
    outreachResult.status === 'fulfilled'
      ? outreachResult.value
      : emptyOutreachSnapshot();
  if (outreachResult.status === 'rejected') {
    warnings.push(
      `outreach DB query failed — counters omitted: ${describe(outreachResult.reason)}`,
    );
  }

  return {
    date: formatLondonDate(now),
    weekday: formatLondonWeekday(now),
    playbookContent,
    cadenceContent: cadenceMarkdown,
    cadenceSource: cadenceFilename,
    cadenceSnapshotAt,
    outreach,
    warnings,
  };
}

// ---- Repo-root discovery (dev-only; prod skips the playbook read) ----

async function findRepoRoot(start: string): Promise<string> {
  let cur = start;
  for (let i = 0; i < 8; i++) {
    try {
      const marker = await stat(join(cur, 'pnpm-workspace.yaml'));
      if (marker.isFile()) return cur;
    } catch {
      // walk up
    }
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return start;
}

async function readPlaybook(repoRoot: string): Promise<string> {
  const path = join(repoRoot, PLAYBOOK_PATH_FROM_ROOT);
  return readFile(path, 'utf8');
}

// ---- DB snapshot ----

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

function isEnoent(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'ENOENT'
  );
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
