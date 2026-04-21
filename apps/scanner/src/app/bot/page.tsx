import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

export const metadata: Metadata = {
  title: 'FlintmereBot — the Flintmere catalog scanner',
  description:
    'FlintmereBot scans public Shopify catalogs to build anonymous, aggregated benchmarks of AI-agent readiness. What it fetches, how to opt out, and who to contact.',
  robots: { index: true, follow: true },
};

const USER_AGENT = 'FlintmereBot/1.0 (+https://audit.flintmere.com/bot)';

export default function BotPage() {
  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link
            href="/"
            aria-label="Flintmere home"
            className="text-[18px] font-medium tracking-tight"
          >
            Flintmere
            <span className="font-mono font-bold" aria-hidden="true">
              ]
            </span>
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/pricing" className="eyebrow">
              Pricing
            </Link>
            <Link href="/research" className="eyebrow">
              Research
            </Link>
          </nav>
          <Link href="/scan" className="btn">
            Run a free scan →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[720px] px-6 pt-20 pb-10">
        <p className="eyebrow mb-6">FlintmereBot</p>
        <h1 className="max-w-[20ch]">
          The Flintmere <Bracket>scanner</Bracket>, explained.
        </h1>
        <p
          className="mt-8 max-w-[56ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          FlintmereBot visits public Shopify storefronts to read the same
          catalog surfaces a buyer or an AI shopping agent would see. We
          publish anonymous, aggregate benchmarks so merchants can compare
          themselves to their vertical — never an individual-store list.
        </p>
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-10">
        <p className="eyebrow mb-4">User agent string</p>
        <pre
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: '14px 16px',
            border: '1px solid var(--color-line)',
            background: 'var(--color-paper-2)',
            overflowX: 'auto',
            margin: 0,
          }}
        >
          {USER_AGENT}
        </pre>
        <p
          className="mt-3 text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.55 }}
        >
          RFC 7231–compliant. The <code>+URL</code> resolves to this page so
          any admin seeing the traffic can verify who we are.
        </p>
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-10">
        <p className="eyebrow mb-4">What we fetch</p>
        <ul
          className="list-none p-0 m-0 space-y-3 text-[color:var(--color-ink-2)]"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          <li>
            <strong className="text-[color:var(--color-ink)]">
              /robots.txt, /sitemap.xml, /llms.txt
            </strong>{' '}
            — to see what the store tells crawlers.
          </li>
          <li>
            <strong className="text-[color:var(--color-ink)]">
              /products.json
            </strong>{' '}
            — Shopify&rsquo;s public product feed, which Shopify itself
            exposes on every storefront.
          </li>
          <li>
            <strong className="text-[color:var(--color-ink)]">
              A small sample of product pages
            </strong>{' '}
            — to read structured data, meta tags, and rendered markup.
          </li>
        </ul>
        <p
          className="mt-6 text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.55 }}
        >
          We do not attempt to sign in. We do not submit forms. We do not
          read data behind authentication. We do not crawl customer or
          order pages.
        </p>
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-10">
        <p className="eyebrow mb-4">Rate limits</p>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          One request every two seconds per host. A complete visit typically
          fetches fewer than twenty URLs. Each domain is revisited at most
          once per month.
        </p>
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-10">
        <p className="eyebrow mb-4">How to block us</p>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          Add this to your <code>/robots.txt</code>:
        </p>
        <pre
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: '14px 16px',
            border: '1px solid var(--color-line)',
            background: 'var(--color-paper-2)',
            overflowX: 'auto',
            margin: '12px 0 0 0',
          }}
        >{`User-agent: FlintmereBot
Disallow: /`}</pre>
        <p
          className="mt-3 text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.55 }}
        >
          We respect robots.txt. New directives are picked up within 24
          hours. To remove data from the benchmark entirely, email
          {' '}
          <a
            href="mailto:hello@flintmere.com?subject=FlintmereBot%20opt-out"
            className="underline"
          >
            hello@flintmere.com
          </a>
          . We reply within two working days.
        </p>
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-20">
        <p className="eyebrow mb-4">Why we publish aggregates only</p>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          Naming individual stores in a league table would be unfair and
          unhelpful. We publish vertical medians (e.g. &ldquo;beauty stores,
          median grade C&rdquo;) and never a list of stores by grade. The
          research you see on{' '}
          <Link href="/research" className="underline">
            /research
          </Link>{' '}
          is drawn from these aggregates.
        </p>
      </section>

      <footer className="border-t border-[color:var(--color-line)] py-10">
        <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
          <p className="eyebrow">
            © 2026 Flintmere · a trading name of Eazy Access Ltd
          </p>
          <nav className="flex gap-8" aria-label="Footer">
            <Link href="/privacy" className="eyebrow">
              Privacy
            </Link>
            <Link href="/terms" className="eyebrow">
              Terms
            </Link>
            <Link href="/scan" className="eyebrow">
              Scan
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
