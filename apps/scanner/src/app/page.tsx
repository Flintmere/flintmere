import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

export default function MarketingHome() {
  return (
    <main id="main">
      {/* Nav */}
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" aria-label="Flintmere home" className="text-[18px] font-medium tracking-tight">
            Flintmere
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/#pillars" className="eyebrow hover:text-[color:var(--color-ink)]">
              Pillars
            </Link>
            <Link href="/#pricing" className="eyebrow hover:text-[color:var(--color-ink)]">
              Pricing
            </Link>
            <Link href="/research" className="eyebrow hover:text-[color:var(--color-ink)]">
              Research
            </Link>
          </nav>
          <Link href="/scan" className="btn btn-accent">
            Run a free scan →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-8 py-24 md:py-32">
        <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">
          Free scan · 60 seconds · No install
        </p>
        <h1 className="max-w-[14ch]">
          Your product catalog is <Bracket>invisible</Bracket> to ChatGPT.
        </h1>
        <p
          className="mt-10 max-w-[52ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 19, lineHeight: 1.5 }}
        >
          AI shopping agents now drive measurable commerce traffic on Shopify. Roughly 40% of catalogs get excluded from agent recommendations because the product data isn&rsquo;t structured the way agents read it. We tell you where you stand in 60 seconds.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Scan my store →
          </Link>
          <Link href="/#pillars" className="btn">
            How it works
          </Link>
        </div>
      </section>

      <hr className="rule" />

      {/* Numbers strip */}
      <section aria-label="Key statistics" className="mx-auto max-w-[1280px] px-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          <Stat big="15×" label="YoY growth in AI-agent orders on Shopify (2025)" />
          <Stat big="40%" label="Catalogs ignored by AI agents today" />
          <Stat big="5.6M" label="Shopify stores auto-enrolled in agentic storefronts" />
          <Stat big="3–4×" label="Visibility lift at 99%+ attribute completion" />
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">The six pillars</p>
        <h2 className="max-w-[18ch] mb-12">One composite score. Six things we check.</h2>
        <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          <Pillar n="01" name="Identifier completeness" weight="20%" desc="GTIN, MPN, brand, SKU — present, valid, and verifiable." />
          <Pillar n="02" name="Attribute completeness" weight="25%" desc="Metafields populated against a vertical-specific template." />
          <Pillar n="03" name="Title &amp; description quality" weight="15%" desc="Literal language. No fluff. Agent-parseable length." />
          <Pillar n="04" name="Catalog mapping coverage" weight="15%" desc="Custom fields mapped to Shopify Catalog standard fields." />
          <Pillar n="05" name="Consistency &amp; integrity" weight="15%" desc="Price, inventory, status aligned across Admin API, Storefront API, and rendered JSON-LD." />
          <Pillar n="06" name="AI checkout eligibility" weight="10%" desc="External URL metafield, store policies, published status, agentic channel enabled." />
        </ol>
      </section>

      {/* Footer */}
      <footer className="border-t border-[color:var(--color-line)] py-10">
        <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
          <p className="eyebrow">© 2026 Flintmere Ltd</p>
          <nav className="flex gap-8" aria-label="Footer">
            <Link href="/privacy" className="eyebrow">Privacy</Link>
            <Link href="/terms" className="eyebrow">Terms</Link>
            <Link href="/security" className="eyebrow">Security</Link>
            <Link href="/scan" className="eyebrow">Scan</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="p-8">
      <div
        style={{
          fontSize: 52,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        {big}
      </div>
      <p className="mt-3 eyebrow max-w-[24ch]">{label}</p>
    </div>
  );
}

function Pillar({ n, name, weight, desc }: { n: string; name: string; weight: string; desc: string }) {
  return (
    <li className="grid grid-cols-[80px_280px_1fr_100px] gap-6 py-7 items-baseline max-md:grid-cols-1 max-md:gap-2">
      <span
        aria-hidden="true"
        style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}
      >
        [&nbsp;{n}&nbsp;]
      </span>
      <span style={{ fontSize: 22, letterSpacing: '-0.01em' }} dangerouslySetInnerHTML={{ __html: name }} />
      <span className="text-[color:var(--color-mute)] text-[15px] leading-[1.45]" dangerouslySetInnerHTML={{ __html: desc }} />
      <span className="eyebrow text-right max-md:text-left">{weight}</span>
    </li>
  );
}
