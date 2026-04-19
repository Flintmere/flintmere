import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import { parseJsonlStream, type ParsedProductBlock } from './streaming-parser.server';

function streamOf(lines: string[]): Readable {
  return Readable.from(lines.join('\n'));
}

async function collect(
  iter: AsyncGenerator<ParsedProductBlock, unknown>,
): Promise<{ blocks: ParsedProductBlock[]; stats: unknown }> {
  const blocks: ParsedProductBlock[] = [];
  let result = await iter.next();
  while (!result.done) {
    blocks.push(result.value);
    result = await iter.next();
  }
  return { blocks, stats: result.value };
}

describe('parseJsonlStream', () => {
  it('groups a product with its child variants', async () => {
    const lines = [
      JSON.stringify({ id: 'gid://shopify/Product/1', title: 'P1' }),
      JSON.stringify({ id: 'gid://shopify/ProductVariant/10', __parentId: 'gid://shopify/Product/1', sku: 'S10' }),
      JSON.stringify({ id: 'gid://shopify/ProductVariant/11', __parentId: 'gid://shopify/Product/1', sku: 'S11' }),
      JSON.stringify({ id: 'gid://shopify/Product/2', title: 'P2' }),
      JSON.stringify({ id: 'gid://shopify/ProductVariant/20', __parentId: 'gid://shopify/Product/2', sku: 'S20' }),
    ];

    const { blocks, stats } = await collect(parseJsonlStream(streamOf(lines)));
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.children).toHaveLength(2);
    expect(blocks[1]!.children).toHaveLength(1);
    expect((stats as { productsParsed: number }).productsParsed).toBe(2);
  });

  it('skips malformed lines without aborting', async () => {
    const lines = [
      JSON.stringify({ id: 'gid://shopify/Product/1', title: 'ok' }),
      'not json',
      JSON.stringify({ id: 'gid://shopify/ProductVariant/10', __parentId: 'gid://shopify/Product/1' }),
      JSON.stringify({ id: 'gid://shopify/Product/2', title: 'still ok' }),
    ];
    const { blocks, stats } = await collect(parseJsonlStream(streamOf(lines)));
    expect(blocks).toHaveLength(2);
    expect((stats as { malformedLines: number }).malformedLines).toBe(1);
  });

  it('ignores blank lines and trailing whitespace', async () => {
    const lines = [
      '',
      JSON.stringify({ id: 'gid://shopify/Product/1', title: 'P1' }),
      '',
      JSON.stringify({ id: 'gid://shopify/ProductVariant/10', __parentId: 'gid://shopify/Product/1' }),
      '',
    ];
    const { blocks } = await collect(parseJsonlStream(streamOf(lines)));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.children).toHaveLength(1);
  });

  it('drops children with no preceding product', async () => {
    const lines = [
      JSON.stringify({ id: 'gid://shopify/ProductVariant/10', __parentId: 'orphan' }),
      JSON.stringify({ id: 'gid://shopify/Product/1', title: 'P1' }),
    ];
    const { blocks } = await collect(parseJsonlStream(streamOf(lines)));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.children).toHaveLength(0);
  });

  it('handles trailing product without subsequent flush', async () => {
    const lines = [
      JSON.stringify({ id: 'gid://shopify/Product/1', title: 'P1' }),
    ];
    const { blocks, stats } = await collect(parseJsonlStream(streamOf(lines)));
    expect(blocks).toHaveLength(1);
    expect((stats as { productsParsed: number }).productsParsed).toBe(1);
  });

  it('stats count lines, products, children, malformed separately', async () => {
    const lines = [
      JSON.stringify({ id: 'gid://shopify/Product/1' }),
      JSON.stringify({ id: 'gid://shopify/ProductVariant/10', __parentId: 'gid://shopify/Product/1' }),
      'malformed{',
      JSON.stringify({ id: 'gid://shopify/Product/2' }),
    ];
    const { stats } = await collect(parseJsonlStream(streamOf(lines)));
    expect(stats).toEqual({
      linesSeen: 4,
      productsParsed: 2,
      childrenParsed: 1,
      malformedLines: 1,
    });
  });
});
