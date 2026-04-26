import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { enqueueFixTier1 } from '../../queue/queues.server';
import { fixTypeForIssueCode, getFixTypeMeta } from '../../lib/fixes/registry';

// POST /api/fix/apply
// Body: { issueId: string }
// Creates a Fix row in 'pending' state, enqueues the apply job, returns
// the fix id. The worker handles the Shopify mutation; the dashboard polls
// or shows a success toast on the next page load via ?fix-applied=<id>.

const REVERT_WINDOW_DAYS = 7;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ ok: false, code: 'method-not-allowed' }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const issueId = String(formData.get('issueId') ?? '').trim();

  if (!issueId) {
    return json({ ok: false, code: 'missing-issue-id' }, { status: 400 });
  }

  // Authorise: Issue must belong to a Score owned by this shop.
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { score: { select: { shopDomain: true } } },
  });

  if (!issue || issue.score.shopDomain !== session.shop) {
    return json({ ok: false, code: 'issue-not-found' }, { status: 404 });
  }

  const fixMeta = fixTypeForIssueCode(issue.code);
  if (!fixMeta) {
    return json(
      { ok: false, code: 'no-tier-1-fix-for-issue', issueCode: issue.code },
      { status: 400 },
    );
  }

  if (fixMeta.tier !== 1) {
    return json(
      { ok: false, code: 'not-a-tier-1-fix', tier: fixMeta.tier },
      { status: 400 },
    );
  }

  // Validate registry has not drifted (defensive).
  if (!getFixTypeMeta(fixMeta.fixType)) {
    return json({ ok: false, code: 'fix-type-not-registered' }, { status: 500 });
  }

  const productIds = issue.affectedProductIds;
  if (productIds.length === 0) {
    return json({ ok: false, code: 'no-affected-products' }, { status: 400 });
  }

  const revertableUntil = new Date();
  revertableUntil.setDate(revertableUntil.getDate() + REVERT_WINDOW_DAYS);

  const fix = await prisma.fix.create({
    data: {
      shopDomain: session.shop,
      tier: 1,
      status: 'pending',
      fixType: fixMeta.fixType,
      productCount: productIds.length,
      beforeState: { productIds } as unknown as object,
      afterState: {} as unknown as object,
      revertableUntil,
    },
  });

  await enqueueFixTier1({
    shopDomain: session.shop,
    fixId: fix.id,
    op: 'apply',
  });

  return json({ ok: true, fixId: fix.id });
}
