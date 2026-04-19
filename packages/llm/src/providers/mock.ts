import {
  LLMError,
  type CompletionOpts,
  type CompletionResult,
  type LLMProvider,
  type ProviderId,
  type VisionOpts,
} from '../types.js';

export interface MockCall {
  kind: 'complete' | 'completeVision';
  opts: CompletionOpts | VisionOpts;
  timestamp: number;
}

export interface MockProviderOptions {
  /** Canned text to return on every complete() / completeVision() call. */
  text?: string;
  /** If set, throw this error instead of returning. */
  error?: LLMError;
  /** Simulated latency in ms. */
  latencyMs?: number;
  /** Canned usage values. */
  usage?: { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number };
  model?: string;
}

/**
 * Deterministic, no-network provider for tests.
 * Records every call for assertion.
 */
export class MockProvider implements LLMProvider {
  readonly id: ProviderId = 'mock';
  readonly model: string;

  public readonly calls: MockCall[] = [];

  constructor(private readonly options: MockProviderOptions = {}) {
    this.model = options.model ?? 'mock-model';
  }

  async complete(opts: CompletionOpts): Promise<CompletionResult> {
    return this.handle({ kind: 'complete', opts, timestamp: Date.now() });
  }

  async completeVision(opts: VisionOpts): Promise<CompletionResult> {
    return this.handle({ kind: 'completeVision', opts, timestamp: Date.now() });
  }

  reset(): void {
    this.calls.length = 0;
  }

  private async handle(call: MockCall): Promise<CompletionResult> {
    this.calls.push(call);
    if (this.options.latencyMs) {
      await new Promise((r) => setTimeout(r, this.options.latencyMs));
    }
    if (this.options.error) throw this.options.error;
    return {
      text: this.options.text ?? 'mock response',
      finishReason: 'stop',
      usage: {
        inputTokens: this.options.usage?.inputTokens ?? 10,
        outputTokens: this.options.usage?.outputTokens ?? 20,
        cachedInputTokens: this.options.usage?.cachedInputTokens ?? 0,
      },
      provider: this.id,
      model: this.model,
      latencyMs: this.options.latencyMs ?? 1,
      costTenthPence: 0,
    };
  }
}
