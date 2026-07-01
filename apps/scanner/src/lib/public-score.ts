import type { Prisma } from '@/generated/prisma';

// The consent gate shared by every public-facing score surface: the score
// page (`/score/[shop]`), its OpenGraph image, and the embeddable badge
// (`/badge/[shop]`). It selects a merchant's most recent scan that they
// opted to publish (`publishPublicPage`) and that completed with a score
// and grade. Centralised so the consent conditions cannot drift between
// the three surfaces that render a public score (#24) — each caller
// supplies its own `select`.
export function publishedScanQuery(domain: string) {
  return {
    where: {
      normalisedDomain: domain,
      publishPublicPage: true,
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    } satisfies Prisma.ScanWhereInput,
    orderBy: { completedAt: 'desc' } as const,
  };
}
