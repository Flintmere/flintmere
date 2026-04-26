import type { LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import {
  Badge,
  BlockStack,
  Box,
  Card,
  IndexTable,
  InlineStack,
  Layout,
  Modal,
  Page,
  Text,
} from '@shopify/polaris';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { getFixTypeMeta } from '../../lib/fixes/registry';
import {
  deriveFixStatus,
  statusBadgeTone,
  statusLabel,
} from '../../lib/fixes/status';

interface BeforeItem {
  productId: string;
  shopifyProductId: string;
  existingBrand: string | null;
}

interface AfterItem {
  shopifyProductId: string;
  brand: string;
}

interface BeforeStateShape {
  productIds?: string[];
  items?: BeforeItem[];
}

interface AfterStateShape {
  items?: AfterItem[];
  skipped?: { productId: string; reason: string }[];
  failed?: { shopifyProductId: string; error: string }[];
}

const SAMPLE_SIZE = 5;

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const fixId = params.fixId;
  if (!fixId) throw redirect('/app/fixes');

  const fix = await prisma.fix.findUnique({ where: { id: fixId } });
  if (!fix || fix.shopDomain !== session.shop) {
    throw json({ message: 'Fix not found' }, { status: 404 });
  }

  const beforeState = (fix.beforeState ?? {}) as BeforeStateShape;
  const afterState = (fix.afterState ?? {}) as AfterStateShape;
  const beforeItems = beforeState.items ?? [];

  // Hydrate sample products for the diff.
  const sampleIds = beforeItems.slice(0, SAMPLE_SIZE).map((b) => b.productId);
  const sampleProducts = sampleIds.length
    ? await prisma.product.findMany({
        where: { shopDomain: session.shop, id: { in: sampleIds } },
        select: { id: true, handle: true, title: true, vendor: true },
      })
    : [];

  const productById = new Map(sampleProducts.map((p) => [p.id, p]));

  const meta = getFixTypeMeta(fix.fixType);
  const displayStatus = deriveFixStatus(fix);

  return {
    fix: {
      id: fix.id,
      tier: fix.tier,
      status: fix.status,
      fixType: fix.fixType,
      productCount: fix.productCount,
      appliedAt: fix.appliedAt,
      revertableUntil: fix.revertableUntil,
      revertedAt: fix.revertedAt,
      displayStatus,
      displayName: meta?.displayName ?? fix.fixType,
      description: meta?.description ?? '',
    },
    samples: beforeItems.slice(0, SAMPLE_SIZE).map((b) => {
      const after = afterState.items?.find(
        (a) => a.shopifyProductId === b.shopifyProductId,
      );
      const product = productById.get(b.productId);
      return {
        productId: b.productId,
        title: product?.title ?? '—',
        handle: product?.handle ?? '—',
        vendor: product?.vendor ?? '—',
        before: b.existingBrand ?? '(empty)',
        after: after?.brand ?? '—',
      };
    }),
    counts: {
      written: afterState.items?.length ?? 0,
      skipped: afterState.skipped?.length ?? 0,
      failed: afterState.failed?.length ?? 0,
    },
  };
}

export default function FixDetail() {
  const { fix, samples, counts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ ok: boolean; code?: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitting = fetcher.state !== 'idle';
  const canRevert = fix.displayStatus === 'applied';

  const onConfirmRevert = () => {
    setConfirmOpen(false);
    fetcher.submit(
      { fixId: fix.id },
      { method: 'POST', action: '/api/fix/revert' },
    );
  };

  return (
    <Page
      backAction={{ content: 'Fix history', url: '/app/fixes' }}
      title={fix.displayName}
      subtitle={fix.description}
      primaryAction={
        canRevert
          ? {
              content: submitting ? 'Reverting…' : '[ Revert this batch ]',
              destructive: true,
              onAction: () => setConfirmOpen(true),
              disabled: submitting,
            }
          : undefined
      }
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200" wrap>
                <Badge tone={statusBadgeTone(fix.displayStatus)}>
                  {statusLabel(fix.displayStatus)}
                </Badge>
                <Badge>{`Tier ${fix.tier}`}</Badge>
                <Badge>{fix.fixType}</Badge>
              </InlineStack>

              <Text as="p" tone="subdued" variant="bodySm">
                Applied {formatDate(fix.appliedAt)} · {fix.productCount}{' '}
                products updated
                {counts.skipped > 0 ? ` · ${counts.skipped} skipped` : ''}
                {counts.failed > 0 ? ` · ${counts.failed} failed` : ''}
              </Text>

              {fix.displayStatus === 'applied' ? (
                <Text as="p" tone="subdued" variant="bodySm">
                  Revertable until {formatDate(fix.revertableUntil)}.
                </Text>
              ) : null}

              {fix.displayStatus === 'reverted' && fix.revertedAt ? (
                <Text as="p" tone="subdued" variant="bodySm">
                  Reverted {formatDate(fix.revertedAt)}.
                </Text>
              ) : null}

              {fetcher.data?.ok ? (
                <Box
                  background="bg-surface-success-active"
                  padding="200"
                  borderRadius="200"
                >
                  <Text as="p" fontWeight="medium">
                    Revert queued. Status will refresh shortly.
                  </Text>
                </Box>
              ) : null}

              {fetcher.data && !fetcher.data.ok ? (
                <Box
                  background="bg-surface-critical"
                  padding="200"
                  borderRadius="200"
                >
                  <Text as="p" fontWeight="medium">
                    Could not revert: {fetcher.data.code ?? 'unknown error'}
                  </Text>
                </Box>
              ) : null}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <Text as="h3" variant="headingSm">
                Sample of {samples.length} of {fix.productCount} affected
              </Text>
            </Box>
            {samples.length === 0 ? (
              <Box padding="400">
                <Text as="p" tone="subdued">
                  No sample data available.
                </Text>
              </Box>
            ) : (
              <IndexTable
                resourceName={{ singular: 'product', plural: 'products' }}
                itemCount={samples.length}
                selectable={false}
                headings={[
                  { title: 'Title' },
                  { title: 'Handle' },
                  { title: 'Before' },
                  { title: 'After' },
                ]}
              >
                {samples.map((s, index) => (
                  <IndexTable.Row id={s.productId} key={s.productId} position={index}>
                    <IndexTable.Cell>
                      <Text as="span" fontWeight="medium">
                        {s.title}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" tone="subdued">
                        {s.handle}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" tone="subdued">
                        {s.before}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" fontWeight="medium">
                        {s.after}
                      </Text>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {canRevert ? (
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Revert this batch?"
          primaryAction={{
            content: 'Revert',
            destructive: true,
            onAction: onConfirmRevert,
            loading: submitting,
          }}
          secondaryActions={[
            { content: 'Cancel', onAction: () => setConfirmOpen(false) },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="200">
              <Text as="p">
                This will undo the changes to {fix.productCount} products.
                Brand metafields written by this batch will be removed.
              </Text>
              <Text as="p" tone="subdued">
                Reverts cannot be undone — you would need to apply the fix
                again from the issue drill-down.
              </Text>
            </BlockStack>
          </Modal.Section>
        </Modal>
      ) : null}
    </Page>
  );
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
