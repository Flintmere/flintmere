import type { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';
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
import { PILLAR_META, parsePillarsJson } from '../../lib/pillars';

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

  const latestScore = shop?.scores[0] ?? null;
  const parsed = latestScore ? parsePillarsJson(latestScore.pillars) : null;

  return {
    shopDomain: session.shop,
    latestScore,
    pillarsParse: parsed,
    planTier: shop?.planTier ?? 'free',
  };
}

export default function Dashboard() {
  const { shopDomain, latestScore, pillarsParse } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const fixApplied = searchParams.get('fix-applied');

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
        onAction: async () => {
          await fetch('/api/rescan', { method: 'POST' });
          window.location.reload();
        },
      }}
    >
      <Layout>
        {fixApplied ? (
          <Layout.Section>
            <Banner
              title="Fix queued"
              tone="success"
            >
              <p>
                Your fix is being applied in the background. The score will
                refresh once it lands.
              </p>
            </Banner>
          </Layout.Section>
        ) : null}

        {!latestScore ? (
          <Layout.Section>
            <Banner
              title="Your first scan is building"
              tone="info"
            >
              <p>
                We&rsquo;re analysing {shopDomain}&rsquo;s catalog against
                seven pillars. First scorecard will appear here within a few
                minutes for small catalogs, or we&rsquo;ll email you when
                it&rsquo;s ready for catalogs over 5,000 products.
              </p>
            </Banner>
          </Layout.Section>
        ) : null}

        {latestScore && pillarsParse?.legacyShape ? (
          <Layout.Section>
            <Banner
              title="Re-scan to populate the seventh pillar"
              tone="warning"
            >
              <p>
                Your last scan ran before AI Agent Access (crawlability)
                became part of the score. Click <em>Re-scan catalog</em> to
                refresh.
              </p>
            </Banner>
          </Layout.Section>
        ) : null}

        {latestScore && pillarsParse && !pillarsParse.ok ? (
          <Layout.Section>
            <Banner
              title="Pillar breakdown unavailable"
              tone="warning"
            >
              <p>
                We could not parse the latest pillar data. Re-scan to
                regenerate it.
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

            {pillarsParse?.ok ? (
              <Layout.Section>
                <IslandFrame eyebrow="Seven pillars">
                  <PillarGrid pillars={buildPillarRows(pillarsParse.pillars)} />
                </IslandFrame>
              </Layout.Section>
            ) : null}

            <Layout.Section>
              <Text variant="headingSm" as="h3">
                Top issues, ranked by revenue impact
              </Text>
              <Box paddingBlockStart="300">
                <BlockStack gap="200">
                  {latestScore.issues.map((issue) => (
                    <Link
                      key={issue.id}
                      to={`/app/issues/${issue.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Card>
                        <BlockStack gap="100">
                          <Text as="p" fontWeight="medium">
                            {issue.title}
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            {issue.description}
                          </Text>
                        </BlockStack>
                      </Card>
                    </Link>
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

function buildPillarRows(
  parsed: NonNullable<ReturnType<typeof parsePillarsJson>>['pillars'],
): Pillar[] {
  return PILLAR_META.map((meta) => {
    const row = parsed.find((p) => p.pillar === meta.id);
    return {
      n: meta.numeral,
      name: meta.name,
      weight: meta.weightLabel,
      score: row?.score ?? 0,
      locked: row?.locked ?? true,
      lockedReason: row?.lockedReason ?? 'crawlability-not-fetched',
    };
  });
}

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
