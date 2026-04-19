import { z } from 'zod';

// ---- Input ----

export const MessageRoleSchema = z.enum(['system', 'user', 'assistant']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const CompletionOptsSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  maxOutputTokens: z.number().int().positive().default(1024),
  temperature: z.number().min(0).max(2).default(0.2),
  topP: z.number().min(0).max(1).optional(),
  stopSequences: z.array(z.string()).optional(),
  /** Arbitrary tag used by cost logging + rate limiting. */
  tag: z.string().optional(),
  /** A stable correlation id that propagates through logs. */
  requestId: z.string().optional(),
});
export type CompletionOpts = z.infer<typeof CompletionOptsSchema>;

export const VisionImageSchema = z.object({
  /** Base64-encoded image bytes or a publicly-reachable https URL. */
  data: z.string(),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
});
export type VisionImage = z.infer<typeof VisionImageSchema>;

export const VisionOptsSchema = CompletionOptsSchema.extend({
  images: z.array(VisionImageSchema).min(1),
});
export type VisionOpts = z.infer<typeof VisionOptsSchema>;

// ---- Output ----

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}

export interface CompletionResult {
  text: string;
  finishReason: 'stop' | 'length' | 'safety' | 'error' | 'other';
  usage: TokenUsage;
  provider: ProviderId;
  model: string;
  /** Unix ms */
  latencyMs: number;
  /** Estimated cost in tenths of a pence (so 100 = £0.01). 0 means unknown. */
  costTenthPence: number;
}

// ---- Providers ----

export type ProviderId = 'vertex' | 'azure-openai' | 'mock';

export interface LLMProvider {
  readonly id: ProviderId;
  readonly model: string;
  complete(opts: CompletionOpts): Promise<CompletionResult>;
  completeVision(opts: VisionOpts): Promise<CompletionResult>;
}

// ---- Errors ----

export class LLMError extends Error {
  constructor(
    public readonly code:
      | 'provider-error'
      | 'safety-filter'
      | 'rate-limit'
      | 'timeout'
      | 'invalid-input'
      | 'auth'
      | 'circuit-open',
    message: string,
    public readonly provider?: ProviderId,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
