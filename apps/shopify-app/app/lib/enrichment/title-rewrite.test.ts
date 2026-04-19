import { describe, expect, it } from 'vitest';
import { MockProvider } from '@flintmere/llm/testing';
import { LLMRouter } from '@flintmere/llm';
import { rewriteTitle } from './title-rewrite.js';

function buildRouter(hardcase: MockProvider): LLMRouter {
  return new LLMRouter({
    primary: new MockProvider(),
    hardcase,
    fallback: new MockProvider(),
  });
}

describe('rewriteTitle', () => {
  const input = {
    currentTitle: 'BEST EVER!!! Meridian Coffee Grinder — MUST HAVE',
    brand: 'Meridian',
    productType: 'Coffee Grinder',
  };

  it('routes to the hard-case provider', async () => {
    const hard = new MockProvider({
      text: 'TITLE: Meridian Matte Black Manual Coffee Grinder\nCHANGES: removed fluff',
    });
    const router = buildRouter(hard);

    await rewriteTitle(router, input);
    expect(hard.calls).toHaveLength(1);
    expect(hard.calls[0]?.opts.tag).toBe('title-rewrite');
  });

  it('parses TITLE + CHANGES from the response', async () => {
    const hard = new MockProvider({
      text: 'TITLE: Meridian Matte Black Coffee Grinder\nCHANGES: removed BEST EVER, removed ALL-CAPS',
    });
    const router = buildRouter(hard);

    const result = await rewriteTitle(router, input);
    expect(result.proposedTitle).toBe('Meridian Matte Black Coffee Grinder');
    expect(result.changeSummary).toEqual(['removed BEST EVER', 'removed ALL-CAPS']);
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('returns empty changes when model says "none"', async () => {
    const hard = new MockProvider({
      text: 'TITLE: Meridian Matte Black Coffee Grinder\nCHANGES: none',
    });
    const router = buildRouter(hard);

    const result = await rewriteTitle(router, input);
    expect(result.changeSummary).toEqual([]);
  });

  it('caps proposed title at 150 chars', async () => {
    const hard = new MockProvider({
      text: `TITLE: ${'x'.repeat(200)}\nCHANGES: none`,
    });
    const router = buildRouter(hard);

    const result = await rewriteTitle(router, input);
    expect(result.proposedTitle.length).toBeLessThanOrEqual(150);
    expect(result.confidence).toBeLessThanOrEqual(0.4);
  });

  it('perfect confidence when proposed == original', async () => {
    const hard = new MockProvider({
      text: `TITLE: ${input.currentTitle}\nCHANGES: none`,
    });
    const router = buildRouter(hard);
    const result = await rewriteTitle(router, input);
    expect(result.confidence).toBe(1);
  });
});
