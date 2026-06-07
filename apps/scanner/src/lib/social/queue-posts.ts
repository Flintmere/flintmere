/**
 * Agent-drafted X post intake — ADR 0026. Single validation + insert
 * surface shared by the local script (scripts/queue-social-posts.ts)
 * and the agent API route (/api/agent/queue-posts) so the remote
 * weekly agent and a local operator get identical guarantees:
 * 280-char cap, banned-phrase refusal (memory/VOICE.md — list mirrors
 * lib/daily-brief/compose.ts), ISO scheduledAt, ≤10 posts per call.
 */

import { z } from 'zod';
import { prisma } from '../db';

export const BANNED_PHRASES = [
  'leverage', 'unlock', 'transform', 'synergy', 'supercharge', 'world-class',
  'industry-leading', 'ai-powered', 'best-in-class', 'ai-driven', 'game-changing',
  'revolutionary', 'disruptive', 'next-generation', 'guaranteed', 'bulletproof',
  'trusted by',
] as const;

export function findBannedPhrase(body: string): string | null {
  const lower = body.toLowerCase();
  return BANNED_PHRASES.find((b) => lower.includes(b)) ?? null;
}

const postSchema = z.object({
  body: z
    .string()
    .min(1)
    .max(280, 'post exceeds 280 chars')
    .superRefine((body, ctx) => {
      const hit = findBannedPhrase(body);
      if (hit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `banned phrase "${hit}"`,
        });
      }
    }),
  utmCampaign: z.string().min(1).max(100),
  scheduledAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T/, 'scheduledAt must be ISO 8601')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'scheduledAt must be a valid date'),
  altText: z.string().max(1000).nullish(),
});

export const queuePostsSchema = z.array(postSchema).min(1).max(10);

export type QueuePostInput = z.infer<typeof postSchema>;

/** Narrow prisma surface so tests inject a fake (approval.ts pattern). */
export interface QueuePostsPrisma {
  socialPost: {
    createMany(args: {
      data: Array<{
        channel: string;
        body: string;
        altText: string | null;
        utmCampaign: string;
        scheduledAt: Date;
      }>;
    }): Promise<{ count: number }>;
  };
}

/** Insert validated posts into the SocialPost queue. Returns rows queued. */
export async function queuePosts(
  posts: QueuePostInput[],
  client: QueuePostsPrisma = prisma,
): Promise<number> {
  const { count } = await client.socialPost.createMany({
    data: posts.map((p) => ({
      channel: 'x',
      body: p.body,
      altText: p.altText ?? null,
      utmCampaign: p.utmCampaign,
      scheduledAt: new Date(p.scheduledAt),
    })),
  });
  return count;
}
