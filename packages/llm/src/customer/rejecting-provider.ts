import {
  LLMError,
  type CompletionOpts,
  type CompletionResult,
  type LLMProvider,
  type ProviderId,
  type VisionOpts,
} from '../types.js';

/**
 * Fail-loud provider for routes that must NOT silently failover.
 *
 * Audit-assist v0 (per plan D2) injects this into the LLMRouter's
 * fallback slot. The router's automatic-failover machinery still runs
 * (so the cost telemetry hook + breaker stay live), but any failover
 * lands on RejectingProvider, which throws — and the throw propagates
 * out of the router, surfaced by the caller as a 503.
 *
 * The OpenAI fallback's privacy posture (catalog text in abuse-monitor
 * retention up to 30 days, no formal EU residency) is acceptable for
 * fallback bulk volume, not for one-shot premium audit drafts. Quality
 * surface; fail loud.
 */
export class RejectingProvider implements LLMProvider {
  readonly id: ProviderId = 'mock';
  readonly model: string;
  private readonly reason: string;

  constructor(reason = 'fallback intentionally disabled on this route') {
    this.reason = reason;
    this.model = 'rejecting';
  }

  async complete(_opts: CompletionOpts): Promise<CompletionResult> {
    throw new LLMError('provider-error', this.reason, this.id);
  }

  async completeVision(_opts: VisionOpts): Promise<CompletionResult> {
    throw new LLMError('provider-error', this.reason, this.id);
  }
}
