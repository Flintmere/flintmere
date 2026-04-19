import { describe, expect, it } from 'vitest';
import { MockProvider } from '@flintmere/llm/testing';
import { LLMRouter } from '@flintmere/llm';
import { inferAttributes } from './attribute-infer.js';

function buildRouter(primary: MockProvider): LLMRouter {
  return new LLMRouter({
    primary,
    hardcase: new MockProvider(),
    fallback: new MockProvider(),
  });
}

describe('inferAttributes', () => {
  it('parses a well-formed JSON response and keeps only known keys', async () => {
    const primary = new MockProvider({
      text: JSON.stringify({
        attributes: [
          { key: 'ingredients_list', value: 'hyaluronic acid, niacinamide', confidence: 0.9 },
          { key: 'volume_ml', value: '30', confidence: 0.85 },
          { key: 'unknown_key', value: 'ignored', confidence: 0.95 },
          { key: 'skin_type', value: 'oily', confidence: 0.4 }, // below 0.5 floor → dropped
        ],
      }),
    });
    const router = buildRouter(primary);

    const result = await inferAttributes(router, {
      title: 'Meridian Hydration Serum',
      vertical: 'beauty',
    });

    expect(result.attributes).toHaveLength(2);
    expect(result.attributes.map((a) => a.key).sort()).toEqual([
      'ingredients_list',
      'volume_ml',
    ]);
  });

  it('returns empty on malformed JSON', async () => {
    const primary = new MockProvider({ text: 'not json' });
    const router = buildRouter(primary);

    const result = await inferAttributes(router, {
      title: 'something',
      vertical: 'default',
    });
    expect(result.attributes).toEqual([]);
  });

  it('tolerates ```json fences around the JSON', async () => {
    const primary = new MockProvider({
      text: '```json\n' + JSON.stringify({
        attributes: [{ key: 'brand', value: 'Meridian', confidence: 0.9 }],
      }) + '\n```',
    });
    const router = buildRouter(primary);

    const result = await inferAttributes(router, {
      title: 'Meridian Hydration Serum',
      vertical: 'default',
    });
    expect(result.attributes).toHaveLength(1);
  });

  it('uses vision path when imageUrl provided', async () => {
    const primary = new MockProvider({
      text: JSON.stringify({ attributes: [] }),
    });
    const router = buildRouter(primary);

    await inferAttributes(router, {
      title: 'Meridian Hydration Serum',
      imageUrl: 'https://cdn.shopify.com/s/meridian/serum.jpg',
      vertical: 'beauty',
    });

    expect(primary.calls[0]?.kind).toBe('completeVision');
  });

  it('uses text-only path when no image provided', async () => {
    const primary = new MockProvider({
      text: JSON.stringify({ attributes: [] }),
    });
    const router = buildRouter(primary);

    await inferAttributes(router, {
      title: 'Meridian Serum',
      vertical: 'beauty',
    });

    expect(primary.calls[0]?.kind).toBe('complete');
  });

  it('tags the request with the vertical', async () => {
    const primary = new MockProvider({
      text: JSON.stringify({ attributes: [] }),
    });
    const router = buildRouter(primary);

    await inferAttributes(router, {
      title: 'Meridian Serum',
      vertical: 'supplements',
    });

    expect(primary.calls[0]?.opts.tag).toBe('attr-infer:supplements');
  });
});
