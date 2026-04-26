import type { LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  IndexTable,
  InlineStack,
  Layout,
  Modal,
  Page,
  Text,
  useIndexResourceState,
} from '@shopify/polaris';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { fixTypeForIssueCode } from '../../lib/fixes/registry';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const issueId = params.issueId;
  if (!issueId) throw redirect('/app/issues');

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { score: { select: { shopDomain: true, scoredAt: true } } },
  });

  if (!issue || issue.score.shopDomain !== session.shop) {
    throw json({ message: 'Issue not found' }, { status: 404 });
  }

  // Hydrate affected products in one query.
  const products = issue.affectedProductIds.length
    ? await prisma.product.findMany({
        where: {
          shopDomain: session.shop,
          id: { in: issue.affectedProductIds },
        },
        select: {
          id: true,
          shopifyProductId: true,
          handle: true,
          title: true,
          vendor: true,
        },
      })
    : [];

  const fixMeta = fixTypeForIssueCode(issue.code);

  return {
    issue: {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      pillar: issue.pillar,
      code: issue.code,
      severity: issue.severity,
      affectedCount: issue.affectedCount,
    },
    products,
    fixMeta,
  };
}

export default function IssueDetail() {
  const { issue, products, fixMeta } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ ok: boolean; fixId?: string; code?: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitting = fetcher.state !== 'idle';

  const resourceName = { singular: 'product', plural: 'products' };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products.map((p) => ({ ...p })));

  const onConfirmApply = () => {
    setConfirmOpen(false);
    fetcher.submit(
      { issueId: issue.id },
      { method: 'POST', action: '/api/fix/apply' },
    );
  };

  return (
    <Page
      backAction={{ content: 'Issues', url: '/app/issues' }}
      title={issue.title}
      subtitle={issue.description}
      primaryAction={
        fixMeta?.tier === 1
          ? {
              content: submitting ? 'Applying…' : `[ ${fixMeta.displayName} ]`,
              onAction: () => setConfirmOpen(true),
              disabled: submitting || products.length === 0,
            }
          : undefined
      }
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200">
                <Badge tone={severityTone(issue.severity)}>{issue.severity}</Badge>
                <Badge>{`pillar: ${issue.pillar}`}</Badge>
                <Badge>{`code: ${issue.code}`}</Badge>
                {fixMeta ? (
                  <Badge tone={fixMeta.tier === 1 ? 'success' : 'attention'}>
                    {fixMeta.tier === 1 ? 'Tier 1 — one-click' : `Tier ${fixMeta.tier}`}
                  </Badge>
                ) : (
                  <Badge tone="info">Detect-only</Badge>
                )}
              </InlineStack>

              {fixMeta?.tier === 1 ? (
                <Text as="p">{fixMeta.description}</Text>
              ) : !fixMeta ? (
                <Text as="p" tone="subdued">
                  This issue requires merchant action — see GTIN guidance or
                  store policies for next steps.
                </Text>
              ) : null}

              {fetcher.data?.ok ? (
                <Box
                  background="bg-surface-success-active"
                  padding="200"
                  borderRadius="200"
                >
                  <Text as="p" fontWeight="medium">
                    Fix queued. Score will refresh once it lands.
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
                    Could not apply fix: {fetcher.data.code ?? 'unknown error'}
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
                Affected products ({products.length})
              </Text>
            </Box>
            {products.length === 0 ? (
              <Box padding="400">
                <Text as="p" tone="subdued">
                  No affected-product details on this issue. Re-scan to
                  populate.
                </Text>
              </Box>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={products.length}
                selectedItemsCount={
                  allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                selectable={false}
                headings={[
                  { title: 'Title' },
                  { title: 'Handle' },
                  { title: 'Vendor' },
                ]}
              >
                {products.map((p, index) => (
                  <IndexTable.Row id={p.id} key={p.id} position={index}>
                    <IndexTable.Cell>
                      <Text as="span" fontWeight="medium">
                        {p.title}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" tone="subdued">
                        {p.handle}
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{p.vendor ?? '—'}</IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {fixMeta?.tier === 1 ? (
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={fixMeta.displayName}
          primaryAction={{
            content: fixMeta.confirmLabel,
            onAction: onConfirmApply,
            loading: submitting,
          }}
          secondaryActions={[
            { content: 'Cancel', onAction: () => setConfirmOpen(false) },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="200">
              <Text as="p">{fixMeta.description}</Text>
              <Text as="p" tone="subdued">
                {products.length} products will be updated. You can revert
                this batch from <strong>Fix history</strong> within 7 days.
              </Text>
            </BlockStack>
          </Modal.Section>
        </Modal>
      ) : null}
    </Page>
  );
}

function severityTone(
  severity: string,
): 'critical' | 'warning' | 'attention' | 'info' {
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'warning';
  if (severity === 'medium') return 'attention';
  return 'info';
}
