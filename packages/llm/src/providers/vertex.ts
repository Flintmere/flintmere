import {
  VertexAI,
  type Content,
  type GenerateContentRequest,
  type Part,
} from '@google-cloud/vertexai';
import {
  LLMError,
  type CompletionOpts,
  type CompletionResult,
  type LLMProvider,
  type ProviderId,
  type VisionOpts,
} from '../types.js';

export interface VertexProviderOptions {
  project: string;
  location: string;
  /** e.g. 'gemini-2.5-flash' or 'gemini-2.5-pro' */
  model: string;
  /** Price per 1M input tokens, in tenths-of-pence (so 120 = £0.0012 / 1K in). 0 skips cost log. */
  inputPriceTenthPencePerMillion?: number;
  /** Price per 1M output tokens. */
  outputPriceTenthPencePerMillion?: number;
}

export class VertexProvider implements LLMProvider {
  readonly id: ProviderId = 'vertex';
  readonly model: string;
  private readonly client: VertexAI;
  private readonly inputPrice: number;
  private readonly outputPrice: number;

  constructor(private readonly options: VertexProviderOptions) {
    this.model = options.model;
    this.inputPrice = options.inputPriceTenthPencePerMillion ?? 0;
    this.outputPrice = options.outputPriceTenthPencePerMillion ?? 0;
    this.client = new VertexAI({
      project: options.project,
      location: options.location,
    });
  }

  async complete(opts: CompletionOpts): Promise<CompletionResult> {
    return this.invoke(opts, null);
  }

  async completeVision(opts: VisionOpts): Promise<CompletionResult> {
    return this.invoke(opts, opts.images);
  }

  private async invoke(
    opts: CompletionOpts,
    images: VisionOpts['images'] | null,
  ): Promise<CompletionResult> {
    const started = Date.now();
    try {
      // Structured-output passthrough — when caller sets
      // `responseMimeType: 'application/json'` (and optionally
      // `responseSchema`), Vertex constrains output to that shape. The
      // SDK's GenerationConfig type may or may not surface these fields
      // depending on @google-cloud/vertexai version; we cast through
      // `unknown` to avoid pinning the SDK type. Verified against
      // @google-cloud/vertexai ^1.9 (the project's pinned version).
      const generationConfig: Record<string, unknown> = {
        maxOutputTokens: opts.maxOutputTokens,
        temperature: opts.temperature,
        topP: opts.topP,
        stopSequences: opts.stopSequences,
      };
      if (opts.responseMimeType) {
        generationConfig.responseMimeType = opts.responseMimeType;
      }
      if (opts.responseSchema !== undefined) {
        generationConfig.responseSchema = opts.responseSchema;
      }
      // Gemini surface system prompts via `systemInstruction` on the
      // model config — NOT via a `system` role in `contents`. The
      // OpenAI-shaped `Message[]` we accept allows `system` for
      // cross-provider portability; we extract system messages here
      // and concatenate (rare but possible) before passing through.
      // Caught 2026-05-06 — the audit-draft route was the first caller
      // to send a system message; Vertex 400'd "Content with system
      // role is not supported" until this split landed.
      const systemMessages = opts.messages.filter((m) => m.role === 'system');
      const nonSystemMessages = opts.messages.filter(
        (m) => m.role !== 'system',
      );
      const systemInstructionText = systemMessages
        .map((m) => m.content)
        .join('\n\n');

      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
        generationConfig:
          generationConfig as unknown as GenerateContentRequest['generationConfig'],
        ...(systemInstructionText && {
          systemInstruction: systemInstructionText,
        }),
      });

      const contents: Content[] = nonSystemMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }] as Part[],
      }));

      if (images && images.length > 0) {
        const last = contents[contents.length - 1];
        const lastText = last?.parts?.[0]?.text ?? '';
        const lastParts: Part[] = [{ text: lastText }];
        for (const img of images) {
          lastParts.push({
            inlineData: { mimeType: img.mimeType, data: img.data },
          });
        }
        contents[contents.length - 1] = { role: 'user', parts: lastParts };
      }

      const request: GenerateContentRequest = { contents };

      const response = await generativeModel.generateContent(request);
      const aggregated = response.response;
      const candidate = aggregated.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text ?? '';
      const finish = mapFinishReason(candidate?.finishReason);

      const inputTokens = aggregated.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = aggregated.usageMetadata?.candidatesTokenCount ?? 0;
      const cachedInputTokens =
        aggregated.usageMetadata?.cachedContentTokenCount ?? 0;

      return {
        text,
        finishReason: finish,
        usage: { inputTokens, outputTokens, cachedInputTokens },
        provider: this.id,
        model: this.model,
        latencyMs: Date.now() - started,
        costTenthPence: this.computeCost(inputTokens, outputTokens),
      };
    } catch (err) {
      throw wrapVertexError(err);
    }
  }

  private computeCost(input: number, output: number): number {
    if (!this.inputPrice && !this.outputPrice) return 0;
    const cost =
      (input / 1_000_000) * this.inputPrice +
      (output / 1_000_000) * this.outputPrice;
    return Math.round(cost);
  }
}

function mapFinishReason(raw: unknown): CompletionResult['finishReason'] {
  const reason = typeof raw === 'string' ? raw.toUpperCase() : '';
  if (reason.includes('SAFETY')) return 'safety';
  if (reason.includes('MAX_TOKENS')) return 'length';
  if (reason.includes('STOP')) return 'stop';
  if (reason === '' || reason === 'FINISH_REASON_UNSPECIFIED') return 'other';
  return 'other';
}

function wrapVertexError(err: unknown): LLMError {
  const message = err instanceof Error ? err.message : String(err);
  if (/429|rate|quota/i.test(message)) {
    return new LLMError('rate-limit', message, 'vertex', err);
  }
  if (/401|403|auth/i.test(message)) {
    return new LLMError('auth', message, 'vertex', err);
  }
  if (/timeout|deadline/i.test(message)) {
    return new LLMError('timeout', message, 'vertex', err);
  }
  if (/safety|blocked/i.test(message)) {
    return new LLMError('safety-filter', message, 'vertex', err);
  }
  return new LLMError('provider-error', message, 'vertex', err);
}
