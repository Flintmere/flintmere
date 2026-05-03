import { describe, expect, it } from 'vitest';
import type { ContactStatus } from '@/generated/prisma';
import {
  DEFAULT_CONTACT_RETENTION_MONTHS,
  RESOLVED_CONTACT_STATUSES,
  purgeResolvedContactThreads,
  type ContactPurgePrisma,
} from './contact-purge';

interface FakeRow {
  id: string;
  status: ContactStatus;
  updatedAt: Date;
}

function makeFakePrisma(rows: FakeRow[]): {
  client: ContactPurgePrisma;
  rows: FakeRow[];
} {
  const store = [...rows];
  const matches = (r: FakeRow, where: {
    status: { in: ContactStatus[] };
    updatedAt: { lt: Date };
  }): boolean =>
    where.status.in.includes(r.status) && r.updatedAt < where.updatedAt.lt;

  return {
    client: {
      contactMessage: {
        count: async ({ where }) => store.filter((r) => matches(r, where)).length,
        deleteMany: async ({ where }) => {
          const eligible = store.filter((r) => matches(r, where));
          for (const r of eligible) {
            const idx = store.indexOf(r);
            if (idx >= 0) store.splice(idx, 1);
          }
          return { count: eligible.length };
        },
        findFirst: async () => {
          if (store.length === 0) return null;
          return store
            .slice()
            .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())[0];
        },
      },
    },
    rows: store,
  };
}

const NOW = new Date('2026-05-03T00:00:00.000Z');

function monthsAgo(n: number): Date {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - n);
  return d;
}

describe('purgeResolvedContactThreads', () => {
  it('exposes 24-month default retention', () => {
    expect(DEFAULT_CONTACT_RETENTION_MONTHS).toBe(24);
  });

  it('lists exactly the resolved statuses; never includes new or acknowledged', () => {
    expect(RESOLVED_CONTACT_STATUSES).toEqual(['responded', 'archived', 'spam']);
  });

  it('deletes resolved rows older than the cutoff', async () => {
    const old1: FakeRow = { id: 'a', status: 'responded', updatedAt: monthsAgo(25) };
    const old2: FakeRow = { id: 'b', status: 'archived', updatedAt: monthsAgo(30) };
    const fresh: FakeRow = { id: 'c', status: 'responded', updatedAt: monthsAgo(12) };
    const { client, rows } = makeFakePrisma([old1, old2, fresh]);

    const result = await purgeResolvedContactThreads({ prisma: client, now: NOW });

    expect(result.eligibleCount).toBe(2);
    expect(result.deletedCount).toBe(2);
    expect(result.dryRun).toBe(false);
    expect(rows.map((r) => r.id)).toEqual(['c']);
  });

  it('never deletes open threads (new or acknowledged), even when ancient', async () => {
    const ancientNew: FakeRow = { id: 'a', status: 'new', updatedAt: monthsAgo(60) };
    const ancientAck: FakeRow = {
      id: 'b',
      status: 'acknowledged',
      updatedAt: monthsAgo(48),
    };
    const oldResolved: FakeRow = {
      id: 'c',
      status: 'responded',
      updatedAt: monthsAgo(30),
    };
    const { client, rows } = makeFakePrisma([ancientNew, ancientAck, oldResolved]);

    const result = await purgeResolvedContactThreads({ prisma: client, now: NOW });

    expect(result.deletedCount).toBe(1);
    expect(rows.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });

  it('honours a custom retention window for testing or policy change', async () => {
    const r6: FakeRow = { id: 'a', status: 'archived', updatedAt: monthsAgo(7) };
    const r4: FakeRow = { id: 'b', status: 'archived', updatedAt: monthsAgo(4) };
    const { client, rows } = makeFakePrisma([r6, r4]);

    const result = await purgeResolvedContactThreads({
      prisma: client,
      now: NOW,
      cutoffMonths: 6,
    });

    expect(result.deletedCount).toBe(1);
    expect(rows.map((r) => r.id)).toEqual(['b']);
  });

  it('dry-run counts eligible rows but does not delete', async () => {
    const old: FakeRow = { id: 'a', status: 'spam', updatedAt: monthsAgo(36) };
    const { client, rows } = makeFakePrisma([old]);

    const result = await purgeResolvedContactThreads({
      prisma: client,
      now: NOW,
      dryRun: true,
    });

    expect(result.eligibleCount).toBe(1);
    expect(result.deletedCount).toBe(0);
    expect(result.dryRun).toBe(true);
    expect(rows).toHaveLength(1);
  });

  it('is a no-op when nothing is eligible', async () => {
    const fresh: FakeRow = { id: 'a', status: 'responded', updatedAt: monthsAgo(6) };
    const { client, rows } = makeFakePrisma([fresh]);

    const result = await purgeResolvedContactThreads({ prisma: client, now: NOW });

    expect(result.eligibleCount).toBe(0);
    expect(result.deletedCount).toBe(0);
    expect(rows).toHaveLength(1);
  });

  it('reports the oldest preserved row for observability', async () => {
    const purged: FakeRow = {
      id: 'a',
      status: 'archived',
      updatedAt: monthsAgo(36),
    };
    const kept1: FakeRow = {
      id: 'b',
      status: 'new',
      updatedAt: monthsAgo(40),
    };
    const kept2: FakeRow = {
      id: 'c',
      status: 'responded',
      updatedAt: monthsAgo(3),
    };
    const { client } = makeFakePrisma([purged, kept1, kept2]);

    const result = await purgeResolvedContactThreads({ prisma: client, now: NOW });

    expect(result.deletedCount).toBe(1);
    expect(result.oldestPreservedAt).toEqual(kept1.updatedAt);
  });

  it('returns null oldestPreservedAt when the table is empty after purge', async () => {
    const only: FakeRow = {
      id: 'a',
      status: 'archived',
      updatedAt: monthsAgo(36),
    };
    const { client } = makeFakePrisma([only]);

    const result = await purgeResolvedContactThreads({ prisma: client, now: NOW });

    expect(result.deletedCount).toBe(1);
    expect(result.oldestPreservedAt).toBeNull();
  });
});
