/* eslint-disable no-console */
/**
 * Insert agent-drafted posts into the SocialPost queue — ADR 0026.
 * Posts that omit "channel" cross-post to X + Bluesky (see queue-posts.ts).
 *
 * Usage: pnpm -F scanner social:queue path/to/posts.json
 * (no `--` separator — pnpm forwards it literally as argv and the script
 *  then tries to open a file named `--`; verified during the 2026-07-04
 *  carousel test drive)
 * JSON shape: [{ "body": "...", "utmCampaign": "kebab-slug",
 *               "scheduledAt": "2026-06-11T10:00:00Z",
 *               "images": [{ "path": "/abs/path/slide1.png", "alt": "..." }] }]
 *
 * Local sugar: a slide may name a local PNG `path` (Maters output —
 * outputs/<campaign>/slideN.png) instead of inline `imageBase64`; the
 * script inlines the file before validation. Order = display order, ≤4,
 * alt required per slide.
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

  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  // Inline local slide files (`path` → `imageBase64`) before validation.
  if (Array.isArray(raw)) {
    for (const post of raw) {
      const images = (post as { images?: unknown }).images;
      if (!Array.isArray(images)) continue;
      for (const slide of images) {
        const s = slide as { path?: string; imageBase64?: string };
        if (s.path && !s.imageBase64) {
          s.imageBase64 = readFileSync(s.path).toString('base64');
          delete s.path;
        }
      }
    }
  }
  const parsed = queuePostsSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`invalid posts.json — ${issues.join('; ')}`);
  }

  const count = await queuePosts(parsed.data);
  for (const p of parsed.data) {
    const slides = p.images?.length ? ` [${p.images.length} slide(s)]` : '';
    console.log(`queued for ${p.scheduledAt}${slides}: ${p.body.slice(0, 60)}…`);
  }
  console.log(`done — ${count} queued`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
  void prisma.$disconnect();
});
