import Link from 'next/link';
import type { Metadata } from 'next';
import { Bracket } from '@/components/Bracket';

export const metadata: Metadata = {
  title: 'Flintmere for Shopify Plus — seven-figure catalogs, agent-ready',
  description:
    'The catalog mistakes that quietly cost Plus brands share-of-shelf in AI shopping agents — and the Flintmere checks that detect them.',
};

interface Mistake {
  n: string;
  title: string;
  symptom: string;
  pillar: string;
  fix: string;
}

const MISTAKES: Mistake[] = [
  {
    n: '01',
    title: 'No llms.txt at the root',
    symptom:
      'Agents fall back to raw crawling. On a 10,000-SKU storefront that means slower, shallower indexing and a disadvantage against competitors who publish a curated manifest.',
    pillar: 'Agent crawlability',
    fix: 'Flintmere fetches /llms.txt during every scan and scores presence, structure (H1 + at least one H2), and content freshness.',
  },
  {
    n: '02',
    title: 'robots.txt blocks AI agents by default',
    symptom:
      'A well-meaning SEO audit added `User-agent: GPTBot Disallow: /` in 2024. It never got revisited. Your catalog is invisible to every GPT-powered shopping surface.',
    pillar: 'Agent crawlability',
    fix: 'We parse robots.txt for blanket disallows and explicit blocks on GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Applebot-Extended, cohere-ai, Bytespider, CCBot, OAI-SearchBot, ChatGPT-User.',
  },
  {
    n: '03',
    title: 'GTINs missing at the long tail',
    symptom:
      'The top 200 SKUs are clean. The next 4,800 inherited from an old supplier integration never got GS1-registered barcodes. Amazon + Google Shopping silently demote the long tail.',
    pillar: 'Identifier completeness',
    fix: 'Flintmere flags every variant missing a barcode, validates modulo-10 checksums, and shows you the GTIN-less ceiling — the best score you can reach without paying GS1 fees yet.',
  },
  {
    n: '04',
    title: 'Metafield templates drift between categories',
    symptom:
      'Apparel products have `material`, `care_instructions`, `fit`. Electronics products have `model_number`, `compatibility`, `warranty`. The overlap between the two templates is 12% and no one owns it.',
    pillar: 'Attribute completeness',
    fix: 'Install Flintmere to unlock attribute scoring. We check each product against a vertical-specific template and flag metafields that agents expect but your theme is not populating.',
  },
  {
    n: '05',
    title: 'Shopify Catalog Mapping never done',
    symptom:
      'Your team built beautiful custom metafields for `shoe-width-us`, `shoe-width-uk`. Shopify Catalog has `size.width` as a standard field. The mapping UI sits empty. Agents see raw custom fields as noise.',
    pillar: 'Catalog mapping',
    fix: 'The embedded app scores your mapping coverage and surfaces high-value mappings to commit — the ones that move the needle most on agent discoverability.',
  },
  {
    n: '06',
    title: 'Title fluff from a 2022 import job',
    symptom:
      '"BEST EVER Premium Ultra Professional Coffee Grinder Matte Black Limited Edition MUST HAVE" — 142 characters, mostly noise. Agents strip it to "Coffee Grinder" and you lose the differentiator.',
    pillar: 'Title & description quality',
    fix: 'Flintmere detects all-caps shouting, exclamation spam, promotional language, and title length exceeding the agent-parseable cap (150 chars). We show you which products need rewriting, ranked by revenue impact.',
  },
  {
    n: '07',
    title: 'Active products with zero inventory',
    symptom:
      'Drift accumulates. 380 products are ACTIVE with zero available inventory and deny-backorder policy. Agents penalise catalogs with stock inconsistencies; your rank drops across every surface.',
    pillar: 'Consistency & integrity',
    fix: 'We cross-check product status × inventory × policy and flag every product that should be DRAFT or have backorder enabled.',
  },
  {
    n: '08',
    title: 'Missing external URL for agentic checkout',
    symptom:
      'Shopify agentic storefronts require a populated external product URL metafield. Your theme writes product handles but not the fully-qualified URL, so AI checkout eligibility fails silently on 100% of the catalog.',
    pillar: 'AI checkout eligibility',
    fix: 'The embedded app inspects each product for the required metafield and offers a one-click bulk-fix that writes canonical URLs across the catalog.',
  },
];

export default function FlintmereForPlus() {
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
            <span className="font-mono font-bold" aria-hidden="true">]</span>
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link
              href="/#pillars"
              className="eyebrow hover:text-[color:var(--color-ink)]"
            >
              Pillars
            </Link>
            <Link
              href="/#pricing"
              className="eyebrow hover:text-[color:var(--color-ink)]"
            >
              Pricing
            </Link>
            <Link
              href="/research"
              className="eyebrow hover:text-[color:var(--color-ink)]"
            >
              Research
            </Link>
          </nav>
          <Link href="/scan" className="btn btn-accent">
            Run a free scan →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-20 md:py-28">
        <p className="eyebrow mb-6">
          For Shopify Plus · £5M–£200M revenue · 1,000–50,000 SKUs
        </p>
        <h1 className="max-w-[20ch]">
          Seven-figure catalogs don&rsquo;t lose agents to{' '}
          <Bracket>algorithms</Bracket>. They lose them to catalog drift.
        </h1>
        <p
          className="mt-8 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.55 }}
        >
          Plus teams ship fast. That speed creates quiet, compounding catalog
          mistakes that surface only when AI shopping agents route their queries
          to a competitor. Here are eight of them, and the Flintmere pillar that
          catches each.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Scan my Plus store →
          </Link>
          <Link href="/audit" className="btn">
            Book a £97 concierge audit
          </Link>
        </div>
      </section>

      <hr className="rule" />

      <section aria-label="Plus-scale mistakes" className="mx-auto max-w-[1280px] px-8 py-20">
        <p className="eyebrow mb-6">Eight Plus-scale mistakes</p>
        <h2 className="max-w-[20ch] mb-12">
          Each one is silent. Each one is measurable. Flintmere surfaces all eight.
        </h2>
        <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          {MISTAKES.map((m) => (
            <MistakeRow key={m.n} mistake={m} />
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="plus-cta-heading"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
        }}
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24">
          <p
            className="eyebrow"
            style={{ color: 'var(--color-accent)' }}
          >
            Plus-tier concierge
          </p>
          <h2
            id="plus-cta-heading"
            className="mt-6 max-w-[22ch]"
            style={{ color: 'var(--color-paper)' }}
          >
            Send your store URL. Three working days later, a written{' '}
            <Bracket>audit</Bracket> lands in your inbox.
          </h2>
          <p
            className="mt-8 max-w-[56ch]"
            style={{ color: 'var(--color-mute-inv)', fontSize: 16, lineHeight: 1.55 }}
          >
            £97 gets you John reading your catalog product by product, a 1,500-word
            letter pointing at specific SKUs by name, a per-product fix CSV with the
            worst ten offenders already drafted, a 30-day fix sequence, and a 30-day
            re-scan. No video, no call — just the data a Plus ops team can action
            the same morning it arrives.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="btn"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-accent-ink)',
                borderColor: 'var(--color-accent)',
              }}
            >
              Book the £97 audit →
            </Link>
            <Link
              href="/scan"
              className="btn"
              style={{
                color: 'var(--color-paper)',
                borderColor: 'var(--color-paper)',
              }}
            >
              Or run a free scan first
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 py-10 flex flex-wrap justify-between gap-4 text-[color:var(--color-mute)]">
          <p className="eyebrow">
            Flintmere · a trading name of Eazy Access Ltd · London
          </p>
          <p className="eyebrow">
            <Link href="/research" className="hover:text-[color:var(--color-ink)]">
              Research
            </Link>{' '}
            ·{' '}
            <Link href="/#pricing" className="hover:text-[color:var(--color-ink)]">
              Pricing
            </Link>{' '}
            ·{' '}
            <Link href="/scan" className="hover:text-[color:var(--color-ink)]">
              Free scan
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

function MistakeRow({ mistake }: { mistake: Mistake }) {
  return (
    <li className="grid grid-cols-[80px_1fr_200px] gap-8 py-9 items-start max-md:grid-cols-1 max-md:gap-4">
      <span
        aria-hidden="true"
        style={{
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        [&nbsp;{mistake.n}&nbsp;]
      </span>
      <div>
        <h3
          className="mb-3"
          style={{ fontSize: 22, letterSpacing: '-0.015em', lineHeight: 1.2 }}
        >
          {mistake.title}
        </h3>
        <p
          className="text-[color:var(--color-ink-2)] mb-3"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          {mistake.symptom}
        </p>
        <p
          className="text-[color:var(--color-mute)]"
          style={{ fontSize: 14, lineHeight: 1.5 }}
        >
          <strong className="text-[color:var(--color-ink)]">Flintmere:</strong>{' '}
          {mistake.fix}
        </p>
      </div>
      <p className="eyebrow text-right max-md:text-left">
        Check · {mistake.pillar}
      </p>
    </li>
  );
}
