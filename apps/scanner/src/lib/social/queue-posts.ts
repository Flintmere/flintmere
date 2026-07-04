/**
 * Agent-drafted social post intake — ADR 0026. Single validation + insert
 * surface shared by the local script (scripts/queue-social-posts.ts)
 * and the agent API route (/api/agent/queue-posts) so the remote
 * weekly agent and a local operator get identical guarantees:
 * 280-char cap, banned-phrase refusal (memory/VOICE.md — list mirrors
 * lib/daily-brief/compose.ts), ISO scheduledAt, ≤10 posts per call.
 */

import { z } from 'zod';
import { prisma } from '../db';
import { isPng } from './png';

/**
 * Minimum scheduling lead for agent-queued posts (route-enforced, not
 * schema-enforced — the local operator script may queue sooner). 12h
 * guarantees every agent-queued post appears in at least one daily
 * brief before the hourly cron could ever post it.
 */
export const AGENT_MIN_LEAD_MS = 12 * 60 * 60 * 1000;

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

/** X and Bluesky both cap a post at 4 images. */
export const MAX_SLIDES = 4;

/**
 * Per-slide decoded ceiling. Bluesky's app.bsky.embed.images blob limit
 * (1,000,000 bytes) binds — X allows 5MB — and one cap keeps a cross-posted
 * slide valid on both channels. Oversize renders are a Maters-side export
 * concern (recompress there); the queue refuses them loudly at intake.
 */
export const MAX_SLIDE_BYTES = 950_000;

/** Base64 expansion of MAX_SLIDE_BYTES (×4/3) plus slack — bounds decode cost. */
const MAX_SLIDE_BASE64_CHARS = 1_300_000;

const slideSchema = z.object({
  imageBase64: z.string().min(1).max(MAX_SLIDE_BASE64_CHARS),
  // Alt per slide is an accessibility floor (Noor #8): required, never empty.
  alt: z.string().min(1).max(1000),
});

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
  // Channel is optional: omitted ⇒ cross-post to every CROSSPOST_CHANNEL
  // (resolved in queuePosts), set explicitly to pin one. The 280 cap is the
  // binding length limit for both (Bluesky allows 300).
  channel: z.enum(['x', 'bluesky']).optional(),
  // The carousel IS the post: 1–4 ordered Maters slides, array index =
  // display order on both channels. Omit for a text-only post.
  images: z.array(slideSchema).min(1).max(MAX_SLIDES).optional(),
}).superRefine((post, ctx) => {
  for (const [i, slide] of (post.images ?? []).entries()) {
    const bytes = Buffer.from(slide.imageBase64, 'base64');
    if (!isPng(bytes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['images', i, 'imageBase64'],
        message: 'slide is not a PNG',
      });
    } else if (bytes.byteLength > MAX_SLIDE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['images', i, 'imageBase64'],
        message: `slide exceeds ${MAX_SLIDE_BYTES} decoded bytes (Bluesky blob limit binds) — recompress the Maters export`,
      });
    }
  }
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
        // Buffer, not Uint8Array: this Prisma version's Bytes input is Buffer[]
        // (queuePosts decodes with Buffer.from, so this is what we build anyway).
        images: Buffer[];
        imageAlts: string[];
      }>;
    }): Promise<{ count: number }>;
  };
}

/**
 * Channels a post fans out to when it doesn't name one. Cross-posting is the
 * default so every agent-drafted post (which omits `channel`) reaches both X
 * and Bluesky — a free Bluesky copy keeps publishing even when X is credit-blocked.
 */
export const CROSSPOST_CHANNELS = ['x', 'bluesky'] as const;

/** Insert validated posts into the SocialPost queue. Returns rows queued. */
export async function queuePosts(
  posts: QueuePostInput[],
  client: QueuePostsPrisma = prisma,
): Promise<number> {
  const { count } = await client.socialPost.createMany({
    data: posts.flatMap((p) => {
      const channels = p.channel ? [p.channel] : CROSSPOST_CHANNELS;
      // Cross-posted rows each carry the full slide set — megabytes/week at
      // our cadence, and the DB is the one store that survives redeploys.
      const images = (p.images ?? []).map((s) => Buffer.from(s.imageBase64, 'base64'));
      const imageAlts = (p.images ?? []).map((s) => s.alt);
      return channels.map((channel) => ({
        channel,
        body: p.body,
        altText: p.altText ?? null,
        utmCampaign: p.utmCampaign,
        scheduledAt: new Date(p.scheduledAt),
        images,
        imageAlts,
      }));
    }),
  });
  return count;
}
