import type { Metadata } from 'next';
import { StandardsShell } from '@/components/standards/StandardsShell';
import { FoodStandardBody } from '@/components/standards/FoodStandardBody';
import {
  CANONICAL_URL,
  PUBLISHED_AT,
  isPublishable,
} from '@/lib/standards/food-v1-fields';

/**
 * `/food/v1.0/` — the immutable citation target.
 *
 * This is the URL trade press, academics, and RFPs are asked to cite, and
 * per the binding IA §Versioning it is immutable post-publication: the
 * content may be corrected only by publishing v1.0.1 at a new URL.
 * `lib/standards/__tests__/immutability.test.ts` enforces that at CI.
 *
 * `force-static` — no DB, no LLM, no request context. The authority
 * surface stays up even if scanner-side product code is failing.
 */
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Food catalog standard, version 1.0 — Flintmere',
  description:
    'Seven fields for describing a food catalog so shopping channels and AI agents read it correctly. Each field cites a primary regulator and carries a Shopify encoding rule. Free to read, free to cite.',
  alternates: { canonical: CANONICAL_URL },
  openGraph: {
    title: 'Food catalog standard, version 1.0 — Flintmere',
    description:
      'Seven fields, each citing a primary regulator, for describing a food catalog so channels and agents can read it.',
    url: CANONICAL_URL,
    type: 'article',
    publishedTime: PUBLISHED_AT,
  },
};

export default function FoodStandardV10() {
  // The publication gate. Every regulatory citation must have been opened
  // and confirmed by a human before this document is servable — ADR 0024
  // §Mitigations. Rendering an unverified standard would contradict its
  // own premise, so the route refuses rather than degrading.
  if (!isPublishable()) {
    throw new Error(
      'food v1.0 is not publishable: unverified regulatory citations remain. See lib/standards/food-v1-fields.ts.',
    );
  }

  return (
    <StandardsShell
      reviewedOn={PUBLISHED_AT}
      primarySource={{
        label: 'the Food Standards Agency',
        url: 'https://www.gov.uk/government/publications/allergen-labelling-for-food-manufacturers/allergen-labelling-for-food-manufacturers',
      }}
      citable={{
        title: 'Food catalog standard, version 1.0',
        url: CANONICAL_URL,
        publishedAt: PUBLISHED_AT,
        bibtexKey: 'flintmere2026foodv10',
      }}
    >
      <FoodStandardBody canonicalPath="/food/v1.0/" />
    </StandardsShell>
  );
}
