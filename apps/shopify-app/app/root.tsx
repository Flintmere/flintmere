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
// captureRemixErrorBoundaryError; surfaces an 8-char Sentry event reference
// in the body and includes the full event ID in the support mailto subject
// so help@ can pull the trace immediately.
export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  const eventId = Sentry.lastEventId();
  const refShort = eventId ? eventId.slice(0, 8) : null;

  const subject = eventId
    ? `Flintmere — error ref ${eventId}`
    : 'Flintmere — embedded app error';
  const mailto = `mailto:help@flintmere.com?subject=${encodeURIComponent(subject)}`;

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
              url: mailto,
              external: false,
            }}
          >
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                Try reloading. If it keeps happening, send us the reference below and we&rsquo;ll dig in.
              </Text>
              {refShort ? (
                <Text as="p" variant="bodySm" tone="subdued">
                  Reference: <code>{refShort}</code>
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