/* eslint-disable no-console */
/**
 * Insert agent-drafted posts into the SocialPost queue — ADR 0026.
 * Posts that omit "channel" cross-post to X + Bluesky (see queue-posts.ts).
 *
 * Usage: pnpm -F scanner social:queue -- path/to/posts.json
 * JSON shape: [{ "body": "...", "utmCampaign": "kebab-slug",
 *               "scheduledAt": "2026-06-11T10:00:00Z", "altText": null }]
 *
 * Validation + insert live in src/lib/social/queue-posts (shared with
 * the /api/agent/queue-posts route): banned-phrase refusal
 * (memory/VOICE.md), 280-char cap, ISO scheduledAt, ≤10 per call.
 */

import { readFileSync } from 'node:fs';
import { prisma } from '../src/lib/db';
import { queuePosts, queuePostsSchema } from '../src/lib/social/queue-posts';

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) throw new Error('usage: social:queue -- <posts.json>');

  const parsed = queuePostsSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`invalid posts.json — ${issues.join('; ')}`);
  }

  const count = await queuePosts(parsed.data);
  for (const p of parsed.data) {
    console.log(`queued for ${p.scheduledAt}: ${p.body.slice(0, 60)}…`);
  }
  console.log(`done — ${count} queued`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
  void prisma.$disconnect();
});
