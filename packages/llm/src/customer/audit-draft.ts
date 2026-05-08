import type { z } from 'zod';
import {
  LLMError,
  type CompletionOpts,
  type CompletionResult,
  type Message,
} from '../types.js';

/**
 * Audit-assist v0 — structured-output Gemini call with one-shot repair.
 *
 * Generic in shape (caller passes the zod schema, the JSON schema, and
 * the prompt strings) so the same wrapper covers any future structured
 * customer-data call. The brief named the file audit-draft.ts; it stays
 * audit-draft-named while v0 is the only caller. Extract into a
 * generic name when a second customer call lands.
 *
 * Flow:
 *   1. Call `complete()` with system + user messages and structured-
 *      output config (responseMimeType + responseSchema).
 *   2. Parse `result.text` as JSON, validate against `schema`.
 *   3. On parse OR schema failure, retry once with a repair prompt
 *      that cites the zod error path. Second failure → throw.
 *   4. Return validated payload + cost / latency / attempts metadata.
 *
 * The wrapper does NOT construct providers — caller wires Vertex +
 * RejectingProvider through the LLMRouter and passes the bound
 * `router.completeHardCase` as the `complete` callback. That decouples
 * the wrapper from production env wiring and keeps tests trivial
 * (`vi.fn()` returns the canned text).
 */

export interface DraftAuditOpts<T> {
  /** The actual LLM call. In prod: `router.completeHardCase.bind(router)`. */
  complete: (opts: CompletionOpts) => Promise<CompletionResult>;
  /** System prompt — voice + structured-output discipline + cardinality. */
  systemPrompt: string;
  /** User message — scan summary + catalog sample + closing instruction. */
  userPrompt: string;
  /** Runtime validation. Caller owns the zod schema. */
  schema: z.ZodType<T>;
  /**
   * Provider-shape JSON schema for structured output. Vertex uses a
   * Gemini-flavoured JSON schema; the caller hand-writes it once.
   */
  responseSchema: object;
  maxOutputTokens?: number;
  temperature?: number;
  thinkingConfig?: CompletionOpts['thinkingConfig'];
  /** Correlation id propagated through logs + cost telemetry. */
  requestId?: string;
  /** Cost-telemetry tag. */
  tag?: string;
}

export interface DraftAuditResult<T> {
  data: T;
  rawText: string;
  /** 1 if the first attempt parsed; 2 if the repair attempt parsed. */
  attempts: 1 | 2;
  latencyMsTotal: number;
  costTenthPenceTotal: number;
}

export async function draftAudit<T>(
  opts: DraftAuditOpts<T>,
): Promise<DraftAuditResult<T>> {
  const messages: Message[] = [
    { role: 'system', content: opts.systemPrompt },
    { role: 'user', content: opts.userPrompt },
  ];

  // 32768 default leaves headroom for Gemini 2.5 Pro thinking tokens
  // (which count against maxOutputTokens) AND the structured JSON body.
  // Pro's dynamic thinking can consume 10–20k on a complex prompt; an
  // 8192 budget left zero for visible output, so the candidate text was
  // empty and Vertex returned finishReason=MAX_TOKENS.
  const baseCallOpts: CompletionOpts = {
    messages,
    maxOutputTokens: opts.maxOutputTokens ?? 32768,
    temperature: opts.temperature ?? 0.2,
    responseMimeType: 'application/json',
    responseSchema: opts.responseSchema,
    thinkingConfig: opts.thinkingConfig,
    requestId: opts.requestId,
    tag: opts.tag ?? 'audit-draft',
  };

  // Attempt 1.
  const first = await opts.complete(baseCallOpts);
  const firstParse = tryParse(first.text, opts.schema);
  if (firstParse.ok) {
    return {
      data: firstParse.data,
      rawText: first.text,
      attempts: 1,
      latencyMsTotal: first.latencyMs,
      costTenthPenceTotal: first.costTenthPence,
    };
  }

  // Attempt 2 — repair prompt cites the failure path so the model knows
  // exactly which field misbehaved. Cap at one retry: a second failure
  // is a prompt bug, not a transient LLM error, and a third attempt
  // would just spend tokens.
  const repairMessages: Message[] = [
    ...messages,
    { role: 'assistant', content: first.text },
    {
      role: 'user',
      content: buildRepairPrompt(firstParse.error),
    },
  ];

  const second = await opts.complete({
    ...baseCallOpts,
    messages: repairMessages,
    tag: `${opts.tag ?? 'audit-draft'}:repair`,
  });

  const secondParse = tryParse(second.text, opts.schema);
  if (secondParse.ok) {
    return {
      data: secondParse.data,
      rawText: second.text,
      attempts: 2,
      latencyMsTotal: first.latencyMs + second.latencyMs,
      costTenthPenceTotal: first.costTenthPence + second.costTenthPence,
    };
  }

  // Both attempts failed schema parse. Surface as provider-error so the
  // route handler maps to 502 `llm-schema-fail`.
  throw new LLMError(
    'provider-error',
    `audit-draft schema-parse failed twice: ${secondParse.error}`,
  );
}

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function tryParse<T>(text: string, schema: z.ZodType<T>): ParseResult<T> {
  // Strip a common Gemini quirk: code-fenced JSON. Vertex's structured-
  // output mode usually returns bare JSON, but occasionally wraps in
  // ```json fences. Defensive trim before parse.
  const trimmed = stripCodeFence(text.trim());
  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch (err) {
    return {
      ok: false,
      error: `JSON.parse failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; '),
    };
  }
  return { ok: true, data: result.data };
}

function stripCodeFence(text: string): string {
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const m = text.match(fenced);
  return m?.[1]?.trim() ?? text;
}

function buildRepairPrompt(error: string): string {
  return [
    'Your previous output failed schema validation:',
    error,
    '',
    'Produce the document again, conforming exactly to the supplied JSON',
    'schema. Output strict JSON only — no prose, no preamble, no code',
    'fences.',
  ].join('\n');
}
