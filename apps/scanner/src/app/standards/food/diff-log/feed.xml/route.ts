import { PUBLISHED_AT } from '@/lib/standards/food-v1-fields';
import { STANDARDS_DISCLAIMER_SHORT } from '@/lib/standards/disclaimer';

/**
 * `/food/diff-log/feed.xml` — Atom 1.0.
 *
 * Atom rather than RSS 2.0 per the binding IA §Atom feed: it has a real
 * date format, a required stable id per entry, and unambiguous content
 * typing. Trade-press desks and automated ingest are the intended
 * subscribers, and those three properties are exactly what they need.
 *
 * Valid while empty. A feed with zero entries is well-formed Atom, and
 * shipping it on publication day means a subscriber who finds the
 * standard now is already subscribed when the first entry lands — which
 * is the whole point of publishing the feed early.
 *
 * `updated` is pinned to the publication date rather than request time:
 * a feed that reports itself as freshly updated on every poll while
 * carrying no new entries trains readers to ignore it.
 */
export const dynamic = 'force-static';

const FEED_URL = 'https://standards.flintmere.com/food/diff-log/feed.xml';
const PAGE_URL = 'https://standards.flintmere.com/food/diff-log/';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  // Atom requires RFC 3339. The publication constant is a plain date, so
  // it is widened to midnight UTC rather than passed through a Date, which
  // would reintroduce the local-timezone drift the date handling elsewhere
  // in this module tree deliberately avoids.
  const updated = `${PUBLISHED_AT}T00:00:00Z`;

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Flintmere food catalog standard — change log</title>
  <subtitle>${escapeXml(STANDARDS_DISCLAIMER_SHORT)}</subtitle>
  <link href="${PAGE_URL}" rel="alternate" type="text/html"/>
  <link href="${FEED_URL}" rel="self" type="application/atom+xml"/>
  <id>${PAGE_URL}</id>
  <updated>${updated}</updated>
  <author>
    <name>Flintmere Regulatory Affairs</name>
  </author>
  <rights>CC-BY 4.0</rights>
</feed>
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    },
  });
}
