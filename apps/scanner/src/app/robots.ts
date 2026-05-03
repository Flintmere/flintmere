import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { MARKETING_HOST, SCANNER_HOST } from '@/lib/host-routing';

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

  const host =
    requestHost === SCANNER_HOST ? SCANNER_HOST : MARKETING_HOST;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/score/*/raw'],
      },
    ],
    sitemap: `https://${host}/sitemap.xml`,
    host: `https://${host}`,
  };
}
