import type { HeadersFunction, LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet, useLoaderData, useRouteError } from '@remix-run/react';
import { boundary } from '@shopify/shopify-app-remix/server';
import { AppProvider } from '@shopify/shopify-app-remix/react';
import { NavMenu } from '@shopify/app-bridge-react';
import { AppProvider as PolarisAppProvider } from '@shopify/polaris';
import polarisStyles from '@shopify/polaris/build/esm/styles.css?url';
import enTranslations from '@shopify/polaris/locales/en.json';

import { authenticate } from '../../shopify.server';

export const links = () => [
  { rel: 'stylesheet', href: polarisStyles },
  // Flintmere island typography — Geist Sans + Geist Mono. Polaris owns its
  // own font stack; these load alongside and are applied only inside
  // IslandFrame children via inline font-family. DESIGN.md §island rule.
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&family=Geist+Mono:wght@400;700&display=swap',
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY ?? '' };
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <PolarisAppProvider i18n={enTranslations}>
        <NavMenu>
          <Link to="/app" rel="home">
            Dashboard
          </Link>
          <Link to="/app/issues">Issues</Link>
          <Link to="/app/fixes">Fix history</Link>
          <Link to="/app/channel-health">Channel Health</Link>
          <Link to="/app/gtin">GTIN guidance</Link>
          <Link to="/app/settings">Settings</Link>
        </NavMenu>
        <Outlet />
      </PolarisAppProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
