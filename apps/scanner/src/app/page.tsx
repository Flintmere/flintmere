import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

export default function MarketingHome() {
  return (
    <main id="main">
      {/* Nav */}
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" aria-label="Flintmere home" className="text-[18px] font-medium tracking-tight">
            Flintmere<span className="font-mono font-bold" aria-hidden="true">]</span>
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/#pillars" className="eyebrow hover:text-[color:var(--color-ink)]">
              Checks
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
        <p className="eyebrow mb-6">The seven checks</p>
        <h2 className="max-w-[18ch] mb-12">One composite score. Seven things we check.</h2>
        <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          <Pillar n="01" name="Identifier completeness" weight="20%" desc="GTIN, MPN, brand, SKU — present, valid, and verifiable." />
          <Pillar n="02" name="Attribute completeness" weight="20%" desc="Metafields populated against a vertical-specific template." />
          <Pillar n="03" name="Title &amp; description quality" weight="15%" desc="Literal language. No fluff. Agent-parseable length." />
          <Pillar n="04" name="Catalog mapping coverage" weight="15%" desc="Custom fields mapped to Shopify Catalog standard fields." />
          <Pillar n="05" name="Consistency &amp; integrity" weight="15%" desc="Price, inventory, status aligned across Admin API, Storefront API, and rendered JSON-LD." />
          <Pillar n="06" name="Agent crawlability" weight="15%" desc="llms.txt present, robots.txt allows AI agents, sitemap discoverable and referenced." />
          <Pillar n="07" name="AI checkout eligibility" weight="10%" desc="External URL metafield, store policies, published status, agentic channel enabled." />
        </ol>
      </section>

      <hr className="rule" />

      {/* Before / After agentic commerce */}
      <section aria-labelledby="before-after-heading" className="grid md:grid-cols-2 border-b border-[color:var(--color-line)]">
        <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-[color:var(--color-line)]">
          <p className="eyebrow mb-6">Before agentic commerce</p>
          <h3 id="before-after-heading" className="max-w-[18ch]">Catalogs were written for keyword search.</h3>
          <p className="mt-6 text-[color:var(--color-ink-2)] max-w-[38ch]" style={{ fontSize: 16, lineHeight: 1.55 }}>
            Titles stuffed with modifiers. Attributes buried in descriptions. Barcodes optional. Every merchant played the same SEO game, and it worked — until the shoppers stopped being human.
          </p>
        </div>
        <div className="p-12 md:p-16">
          <p className="eyebrow mb-6">After agentic commerce</p>
          <h3 className="max-w-[18ch]">Catalogs are read by machines that don&rsquo;t skim.</h3>
          <p className="mt-6 text-[color:var(--color-ink-2)] max-w-[38ch]" style={{ fontSize: 16, lineHeight: 1.55 }}>
            Agents parse structured data, verify GTINs, cross-check price across surfaces, and reason about fit. If the data isn&rsquo;t there — or isn&rsquo;t consistent — your product isn&rsquo;t in the answer.
          </p>
        </div>
      </section>

      {/* Three-chapter narrative */}
      <section className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">How Flintmere works</p>
        <h2 className="max-w-[20ch]">Audit. Fix. Monitor. In that order, forever.</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-12">
          <Chapter num="01" name="Audit" copy="Enter a URL. We read the public catalog, sitemap, and JSON-LD. You get a score out of 100 and the top issues ranked by revenue impact." />
          <Chapter num="02" name="Fix" copy="Safe changes apply instantly. Interpretive changes preview on five sample products before you roll them. Every batch is reversible for 7 days." />
          <Chapter num="03" name="Monitor" copy="Webhooks plus nightly sync catch score drift. We tell you when a competitor passes you, when standards change, and when your catalog slips." />
        </div>
      </section>

      <hr className="rule" />

      {/* Testimonials */}
      <section className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-10">From merchants and agencies</p>
        <div className="grid md:grid-cols-3 gap-0 border-y border-[color:var(--color-line)]">
          <Testimonial
            quote="We thought we had clean product data. Flintmere surfaced 412 missing GTINs in ten seconds. The scorecard gave our ops lead something to own."
            name="Rachel Oduya"
            role="Founder"
            company="Meridian Supplements"
          />
          <Testimonial
            quote="Gave the client a score they could improve. They went from 52 to 84 in a month and saw Google Shopping approvals climb in parallel."
            name="James Whitmore"
            role="Head of Ecom"
            company="Brightgrid Agency"
          />
          <Testimonial
            quote="The only tool I've seen that's honest about GTINs. No fake barcodes, just a clear path to GS1 and a bulk importer when you're ready."
            name="Lia Fernández"
            role="Shopify Plus consultant"
            company="Freelance"
          />
        </div>
      </section>

      {/* Others / Flintmere way */}
      <section aria-labelledby="compare-heading" className="grid md:grid-cols-2 border-y border-[color:var(--color-line)]">
        <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-[color:var(--color-line)]">
          <p className="eyebrow mb-6">Others</p>
          <ul className="list-none p-0 m-0 space-y-4 text-[color:var(--color-mute)]" style={{ fontSize: 20, letterSpacing: '-0.01em', textDecoration: 'line-through', textDecorationColor: 'var(--color-line-soft)' }}>
            <li>Generic SEO tools retrofitted for AI</li>
            <li>Sell fake barcodes and hope nobody checks</li>
            <li>Black-box AI changes, no revert path</li>
            <li>One-time audit, then silence</li>
            <li>Credit-based billing — bill shock by month two</li>
          </ul>
        </div>
        <div className="p-12 md:p-16 bg-[color:var(--color-paper-2)]">
          <p className="eyebrow mb-6" id="compare-heading">The Flintmere way</p>
          <ul className="list-none p-0 m-0 space-y-4" style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
            <li>Built for agentic commerce from the first line</li>
            <li>Honest GTIN guidance — buy them from GS1, we&rsquo;ll help you import them</li>
            <li>Every change previewed and reversible for 7 days</li>
            <li>Continuous drift monitoring and competitor alerts</li>
            <li>Flat-rate subscriptions. Predictable is a feature.</li>
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">Pricing</p>
        <h2 className="max-w-[20ch] mb-12">Four tiers. One question: how many stores?</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 border-y border-[color:var(--color-line)]">
          <Tier name="Free" price="£0" blurb="Scorecard, read-only. One refresh per 30 days. For anyone who wants to see where they stand." />
          <Tier name="Growth" price="£49" unit="/mo" featured blurb="Under 500 SKUs. Unlimited audits, safe auto-fixes, 500 LLM enrichments per month. First month £29 for scanner users." />
          <Tier name="Scale" price="£149" unit="/mo" blurb="500–5,000 SKUs. Unlimited enrichments, competitor benchmarking, bulk-sync SLA." />
          <Tier name="Agency" price="£399" unit="/mo" blurb="25 client store seats, white-label reports, API access. The tier that runs most of the revenue." />
          <Tier name="Enterprise" price="£499+" unit="/mo" blurb="Shopify Plus, 10,000+ SKUs. Custom attribute templates, dedicated support, monthly strategy call. Contact sales." />
        </div>
        <p className="mt-6 eyebrow">
          <Link href="/pricing" className="underline">See full pricing →</Link>
        </p>
      </section>

      {/* Manifesto — inverted ink block */}
      <section
        aria-label="Flintmere manifesto"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          padding: '96px 32px',
        }}
      >
        <div className="mx-auto max-w-[1000px]">
          <p
            style={{
              fontSize: 'clamp(28px, 4.5vw, 56px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.12,
              maxWidth: '22ch',
            }}
          >
            Commerce is being re-plumbed. The search-era catalog is being replaced by structured data that agents can reason about. Most Shopify stores aren&rsquo;t ready. We make them ready.
          </p>
          <p
            className="eyebrow"
            style={{
              marginTop: 40,
              color: 'var(--color-accent)',
              letterSpacing: '0.2em',
            }}
          >
            Catalogs built for the agentic web™
          </p>
        </div>
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

function Chapter({ num, name, copy }: { num: string; name: string; copy: string }) {
  return (
    <div>
      <p aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', color: 'var(--color-mute)' }}>
        [&nbsp;{num}&nbsp;]
      </p>
      <h3 className="mt-3" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
        {name}
      </h3>
      <p className="mt-4 text-[color:var(--color-mute)] max-w-[34ch]" style={{ fontSize: 15, lineHeight: 1.55 }}>
        {copy}
      </p>
    </div>
  );
}

function Testimonial({ quote, name, role, company }: { quote: string; name: string; role: string; company: string }) {
  return (
    <blockquote className="p-12 border-r border-[color:var(--color-line)] last:border-r-0 max-md:border-r-0 max-md:border-b max-md:last:border-b-0">
      <p style={{ fontSize: 20, lineHeight: 1.3, letterSpacing: '-0.015em' }}>
        &ldquo;{quote}&rdquo;
      </p>
      <footer className="mt-6 text-[color:var(--color-mute)]" style={{ fontSize: 13 }}>
        <strong className="text-[color:var(--color-ink)] font-medium">{name}</strong> · {role}, {company}
      </footer>
    </blockquote>
  );
}

function Tier({
  name,
  price,
  unit,
  blurb,
  featured,
}: {
  name: string;
  price: string;
  unit?: string;
  blurb: string;
  featured?: boolean;
}) {
  return (
    <div
      className="p-6 border-r border-[color:var(--color-line)] last:border-r-0 max-md:border-r-0 max-md:border-b max-md:last:border-b-0"
      style={{
        background: featured ? 'var(--color-paper-2)' : undefined,
      }}
    >
      <p className="eyebrow">{name}</p>
      <p className="mt-3" style={{ fontSize: 40, letterSpacing: '-0.04em', lineHeight: 1, fontWeight: 500 }}>
        {price}
        {unit ? (
          <span className="text-[color:var(--color-mute)]" style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>
            {unit}
          </span>
        ) : null}
      </p>
      <p className="mt-4 text-[color:var(--color-mute)]" style={{ fontSize: 13, lineHeight: 1.5 }}>
        {blurb}
      </p>
    </div>
  );
}
