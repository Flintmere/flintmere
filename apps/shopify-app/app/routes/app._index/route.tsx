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
import { IslandFrame } from '../../components/island/IslandFrame';
import { ScoreRing } from '../../components/island/ScoreRing';
import { PillarGrid, type Pillar } from '../../components/island/PillarGrid';

// Static pillar names + weights. Scores fold in from the latest scan row
// once the P1 schema (task #56) lands and real scoring writes pillarScores.
const PILLAR_TEMPLATE: Array<Omit<Pillar, 'score'>> = [
  { n: '01', name: 'Product IDs', weight: '20%' },
  { n: '02', name: 'Structured attributes', weight: '20%' },
  { n: '03', name: 'Title & description quality', weight: '15%' },
  { n: '04', name: 'Google category match', weight: '15%' },
  { n: '05', name: 'Data consistency', weight: '15%' },
  { n: '06', name: 'AI agent access', weight: '15%' },
];

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
              <IslandFrame eyebrow="Flintmere · AI-readiness score">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr',
                    gap: 32,
                    alignItems: 'center',
                  }}
                >
                  <ScoreRing
                    score={latestScore.composite}
                    grade={latestScore.grade ?? undefined}
                  />
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'Geist, -apple-system, sans-serif',
                        fontSize: 22,
                        letterSpacing: '-0.015em',
                        color: '#0A0A0B',
                        lineHeight: 1.25,
                        maxWidth: '42ch',
                      }}
                    >
                      Your catalog is{' '}
                      <span
                        style={{
                          fontFamily:
                            '"Geist Mono", ui-monospace, monospace',
                          fontWeight: 700,
                        }}
                      >
                        [&nbsp;{latestScore.grade ?? '—'}&nbsp;]
                      </span>{' '}
                      for AI shopping agents.
                    </p>
                    <p
                      style={{
                        margin: 0,
                        marginTop: 12,
                        fontFamily:
                          '"Geist Mono", ui-monospace, monospace',
                        fontSize: 11,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: '#5A5C64',
                      }}
                    >
                      GTIN-less ceiling · {latestScore.gtinlessCeiling}/100
                    </p>
                  </div>
                </div>
              </IslandFrame>
            </Layout.Section>

            <Layout.Section>
              <IslandFrame eyebrow="Six pillars">
                <PillarGrid
                  pillars={PILLAR_TEMPLATE.map((p, i) => ({
                    ...p,
                    score: derivePillarScore(latestScore.composite, i),
                  }))}
                />
              </IslandFrame>
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

// Placeholder until pillarScores JSON lands on the scores row (task #56).
// Spreads the composite across the six pillars deterministically so the
// art spike has something to render. Remove once real pillar scores exist.
function derivePillarScore(composite: number, index: number): number {
  const spread = [6, -4, 2, -2, 4, -6];
  return Math.max(0, Math.min(100, composite + (spread[index] ?? 0)));
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
