import { z } from 'zod';
import type { LLMRouter } from '@flintmere/llm';

export const AltTextInputSchema = z.object({
  imageUrl: z.string().url(),
  imageMimeType: z
    .enum(['image/png', 'image/jpeg', 'image/webp'])
    .default('image/jpeg'),
  productTitle: z.string().min(1),
  productType: z.string().optional(),
  brand: z.string().optional(),
  requestId: z.string().optional(),
});
export type AltTextInput = z.infer<typeof AltTextInputSchema>;

export interface AltTextResult {
  altText: string;
  confidence: number;
  tokensUsed: number;
}

const SYSTEM_PROMPT = `You write concise, literal alt text for e-commerce product images.

Rules:
- Describe what is shown, not what it does.
- Include material, colour, and any distinctive shape.
- Do not use marketing language ("beautiful", "stunning", "amazing").
- Do not use brand names unless the brand is legibly visible in the image.
- Maximum 125 characters.
- No "Image of" / "Picture of" prefixes.
- Return just the alt text on one line. No quotes, no commentary.`;

/**
 * Tier 1 auto-safe fix per SPEC §5.1.
 * Uses the primary (Flash) provider for cost efficiency.
 */
export async function generateAltText(
  router: LLMRouter,
  inputRaw: AltTextInput,
): Promise<AltTextResult> {
  const input = AltTextInputSchema.parse(inputRaw);

  const context = [
    `Product title: ${input.productTitle}`,
    input.productType ? `Product type: ${input.productType}` : null,
    input.brand ? `Brand: ${input.brand}` : null,
    'Write the alt text now:',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await router.completeVisionBulk({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: context },
    ],
    images: [{ data: input.imageUrl, mimeType: input.imageMimeType }],
    maxOutputTokens: 80,
    temperature: 0.2,
    tag: 'alt-text',
    requestId: input.requestId,
  });

  const altText = normaliseAltText(result.text);
  const confidence = estimateAltTextConfidence(altText, result.finishReason);

  return {
    altText,
    confidence,
    tokensUsed: result.usage.inputTokens + result.usage.outputTokens,
  };
}

function normaliseAltText(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^(image|picture|photo) of\s+/i, '')
    .replace(/\s+/g, ' ')
    .slice(0, 125);
}

function estimateAltTextConfidence(
  altText: string,
  finish: string,
): number {
  if (finish !== 'stop') return 0.3;
  if (altText.length < 20) return 0.4;
  if (altText.length > 120) return 0.6;
  if (/^(a |an |the )/i.test(altText)) return 0.7;
  return 0.85;
}
