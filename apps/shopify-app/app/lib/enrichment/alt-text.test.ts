import { describe, expect, it } from 'vitest';
import { MockProvider } from '@flintmere/llm/testing';
import { LLMRouter } from '@flintmere/llm';
import { generateAltText } from './alt-text.js';

function buildRouter(primary: MockProvider): LLMRouter {
  return new LLMRouter({
    primary,
    hardcase: new MockProvider(),
    fallback: new MockProvider(),
  });
}

describe('generateAltText', () => {
  const baseInput = {
    imageUrl: 'https://cdn.shopify.com/s/files/1/meridian/grinder.jpg',
    imageMimeType: 'image/jpeg' as const,
    productTitle: 'Meridian Matte Black Coffee Grinder',
    productType: 'Coffee Grinder',
    brand: 'Meridian',
  };

  it('returns the alt text from the LLM response', async () => {
    const primary = new MockProvider({
      text: 'Matte black manual coffee grinder with stainless steel burr',
    });
    const router = buildRouter(primary);

    const result = await generateAltText(router, baseInput);
    expect(result.altText).toBe(
      'Matte black manual coffee grinder with stainless steel burr',
    );
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('strips "image of" prefixes', async () => {
    const primary = new MockProvider({
      text: 'Image of matte black grinder',
    });
    const router = buildRouter(primary);

    const result = await generateAltText(router, baseInput);
    expect(result.altText.toLowerCase()).not.toMatch(/^image of/);
  });

  it('caps alt text at 125 characters', async () => {
    const primary = new MockProvider({
      text: 'x'.repeat(200),
    });
    const router = buildRouter(primary);

    const result = await generateAltText(router, baseInput);
    expect(result.altText.length).toBeLessThanOrEqual(125);
  });

  it('passes the image to the vision call', async () => {
    const primary = new MockProvider();
    const router = buildRouter(primary);

    await generateAltText(router, baseInput);
    expect(primary.calls[0]?.kind).toBe('completeVision');
  });

  it('rejects invalid image URLs', async () => {
    const primary = new MockProvider();
    const router = buildRouter(primary);

    await expect(
      generateAltText(router, { ...baseInput, imageUrl: 'not a url' }),
    ).rejects.toThrow();
  });
});
