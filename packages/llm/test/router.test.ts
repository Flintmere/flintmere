import { describe, expect, it, vi } from 'vitest';
import { createRouterFromProviders, LLMError } from '../src/index.js';
import { MockProvider } from '../src/testing.js';

describe('LLMRouter', () => {
  const opts = {
    messages: [{ role: 'user' as const, content: 'hello' }],
    maxOutputTokens: 256,
    temperature: 0.2,
  };

  it('routes completeBulk to primary provider', async () => {
    const primary = new MockProvider({ text: 'primary' });
    const hard = new MockProvider({ text: 'hard' });
    const fb = new MockProvider({ text: 'fb' });
    const router = createRouterFromProviders(primary, hard, fb);

    const result = await router.completeBulk(opts);
    expect(result.text).toBe('primary');
    expect(primary.calls).toHaveLength(1);
    expect(hard.calls).toHaveLength(0);
    expect(fb.calls).toHaveLength(0);
  });

  it('routes completeHardCase to hardcase provider', async () => {
    const primary = new MockProvider({ text: 'primary' });
    const hard = new MockProvider({ text: 'hard' });
    const fb = new MockProvider({ text: 'fb' });
    const router = createRouterFromProviders(primary, hard, fb);

    const result = await router.completeHardCase(opts);
    expect(result.text).toBe('hard');
    expect(hard.calls).toHaveLength(1);
    expect(primary.calls).toHaveLength(0);
  });

  it('fails over to fallback on provider-error from primary', async () => {
    const primary = new MockProvider({
      error: new LLMError('provider-error', 'boom', 'vertex'),
    });
    const hard = new MockProvider();
    const fb = new MockProvider({ text: 'from-fallback' });
    const router = createRouterFromProviders(primary, hard, fb);

    const result = await router.completeBulk(opts);
    expect(result.text).toBe('from-fallback');
    expect(fb.calls).toHaveLength(1);
  });

  it('does not fail over on safety-filter', async () => {
    const primary = new MockProvider({
      error: new LLMError('safety-filter', 'blocked', 'vertex'),
    });
    const hard = new MockProvider();
    const fb = new MockProvider({ text: 'fb' });
    const router = createRouterFromProviders(primary, hard, fb);

    await expect(router.completeBulk(opts)).rejects.toThrow('blocked');
    expect(fb.calls).toHaveLength(0);
  });

  it('does not fail over on auth errors', async () => {
    const primary = new MockProvider({
      error: new LLMError('auth', 'bad creds', 'vertex'),
    });
    const hard = new MockProvider();
    const fb = new MockProvider();
    const router = createRouterFromProviders(primary, hard, fb);

    await expect(router.completeBulk(opts)).rejects.toThrow('bad creds');
    expect(fb.calls).toHaveLength(0);
  });

  it('emits completion events with tier + fallback flag', async () => {
    const primary = new MockProvider({ text: 'primary' });
    const hard = new MockProvider();
    const fb = new MockProvider();
    const onCompletion = vi.fn();
    const router = createRouterFromProviders(primary, hard, fb, onCompletion);

    await router.completeBulk({ ...opts, tag: 'title-rewrite', requestId: 'req-1' });
    expect(onCompletion).toHaveBeenCalledOnce();
    const event = onCompletion.mock.calls[0]![0];
    expect(event.tier).toBe('primary');
    expect(event.fellBackToFallback).toBe(false);
    expect(event.tag).toBe('title-rewrite');
    expect(event.requestId).toBe('req-1');
  });

  it('does not fail over vision requests by default (ADR 0010)', async () => {
    const primary = new MockProvider({
      error: new LLMError('provider-error', 'boom', 'vertex'),
    });
    const hard = new MockProvider();
    const fb = new MockProvider({ text: 'fb' });
    const router = createRouterFromProviders(primary, hard, fb);

    await expect(
      router.completeVisionBulk({
        ...opts,
        images: [{ data: 'b64', mimeType: 'image/png' }],
      }),
    ).rejects.toThrow('boom');
    expect(fb.calls).toHaveLength(0);
  });

  it('does fail over vision when allowVisionFallback=true (opt-in)', async () => {
    const { LLMRouter } = await import('../src/router.js');
    const primary = new MockProvider({
      error: new LLMError('provider-error', 'boom', 'vertex'),
    });
    const hard = new MockProvider();
    const fb = new MockProvider({ text: 'fb-vision' });
    const router = new LLMRouter({
      primary,
      hardcase: hard,
      fallback: fb,
      allowVisionFallback: true,
    });

    const r = await router.completeVisionBulk({
      ...opts,
      images: [{ data: 'b64', mimeType: 'image/png' }],
    });
    expect(r.text).toBe('fb-vision');
    expect(fb.calls).toHaveLength(1);
  });

  it('internal route uses the internal provider when provided', async () => {
    const primary = new MockProvider({ text: 'primary' });
    const hard = new MockProvider();
    const fb = new MockProvider();
    const internal = new MockProvider({ text: 'internal-response' });
    const router = createRouterFromProviders(primary, hard, fb);
    // Internal defaults to primary when not provided; build one that has internal set.
    const routerWithInternal = createRouterFromProviders(primary, hard, fb);
    // swap in an internal provider via direct construction
    const { LLMRouter } = await import('../src/router.js');
    const custom = new LLMRouter({ primary, hardcase: hard, fallback: fb, internal });

    const result = await custom.completeInternal(opts);
    expect(result.text).toBe('internal-response');
    expect(internal.calls).toHaveLength(1);
    expect(primary.calls).toHaveLength(0);
    void router;
    void routerWithInternal;
  });
});
