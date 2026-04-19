/**
 * LLM router singleton for the Shopify app.
 *
 * Apps never import @google-cloud/vertexai or openai directly; they go through
 * @flintmere/llm per ADRs 0005 + 0006. This module owns the single router
 * instance + the cost/latency telemetry sink.
 */

import { createRouter, type CompletionEvent, type LLMRouter } from '@flintmere/llm';

declare global {
  // eslint-disable-next-line no-var
  var __llmRouter: LLMRouter | undefined;
}

function buildRouter(): LLMRouter {
  return createRouter(process.env, onCompletion);
}

function onCompletion(event: CompletionEvent): void {
  // Structured JSON log; stays under the 120-char log-line budget
  // Redact nothing — prompt content is NOT in this event.
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event: 'llm_completion',
    tier: event.tier,
    provider: event.provider,
    model: event.model,
    fellBack: event.fellBackToFallback,
    tokensIn: event.inputTokens,
    tokensOut: event.outputTokens,
    latencyMs: event.latencyMs,
    costTenthPence: event.costTenthPence,
    tag: event.tag,
    requestId: event.requestId,
  });
  // eslint-disable-next-line no-console
  console.log(line);
}

export function getLLMRouter(): LLMRouter {
  if (process.env.NODE_ENV === 'production') {
    return buildRouter();
  }
  if (!globalThis.__llmRouter) {
    globalThis.__llmRouter = buildRouter();
  }
  return globalThis.__llmRouter;
}
