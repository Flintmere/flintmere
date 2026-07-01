import { revalidatePath } from 'next/cache';
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

// Purge the cached public-score surfaces for one merchant after a consent
// change (opt-in or opt-out), so it takes effect on the next request rather
// than waiting out the ISR window (#24 — consent withdrawal "without undue
// delay"). Covers the ISR score page and its separately-cached OpenGraph
// image; both use the LITERAL resolved path so only this merchant is
// invalidated (the `/score/[shop]` route-pattern form would purge every
// merchant). The badge is a manual-`Cache-Control` route handler that
// `revalidatePath` cannot touch — its freshness is governed by the header,
// not here. Call only from a Route Handler / Server Action.
export function revalidatePublicScore(domain: string): void {
  try {
    revalidatePath(`/score/${domain}`);
    revalidatePath(`/score/${domain}/opengraph-image`);
  } catch (err) {
    // Best-effort purge. The DB write is the source of truth and has already
    // committed by the time we get here, so a cache-layer failure must never
    // surface as a 500 or roll back the consent response — the ISR TTL is the
    // fallback that eventually reconciles the surfaces.
    console.error('[revalidatePublicScore] cache purge failed for', domain, err);
  }
}
