import { z } from 'zod';
import type { LLMRouter } from '@flintmere/llm';

export const TitleRewriteInputSchema = z.object({
  currentTitle: z.string().min(1),
  brand: z.string().optional(),
  productType: z.string().optional(),
  descriptionPlain: z.string().optional(),
  requestId: z.string().optional(),
});
export type TitleRewriteInput = z.infer<typeof TitleRewriteInputSchema>;

export interface TitleRewriteResult {
  proposedTitle: string;
  changeSummary: string[];
  confidence: number;
  tokensUsed: number;
}

const SYSTEM_PROMPT = `You rewrite Shopify product titles for AI-agent readability.

Rules (strict):
- Target format: [Brand] [Product type] [primary differentiator] [size/variant if critical].
- Maximum 150 characters.
- No marketing fluff: no "BEST", "EVER", "LIMITED", no "!!!", no ALL-CAPS words.
- No emoji.
- Use literal, descriptive language only.
- Preserve factual content from the original title; never invent attributes.
- Keep the brand name, product type, and any quantitative differentiator (volume, size, colour).

Output format (exactly two lines):
TITLE: <the rewritten title>
CHANGES: <short comma-separated list of what you changed>

If the original title is already agent-ready, output the original verbatim and CHANGES: none.`;

/**
 * Hard-case per ADR 0006 — goes to Gemini 2.5 Pro (or the hard-case provider configured).
 */
export async function rewriteTitle(
  router: LLMRouter,
  inputRaw: TitleRewriteInput,
): Promise<TitleRewriteResult> {
  const input = TitleRewriteInputSchema.parse(inputRaw);

  const context = [
    `Original title: ${input.currentTitle}`,
    input.brand ? `Brand: ${input.brand}` : null,
    input.productType ? `Product type: ${input.productType}` : null,
    input.descriptionPlain
      ? `Description excerpt (first 400 chars): ${input.descriptionPlain.slice(0, 400)}`
      : null,
    'Rewrite the title now:',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await router.completeHardCase({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: context },
    ],
    maxOutputTokens: 200,
    temperature: 0.1,
    tag: 'title-rewrite',
    requestId: input.requestId,
  });

  const parsed = parseResponse(result.text);
  const confidence = estimateTitleConfidence(
    input.currentTitle,
    parsed.proposedTitle,
    result.finishReason,
  );

  return {
    proposedTitle: parsed.proposedTitle,
    changeSummary: parsed.changes,
    confidence,
    tokensUsed: result.usage.inputTokens + result.usage.outputTokens,
  };
}

function parseResponse(text: string): {
  proposedTitle: string;
  changes: string[];
} {
  const titleMatch = /^TITLE:\s*(.+)$/im.exec(text);
  const changesMatch = /^CHANGES:\s*(.+)$/im.exec(text);
  const proposedTitle = (titleMatch?.[1] ?? '').trim().slice(0, 150);
  const rawChanges = (changesMatch?.[1] ?? '').trim();
  const changes = rawChanges && rawChanges.toLowerCase() !== 'none'
    ? rawChanges.split(/,\s*/).filter(Boolean)
    : [];
  return { proposedTitle, changes };
}

function estimateTitleConfidence(
  original: string,
  proposed: string,
  finish: string,
): number {
  if (!proposed) return 0;
  if (finish !== 'stop') return 0.3;
  if (proposed.length > 150) return 0.4;
  if (proposed === original) return 1;
  if (proposed.length < 10) return 0.2;
  // Simple proxy: confidence higher when change is incremental, not a complete invention.
  const overlap = overlapRatio(original, proposed);
  if (overlap < 0.3) return 0.4;
  if (overlap < 0.5) return 0.6;
  return 0.88;
}

function overlapRatio(a: string, b: string): number {
  const aw = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const bw = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (aw.size === 0) return 0;
  let shared = 0;
  for (const w of aw) if (bw.has(w)) shared += 1;
  return shared / aw.size;
}
