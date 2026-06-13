/**
 * SocialPost queue consumer — ADR 0026. Picks due queued rows (≤3 per
 * run; cadence is 2–3/week so this is purely defensive), posts via the
 * injected poster, marks posted/failed. Failed rows are terminal until
 * the weekly agent re-queues — no auto-retry, no silent loops.
 */

import { prisma } from '../db';

const MAX_PER_RUN = 3;

/** Channels the queue knows about. The cron narrows the set it actually
 *  runs to those whose credentials are configured, so a queued row for an
 *  unconfigured channel stays `queued` rather than burning to `failed`. */
export const KNOWN_CHANNELS = ['x', 'bluesky'];

/** Post outcome — structurally shared by every channel client
 *  (x-client `PostTweetResult`, bluesky-client `PostSkeetResult`). */
export type PostResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string };

export type Poster = (channel: string, text: string) => Promise<PostResult>;

export interface SocialQueuePrisma {
  socialPost: {
    findMany(args: {
      where: { status: string; scheduledAt: { lte: Date }; channel: { in: string[] } };
      orderBy: { scheduledAt: 'asc' };
      take: number;
    }): Promise<Array<{ id: string; body: string; channel: string }>>;
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
  client: SocialQueuePrisma = prisma,
  poster: Poster,
  now: Date = new Date(),
  channels: string[] = KNOWN_CHANNELS,
): Promise<SocialBatchResult> {
  const due = await client.socialPost.findMany({
    where: { status: 'queued', scheduledAt: { lte: now }, channel: { in: channels } },
    orderBy: { scheduledAt: 'asc' },
    take: MAX_PER_RUN,
  });
  let posted = 0;
  let failed = 0;
  for (const post of due) {
    const result = await poster(post.channel, post.body);
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
