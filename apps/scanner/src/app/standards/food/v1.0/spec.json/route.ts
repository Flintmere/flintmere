import { renderFoodV1JsonLd } from '@/lib/standards/food-v1-jsonld';
import { isPublishable } from '@/lib/standards/food-v1-fields';

/**
 * `/food/v1.0/spec.json` — the JSON-LD citation artefact.
 *
 * CC0 per ADR 0024 §Q2, so no licence gate and no attribution demand.
 * Immutable alongside its parent page: corrections publish at v1.0.1.
 *
 * Served with `application/ld+json` (not `application/json`) so RDF
 * tooling and crawlers recognise it as linked data rather than a generic
 * payload — that recognition is the entire point of shipping JSON-LD
 * instead of a bare object.
 *
 * No canonical link header: this is not HTML and has no HTML duplicate.
 */
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  if (!isPublishable()) {
    return new Response(
      JSON.stringify({ error: 'not_published' }, null, 2),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify(renderFoodV1JsonLd(), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      // Immutable artefact at an immutable URL — cache hard. Corrections
      // ship at a different URL, so there is nothing here to invalidate.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
