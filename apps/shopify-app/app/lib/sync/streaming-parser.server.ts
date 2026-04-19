import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

/**
 * Streaming JSONL parser for Shopify bulk-operation results.
 *
 * Shopify returns a flat JSONL where child rows carry `__parentId` pointing at their parent.
 * This parser reconstructs parent + children into blocks and yields one complete product at a time.
 *
 * MEMORY RULE (from memory/product-engineering/shopify-api-rules.md §Bulk operation handling):
 *   - Stream, never load. Peak memory = one product block + its children.
 *   - Malformed lines are logged + skipped; never abort the whole stream.
 *   - Expired signed URLs must be re-requested from Shopify, not re-downloaded from the same URL.
 */

export interface ParsedProductBlock {
  product: Record<string, unknown>;
  children: Record<string, unknown>[];
}

export interface StreamStats {
  linesSeen: number;
  productsParsed: number;
  childrenParsed: number;
  malformedLines: number;
}

/**
 * Async generator yielding one product block at a time.
 * The generator flushes whenever a new top-level product line arrives.
 */
export async function* parseJsonlStream(
  stream: Readable,
): AsyncGenerator<ParsedProductBlock, StreamStats, void> {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  const stats: StreamStats = {
    linesSeen: 0,
    productsParsed: 0,
    childrenParsed: 0,
    malformedLines: 0,
  };

  let currentProduct: Record<string, unknown> | null = null;
  let currentChildren: Record<string, unknown>[] = [];

  for await (const line of rl) {
    stats.linesSeen += 1;
    if (!line.trim()) continue;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      stats.malformedLines += 1;
      continue;
    }

    if (typeof parsed.__parentId === 'string') {
      // Child row — attach to current product
      if (currentProduct) {
        currentChildren.push(parsed);
        stats.childrenParsed += 1;
      }
      continue;
    }

    // New top-level row → flush the previous block
    if (currentProduct) {
      yield { product: currentProduct, children: currentChildren };
      stats.productsParsed += 1;
    }

    currentProduct = parsed;
    currentChildren = [];
  }

  // Flush trailing product
  if (currentProduct) {
    yield { product: currentProduct, children: currentChildren };
    stats.productsParsed += 1;
  }

  return stats;
}

/**
 * Fetches a Shopify bulk-op signed URL and wraps the response body as a Node Readable
 * suitable for parseJsonlStream().
 *
 * Handles:
 *   - 404 → expired URL; caller must re-request the bulk op.
 *   - 5xx mid-stream → propagates; caller decides retry cadence.
 */
export async function openBulkStream(signedUrl: string): Promise<Readable> {
  const response = await fetch(signedUrl, {
    headers: {
      'user-agent': 'Flintmere-Sync/0.1 (+https://flintmere.com/bot)',
      accept: 'application/jsonl, application/x-ndjson, */*',
    },
  });

  if (response.status === 404) {
    throw new Error('bulk-url-expired');
  }
  if (!response.ok) {
    throw new Error(`bulk-fetch-failed:${response.status}`);
  }
  if (!response.body) {
    throw new Error('bulk-fetch-empty-body');
  }

  // Convert Web ReadableStream → Node Readable.
  return Readable.fromWeb(response.body as unknown as Parameters<typeof Readable.fromWeb>[0]);
}
