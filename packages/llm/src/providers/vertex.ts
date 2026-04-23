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
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: opts.maxOutputTokens,
          temperature: opts.temperature,
          topP: opts.topP,
          stopSequences: opts.stopSequences,
        },
      });

      const contents: Content[] = opts.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
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
