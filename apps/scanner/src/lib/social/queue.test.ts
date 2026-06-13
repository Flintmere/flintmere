import { describe, it, expect } from 'vitest';
import { runSocialPostBatch, type SocialQueuePrisma, type Poster } from './queue';

interface Row {
  id: string; channel: string; body: string; status: string;
  scheduledAt: Date; postedAt: Date | null; externalId: string | null; errorMessage: string | null;
}

function makeFakePrisma(rows: Row[]): SocialQueuePrisma {
  return {
    socialPost: {
      findMany: async ({ where, orderBy: _o, take }) =>
        rows
          .filter(
            (r) =>
              r.status === where.status &&
              r.scheduledAt <= where.scheduledAt.lte &&
              where.channel.in.includes(r.channel),
          )
          .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
          .slice(0, take),
      update: async ({ where, data }) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
    },
  };
}

const NOW = new Date('2026-06-10T10:00:00Z');

function row(id: string, scheduledAt: Date, status = 'queued', channel = 'x'): Row {
  return { id, channel, body: `post ${id}`, status, scheduledAt, postedAt: null, externalId: null, errorMessage: null };
}

describe('runSocialPostBatch', () => {
  it('posts due rows oldest-first and marks them posted', async () => {
    const rows = [row('a', new Date('2026-06-09T09:00:00Z')), row('b', new Date('2026-06-10T09:00:00Z')), row('c', new Date('2026-06-11T09:00:00Z'))];
    const posted: string[] = [];
    const poster: Poster = async (_channel, text) => { posted.push(text); return { ok: true, id: `x-${posted.length}` }; };
    const result = await runSocialPostBatch(makeFakePrisma(rows), poster, NOW);
    expect(posted).toEqual(['post a', 'post b']); // c not due
    expect(result).toEqual({ attempted: 2, posted: 2, failed: 0 });
    expect(rows[0]!.status).toBe('posted');
    expect(rows[0]!.externalId).toBe('x-1');
    expect(rows[2]!.status).toBe('queued');
  });

  it('marks failures with the error body and continues', async () => {
    const rows = [row('a', new Date('2026-06-09T09:00:00Z')), row('b', new Date('2026-06-09T10:00:00Z'))];
    const poster: Poster = async (_channel, text) =>
      text === 'post a' ? { ok: false, status: 429, error: 'rate limited' } : { ok: true, id: 'x-ok' };
    const result = await runSocialPostBatch(makeFakePrisma(rows), poster, NOW);
    expect(result).toEqual({ attempted: 2, posted: 1, failed: 1 });
    expect(rows[0]!.status).toBe('failed');
    expect(rows[0]!.errorMessage).toBe('429: rate limited');
    expect(rows[1]!.status).toBe('posted');
  });

  it('dispatches each row to its own channel', async () => {
    const rows = [
      row('a', new Date('2026-06-09T09:00:00Z'), 'queued', 'x'),
      row('b', new Date('2026-06-09T10:00:00Z'), 'queued', 'bluesky'),
    ];
    const seen: Array<{ channel: string; text: string }> = [];
    const poster: Poster = async (channel, text) => { seen.push({ channel, text }); return { ok: true, id: `${channel}-id` }; };
    const result = await runSocialPostBatch(makeFakePrisma(rows), poster, NOW);
    expect(seen).toEqual([
      { channel: 'x', text: 'post a' },
      { channel: 'bluesky', text: 'post b' },
    ]);
    expect(result).toEqual({ attempted: 2, posted: 2, failed: 0 });
    expect(rows[1]!.externalId).toBe('bluesky-id');
  });

  it('runs only channels in the allowlist and leaves the rest queued', async () => {
    const rows = [
      row('a', new Date('2026-06-09T09:00:00Z'), 'queued', 'x'),
      row('b', new Date('2026-06-09T10:00:00Z'), 'queued', 'bluesky'),
    ];
    const poster: Poster = async (channel) => ({ ok: true, id: `${channel}-id` });
    const result = await runSocialPostBatch(makeFakePrisma(rows), poster, NOW, ['x']);
    expect(result).toEqual({ attempted: 1, posted: 1, failed: 0 });
    expect(rows[0]!.status).toBe('posted');
    expect(rows[1]!.status).toBe('queued'); // bluesky held — creds not configured
  });

  it('does nothing when queue is empty', async () => {
    const result = await runSocialPostBatch(makeFakePrisma([]), async () => ({ ok: true, id: 'x' }), NOW);
    expect(result).toEqual({ attempted: 0, posted: 0, failed: 0 });
  });
});
