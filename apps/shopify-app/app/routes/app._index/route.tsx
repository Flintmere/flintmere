import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  Banner,
  BlockStack,
  Box,
  Card,
  InlineGrid,
  Layout,
  Page,
  Text,
} from '@shopify/polaris';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    include: {
      scores: {
        orderBy: { scoredAt: 'desc' },
        take: 1,
        include: { issues: { orderBy: { revenueImpactScore: 'desc' }, take: 5 } },
      },
    },
  });

  return {
    shopDomain: session.shop,
    latestScore: shop?.scores[0] ?? null,
    planTier: shop?.planTier ?? 'free',
  };
}

export default function Dashboard() {
  const { shopDomain, latestScore } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Flintmere — AI-readiness"
      subtitle={
        latestScore
          ? `Last scan ${timeAgo(latestScore.scoredAt)} · ${latestScore.productCount} products analysed`
          : `Welcome to Flintmere. First catalog scan is running in the background.`
      }
      primaryAction={{
        content: 'Re-scan catalog',
        onAction: () => {
          // TODO: POST to /api/rescan
        },
      }}
    >
      <Layout>
        {!latestScore ? (
          <Layout.Section>
            <Banner
              title="Your first scan is building"
              tone="info"
            >
              <p>
                We&rsquo;re analysing {shopDomain}&rsquo;s catalog against six
                pillars. First scorecard will appear here within a few minutes
                for small catalogs, or we&rsquo;ll email you when it&rsquo;s
                ready for catalogs over 5,000 products.
              </p>
            </Banner>
          </Layout.Section>
        ) : null}

        {latestScore ? (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                      [&nbsp;{latestScore.composite}&nbsp;]
                    </span>{' '}
                    / 100 · Grade {latestScore.grade}
                  </Text>
                  <Text as="p" tone="subdued">
                    GTIN-less ceiling: {latestScore.gtinlessCeiling}/100 · Full
                    ceiling: 100/100
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Text variant="headingSm" as="h3">
                Top issues, ranked by revenue impact
              </Text>
              <Box paddingBlockStart="300">
                <BlockStack gap="200">
                  {latestScore.issues.map((issue) => (
                    <Card key={issue.id}>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="medium">
                          {issue.title}
                        </Text>
                        <Text as="p" tone="subdued" variant="bodySm">
                          {issue.description}
                        </Text>
                      </BlockStack>
                    </Card>
                  ))}
                </BlockStack>
              </Box>
            </Layout.Section>
          </>
        ) : null}

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            <Card>
              <BlockStack gap="100">
                <Text variant="headingSm" as="h3">
                  AI agent clicks (30d)
                </Text>
                <Text variant="heading2xl" as="p">—</Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  Attribution begins after your first fix lands.
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="100">
                <Text variant="headingSm" as="h3">
                  Attributed orders
                </Text>
                <Text variant="heading2xl" as="p">—</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="100">
                <Text variant="headingSm" as="h3">
                  Google Shopping approvals
                </Text>
                <Text variant="heading2xl" as="p">—</Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
