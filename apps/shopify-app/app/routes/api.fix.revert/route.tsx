import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { enqueueFixTier1 } from '../../queue/queues.server';

// POST /api/fix/revert
// Body: { fixId: string }
// Validates ownership + window + status, enqueues a revert job.
// Worker reads Fix.beforeState and undoes the metafield writes.

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ ok: false, code: 'method-not-allowed' }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const fixId = String(formData.get('fixId') ?? '').trim();

  if (!fixId) {
    return json({ ok: false, code: 'missing-fix-id' }, { status: 400 });
  }

  const fix = await prisma.fix.findUnique({ where: { id: fixId } });
  if (!fix || fix.shopDomain !== session.shop) {
    return json({ ok: false, code: 'fix-not-found' }, { status: 404 });
  }

  if (fix.status !== 'applied') {
    return json(
      { ok: false, code: 'fix-not-applied', status: fix.status },
      { status: 400 },
    );
  }

  if (fix.revertedAt) {
    return json({ ok: false, code: 'fix-already-reverted' }, { status: 400 });
  }

  if (fix.revertableUntil < new Date()) {
    return json(
      { ok: false, code: 'fix-revert-window-closed' },
      { status: 400 },
    );
  }

  await enqueueFixTier1({
    shopDomain: session.shop,
    fixId,
    op: 'revert',
  });

  return json({ ok: true, fixId });
}
