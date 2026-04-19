import { LLMError } from './types.js';

export interface CircuitBreakerOptions {
  /** Consecutive failures that open the circuit. */
  failureThreshold: number;
  /** Milliseconds to keep circuit open before trying a probe request. */
  openDurationMs: number;
  /** A callback invoked on state change — plug your logger / Sentry here. */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Minimal circuit breaker. When `failureThreshold` consecutive failures occur,
 * the circuit opens for `openDurationMs` — during which calls throw
 * LLMError('circuit-open') without touching the underlying provider.
 *
 * After the open window elapses, the next call is a "probe" (half-open):
 * success closes the circuit; failure re-opens it.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt < this.options.openDurationMs) {
        throw new LLMError('circuit-open', 'Circuit is open; failing fast.');
      }
      this.transition('half-open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  get current(): CircuitState {
    return this.state;
  }

  private onSuccess(): void {
    if (this.state === 'half-open' || this.state === 'open') {
      this.transition('closed');
    }
    this.consecutiveFailures = 0;
  }

  private onFailure(): void {
    this.consecutiveFailures += 1;
    if (this.state === 'half-open') {
      this.transition('open');
      this.openedAt = Date.now();
      return;
    }
    if (
      this.state === 'closed' &&
      this.consecutiveFailures >= this.options.failureThreshold
    ) {
      this.transition('open');
      this.openedAt = Date.now();
    }
  }

  private transition(to: CircuitState): void {
    const from = this.state;
    if (from === to) return;
    this.state = to;
    this.options.onStateChange?.(from, to);
  }
}
