/**
 * SocialPost queue consumer — ADR 0026. Picks due queued rows (≤3 per
 * run; cadence is 2–3/week so this is purely defensive), posts via the
 * injected poster, marks posted/failed. Failed rows are terminal until
 * the weekly agent re-queues — no auto-retry, no silent loops.
 */

import { prisma } from '../db';
import type { PostTweetResult } from './x-client';

const MAX_PER_RUN = 3;

export type Poster = (text: string) => Promise<PostTweetResult>;

export interface SocialQueuePrisma {
  socialPost: {
    findMany(args: {
      where: { status: string; scheduledAt: { lte: Date } };
      orderBy: { scheduledAt: 'asc' };
      take: number;
    }): Promise<Array<{ id: string; body: string }>>;
    update(args: {
      where: { id: string };
      data:
        | { status: 'posted'; postedAt: Date; externalId: string }
        | { status: 'failed'; errorMessage: string };
    }): Promise<unknown>;
  };
}

export interface SocialBatchResult {
  attempted: number;
  posted: number;
  failed: number;
}

export async function runSocialPostBatch(
  client: SocialQueuePrisma = prisma as unknown as SocialQueuePrisma,
  poster: Poster,
  now: Date = new Date(),
): Promise<SocialBatchResult> {
  const due = await client.socialPost.findMany({
    where: { status: 'queued', scheduledAt: { lte: now } },
    orderBy: { scheduledAt: 'asc' },
    take: MAX_PER_RUN,
  });
  let posted = 0;
  let failed = 0;
  for (const post of due) {
    const result = await poster(post.body);
    if (result.ok) {
      await client.socialPost.update({
        where: { id: post.id },
        data: { status: 'posted', postedAt: now, externalId: result.id },
      });
      posted++;
    } else {
      await client.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorMessage: `${result.status}: ${result.error}`.slice(0, 2000) },
      });
      failed++;
    }
  }
  return { attempted: due.length, posted, failed };
}
