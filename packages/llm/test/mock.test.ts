import { describe, expect, it } from 'vitest';
import { LLMError } from '../src/index.js';
import { MockProvider } from '../src/testing.js';

describe('MockProvider', () => {
  const opts = {
    messages: [{ role: 'user' as const, content: 'hi' }],
    maxOutputTokens: 100,
    temperature: 0.1,
  };

  it('returns canned text', async () => {
    const p = new MockProvider({ text: 'hello world' });
    const r = await p.complete(opts);
    expect(r.text).toBe('hello world');
    expect(r.provider).toBe('mock');
  });

  it('records every call', async () => {
    const p = new MockProvider();
    await p.complete(opts);
    await p.complete(opts);
    expect(p.calls).toHaveLength(2);
    expect(p.calls[0]?.kind).toBe('complete');
  });

  it('records vision calls separately', async () => {
    const p = new MockProvider();
    await p.completeVision({
      ...opts,
      images: [{ data: 'base64...', mimeType: 'image/png' }],
    });
    expect(p.calls[0]?.kind).toBe('completeVision');
  });

  it('throws canned error when set', async () => {
    const p = new MockProvider({
      error: new LLMError('rate-limit', 'slow down', 'mock'),
    });
    await expect(p.complete(opts)).rejects.toThrow('slow down');
  });

  it('reset() clears call log', async () => {
    const p = new MockProvider();
    await p.complete(opts);
    p.reset();
    expect(p.calls).toHaveLength(0);
  });
});
