import type { ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { authenticate } from '../../shopify.server';
import { getLLMRouter } from '../../lib/llm.server';
import {
  generateAltText,
  rewriteTitle,
  inferAttributes,
} from '../../lib/enrichment';

/**
 * Preview an enrichment without applying it.
 * Dry-run required before any Tier 2 bulk apply per SPEC §5.2.
 *
 * POST /api/enrichment/preview
 * {
 *   "kind": "alt-text" | "title-rewrite" | "attribute-infer",
 *   "input": { ... specific to kind ... }
 * }
 */

const BodySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('alt-text'),
    input: z.object({
      imageUrl: z.string().url(),
      imageMimeType: z
        .enum(['image/png', 'image/jpeg', 'image/webp'])
        .default('image/jpeg'),
      productTitle: z.string().min(1),
      productType: z.string().optional(),
      brand: z.string().optional(),
    }),
  }),
  z.object({
    kind: z.literal('title-rewrite'),
    input: z.object({
      currentTitle: z.string().min(1),
      brand: z.string().optional(),
      productType: z.string().optional(),
      descriptionPlain: z.string().optional(),
    }),
  }),
  z.object({
    kind: z.literal('attribute-infer'),
    input: z.object({
      title: z.string().min(1),
      descriptionPlain: z.string().optional(),
      imageUrl: z.string().url().optional(),
      imageMimeType: z
        .enum(['image/png', 'image/jpeg', 'image/webp'])
        .default('image/jpeg'),
      vertical: z
        .enum(['beauty', 'supplements', 'apparel', 'electronics', 'home', 'default'])
        .default('default'),
    }),
  }),
]);

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (err) {
    return Response.json(
      {
        ok: false,
        code: 'bad-request',
        message:
          err instanceof z.ZodError
            ? err.flatten().fieldErrors
            : 'Invalid body.',
      },
      { status: 400 },
    );
  }

  const router = getLLMRouter();
  const requestId = crypto.randomUUID();

  try {
    switch (body.kind) {
      case 'alt-text': {
        const result = await generateAltText(router, {
          ...body.input,
          requestId,
        });
        return Response.json({
          ok: true,
          requestId,
          shop: session.shop,
          kind: 'alt-text',
          preview: result,
        });
      }
      case 'title-rewrite': {
        const result = await rewriteTitle(router, {
          ...body.input,
          requestId,
        });
        return Response.json({
          ok: true,
          requestId,
          shop: session.shop,
          kind: 'title-rewrite',
          preview: result,
        });
      }
      case 'attribute-infer': {
        const result = await inferAttributes(router, {
          ...body.input,
          requestId,
        });
        return Response.json({
          ok: true,
          requestId,
          shop: session.shop,
          kind: 'attribute-infer',
          preview: result,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, requestId, code: 'enrichment-failed', message },
      { status: 502 },
    );
  }
}
