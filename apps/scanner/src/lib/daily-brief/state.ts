/**
 * Daily-brief state collection — gather signals deterministically before
 * handing them to the LLM compose step.
 *
 * Three signals in v1:
 *   1. Today's operator playbook (context/operator-daily-playbook.md)
 *   2. Active marketing cadence runbook (newest file in
 *      projects/flintmere/runbooks/ matching *-marketing-launch-and-cadence.md)
 *   3. Outreach DB snapshot (counts by status, today's sends, last-send timestamp)
 *
 * Every collector is wrapped to never throw — partial-failure tolerance
 * is the point. Each failure pushes a one-line warning onto `warnings[]`;
 * the LLM compose step surfaces those in the brief footer so silent
 * degradation can't hide.
 *
 * Filesystem reads resolve paths relative to the repo root, which we
 * derive from process.cwd() walking upward to find a `pnpm-workspace.yaml`.
 * This works under `pnpm --filter scanner …` (cwd = apps/scanner) and
 * under Coolify's Next runtime (cwd = apps/scanner/.next/standalone).
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { prisma } from '../db';
import type { BriefState, OutreachSnapshot } from './types';

const PLAYBOOK_PATH_FROM_ROOT = 'context/operator-daily-playbook.md';
const CADENCE_DIR_FROM_ROOT = 'projects/flintmere/runbooks';
const CADENCE_PATTERN = /-marketing-launch-and-cadence\.md$/;

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

  const [playbookResult, cadenceResult, outreachResult] = await Promise.allSettled([
    readPlaybook(repoRoot),
    readActiveCadence(repoRoot),
    snapshotOutreach(now),
  ]);

  const playbookContent =
    playbookResult.status === 'fulfilled' ? playbookResult.value : '';
  if (playbookResult.status === 'rejected') {
    warnings.push(
      `playbook unreadable — falling back to cadence only: ${describe(playbookResult.reason)}`,
    );
  }

  const cadenceContent =
    cadenceResult.status === 'fulfilled' ? cadenceResult.value : '';
  if (cadenceResult.status === 'rejected') {
    warnings.push(
      `cadence unreadable — brief composed without week context: ${describe(cadenceResult.reason)}`,
    );
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
    cadenceContent,
    outreach,
    warnings,
  };
}

// ---- Repo-root discovery ----

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
  // Fall back to cwd if nothing matched; callers handle the missing-file
  // case via warnings.
  return start;
}

// ---- Filesystem readers ----

async function readPlaybook(repoRoot: string): Promise<string> {
  const path = join(repoRoot, PLAYBOOK_PATH_FROM_ROOT);
  return readFile(path, 'utf8');
}

async function readActiveCadence(repoRoot: string): Promise<string> {
  const dir = join(repoRoot, CADENCE_DIR_FROM_ROOT);
  const entries = await readdir(dir);
  const matches = entries.filter((name) => CADENCE_PATTERN.test(name)).sort();
  if (matches.length === 0) {
    throw new Error(`no cadence runbook matches ${CADENCE_PATTERN} in ${dir}`);
  }
  // Sort puts the most-recent dated filename last (lexicographic on
  // YYYY-MM-DD prefix).
  const newest = matches[matches.length - 1]!;
  return readFile(join(dir, newest), 'utf8');
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
  // sv-SE locale renders YYYY-MM-DD via Intl, sidestepping a manual
  // timezone offset calc. `timeZone: 'Europe/London'` lets the formatter
  // handle BST/GMT transitions.
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
  // YYYY-MM-DD in London, then parse as UTC midnight of that day. Close
  // enough for the day-bucket query — a one-hour edge during BST
  // transitions is acceptable for "today's sends" semantics.
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
