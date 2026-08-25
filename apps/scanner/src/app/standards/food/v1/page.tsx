import type { Metadata } from 'next';
import { StandardsShell } from '@/components/standards/StandardsShell';
import { FoodStandardBody } from '@/components/standards/FoodStandardBody';
import { PUBLISHED_AT, isPublishable } from '@/lib/standards/food-v1-fields';

/**
 * `/food/v1/` — rolling alias, always serving the current v1.x release.
 *
 * Self-renders rather than redirecting, per the binding IA §Versioning:
 * the alias has its own purpose (casual reading, "current state" links
 * from flintmere.com) and canonicalises to ITSELF, never to the pinned
 * version. Canonicalising an alias at the pinned URL would collapse the
 * two into one SEO entity and defeat the point of having both.
 *
 * NOT a citation target. The body renders an explicit note saying so
 * when it is mounted here.
 */
export const dynamic = 'force-static';

const ROLLING_URL = 'https://standards.flintmere.com/food/v1/';

export const metadata: Metadata = {
  title: 'Food catalog standard, v1 (current) — Flintmere',
  description:
    'The current release of the Flintmere food catalog standard. For citation use the pinned URL /food/v1.0/, which never changes.',
  alternates: { canonical: ROLLING_URL },
  openGraph: {
    title: 'Food catalog standard, v1 (current) — Flintmere',
    description:
      'The current release of the Flintmere food catalog standard.',
    url: ROLLING_URL,
    type: 'article',
  },
};

export default function FoodStandardV1Rolling() {
  if (!isPublishable()) {
    throw new Error(
      'food v1 is not publishable: unverified regulatory citations remain. See lib/standards/food-v1-fields.ts.',
    );
  }

  return (
    <StandardsShell
      reviewedOn={PUBLISHED_AT}
      primarySource={{
        label: 'the Food Standards Agency',
        url: 'https://www.gov.uk/government/publications/allergen-labelling-for-food-manufacturers/allergen-labelling-for-food-manufacturers',
      }}
    >
      <FoodStandardBody canonicalPath="/food/v1/" />
    </StandardsShell>
  );
}
