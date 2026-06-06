/* eslint-disable no-console */
/**
 * Insert agent-drafted X posts into the SocialPost queue — ADR 0026.
 *
 * Usage: pnpm -F scanner social:queue -- path/to/posts.json
 * JSON shape: [{ "body": "...", "utmCampaign": "kebab-slug",
 *               "scheduledAt": "2026-06-11T10:00:00Z", "altText": null }]
 *
 * Refuses any body containing a banned phrase (memory/VOICE.md — this
 * list mirrors lib/daily-brief/compose.ts) or exceeding 280 chars.
 */

import { readFileSync } from 'node:fs';
import { prisma } from '../src/lib/db';

const BANNED = [
  'leverage', 'unlock', 'transform', 'synergy', 'supercharge', 'world-class',
  'industry-leading', 'ai-powered', 'best-in-class', 'ai-driven', 'game-changing',
  'revolutionary', 'disruptive', 'next-generation', 'guaranteed', 'bulletproof',
  'trusted by',
];

interface PostInput {
  body: string;
  utmCampaign: string;
  scheduledAt: string;
  altText?: string | null;
}

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) throw new Error('usage: social:queue -- <posts.json>');

  const posts = JSON.parse(readFileSync(path, 'utf8')) as PostInput[];
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('posts.json must be a non-empty array');
  }

  // Validate all posts before touching the DB.
  for (const p of posts) {
    if (p.body.length > 280) {
      throw new Error(`post exceeds 280 chars: ${p.body.slice(0, 60)}…`);
    }
    const lower = p.body.toLowerCase();
    const hit = BANNED.find((b) => lower.includes(b));
    if (hit) throw new Error(`banned phrase "${hit}" in: ${p.body.slice(0, 60)}…`);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(p.scheduledAt)) {
      throw new Error(`scheduledAt must be ISO: ${p.scheduledAt}`);
    }
  }

  for (const p of posts) {
    const created = await prisma.socialPost.create({
      data: {
        channel: 'x',
        body: p.body,
        altText: p.altText ?? null,
        utmCampaign: p.utmCampaign,
        scheduledAt: new Date(p.scheduledAt),
      },
    });
    console.log(`queued ${created.id} for ${p.scheduledAt}: ${p.body.slice(0, 60)}…`);
  }

  console.log(`done — ${posts.length} queued`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
  void prisma.$disconnect();
});
