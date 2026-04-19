import OpenAI from 'openai';
import {
  LLMError,
  type CompletionOpts,
  type CompletionResult,
  type LLMProvider,
  type ProviderId,
  type VisionOpts,
} from '../types.js';

export interface AzureOpenAIProviderOptions {
  endpoint: string;
  apiKey: string;
  /** e.g. 'gpt-4o-mini' — must match your Azure deployment name. */
  deploymentName: string;
  apiVersion?: string;
  inputPriceTenthPencePerMillion?: number;
  outputPriceTenthPencePerMillion?: number;
}

export class AzureOpenAIProvider implements LLMProvider {
  readonly id: ProviderId = 'azure-openai';
  readonly model: string;
  private readonly client: OpenAI;
  private readonly inputPrice: number;
  private readonly outputPrice: number;

  constructor(private readonly options: AzureOpenAIProviderOptions) {
    this.model = options.deploymentName;
    this.inputPrice = options.inputPriceTenthPencePerMillion ?? 0;
    this.outputPrice = options.outputPriceTenthPencePerMillion ?? 0;

    const baseURL = `${options.endpoint.replace(/\/$/, '')}/openai/deployments/${options.deploymentName}`;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL,
      defaultQuery: { 'api-version': options.apiVersion ?? '2024-10-21' },
      defaultHeaders: { 'api-key': options.apiKey },
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

    const messages = opts.messages.map((m, idx) => {
      const isLast = idx === opts.messages.length - 1;
      if (isLast && images && m.role === 'user') {
        const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
          { type: 'text', text: m.content },
          ...images.map<OpenAI.Chat.Completions.ChatCompletionContentPart>((img) => ({
            type: 'image_url',
            image_url: {
              url: img.data.startsWith('http')
                ? img.data
                : `data:${img.mimeType};base64,${img.data}`,
            },
          })),
        ];
        return { role: 'user' as const, content };
      }
      return { role: m.role, content: m.content };
    });

    try {
      const completion = await this.client.chat.completions.create({
        model: this.options.deploymentName,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        max_tokens: opts.maxOutputTokens,
        temperature: opts.temperature,
        top_p: opts.topP,
        stop: opts.stopSequences,
      });

      const choice = completion.choices[0];
      const text = choice?.message.content ?? '';
      const finish = mapFinishReason(choice?.finish_reason);

      const inputTokens = completion.usage?.prompt_tokens ?? 0;
      const outputTokens = completion.usage?.completion_tokens ?? 0;

      return {
        text,
        finishReason: finish,
        usage: { inputTokens, outputTokens, cachedInputTokens: 0 },
        provider: this.id,
        model: this.model,
        latencyMs: Date.now() - started,
        costTenthPence: this.computeCost(inputTokens, outputTokens),
      };
    } catch (err) {
      throw wrapError(err);
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
  switch (raw) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'safety';
    case null:
    case undefined:
      return 'other';
    default:
      return 'other';
  }
}

function wrapError(err: unknown): LLMError {
  if (err instanceof OpenAI.APIError) {
    const message = err.message;
    if (err.status === 429) return new LLMError('rate-limit', message, 'azure-openai', err);
    if (err.status === 401 || err.status === 403)
      return new LLMError('auth', message, 'azure-openai', err);
    if (err.status && err.status >= 500)
      return new LLMError('provider-error', message, 'azure-openai', err);
    return new LLMError('provider-error', message, 'azure-openai', err);
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/timeout/i.test(message)) return new LLMError('timeout', message, 'azure-openai', err);
  return new LLMError('provider-error', message, 'azure-openai', err);
}
