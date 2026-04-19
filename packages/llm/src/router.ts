import { CircuitBreaker, type CircuitBreakerOptions } from './circuit-breaker.js';
import {
  LLMError,
  type CompletionOpts,
  type CompletionResult,
  type LLMProvider,
  type VisionOpts,
} from './types.js';

export type RouteTier = 'primary' | 'hardcase' | 'internal';

export interface RouterOptions {
  primary: LLMProvider;
  hardcase: LLMProvider;
  fallback: LLMProvider;
  /** Internal-only workloads. See `packages/llm/src/customer` vs internal boundary note. */
  internal?: LLMProvider;
  breaker?: Partial<CircuitBreakerOptions>;
  /** Optional cost + latency sink. Called after every successful call. */
  onCompletion?: (event: CompletionEvent) => void;
}

export interface CompletionEvent {
  tier: RouteTier;
  provider: CompletionResult['provider'];
  model: string;
  fellBackToFallback: boolean;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costTenthPence: number;
  requestId?: string;
  tag?: string;
}

const DEFAULT_BREAKER: CircuitBreakerOptions = {
  failureThreshold: 5,
  openDurationMs: 30_000,
};

/**
 * The canonical routing layer for Flintmere's customer-data LLM calls.
 * Apps import { LLMRouter } and never touch provider SDKs directly.
 */
export class LLMRouter {
  private readonly breaker: CircuitBreaker;

  constructor(private readonly options: RouterOptions) {
    this.breaker = new CircuitBreaker({
      ...DEFAULT_BREAKER,
      ...(options.breaker ?? {}),
    });
  }

  async completeBulk(opts: CompletionOpts): Promise<CompletionResult> {
    return this.route('primary', opts, null);
  }

  async completeHardCase(opts: CompletionOpts): Promise<CompletionResult> {
    return this.route('hardcase', opts, null);
  }

  async completeVisionBulk(opts: VisionOpts): Promise<CompletionResult> {
    return this.route('primary', opts, opts.images);
  }

  async completeInternal(opts: CompletionOpts): Promise<CompletionResult> {
    const provider = this.options.internal ?? this.options.primary;
    const result = await provider.complete(opts);
    this.emit('internal', result, false, opts);
    return result;
  }

  get circuit(): CircuitBreaker {
    return this.breaker;
  }

  private async route(
    tier: Exclude<RouteTier, 'internal'>,
    opts: CompletionOpts | VisionOpts,
    images: VisionOpts['images'] | null,
  ): Promise<CompletionResult> {
    const provider = tier === 'primary' ? this.options.primary : this.options.hardcase;

    try {
      const result = await this.breaker.run(() =>
        images
          ? provider.completeVision(opts as VisionOpts)
          : provider.complete(opts),
      );
      this.emit(tier, result, false, opts);
      return result;
    } catch (err) {
      if (shouldFailover(err)) {
        const result = images
          ? await this.options.fallback.completeVision(opts as VisionOpts)
          : await this.options.fallback.complete(opts);
        this.emit(tier, result, true, opts);
        return result;
      }
      throw err;
    }
  }

  private emit(
    tier: RouteTier,
    result: CompletionResult,
    fellBackToFallback: boolean,
    opts: CompletionOpts | VisionOpts,
  ): void {
    this.options.onCompletion?.({
      tier,
      provider: result.provider,
      model: result.model,
      fellBackToFallback,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs: result.latencyMs,
      costTenthPence: result.costTenthPence,
      requestId: opts.requestId,
      tag: opts.tag,
    });
  }
}

function shouldFailover(err: unknown): boolean {
  if (!(err instanceof LLMError)) return false;
  switch (err.code) {
    case 'circuit-open':
    case 'rate-limit':
    case 'timeout':
    case 'provider-error':
      return true;
    case 'safety-filter':
    case 'invalid-input':
    case 'auth':
    default:
      return false;
  }
}
