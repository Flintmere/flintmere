import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { prisma } from '@/lib/db';
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary';

// ISR: hourly, matching /research + /api/benchmark/summary. Keeps the
// live-sample line on the home page aligned with what John cites and
// with what /research publishes.
export const revalidate = 3600;

async function loadLiveSample(): Promise<{
  show: boolean;
  median: number;
  n: number;
}> {
  const rows = await prisma.scan.findMany({
    where: {
      OR: [{ source: 'bot' }, { publishedToBenchmark: true }],
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    },
    select: { score: true, grade: true, vertical: true },
  });
  const typed: BenchmarkRow[] = rows.map((r) => ({
    score: r.score ?? 0,
    grade: r.grade ?? '',
    vertical: r.vertical,
  }));
  const summary = summariseBenchmark(typed);
  // Only surface on home once we clear the publish floor — below that
  // we quote the same numbers on /research as "early sample" but we
  // don't front-door them. Claim review (#9 + #23) — no median framing
  // at sub-publish-floor n.
  const show =
    summary.available &&
    !summary.preview &&
    summary.overall.medianScore !== null;
  return {
    show,
    median: summary.overall.medianScore ?? 0,
    n: summary.overall.n,
  };
}

export default async function MarketingHome() {
  const sample = await loadLiveSample();
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
          Shoppers are starting to buy through ChatGPT, Perplexity and Claude instead of Google. Those agents skip stores whose product data doesn&rsquo;t match Shopify, GS1 UK and Google Merchant Center rules. Paste your URL — we show you exactly where you disappear.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Run the free scan →
          </Link>
          <Link href="/audit" className="btn">
            Or book the £97 concierge audit →
          </Link>
        </div>
        <p
          className="mt-6 max-w-[52ch] text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.55 }}
        >
          Prefer to talk first? Email{' '}
          <a
            href="mailto:hello@flintmere.com"
            className="underline"
          >
            hello@flintmere.com
          </a>{' '}
          — John usually replies within two working days.
        </p>
      </section>

      <hr className="rule" />

      {/* Numbers strip — only verifiable claims */}
      <section aria-label="Key facts" className="mx-auto max-w-[1280px] px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          <Stat
            big="7"
            label="Checks we run on every scan — Shopify data, GS1 UK barcodes, Google Merchant Center, crawler rules, llms.txt, sitemap, checkout."
          />
          <Stat
            big="60s"
            label="Time the free scan takes on a store with 5,000 products. No signup."
          />
          <Stat
            big="£97"
            label="One-off concierge audit by John — written audit letter, per-product fix CSV, and 30-day re-scan, within three working days."
          />
        </div>
      </section>

      {sample.show ? (
        <section
          aria-label="Live sample"
          className="mx-auto max-w-[1280px] px-8 py-24 border-b border-[color:var(--color-line)]"
        >
          <p className="eyebrow mb-6 text-[color:var(--color-mute)]">
            Live · from our rolling sample
          </p>
          <div className="grid md:grid-cols-[auto_1fr] gap-12 items-end">
            <div>
              <p
                style={{
                  fontSize: 'clamp(88px, 14vw, 220px)',
                  fontWeight: 500,
                  letterSpacing: '-0.045em',
                  lineHeight: 0.92,
                }}
              >
                {sample.median}
                <span
                  aria-hidden="true"
                  className="inline-block align-baseline ml-2"
                  style={{
                    width: '0.22em',
                    height: '2px',
                    background: 'var(--color-accent)',
                    transform: 'translateY(-0.22em)',
                  }}
                />
              </p>
              <p
                className="eyebrow mt-4 text-[color:var(--color-mute)]"
                style={{ fontSize: 12 }}
              >
                / 100 · median
              </p>
            </div>
            <div className="pb-4">
              <p
                className="max-w-[40ch]"
                style={{ fontSize: 22, lineHeight: 1.4, letterSpacing: '-0.01em' }}
              >
                The median score across {sample.n.toLocaleString()} mid-market
                Shopify catalogs in our rolling sample. Most fall short on the
                structured fields AI shopping agents actually filter on.
              </p>
              <p className="mt-6">
                <Link href="/research" className="underline eyebrow">
                  Read the full report →
                </Link>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Seven checks */}
      <section id="pillars" className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">What we check</p>
        <h2 className="max-w-[22ch] mb-12">
          Seven things an AI shopping agent looks for before it will recommend your product.
        </h2>
        <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          <Pillar
            n="01"
            name="Product IDs"
            weight="20%"
            desc="Whether each product carries the codes agents look it up by — barcode, brand, manufacturer part number."
          />
          <Pillar
            n="02"
            name="Structured attributes"
            weight="20%"
            desc="Whether size, colour, material and other fields exist as structured data — not hidden inside the description."
          />
          <Pillar
            n="03"
            name="Title &amp; description quality"
            weight="15%"
            desc="Whether titles and descriptions read like spec sheets an agent can parse — not marketing copy."
          />
          <Pillar
            n="04"
            name="Google category match"
            weight="15%"
            desc="Whether products carry a Google Merchant Center category, so agents know what you sell."
          />
          <Pillar
            n="05"
            name="Data consistency"
            weight="15%"
            desc="Whether the catalog looks healthy — images load, active products have stock, alt text exists, prices match across pages."
          />
          <Pillar
            n="06"
            name="AI agent access"
            weight="15%"
            desc="Whether AI shopping agents are allowed to read your site at all — robots rules, sitemap, llms.txt."
          />
          <Pillar
            n="07"
            name="Agent checkout readiness"
            weight="10%"
            desc="Whether an AI agent can actually complete a purchase on your store without human intervention."
          />
        </ol>
      </section>

      <hr className="rule" />

      {/* Before / After */}
      <section aria-labelledby="before-after-heading" className="grid md:grid-cols-2 border-b border-[color:var(--color-line)]">
        <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-[color:var(--color-line)]">
          <p className="eyebrow mb-6">How product pages used to work</p>
          <h3 id="before-after-heading" className="max-w-[18ch]">Titles written for Google. Humans did the rest.</h3>
          <p className="mt-6 text-[color:var(--color-ink-2)] max-w-[38ch]" style={{ fontSize: 16, lineHeight: 1.55 }}>
            Stuffed titles. Attributes buried in descriptions. Barcodes optional. Humans skimmed and filled in the gaps. The same catalog ranked fine in Google search for a decade.
          </p>
        </div>
        <div className="p-12 md:p-16">
          <p className="eyebrow mb-6">How they work now</p>
          <h3 className="max-w-[18ch]">Machines read every word and check every field.</h3>
          <p className="mt-6 text-[color:var(--color-ink-2)] max-w-[38ch]" style={{ fontSize: 16, lineHeight: 1.55 }}>
            ChatGPT, Perplexity and Claude don&rsquo;t skim. They verify barcodes, compare prices across pages, and reject products with missing fields. No field, no recommendation.
          </p>
        </div>
      </section>

      {/* Three-chapter narrative */}
      <section className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">How Flintmere works</p>
        <h2 className="max-w-[20ch]">Audit. Fix. Watch. In that order, forever.</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-12">
          <Chapter
            num="01"
            name="Audit"
            copy="Enter a URL. We read your public catalog in 60 seconds and show you the top issues, ranked by how many products they affect."
          />
          <Chapter
            num="02"
            name="Fix"
            copy="Safe changes apply with one click. Anything judgement-based previews on five sample products before you roll it out. Every batch is reversible for 7 days."
          />
          <Chapter
            num="03"
            name="Watch"
            copy="We re-scan nightly and tell you if something slips — a competitor passes you, a new requirement lands, or a plugin breaks your structured data."
          />
        </div>
      </section>

      <hr className="rule" />

      {/* What makes us different */}
      <section aria-labelledby="different-heading" className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">Who builds Flintmere</p>
        <h2 id="different-heading" className="max-w-[22ch]">
          One founder. One focus. Read every reply.
        </h2>
        <p
          className="mt-8 max-w-[54ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          Flintmere is built by John Morris. If you book the £97 concierge
          audit, John does it — he reads your store product by product and
          writes the audit letter and per-product CSV himself. If you email
          hello@flintmere.com with a question, John replies. No operator
          team, no pitch, no sales call.
        </p>
      </section>

      {/* How we&rsquo;re different */}
      <section aria-labelledby="compare-heading" className="grid md:grid-cols-2 border-y border-[color:var(--color-line)]">
        <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-[color:var(--color-line)]">
          <p className="eyebrow mb-6">What other tools do</p>
          <ul
            className="list-none p-0 m-0 space-y-4 text-[color:var(--color-mute)]"
            style={{
              fontSize: 20,
              letterSpacing: '-0.01em',
              textDecoration: 'line-through',
              textDecorationColor: 'var(--color-line-soft)',
            }}
          >
            <li>Retrofit a Google-SEO scanner and rebrand it for AI</li>
            <li>Sell you fake barcodes that fail the first checksum test</li>
            <li>Charge by the credit, so a big catalog triples your bill</li>
            <li>One-time audit, then silence</li>
            <li>Hide the founder behind a support queue</li>
          </ul>
        </div>
        <div className="p-12 md:p-16 bg-[color:var(--color-paper-2)]">
          <p className="eyebrow mb-6" id="compare-heading">What Flintmere does</p>
          <ul
            className="list-none p-0 m-0 space-y-4"
            style={{ fontSize: 20, letterSpacing: '-0.01em' }}
          >
            <li>Built from the first line for ChatGPT, Perplexity and Claude — not Google</li>
            <li>Honest barcode guidance: buy GS1 barcodes from GS1 UK, we help you import them</li>
            <li>Every change is previewed before it ships, and reversible for 7 days</li>
            <li>Flat monthly price. Scan as often as you like. No credits.</li>
            <li>John reads every reply — usually within two working days</li>
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
            Catalogs built for AI shopping agents
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[color:var(--color-line)] py-10">
        <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
          <p className="eyebrow">
            © 2026 Flintmere · a trading name of Eazy Access Ltd
          </p>
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
