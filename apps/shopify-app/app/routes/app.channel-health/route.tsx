import type { LoaderFunctionArgs } from '@remix-run/node';
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

// Placeholder until the attribution-loop spec resolves
// (context/requirements/2026-04-26-attribution-loop.md). The Channel
// Health table is wired in Prisma and the dashboard reserves space for
// these metrics. Once attribution data is flowing, this page renders
// the AI-traffic deep-dive: sources, daily clicks, attributed orders,
// citation-vs-order conversion.

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return null;
}

export default function ChannelHealth() {
  return (
    <Page
      title="Channel Health"
      subtitle="AI-shopping-agent traffic, attributed orders, and citation health."
    >
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="Coming with the next release"
              image=""
            >
              <BlockStack gap="200">
                <Text as="p">
                  Once Flintmere is connected to your storefront analytics,
                  this page will report:
                </Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone="info">Live</Badge>
                      <Text as="span">
                        Daily clicks attributed to AI shopping agents
                        (ChatGPT, Gemini, Perplexity, Copilot).
                      </Text>
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone="info">Live</Badge>
                      <Text as="span">
                        Orders placed by AI agents and their attributed
                        revenue.
                      </Text>
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone="info">Live</Badge>
                      <Text as="span">
                        Google Shopping approvals + Google AI Overviews
                        citations referencing your products.
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </Box>
                <Text as="p" tone="subdued" variant="bodySm">
                  No setup needed — once your catalog has been scored,
                  attribution begins as soon as the next sync detects an
                  AI-agent referral.
                </Text>
              </BlockStack>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
