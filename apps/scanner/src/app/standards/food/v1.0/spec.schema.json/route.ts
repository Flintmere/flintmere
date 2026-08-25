import { renderFoodV1JsonSchema } from '@/lib/standards/food-v1-jsonschema';
import { isPublishable } from '@/lib/standards/food-v1-fields';

/**
 * `/food/v1.0/spec.schema.json` — JSON Schema 2020-12, for validators.
 *
 * The developer-facing half of the ADR 0024 §Q12 pair: `spec.json` is the
 * citation artefact, this is what tooling validates a product record
 * against. CC0, same as spec.json.
 *
 * `application/schema+json` is the registered media type for JSON Schema
 * documents; validators sniff it.
 */
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  if (!isPublishable()) {
    return new Response(
      JSON.stringify({ error: 'not_published' }, null, 2),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify(renderFoodV1JsonSchema(), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/schema+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
