import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  draftAudit,
  RejectingProvider,
  LLMError,
  type CompletionOpts,
  type CompletionResult,
} from '../src/index.js';

// Minimal schema fixture — keeps the test orthogonal to the canonical
// AuditDraftSchema in apps/scanner. Tests the wrapper's parse + retry,
// not the canonical schema (covered by apps/scanner schema.test.ts).
const FixtureSchema = z.object({
  shop: z.string(),
  pillars: z.array(z.string()).length(3),
  confidence: z.number().min(0).max(1),
});

const validFixture = {
  shop: 'bluetokyo.co.uk',
  pillars: ['identifiers', 'titles', 'attributes'],
  confidence: 0.82,
};

function buildResult(text: string, latencyMs = 1000, costTenthPence = 50): CompletionResult {
  return {
    text,
    finishReason: 'stop',
    usage: { inputTokens: 100, outputTokens: 200, cachedInputTokens: 0 },
    provider: 'vertex',
    model: 'gemini-2.5-pro',
    latencyMs,
    costTenthPence,
  };
}

const baseOpts = {
  systemPrompt: 'You are an audit drafter.',
  userPrompt: 'Draft for bluetokyo.co.uk.',
  schema: FixtureSchema,
  responseSchema: { type: 'object' } as object,
};

describe('RejectingProvider', () => {
  it('throws LLMError(provider-error) on complete()', async () => {
    const provider = new RejectingProvider();
    const opts: CompletionOpts = {
      messages: [{ role: 'user', content: 'hi' }],
      maxOutputTokens: 100,
      temperature: 0.2,
    };
    await expect(provider.complete(opts)).rejects.toBeInstanceOf(LLMError);
    await expect(provider.complete(opts)).rejects.toMatchObject({
      code: 'provider-error',
    });
  });

  it('throws LLMError(provider-error) on completeVision()', async () => {
    const provider = new RejectingProvider();
    const opts = {
      messages: [{ role: 'user' as const, content: 'hi' }],
      maxOutputTokens: 100,
      temperature: 0.2,
      images: [{ data: 'b64', mimeType: 'image/png' as const }],
    };
    await expect(provider.completeVision(opts)).rejects.toMatchObject({
      code: 'provider-error',
    });
  });

  it('exposes the configured reason in the error message', async () => {
    const provider = new RejectingProvider('audit-draft is fail-loud');
    const opts: CompletionOpts = {
      messages: [{ role: 'user', content: 'hi' }],
      maxOutputTokens: 100,
      temperature: 0.2,
    };
    await expect(provider.complete(opts)).rejects.toThrow(/audit-draft is fail-loud/);
  });
});

describe('draftAudit — happy path', () => {
  it('parses valid JSON on the first attempt and returns attempts=1', async () => {
    const complete = vi.fn().mockResolvedValueOnce(
      buildResult(JSON.stringify(validFixture)),
    );

    const result = await draftAudit({ ...baseOpts, complete });

    expect(complete).toHaveBeenCalledOnce();
    expect(result.attempts).toBe(1);
    expect(result.data).toEqual(validFixture);
    expect(result.latencyMsTotal).toBe(1000);
    expect(result.costTenthPenceTotal).toBe(50);
  });

  it('strips ```json code fences before parsing', async () => {
    const fenced = '```json\n' + JSON.stringify(validFixture) + '\n```';
    const complete = vi.fn().mockResolvedValueOnce(buildResult(fenced));

    const result = await draftAudit({ ...baseOpts, complete });

    expect(result.attempts).toBe(1);
    expect(result.data).toEqual(validFixture);
  });

  it('passes responseMimeType=application/json and responseSchema through', async () => {
    const complete = vi.fn().mockResolvedValueOnce(
      buildResult(JSON.stringify(validFixture)),
    );

    await draftAudit({ ...baseOpts, complete });

    const called: CompletionOpts = complete.mock.calls[0]![0];
    expect(called.responseMimeType).toBe('application/json');
    expect(called.responseSchema).toEqual({ type: 'object' });
  });
});

describe('draftAudit — repair retry', () => {
  it('retries once on malformed JSON, then returns attempts=2', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(buildResult('not-json{', 800, 30))
      .mockResolvedValueOnce(buildResult(JSON.stringify(validFixture), 1200, 60));

    const result = await draftAudit({ ...baseOpts, complete });

    expect(complete).toHaveBeenCalledTimes(2);
    expect(result.attempts).toBe(2);
    expect(result.data).toEqual(validFixture);
    expect(result.latencyMsTotal).toBe(2000);
    expect(result.costTenthPenceTotal).toBe(90);
  });

  it('retries once on schema-fail (valid JSON but wrong shape)', async () => {
    const wrongShape = { shop: 'x', pillars: ['a'], confidence: 5 };
    const complete = vi
      .fn()
      .mockResolvedValueOnce(buildResult(JSON.stringify(wrongShape)))
      .mockResolvedValueOnce(buildResult(JSON.stringify(validFixture)));

    const result = await draftAudit({ ...baseOpts, complete });

    expect(complete).toHaveBeenCalledTimes(2);
    expect(result.attempts).toBe(2);
    expect(result.data).toEqual(validFixture);
  });

  it('repair prompt cites the schema failure path', async () => {
    const wrongShape = { shop: 'x', pillars: ['a'], confidence: 5 };
    const complete = vi
      .fn()
      .mockResolvedValueOnce(buildResult(JSON.stringify(wrongShape)))
      .mockResolvedValueOnce(buildResult(JSON.stringify(validFixture)));

    await draftAudit({ ...baseOpts, complete });

    const repairCall: CompletionOpts = complete.mock.calls[1]![0];
    const repairMessage = repairCall.messages.at(-1)!;
    expect(repairMessage.role).toBe('user');
    expect(repairMessage.content).toMatch(/failed schema validation/i);
    expect(repairMessage.content).toMatch(/strict JSON only/i);
  });

  it('repair attempt is tagged so cost telemetry separates retries', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(buildResult('not-json'))
      .mockResolvedValueOnce(buildResult(JSON.stringify(validFixture)));

    await draftAudit({ ...baseOpts, complete });

    expect(complete.mock.calls[0]![0].tag).toBe('audit-draft');
    expect(complete.mock.calls[1]![0].tag).toBe('audit-draft:repair');
  });
});

describe('draftAudit — fail-fatal', () => {
  it('throws LLMError(provider-error) when both attempts fail schema parse', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(buildResult('not-json{'))
      .mockResolvedValueOnce(buildResult('also-not-json{'));

    let caught: unknown;
    try {
      await draftAudit({ ...baseOpts, complete });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(LLMError);
    expect((caught as LLMError).code).toBe('provider-error');
    expect((caught as LLMError).message).toMatch(/schema-parse failed twice/);
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('propagates provider errors from the underlying complete call', async () => {
    const complete = vi
      .fn()
      .mockRejectedValueOnce(new LLMError('circuit-open', 'breaker open'));

    await expect(draftAudit({ ...baseOpts, complete })).rejects.toMatchObject({
      code: 'circuit-open',
    });
    expect(complete).toHaveBeenCalledOnce();
  });
});
