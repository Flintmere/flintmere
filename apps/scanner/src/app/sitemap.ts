import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  MARKETING_HOST,
  SCANNER_HOST,
} from '@/lib/host-routing';

// Per-host sitemap. Reads x-forwarded-host (Coolify/Traefik) before
// falling back to the host header. Each host emits ONLY the routes that
// live on it — flintmere.com lists marketing surfaces, audit.flintmere.com
// lists scanner surfaces + opt-in /score pages.
//
// `force-dynamic` because we read request headers + a live DB query.
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface RouteEntry {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}

const MARKETING_SITEMAP_ROUTES: RouteEntry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/research', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/methodology', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/for/food-and-drink', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/for/beauty', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/for/apparel', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/for/plus', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/security', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/dpa', changeFrequency: 'yearly', priority: 0.2 },
];

const SCANNER_SITEMAP_ROUTES: RouteEntry[] = [
  { path: '/scan', changeFrequency: 'monthly', priority: 1.0 },
  { path: '/audit', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/bot', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const hdrs = await headers();
  const requestHost = (
    hdrs.get('x-forwarded-host') ??
    hdrs.get('host') ??
    MARKETING_HOST
  )
    .split(':')[0]!
    .toLowerCase();

  const isScannerHost = requestHost === SCANNER_HOST;
  const host = isScannerHost ? SCANNER_HOST : MARKETING_HOST;
  const base = `https://${host}`;

  if (isScannerHost) {
    const publicScores = await prisma.scan.findMany({
      where: {
        publishPublicPage: true,
        status: 'complete',
        score: { not: null },
        grade: { not: null },
      },
      select: {
        normalisedDomain: true,
        publicPageAt: true,
        completedAt: true,
      },
      orderBy: { publicPageAt: 'desc' },
    });

    return [
      ...SCANNER_SITEMAP_ROUTES.map((r) => ({
        url: `${base}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
      })),
      ...publicScores.map((s) => ({
        url: `${base}/score/${s.normalisedDomain}`,
        lastModified: s.publicPageAt ?? s.completedAt ?? now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })),
    ];
  }

  return MARKETING_SITEMAP_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
