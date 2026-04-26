import type { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import {
  Badge,
  BlockStack,
  Box,
  Card,
  EmptyState,
  InlineStack,
  Layout,
  Page,
  Text,
} from '@shopify/polaris';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { fixTypeForIssueCode } from '../../lib/fixes/registry';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const latestScore = await prisma.score.findFirst({
    where: { shopDomain: session.shop },
    orderBy: { scoredAt: 'desc' },
    include: {
      issues: {
        orderBy: [{ severity: 'asc' }, { revenueImpactScore: 'desc' }],
      },
    },
  });

  return {
    issues:
      latestScore?.issues.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        pillar: i.pillar,
        code: i.code,
        severity: i.severity,
        affectedCount: i.affectedCount,
        hasTier1Fix: !!fixTypeForIssueCode(i.code),
      })) ?? [],
    scoredAt: latestScore?.scoredAt ?? null,
  };
}

export default function IssuesIndex() {
  const { issues, scoredAt } = useLoaderData<typeof loader>();

  if (issues.length === 0) {
    return (
      <Page title="Issues">
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState
                heading="No issues yet"
                image=""
              >
                <p>
                  Once your first catalog scan completes, every fixable
                  issue lands here ranked by revenue impact.
                </p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Issues"
      subtitle={
        scoredAt
          ? `${issues.length} issues from your latest scan.`
          : `${issues.length} issues.`
      }
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="200">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                to={`/app/issues/${issue.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Card>
                  <BlockStack gap="100">
                    <InlineStack align="space-between" blockAlign="start" wrap>
                      <Box width="70%">
                        <Text as="p" fontWeight="medium">
                          {issue.title}
                        </Text>
                      </Box>
                      <InlineStack gap="200">
                        <SeverityBadge severity={issue.severity} />
                        {issue.hasTier1Fix ? (
                          <Badge tone="success">One-click fix</Badge>
                        ) : null}
                      </InlineStack>
                    </InlineStack>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {issue.description}
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {issue.affectedCount} products affected · pillar:{' '}
                      {issue.pillar}
                    </Text>
                  </BlockStack>
                </Card>
              </Link>
            ))}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const tone =
    severity === 'critical'
      ? 'critical'
      : severity === 'high'
        ? 'warning'
        : severity === 'medium'
          ? 'attention'
          : 'info';
  return <Badge tone={tone}>{severity}</Badge>;
}
