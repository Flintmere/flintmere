import { captureRemixErrorBoundaryError, withSentry } from "@sentry/remix";
import * as Sentry from "@sentry/remix";
import type { LinksFunction } from '@remix-run/node';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from '@remix-run/react';
import { Page, Layout, EmptyState, Text, BlockStack } from '@shopify/polaris';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://cdn.shopify.com' },
  { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
];

function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Root error boundary. Pure Polaris (chrome, not brand island per
// design-app-surface skill spec 2026-04-25). Captures to Sentry via
// captureRemixErrorBoundaryError; surfaces the full Sentry event reference
// in the body so the merchant can paste it into the contact form. Per
// `memory/feedback_no_mailto_links_anywhere.md` (2026-05-03), the support
// route from inside the embedded app is a new-tab navigation to the
// public contact form on flintmere.com (cross-origin from the Shopify
// admin iframe — must open in a new tab).
export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  const eventId = Sentry.lastEventId();

  return (
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <EmptyState
            heading="This page didn't load"
            image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            action={{
              content: 'Reload page',
              onAction: () => window.location.reload(),
            }}
            secondaryAction={{
              content: 'Contact support',
              url: 'https://flintmere.com/contact?topic=general',
              external: true,
            }}
          >
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                Try reloading. If it keeps happening, paste the reference below into the contact form and we&rsquo;ll dig in.
              </Text>
              {eventId ? (
                <Text as="p" variant="bodySm" tone="subdued">
                  Reference: <code>{eventId}</code>
                </Text>
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">
                  Reference unavailable — let us know what you were doing when it happened.
                </Text>
              )}
            </BlockStack>
          </EmptyState>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default withSentry(App);