import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  MARKETING_HOST,
  SCANNER_HOST,
  STANDARDS_HOST,
} from '@/lib/host-routing';
import { getAllPosts } from '@/lib/blog/posts';

// Per-host sitemap. Reads x-forwarded-host (Coolify/Traefik) before
// falling back to the host header. Each host emits ONLY the routes that
// live on it — flintmere.com lists marketing surfaces, audit.flintmere.com
// lists scanner surfaces + opt-in /score pages, standards.flintmere.com
// lists the food regulatory standard surface.
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
  { path: '/founder', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/security', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/sitemap', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/dpa', changeFrequency: 'yearly', priority: 0.2 },
];

const SCANNER_SITEMAP_ROUTES: RouteEntry[] = [
  { path: '/scan', changeFrequency: 'monthly', priority: 1.0 },
  { path: '/catalog-letter', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/bot', changeFrequency: 'yearly', priority: 0.3 },
];

// Phase 1: only the holding page. Phase 2 (post-ingestion-engine) lands
// the actual taxonomy under /food, /food/allergens, /food/origin etc. —
// added here when the routes go live.
// Pinned versions are the citation targets and carry the highest
// priority. The rolling alias `/food/v1/` is deliberately EXCLUDED per
// the binding IA §Routes table — listing both it and the pinned URL
// would hand crawlers two URLs with identical content and invite a
// duplicate-content split across exactly the pages we want ranking.
const STANDARDS_SITEMAP_ROUTES: RouteEntry[] = [
  { path: '/', changeFrequency: 'monthly', priority: 1.0 },
  { path: '/food/', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/food/v1.0/', changeFrequency: 'yearly', priority: 1.0 },
  { path: '/food/v1.0/spec', changeFrequency: 'yearly', priority: 0.7 },
  { path: '/food/diff-log', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/how-to-cite', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
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

  if (requestHost === STANDARDS_HOST) {
    const base = `https://${STANDARDS_HOST}`;
    return STANDARDS_SITEMAP_ROUTES.map((r) => ({
      url: `${base}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    }));
  }

  if (requestHost === SCANNER_HOST) {
    const base = `https://${SCANNER_HOST}`;
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

    // Blog posts (file-based MDX, non-draft). lastModified = updatedAt ??
    // publishedAt (YYYY-MM-DD → Date at UTC midnight).
    const blogPosts = getAllPosts().map((p) => {
      const iso = p.frontmatter.updatedAt ?? p.frontmatter.publishedAt;
      return {
        url: `${base}/blog/${p.frontmatter.slug}`,
        lastModified: new Date(`${iso}T00:00:00Z`),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    });

    return [
      ...SCANNER_SITEMAP_ROUTES.map((r) => ({
        url: `${base}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
      })),
      ...blogPosts,
      ...publicScores.map((s) => ({
        url: `${base}/score/${s.normalisedDomain}`,
        lastModified: s.publicPageAt ?? s.completedAt ?? now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })),
    ];
  }

  const base = `https://${MARKETING_HOST}`;
  return MARKETING_SITEMAP_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
