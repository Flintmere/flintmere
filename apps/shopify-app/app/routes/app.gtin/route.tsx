import type { LoaderFunctionArgs } from '@remix-run/node';
import {
  BlockStack,
  Box,
  Card,
  Layout,
  Link,
  Page,
  Text,
} from '@shopify/polaris';
import { authenticate } from '../../shopify.server';

// Placeholder until the gtin-guidance skill builds out the full surface.
// SPEC §5.3 — Tier 3 fix: the app cannot generate GTINs (those must be
// licensed from GS1). This page surfaces the merchant-action guidance:
// per-geography routing to GS1 office, CSV-import-your-purchased-GTINs
// flow, and the non-affiliation disclaimer.

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return null;
}

export default function GtinGuidance() {
  return (
    <Page
      title="GTIN guidance"
      subtitle="What to do about missing or invalid product identifiers."
    >
      <Layout>
        <Layout.AnnotatedSection
          title="What is a GTIN?"
          description="The 12–14 digit barcode (UPC, EAN, ISBN) that AI shopping agents and major marketplaces use to look up your products."
        >
          <Card>
            <BlockStack gap="200">
              <Text as="p">
                AI agents like ChatGPT, Gemini, and Microsoft Copilot
                cross-reference product listings against the GS1 GTIN
                database. Products without a registered GTIN are routinely
                excluded from AI shopping recommendations and can be
                suppressed from Amazon and Google Shopping.
              </Text>
              <Text as="p">
                Flintmere can&rsquo;t generate GTINs — they must be
                licensed from GS1. We can guide you to the right path
                for your geography and import the codes you purchase
                back into your catalog automatically.
              </Text>
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          title="Where to buy"
          description="Pricing varies by country and catalog size."
        >
          <Card>
            <BlockStack gap="200">
              <Box>
                <Text as="p" fontWeight="medium">
                  UK merchants
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  GS1 UK membership from £50/year (excl. VAT), tiered by
                  annual turnover.{' '}
                  <Link url="https://www.gs1uk.org/" external>
                    gs1uk.org
                  </Link>
                </Text>
              </Box>
              <Box>
                <Text as="p" fontWeight="medium">
                  US merchants &lt; 10 products
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  GS1 US single GTIN, $30 one-time, no annual renewal.{' '}
                  <Link url="https://www.gs1us.org/" external>
                    gs1us.org
                  </Link>
                </Text>
              </Box>
              <Box>
                <Text as="p" fontWeight="medium">
                  US merchants 10+ products
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  GS1 US Company Prefix, tiered annual pricing.
                </Text>
              </Box>
              <Box>
                <Text as="p" fontWeight="medium">
                  Other countries
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  Find your local GS1 office at{' '}
                  <Link url="https://www.gs1.org/contact/offices" external>
                    gs1.org/contact/offices
                  </Link>
                </Text>
              </Box>
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          title="Import GTINs from CSV"
          description="Once you have GTINs from GS1, paste them in and we'll write them to the right products."
        >
          <Card>
            <Text as="p" tone="subdued">
              CSV import flow lands with the next release. The accepted
              format will be: <code>sku,gtin</code> per row, mapping your
              SKUs to the GTINs you purchased.
            </Text>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          title="Disclaimer"
          description="Flintmere is not affiliated with GS1."
        >
          <Card>
            <Text as="p" tone="subdued" variant="bodySm">
              The information above describes marketplace requirements
              and is not legal advice. Barcode and identifier
              requirements vary by marketplace and jurisdiction. Consult
              official sources for authoritative guidance.
            </Text>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}
