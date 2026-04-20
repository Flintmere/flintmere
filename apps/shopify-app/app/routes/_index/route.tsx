import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { login } from '../../shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  if (shop) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
}

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div
      style={{
        fontFamily:
          "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        maxWidth: 720,
        margin: '120px auto',
        padding: '0 24px',
        color: '#0a0a0b',
        background: '#f7f7f4',
        minHeight: '100vh',
      }}
    >
      <p
        style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#5a5c64',
          marginBottom: 32,
        }}
      >
        Flintmere for Shopify
      </p>
      <h1 style={{ fontSize: 64, letterSpacing: '-0.035em', lineHeight: 1, margin: 0 }}>
        Catalog readiness for
        <br />
        <span
          style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontWeight: 700,
          }}
        >
          [&nbsp;AI agents&nbsp;]
        </span>
      </h1>

      <p
        style={{
          marginTop: 40,
          maxWidth: '52ch',
          fontSize: 18,
          lineHeight: 1.55,
          color: '#141518',
        }}
      >
        Score your Shopify catalog for AI-agent readiness across six pillars,
        auto-fix what&rsquo;s safe to fix, and see AI-agent traffic land in
        your store. Install from the Shopify App Store or sign in via your shop
        below.
      </p>

      {showForm ? (
        <Form
          method="post"
          action="/auth/login"
          style={{ marginTop: 40, display: 'flex', gap: 0, maxWidth: 560 }}
        >
          <label htmlFor="shop" style={{ display: 'none' }}>
            Shop domain
          </label>
          <input
            id="shop"
            name="shop"
            type="text"
            placeholder="your-store.myshopify.com"
            style={{
              flex: 1,
              border: '1px solid #0a0a0b',
              borderRight: 0,
              padding: '14px 18px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              background: '#f7f7f4',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              border: '1px solid #0a0a0b',
              background: '#f8bf24',
              color: '#0a0a0b',
              padding: '14px 24px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Sign in →
          </button>
        </Form>
      ) : null}

      <p
        style={{
          marginTop: 48,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#5a5c64',
        }}
      >
        Or install from the Shopify App Store · app.flintmere.com
      </p>
    </div>
  );
}
