import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Flintmere research on agentic commerce, catalog readiness, and AI-agent visibility. Vertical-specific state-of-the-market reports coming month 2.',
};

export default function Research() {
  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" className="text-[18px] font-medium tracking-tight">
            Flintmere
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/#pillars" className="eyebrow">Pillars</Link>
            <Link href="/pricing" className="eyebrow">Pricing</Link>
            <Link href="/research" className="eyebrow" aria-current="page" style={{ color: 'var(--color-ink)' }}>Research</Link>
          </nav>
          <Link href="/scan" className="btn btn-accent">Run a free scan →</Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">Research</p>
        <h1 className="max-w-[20ch]">
          The <Bracket>state</Bracket> of AI readiness, one vertical at a time.
        </h1>
        <p
          className="mt-8 max-w-[56ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          We audit hundreds of Shopify stores per vertical and publish what we learn. Which attributes matter most to ChatGPT. Where Google Shopping diverges from agentic storefronts. How GTIN coverage moves visibility.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-8 pb-24 grid md:grid-cols-2 gap-10">
        <article className="p-12 border border-[color:var(--color-line)]">
          <p className="eyebrow mb-4">Coming · month 2</p>
          <h2 style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
            The state of AI readiness in <Bracket>beauty</Bracket>
          </h2>
          <p className="mt-4 text-[color:var(--color-mute)] max-w-[44ch]" style={{ fontSize: 14, lineHeight: 1.55 }}>
            500+ beauty stores audited. Ingredient-list coverage, volume-in-ml attribute patterns, skin-type metafield usage, GS1 UK membership as a score-lift signal. Full report with per-pillar benchmarks.
          </p>
        </article>

        <article className="p-12 border border-[color:var(--color-line)]">
          <p className="eyebrow mb-4">Coming · month 3</p>
          <h2 style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
            The state of AI readiness in <Bracket>supplements</Bracket>
          </h2>
          <p className="mt-4 text-[color:var(--color-mute)] max-w-[44ch]" style={{ fontSize: 14, lineHeight: 1.55 }}>
            Serving-size and certification coverage across 300+ supplement brands. The regulatory-disclosure gap and what it costs you in agent visibility.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]">
        <p className="eyebrow mb-4">Early access</p>
        <p className="max-w-[52ch]" style={{ fontSize: 18, lineHeight: 1.55 }}>
          Run the scanner to join the waitlist for vertical reports. We&rsquo;ll email you when the report for your vertical drops.
        </p>
        <Link href="/scan" className="btn btn-accent mt-6 inline-flex">Scan my store →</Link>
      </section>

      <footer className="border-t border-[color:var(--color-line)] py-10">
        <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
          <p className="eyebrow">© 2026 Flintmere Ltd</p>
          <nav className="flex gap-8" aria-label="Footer">
            <Link href="/privacy" className="eyebrow">Privacy</Link>
            <Link href="/terms" className="eyebrow">Terms</Link>
            <Link href="/scan" className="eyebrow">Scan</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
