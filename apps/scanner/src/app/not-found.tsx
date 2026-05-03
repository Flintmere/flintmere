import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@flintmere/ui';

// Root not-found. Without this, Next.js emits its built-in default which
// renders a stray <title>404…</title> + <meta robots noindex> alongside
// the root layout's metadata, leaving conflicting tags on every 404.
// This component takes ownership: clean noindex, no conflicting title,
// and stays on-canon.
export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="main">
      <section className="mx-auto max-w-[1280px] px-8 py-24 md:py-32">
        <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">
          404
        </p>
        <h1 className="max-w-[20ch]">
          The page you wanted isn&rsquo;t <Bracket>here</Bracket>.
        </h1>
        <p
          className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.5 }}
        >
          The URL is wrong, or the page has moved. The scanner, the pricing
          page, and the standards subdomain are all linked below.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Run the free scan →
          </Link>
          <Link href="/pricing" className="btn">
            See pricing
          </Link>
          <Link href="/" className="btn">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
