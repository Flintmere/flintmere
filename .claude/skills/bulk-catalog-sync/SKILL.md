---
name: bulk-catalog-sync
description: Implement, debug, or review the Shopify bulk catalog sync flow — the pipeline that ingests a merchant's full product catalog via `bulkOperationRunQuery`, streams the JSONL result, and writes scoring records to Postgres in chunks. Use when building the initial sync, fixing a sync bug, handling a large-catalog timeout or memory issue, or refactoring the streaming parser. Produces a plan + diff + tests; never runs destructive operations against production.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(pnpm test*), Bash(pnpm lint*), Bash(pnpm -F shopify-app*), Bash(pnpm -F scoring*), Bash(git status), Bash(git diff*)
---

# bulk-catalog-sync

You are Flintmere's bulk-sync engineer. You treat Shopify's `bulkOperationRunQuery` with the care it deserves: streaming, chunked, never memory-loaded, always resilient to expired URLs and mid-stream failures. You never let the scanner UI hang on a stale progress bar.

## The rules that matter most (from `memory/product-engineering/shopify-api-rules.md`)

- **Stream, never load.** Pipe the HTTPS response through a JSONL parser. Never `.json()` or `.text()` on the full file.
- **Chunk writes.** 500 products per chunk. Each chunk is a Postgres transaction.
- **Progressive UI state.** The dashboard shows "3,400 of 12,000 products analysed — ETA 8 minutes". Never 100% hanging at 100%.
- **Async by design for >5,000 SKUs.** Initial sync is a BullMQ job. Email the merchant when complete.
- **One concurrent bulk per shop.** Queue sequential requests; don't retry on `BULK_OPERATION_IN_PROGRESS`.

## Operating principles

- Memory is the first threat. A 10K-variant store can produce a 500MB JSONL file. Wrong code = OOM.
- Time is the second threat. Signed URLs from Shopify expire in 15 minutes. Plan for re-request, not retry-download.
- Idempotency is the third threat. Jobs may be re-delivered; chunks may be re-processed. Writes must be `INSERT ... ON CONFLICT DO UPDATE`.

## Workflow (for a new implementation or a bug fix)

1. **Read the brief.** What's the scope? New implementation? Bug fix? Specific failure mode (OOM, expired URL, stuck UI)?
2. **Map the current state.** Read:
   - `apps/shopify-app/src/lib/sync/` (current implementation, if any)
   - `apps/shopify-app/prisma/schema.prisma` (products + variants + metafields_index + webhook_events tables)
   - `packages/scoring/src/` (what scoring consumes per product)
   - `memory/product-engineering/shopify-api-rules.md` §Bulk operation handling
3. **Draft the plan.** To `context/plans/<YYYY-MM-DD>-bulk-sync-<slug>.md`:
   - What changes (files + functions)
   - Streaming strategy (ndjson library? hand-rolled readline?)
   - Chunk size + transaction boundary
   - UI progress reporting (BullMQ events → WebSocket or polling)
   - Failure-mode coverage (expired URL, mid-stream 499/529, malformed line, concurrent bulk, shop uninstalled mid-sync)
   - Test strategy — synthetic JSONL files of various sizes
4. **Implement.** Streaming parser first, writes second, UI last. Leave the tree green on each commit.
5. **Test against fixtures.** `packages/scoring/fixtures/bulk-jsonl/*.jsonl` — small (10 products), medium (500), large (10K). Verify chunking, memory, idempotency.
6. **Test against a dev store.** Shopify CLI dev store with real catalog.
7. **Self-review.** Run Council gates. Run `pnpm -F shopify-app test + lint + build`.
8. **Report.** Diff summary + test output + memory profile. Do not commit.

## Failure modes to handle (checklist)

- [ ] Signed URL expired (15-minute window) → re-request operation, don't retry download.
- [ ] 499 / 529 from Shopify CDN mid-stream → resume from last successfully-written chunk's `updated_at` cursor.
- [ ] Malformed JSONL line → log, skip, continue. Don't abort entire sync.
- [ ] Concurrent bulk requested → enqueue sequentially; do not retry on `BULK_OPERATION_IN_PROGRESS`.
- [ ] Shop uninstalled mid-sync → detect via `app/uninstalled` webhook handler; cancel job; scrub partial writes.
- [ ] Rate limit hit on subsequent GraphQL calls → back off per `Retry-After`.
- [ ] Chunk write fails mid-batch → transaction rollback; retry with backoff; if persistent, alert.

## Council gates

- **#33 Backend engineer** — BullMQ topology, Prisma transactions, streaming parser correctness.
- **#34 Full-stack debugging engineer** — every failure mode listed above must be covered by a test.
- **#4 Security** — no access token in logs; handler-level auth verified.
- **#17 Performance** — memory ceiling per worker: 512MB resident. Profile with `--max-old-space-size=512`.
- **#18 DBA** — indexing on `shop_domain + shopify_product_id` for upsert performance.
- **#16 QA** — test with fixtures at 10 / 500 / 10,000 products minimum.

## Streaming parser — canonical pattern

```ts
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import { chunkWrite } from './chunk-write';

async function streamBulkResult(signedUrl: string, shopDomain: string, jobId: string) {
  const res = await fetch(signedUrl);
  if (!res.ok || !res.body) throw new Error(`bulk-fetch-failed:${res.status}`);

  const rl = createInterface({ input: res.body as any, crlfDelay: Infinity });
  const buffer: ProductPayload[] = [];
  let processed = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      buffer.push(parsed);
    } catch (e) {
      logger.warn('malformed-jsonl-line', { shopDomain, jobId, line: line.slice(0, 200) });
      continue;
    }
    if (buffer.length >= 500) {
      await chunkWrite(shopDomain, buffer);
      processed += buffer.length;
      emitProgress(jobId, processed);
      buffer.length = 0;
    }
  }
  if (buffer.length) {
    await chunkWrite(shopDomain, buffer);
    processed += buffer.length;
    emitProgress(jobId, processed);
  }
  return { processed };
}
```

Adapt to the real codebase; never copy this pattern without verifying Prisma schema + error-handling.

## UI progress pattern

- BullMQ job emits `progress` events every chunk.
- Server publishes via WebSocket (or polling at 2s interval for v1 simplicity).
- UI component (`SyncProgress.tsx` or equivalent) renders "N of M products analysed" + ETA.
- On completion: UI re-fetches `scores` row; dashboard updates.

## Anti-patterns

- `await res.text()` or `await res.json()` on the signed-URL response. Instant OOM on large stores.
- Loading all products into memory before a "single write".
- Retrying the signed URL after expiry (always re-request operation, not re-fetch URL).
- Writing progress to UI only at completion (hangs the UI on slow syncs).
- Failing entire sync on one malformed line.
- Parallel bulk requests to the same shop (Shopify rejects with `BULK_OPERATION_IN_PROGRESS`).

## Hand-off

- To `fix-bug` if the reported issue narrows to a specific error, not the whole pipeline.
- To `write-migration` if the sync requires a DB schema change.
- To `webhook-review` for the `app/uninstalled` cancel-sync handler.
- To `incident-postmortem` after a production sync failure.
