import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { startBulkCatalogQuery, pollBulkOp } from '../../lib/sync/bulk-op.server';
import { enqueueSync } from '../../queue/queues.server';

/**
 * POST /api/rescan — triggers a merchant-initiated bulk sync.
 *
 * Flow (synchronous half):
 *   1. Kick off bulkOperationRunQuery.
 *   2. Poll until the bulk op lands a signed URL.
 *   3. Enqueue the sync job with the signed URL.
 *
 * The heavy streaming + chunk-write happens in the worker per
 * memory/product-engineering/shopify-api-rules.md §Bulk operation handling.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);

  try {
    await startBulkCatalogQuery(admin);
    const result = await pollBulkOp(admin, { maxWaitMs: 60_000 });

    if (result.status !== 'COMPLETED' || !result.url) {
      return json(
        {
          ok: false,
          code: 'bulk-op-incomplete',
          message: `Bulk op finished as ${result.status}.`,
        },
        { status: 502 },
      );
    }

    const now = new Date().toISOString();
    const job = await enqueueSync({
      shopDomain: session.shop,
      enqueuedAt: now,
      trigger: 'rescan',
    });

    // Attach the signed URL to the job data. The worker reads it from job.data.
    await job.updateData({ ...job.data, signedUrl: result.url } as typeof job.data & { signedUrl: string });

    return json({
      ok: true,
      jobId: job.id,
      bulkOpId: result.id,
      rootObjectCount: result.rootObjectCount ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json(
      { ok: false, code: 'rescan-failed', message },
      { status: 502 },
    );
  }
}
