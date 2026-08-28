import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import {
  LEGACY_SCANNER_HOST,
  MARKETING_HOST,
  SCANNER_HOST,
  STANDARDS_HOST,
  KNOWN_HOSTS,
} from '@/lib/host-routing';

// Per-host robots.txt. Each host advertises its own sitemap (the
// per-host sitemap.ts emits only that host's routes).
//
// `force-dynamic` because Next.js needs to re-render per request to
// pick up the host header. Robots is hit infrequently — cost is fine.
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const hdrs = await headers();
  const requestHost = (
    hdrs.get('x-forwarded-host') ??
    hdrs.get('host') ??
    MARKETING_HOST
  )
    .split(':')[0]!
    .toLowerCase();

  // `/robots.txt` is host-agnostic, so it is never redirected — a crawler
  // on the legacy scanner host gets a real response from here. Fold it onto
  // the canonical host so it inherits the scanner disallow rules and
  // advertises the canonical sitemap; advertising the legacy host as
  // canonical would work against the Search Console change of address.
  const resolved =
    requestHost === LEGACY_SCANNER_HOST ? SCANNER_HOST : requestHost;
  const host = KNOWN_HOSTS.includes(resolved) ? resolved : MARKETING_HOST;

  const disallow =
    host === SCANNER_HOST ? ['/api/', '/score/*/raw'] : ['/api/'];

  // AI / answer-engine crawlers, allowed explicitly (blog AEO standard §D —
  // "get cited by AI engines"). They inherit the `*` allow, but naming them
  // is the canonical signal that the blog + standard are fair game for
  // answer-engine citation. Add new agents here as they emerge.
  const AI_CRAWLERS = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'Google-Extended',
    'PerplexityBot',
    'ClaudeBot',
    'Claude-Web',
    'Applebot-Extended',
    'CCBot',
    'cohere-ai',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow,
      })),
    ],
    sitemap: `https://${host}/sitemap.xml`,
    host: `https://${host}`,
  };
}
