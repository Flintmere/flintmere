import type { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import {
  Badge,
  BlockStack,
  Button,
  Card,
  EmptyState,
  IndexTable,
  InlineStack,
  Layout,
  Page,
  Text,
  useIndexResourceState,
} from '@shopify/polaris';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { getFixTypeMeta } from '../../lib/fixes/registry';
import {
  deriveFixStatus,
  statusBadgeTone,
  statusLabel,
} from '../../lib/fixes/status';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const fixes = await prisma.fix.findMany({
    where: { shopDomain: session.shop },
    orderBy: { appliedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      tier: true,
      status: true,
      fixType: true,
      productCount: true,
      appliedAt: true,
      revertableUntil: true,
      revertedAt: true,
    },
  });

  return {
    fixes: fixes.map((f) => ({
      ...f,
      displayStatus: deriveFixStatus(f),
      displayName: getFixTypeMeta(f.fixType)?.displayName ?? f.fixType,
    })),
  };
}

export default function FixesIndex() {
  const { fixes } = useLoaderData<typeof loader>();

  if (fixes.length === 0) {
    return (
      <Page title="Fix history">
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState heading="No fixes applied yet" image="">
                <p>
                  Tier 1 fixes appear here as you apply them from issue
                  drill-downs. You can revert any batch within 7 days.
                </p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const resourceName = { singular: 'fix', plural: 'fixes' };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(fixes.map((f) => ({ ...f })));

  return (
    <Page
      title="Fix history"
      subtitle={`${fixes.length} batch${fixes.length === 1 ? '' : 'es'}.`}
      secondaryActions={[
        {
          content: 'Export CSV',
          url: '/app/fixes/export.csv',
          external: true,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={fixes.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              selectable={false}
              headings={[
                { title: 'Applied' },
                { title: 'Fix' },
                { title: 'Products' },
                { title: 'Status' },
                { title: '' },
              ]}
            >
              {fixes.map((fix, index) => (
                <IndexTable.Row id={fix.id} key={fix.id} position={index}>
                  <IndexTable.Cell>
                    <Text as="span">{formatDate(fix.appliedAt)}</Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <BlockStack gap="050">
                      <Text as="span" fontWeight="medium">
                        {fix.displayName}
                      </Text>
                      <Text as="span" tone="subdued" variant="bodySm">
                        Tier {fix.tier} · {fix.fixType}
                      </Text>
                    </BlockStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{fix.productCount}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <InlineStack gap="100">
                      <Badge tone={statusBadgeTone(fix.displayStatus)}>
                        {statusLabel(fix.displayStatus)}
                      </Badge>
                      {fix.displayStatus === 'applied' ? (
                        <Text as="span" tone="subdued" variant="bodySm">
                          Revertable until {formatDate(fix.revertableUntil)}
                        </Text>
                      ) : null}
                    </InlineStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Link to={`/app/fixes/${fix.id}`}>
                      <Button variant="plain">View</Button>
                    </Link>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
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
