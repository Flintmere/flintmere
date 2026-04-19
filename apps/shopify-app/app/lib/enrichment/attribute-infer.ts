import { z } from 'zod';
import type { LLMRouter } from '@flintmere/llm';

export const VerticalSchema = z.enum([
  'beauty',
  'supplements',
  'apparel',
  'electronics',
  'home',
  'default',
]);
export type Vertical = z.infer<typeof VerticalSchema>;

export const AttributeInferInputSchema = z.object({
  title: z.string().min(1),
  descriptionPlain: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageMimeType: z
    .enum(['image/png', 'image/jpeg', 'image/webp'])
    .default('image/jpeg'),
  vertical: VerticalSchema.default('default'),
  requestId: z.string().optional(),
});
export type AttributeInferInput = z.infer<typeof AttributeInferInputSchema>;

export interface InferredAttribute {
  key: string;
  value: string;
  confidence: number;
}

export interface AttributeInferResult {
  attributes: InferredAttribute[];
  tokensUsed: number;
}

const VERTICAL_TEMPLATES: Record<Vertical, readonly string[]> = {
  beauty: [
    'skin_type',
    'ingredients_list',
    'volume_ml',
    'product_form',
    'fragrance_family',
  ],
  supplements: [
    'serving_size',
    'ingredients',
    'certifications',
    'age_restriction',
    'delivery_format',
  ],
  apparel: [
    'material_composition',
    'size_system',
    'care_instructions',
    'fit_type',
    'gender_age',
  ],
  electronics: [
    'model_number',
    'compatibility',
    'power_requirements',
    'connectivity',
    'warranty_terms',
  ],
  home: [
    'material',
    'dimensions',
    'weight',
    'assembly_required',
    'care_instructions',
  ],
  default: ['brand', 'product_type', 'material', 'primary_differentiator'],
};

const SYSTEM_PROMPT = `You infer structured product attributes from a Shopify product's title, description, and image.

Rules:
- Only report an attribute if you have direct evidence for it in the provided data.
- Never guess or invent values.
- Values must be literal (grams, ml, material names, size systems), not marketing.
- Confidence is 0.0 to 1.0; only report attributes with confidence >= 0.5.

Output format (one JSON object, no markdown fences):
{"attributes":[{"key":"...","value":"...","confidence":0.8}]}`;

/**
 * Tier 2 enrichment — primary (Flash) provider by default. Vertical-specific attribute templates
 * per SPEC §4.2 + §11.1 moat strategy.
 */
export async function inferAttributes(
  router: LLMRouter,
  inputRaw: AttributeInferInput,
): Promise<AttributeInferResult> {
  const input = AttributeInferInputSchema.parse(inputRaw);
  const template = VERTICAL_TEMPLATES[input.vertical];

  const context = [
    `Vertical: ${input.vertical}`,
    `Target attributes (only report those with evidence): ${template.join(', ')}`,
    `Product title: ${input.title}`,
    input.descriptionPlain
      ? `Description (first 800 chars): ${input.descriptionPlain.slice(0, 800)}`
      : null,
    'Return a JSON object. Only include attributes you can support from the data provided.',
  ]
    .filter(Boolean)
    .join('\n');

  const result = input.imageUrl
    ? await router.completeVisionBulk({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: context },
        ],
        images: [
          { data: input.imageUrl, mimeType: input.imageMimeType },
        ],
        maxOutputTokens: 512,
        temperature: 0.1,
        tag: `attr-infer:${input.vertical}`,
        requestId: input.requestId,
      })
    : await router.completeBulk({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: context },
        ],
        maxOutputTokens: 512,
        temperature: 0.1,
        tag: `attr-infer:${input.vertical}`,
        requestId: input.requestId,
      });

  const attributes = parseAttributes(result.text, template);

  return {
    attributes,
    tokensUsed: result.usage.inputTokens + result.usage.outputTokens,
  };
}

function parseAttributes(
  raw: string,
  allowedKeys: readonly string[],
): InferredAttribute[] {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  const allowed = new Set(allowedKeys);
  try {
    const parsed = JSON.parse(trimmed) as {
      attributes?: Array<{ key?: unknown; value?: unknown; confidence?: unknown }>;
    };
    if (!parsed.attributes || !Array.isArray(parsed.attributes)) return [];
    return parsed.attributes
      .map((a): InferredAttribute | null => {
        if (
          typeof a.key !== 'string' ||
          typeof a.value !== 'string' ||
          typeof a.confidence !== 'number'
        ) {
          return null;
        }
        if (!allowed.has(a.key)) return null;
        const confidence = Math.min(1, Math.max(0, a.confidence));
        if (confidence < 0.5) return null;
        return { key: a.key, value: a.value.trim(), confidence };
      })
      .filter((v): v is InferredAttribute => v !== null);
  } catch {
    return [];
  }
}

export { VERTICAL_TEMPLATES };
