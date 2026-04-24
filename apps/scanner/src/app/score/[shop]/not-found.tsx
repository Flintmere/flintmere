import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { SiteFooter } from '@/components/SiteFooter';

export default function ScoreNotFound() {
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
          <Link href="/scan" className="btn btn-accent">
            Run a free scan →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-24 md:py-32">
        <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">
          No public score yet
        </p>
        <h1 className="max-w-[20ch]">
          We haven&rsquo;t <Bracket>scored</Bracket> this store yet.
        </h1>
        <p
          className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.5 }}
        >
          Public score pages are opt-in by the store owner. Either this store
          hasn&rsquo;t been scanned, or the owner hasn&rsquo;t published the
          page. You can run a free scan on any Shopify store in 60 seconds.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Run the free scan →
          </Link>
          <Link href="/" className="btn">
            Back to home
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
