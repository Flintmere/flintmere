import { describe, expect, it, vi } from 'vitest';

import { findBannedPhrase, queuePosts, queuePostsSchema } from './queue-posts';
import type { QueuePostsPrisma } from './queue-posts';

const VALID_POST = {
  body: 'GTIN coverage is the first thing Google checks. We measured 312 UK food stores.',
  utmCampaign: 'gtin-coverage',
  scheduledAt: '2026-06-11T10:00:00Z',
};

describe('queuePostsSchema', () => {
  it('accepts a valid post array', () => {
    const result = queuePostsSchema.safeParse([VALID_POST]);
    expect(result.success).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(queuePostsSchema.safeParse([]).success).toBe(false);
  });

  it('rejects more than 10 posts per call', () => {
    const posts = Array.from({ length: 11 }, () => VALID_POST);
    expect(queuePostsSchema.safeParse(posts).success).toBe(false);
  });

  it('rejects a post exceeding 280 chars', () => {
    const result = queuePostsSchema.safeParse([
      { ...VALID_POST, body: 'x'.repeat(281) },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a banned phrase regardless of case', () => {
    const result = queuePostsSchema.safeParse([
      { ...VALID_POST, body: 'Unlock your catalog potential today' },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('banned phrase "unlock"');
    }
  });

  it('rejects a non-ISO scheduledAt', () => {
    const result = queuePostsSchema.safeParse([
      { ...VALID_POST, scheduledAt: '11/06/2026 10:00' },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects an ISO-shaped but invalid date', () => {
    const result = queuePostsSchema.safeParse([
      { ...VALID_POST, scheduledAt: '2026-13-45Tnonsense' },
    ]);
    expect(result.success).toBe(false);
  });

  it('leaves channel undefined when omitted (cross-post resolved at insert)', () => {
    const result = queuePostsSchema.safeParse([VALID_POST]);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data[0]?.channel).toBeUndefined();
  });

  it('accepts an explicit bluesky channel', () => {
    const result = queuePostsSchema.safeParse([{ ...VALID_POST, channel: 'bluesky' }]);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data[0]?.channel).toBe('bluesky');
  });

  it('rejects an unknown channel', () => {
    expect(queuePostsSchema.safeParse([{ ...VALID_POST, channel: 'linkedin' }]).success).toBe(false);
  });
});

describe('findBannedPhrase', () => {
  it('returns null for clean copy', () => {
    expect(findBannedPhrase('Real numbers only: 312 stores scanned.')).toBeNull();
  });

  it('finds a banned phrase case-insensitively', () => {
    expect(findBannedPhrase('Game-Changing results')).toBe('game-changing');
  });
});

describe('queuePosts', () => {
  it('inserts validated posts with their channel and parsed dates', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const client: QueuePostsPrisma = { socialPost: { createMany } };

    const queued = await queuePosts(
      [
        { ...VALID_POST, channel: 'x' },
        { ...VALID_POST, channel: 'bluesky', altText: 'score ring at 64', scheduledAt: '2026-06-13T10:00:00Z' },
      ],
      client,
    );

    expect(queued).toBe(2);
    expect(createMany).toHaveBeenCalledOnce();
    const { data } = createMany.mock.calls[0]![0] as {
      data: Array<{ channel: string; altText: string | null; scheduledAt: Date }>;
    };
    expect(data[0]).toMatchObject({ channel: 'x', altText: null });
    expect(data[1]).toMatchObject({ channel: 'bluesky', altText: 'score ring at 64' });
    expect(data[0]!.scheduledAt).toEqual(new Date('2026-06-11T10:00:00Z'));
  });

  it('cross-posts to x and bluesky when channel is omitted', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const client: QueuePostsPrisma = { socialPost: { createMany } };

    const queued = await queuePosts([VALID_POST], client);

    expect(queued).toBe(2);
    const { data } = createMany.mock.calls[0]![0] as {
      data: Array<{ channel: string; body: string }>;
    };
    expect(data.map((d) => d.channel)).toEqual(['x', 'bluesky']);
    expect(data[0]!.body).toBe(data[1]!.body);
  });

  it('queues a single channel when one is set explicitly', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const client: QueuePostsPrisma = { socialPost: { createMany } };

    await queuePosts([{ ...VALID_POST, channel: 'bluesky' }], client);

    const { data } = createMany.mock.calls[0]![0] as { data: Array<{ channel: string }> };
    expect(data.map((d) => d.channel)).toEqual(['bluesky']);
  });
});
