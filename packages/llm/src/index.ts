export {
  LLMError,
  CompletionOptsSchema,
  VisionOptsSchema,
  MessageSchema,
  VisionImageSchema,
  MessageRoleSchema,
} from './types.js';

export type {
  CompletionOpts,
  CompletionResult,
  LLMProvider,
  Message,
  MessageRole,
  ProviderId,
  TokenUsage,
  VisionImage,
  VisionOpts,
} from './types.js';

export { LLMRouter } from './router.js';
export type { CompletionEvent, RouteTier, RouterOptions } from './router.js';

export { CircuitBreaker } from './circuit-breaker.js';
export type { CircuitBreakerOptions, CircuitState } from './circuit-breaker.js';

export { VertexProvider } from './providers/vertex.js';
export type { VertexProviderOptions } from './providers/vertex.js';

export { OpenAIProvider } from './providers/openai.js';
export type { OpenAIProviderOptions } from './providers/openai.js';

export { sanitizeText, sanitizeMessages } from './sanitize.js';
export type { SanitizeResult, SanitizeMessagesResult } from './sanitize.js';

export { createRouter, createRouterFromProviders } from './factory.js';
export type { FactoryEnv } from './factory.js';
