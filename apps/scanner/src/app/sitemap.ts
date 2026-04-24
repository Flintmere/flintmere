import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const BASE = 'https://flintmere.com';

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/research', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/scan', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/audit', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/for/apparel', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/for/beauty', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/for/food-and-drink', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/bot', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/dpa', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/security', changeFrequency: 'yearly', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const publicScores = await prisma.scan.findMany({
    where: {
      publishPublicPage: true,
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    },
    select: { normalisedDomain: true, publicPageAt: true, completedAt: true },
    orderBy: { publicPageAt: 'desc' },
  });

  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...publicScores.map((s) => ({
      url: `${BASE}/score/${s.normalisedDomain}`,
      lastModified: s.publicPageAt ?? s.completedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];
}
