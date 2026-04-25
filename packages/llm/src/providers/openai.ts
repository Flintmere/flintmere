import OpenAI from 'openai';
import { sanitizeMessages } from '../sanitize.js';
import {
  LLMError,
  type CompletionOpts,
  type CompletionResult,
  type LLMProvider,
  type ProviderId,
  type VisionOpts,
} from '../types.js';

export interface OpenAIProviderOptions {
  apiKey: string;
  /** Project-scoped key required — `sk-proj-…`. User keys rejected per ADR 0010. */
  projectId: string;
  model?: string;
  /** Optional override; defaults to `https://api.openai.com/v1`. */
  baseURL?: string;
  inputPriceTenthPencePerMillion?: number;
  outputPriceTenthPencePerMillion?: number;
  /** Sink for sanitizer redaction counts. Plug your logger / Sentry here. */
  onRedactions?: (count: number) => void;
}

/**
 * OpenAI Platform fallback per ADR 0010.
 *
 * Posture:
 *   - `store: false` hard-coded — suppresses Application State retention only.
 *     Does NOT exempt the request from OpenAI's separate 30-day abuse-monitoring
 *     retention. ZDR is sales-gated and not in effect on this account tier.
 *   - Project-scoped key required at construction
 *   - All message content sanitized before transmission (PII scrub) — primary
 *     control given that abuse-monitoring retention applies to what does send
 *   - Vision fallback explicitly disabled
 */
export class OpenAIProvider implements LLMProvider {
  readonly id: ProviderId = 'openai';
  readonly model: string;
  private readonly client: OpenAI;
  private readonly inputPrice: number;
  private readonly outputPrice: number;
  private readonly onRedactions?: (count: number) => void;

  constructor(private readonly options: OpenAIProviderOptions) {
    if (!options.apiKey.startsWith('sk-proj-')) {
      throw new LLMError(
        'auth',
        'OpenAIProvider requires a project-scoped key (sk-proj-…); user keys rejected per ADR 0010',
        'openai',
      );
    }
    if (!options.projectId.startsWith('proj_')) {
      throw new LLMError(
        'auth',
        'OpenAIProvider requires a project id of the form proj_…',
        'openai',
      );
    }

    this.model = options.model ?? 'gpt-4o-mini';
    this.inputPrice = options.inputPriceTenthPencePerMillion ?? 0;
    this.outputPrice = options.outputPriceTenthPencePerMillion ?? 0;
    this.onRedactions = options.onRedactions;

    // Project-scoped keys (`sk-proj-…`) self-bind to their project at the
    // auth layer. Sending an `OpenAI-Project` header alongside a project-
    // scoped key is rejected with a 403 (treated as a cross-project request)
    // — even when the header matches the key's project. The OpenAI SDK
    // auto-reads `OPENAI_PROJECT_ID` from process.env and adds the header,
    // so we explicitly pass `project: null` to suppress that behaviour.
    // projectId stays on the provider for config-shape validation and
    // operator-readable audit trail; it is not sent on the wire.
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      project: null,
    });
  }

  async complete(opts: CompletionOpts): Promise<CompletionResult> {
    const sanitized = sanitizeMessages(opts.messages);
    if (sanitized.redactions > 0) this.onRedactions?.(sanitized.redactions);

    const started = Date.now();
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: sanitized.messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: opts.maxOutputTokens,
        temperature: opts.temperature,
        top_p: opts.topP,
        stop: opts.stopSequences,
        // Hard-coded posture per ADR 0010 — never env-configurable.
        store: false,
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

  async completeVision(_opts: VisionOpts): Promise<CompletionResult> {
    throw new LLMError(
      'invalid-input',
      'OpenAI fallback does not support vision per ADR 0010 (residency posture: image bytes cannot be sanitized; alt-text retries on next bulk cycle)',
      'openai',
    );
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
    if (err.status === 429) return new LLMError('rate-limit', message, 'openai', err);
    if (err.status === 401 || err.status === 403)
      return new LLMError('auth', message, 'openai', err);
    if (err.status && err.status >= 500)
      return new LLMError('provider-error', message, 'openai', err);
    return new LLMError('provider-error', message, 'openai', err);
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/timeout/i.test(message)) return new LLMError('timeout', message, 'openai', err);
  return new LLMError('provider-error', message, 'openai', err);
}
