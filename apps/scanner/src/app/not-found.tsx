import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import {
  MARKETING_HOST,
  SCANNER_HOST,
} from '@/lib/host-routing';
import { marketingUrl, scannerUrl } from '@/lib/host-url';

// Root not-found. Without this, Next.js's built-in default emits a stray
// <title>404…</title> + <meta robots noindex> alongside the root layout's
// metadata, leaving conflicting tags on every 404. This component takes
// ownership: clean noindex, no conflicting title.
//
// Host-aware copy per C1 (council 2026-05-03): if the request hit the
// marketing host but the URL looks like a scanner route (or vice versa),
// the page suggests the right host. Better than a generic 404.
export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const hdrs = await headers();
  const requestHost = (
    hdrs.get('x-forwarded-host') ??
    hdrs.get('host') ??
    ''
  )
    .split(':')[0]!
    .toLowerCase();

  const onScanner = requestHost === SCANNER_HOST;
  const otherHost = onScanner ? MARKETING_HOST : SCANNER_HOST;
  const otherSurface = onScanner
    ? 'pricing, the methodology, and the research benchmark'
    : 'the scanner, the concierge audit, and the bot policy page';

  return (
    <main id="main">
      <section className="mx-auto max-w-[1280px] px-8 py-24 md:py-32">
        <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">404</p>
        <h1 className="max-w-[20ch]">
          The page you wanted isn&rsquo;t <Bracket>here</Bracket>.
        </h1>
        <p
          className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.5 }}
        >
          {requestHost ? (
            <>
              You&rsquo;re on{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {requestHost}
              </span>
              . If you&rsquo;re looking for {otherSurface}, those live on{' '}
              <a
                href={`https://${otherHost}`}
                style={{ textDecoration: 'underline' }}
              >
                {otherHost}
              </a>
              . Otherwise the URL is wrong or the page has moved.
            </>
          ) : (
            <>The URL is wrong, or the page has moved.</>
          )}
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          <a href={scannerUrl('/scan')} className="btn btn-accent">
            Run the free scan →
          </a>
          <a href={marketingUrl('/pricing')} className="btn">
            See pricing
          </a>
          <a href={marketingUrl('/')} className="btn">
            Back to home
          </a>
        </div>
      </section>
    </main>
  );
}
