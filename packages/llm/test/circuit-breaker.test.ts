import { describe, expect, it, vi } from 'vitest';
import { CircuitBreaker, LLMError } from '../src/index.js';

describe('CircuitBreaker', () => {
  it('starts closed', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openDurationMs: 100 });
    expect(cb.current).toBe('closed');
  });

  it('opens after N consecutive failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openDurationMs: 100 });
    const failing = () => Promise.reject(new Error('nope'));

    for (let i = 0; i < 3; i += 1) {
      await expect(cb.run(failing)).rejects.toThrow('nope');
    }

    expect(cb.current).toBe('open');
    await expect(cb.run(failing)).rejects.toThrow(LLMError);
  });

  it('resets consecutive failures on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openDurationMs: 100 });
    await expect(cb.run(() => Promise.reject(new Error('x')))).rejects.toThrow();
    await cb.run(() => Promise.resolve(1));
    await expect(cb.run(() => Promise.reject(new Error('y')))).rejects.toThrow();
    await expect(cb.run(() => Promise.reject(new Error('z')))).rejects.toThrow();
    expect(cb.current).toBe('closed');
  });

  it('moves to half-open after open duration and closes on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openDurationMs: 20 });
    await expect(cb.run(() => Promise.reject(new Error('a')))).rejects.toThrow();
    expect(cb.current).toBe('open');
    await new Promise((r) => setTimeout(r, 30));
    await cb.run(() => Promise.resolve('ok'));
    expect(cb.current).toBe('closed');
  });

  it('re-opens on half-open failure', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openDurationMs: 20 });
    await expect(cb.run(() => Promise.reject(new Error('a')))).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 30));
    await expect(cb.run(() => Promise.reject(new Error('b')))).rejects.toThrow();
    expect(cb.current).toBe('open');
  });

  it('invokes onStateChange callback', async () => {
    const onStateChange = vi.fn();
    const cb = new CircuitBreaker({ failureThreshold: 1, openDurationMs: 100, onStateChange });
    await expect(cb.run(() => Promise.reject(new Error('a')))).rejects.toThrow();
    expect(onStateChange).toHaveBeenCalledWith('closed', 'open');
  });
});
