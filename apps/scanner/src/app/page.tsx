import Image from 'next/image';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { SiteFooter } from '@/components/SiteFooter';
import { ViewportReveal } from '@/components/ViewportReveal';
import { prisma } from '@/lib/db';
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary';
import { TIERS } from '@/lib/pricing';

// Belt-and-braces: render per request so build never hits the DB. The
// live-sample line stays fresh without depending on a build-time crawl.
export const dynamic = 'force-dynamic';

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
      <a href="#hero" className="skip-link">Skip to content</a>
      <ViewportReveal>
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
      <section id="hero" className="mx-auto max-w-[1280px] px-8 py-24 md:py-32">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-16 items-center">
          <div>
            <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">
              Free scan · 60 seconds · No install
            </p>
            <ViewportReveal>
              <h1 className="max-w-[18ch]">
                Your product catalog is{' '}
                <Bracket>
                  <span aria-hidden="true" className="text-outlined text-outlined--reveal">
                    invisible
                  </span>
                  <span className="sr-only">invisible</span>
                </Bracket>{' '}
                to ChatGPT, Perplexity and Claude.
              </h1>
            </ViewportReveal>
            <p className="hero-lede mt-10 max-w-[40ch] text-[color:var(--color-ink-2)]">
              Shoppers are buying through AI agents now — ChatGPT, Perplexity, Claude. Those agents skip stores with broken catalog data. Paste your URL; we show exactly where you disappear.
            </p>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link href="/scan" className="btn btn-accent">
                Run the free scan →
              </Link>
              <Link href="/audit" className="btn">
                Or book the £97 concierge audit →
              </Link>
            </div>
            <p className="hero-fineprint mt-6 max-w-[52ch] text-[color:var(--color-mute)]">
              Prefer to talk first? Email{' '}
              <a href="mailto:hello@flintmere.com" className="underline">
                hello@flintmere.com
              </a>{' '}
              — John usually replies within two working days.
            </p>
          </div>
          <figure className="hero-figure">
            <Image
              src="/marketing/hero/jar.avif"
              alt="A jar of loose-leaf tea on a real shelf, with brass lid and warm window light behind."
              width={1200}
              height={1500}
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="hero-image"
            />
            <figcaption className="hero-caption mt-4 max-w-[40ch]">
              A jar of loose-leaf tea on a real shelf. The agent extracts grade, origin, steep time — only if the data is there.
            </figcaption>
          </figure>
        </div>
      </section>

      <hr className="rule" />

      {/* Numbers strip — only verifiable claims */}
      <section aria-label="Key facts" className="mx-auto max-w-[1280px] px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          <Stat
            big="7"
            label="Checks we run on every scan — Shopify data, GS1 UK barcodes, Google Merchant Center, crawler rules, llms.txt, sitemap, checkout."
            data-reveal
            style={{ '--reveal-delay': '0ms' } as React.CSSProperties}
          />
          <Stat
            big="60s"
            label="Time the free scan takes on a store with 5,000 products. No signup."
            data-reveal
            style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
          />
          <Stat
            big="£97"
            label="One-off concierge audit by John — written audit letter, per-product fix CSV, and 30-day re-scan, within three working days."
            data-reveal
            style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
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
              <p className="live-sample-numeral">
                {sample.median}
                <span aria-hidden="true" className="live-sample-undertick" />
              </p>
              <p className="live-sample-meta eyebrow mt-4 text-[color:var(--color-mute)]">
                / 100 · median
              </p>
            </div>
            <div className="pb-4">
              <p className="live-sample-lede max-w-[40ch]">
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
        <h2 className="max-w-[22ch] mb-4">
          Seven things an AI shopping agent looks for before it will recommend your product.
        </h2>
        <p className="pillars-intro max-w-[60ch] text-[color:var(--color-mute)]">
          Each pillar carries the weight shown. Your final score is a weighted average across the seven.
        </p>
        <ol className="mt-12 list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          {[
            {
              name: 'Product IDs',
              weight: '20%',
              desc: 'Whether each product carries the codes agents look it up by — barcode, brand, manufacturer part number.',
            },
            {
              name: 'Structured attributes',
              weight: '20%',
              desc: 'Whether size, colour, material and other fields exist as structured data — not hidden inside the description.',
            },
            {
              name: 'Title & description quality',
              weight: '15%',
              desc: 'Whether titles and descriptions read like spec sheets an agent can parse — not marketing copy.',
            },
            {
              name: 'Google category match',
              weight: '15%',
              desc: 'Whether products carry a Google Merchant Center category, so agents know what you sell.',
            },
            {
              name: 'Data consistency',
              weight: '15%',
              desc: 'Whether the catalog looks healthy — images load, active products have stock, alt text exists, prices match across pages.',
            },
            {
              name: 'AI agent access',
              weight: '15%',
              desc: 'Whether AI shopping agents are allowed to read your site at all — robots rules, sitemap, llms.txt.',
            },
            {
              name: 'Agent checkout readiness',
              weight: '10%',
              desc: 'Whether an AI agent can actually complete a purchase on your store without human intervention.',
            },
          ].map((p, idx) => (
            <Pillar key={p.name} {...p} idx={idx} />
          ))}
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

      {/* What you get with the £97 audit */}
      <section
        aria-labelledby="audit-deep-heading"
        className="mx-auto max-w-[1280px] px-8 py-24"
      >
        <p className="eyebrow mb-6">What you get with the £97 audit</p>
        <h2 id="audit-deep-heading" className="max-w-[24ch]">
          A real scan. A real letter. A 30-day re-scan to prove it stuck.
        </h2>

        <div className="mt-12 grid md:grid-cols-[1.4fr_1fr] gap-12 items-start">
          {/* Audit screenshot anchor — proof of the £97 audit deliverable */}
          <figure
            className="audit-figure"
            data-reveal
            style={{ '--reveal-delay': '0ms' } as React.CSSProperties}
          >
            <Image
              src="/marketing/proof/audit-scan.avif"
              alt="Flintmere scanner results: a 49-out-of-100 score for a Shopify catalog where 1,000 of 1,000 products fail at least one AI-agent readiness check, with three top issues including missing barcodes."
              width={1200}
              height={638}
              sizes="(min-width: 768px) 60vw, 100vw"
              className="audit-image"
            />
            <figcaption className="audit-caption mt-3">
              A real Shopify catalog. The free scan in 60 seconds.
            </figcaption>
          </figure>

          {/* Deliverables list */}
          <div
            data-reveal
            style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
          >
            <p className="eyebrow mb-6 text-[color:var(--color-mute)]">
              For your <Bracket>£97</Bracket> — within three working days
            </p>
            <ul className="list-none p-0 m-0 space-y-8">
              <li>
                <p className="audit-item-name">A written audit letter</p>
                <p className="audit-item-copy">
                  One PDF. Plain English. The seven checks for your catalog,
                  ranked by how many products each one affects, with the exact
                  fix for each.
                </p>
              </li>
              <li>
                <p className="audit-item-name">A per-product fix CSV</p>
                <p className="audit-item-copy">
                  Every product that needs work, with the field that&rsquo;s
                  wrong and the value that should replace it. Import into
                  Shopify in one paste.
                </p>
              </li>
              <li>
                <p className="audit-item-name">A 30-day re-scan</p>
                <p className="audit-item-copy">
                  We rescan after you&rsquo;ve applied the fixes and tell you
                  what landed and what didn&rsquo;t — so you know the work
                  actually moved the score.
                </p>
              </li>
            </ul>
            <p className="mt-10">
              <Link href="/audit" className="btn btn-accent">
                Book the £97 audit →
              </Link>
            </p>
            <p className="audit-fineprint mt-4 text-[color:var(--color-mute)]">
              Or{' '}
              <Link href="/pricing" className="underline">
                see monthly Pro tiers
              </Link>{' '}
              for 100+ stores or recurring scans.
            </p>
          </div>
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
            <li>Sell you barcodes that aren&rsquo;t issued by GS1 UK</li>
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
          {TIERS.map((tier) => (
            <Tier
              key={tier.slug}
              name={tier.name}
              price={tier.price}
              unit={tier.unit}
              blurb={tier.blurb}
              featured={tier.featured}
            />
          ))}
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
      <SiteFooter />
      </ViewportReveal>
    </main>
  );
}

function Stat({
  big,
  label,
  ...rest
}: { big: string; label: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="stat-block p-8" {...rest}>
      <div className="stat-big">{big}</div>
      <p className="mt-3 eyebrow max-w-[24ch]">{label}</p>
    </div>
  );
}

function Pillar({
  name,
  weight,
  desc,
  idx,
}: {
  name: string;
  weight: string;
  desc: string;
  idx?: number;
}) {
  const weightLabel = `${weight.replace('%', ' percent')} of total score weight`;
  const staggerStyle =
    typeof idx === 'number'
      ? ({ '--reveal-delay': `${idx * 80}ms` } as React.CSSProperties)
      : undefined;
  return (
    <li
      className="pillar-row grid grid-cols-[280px_1fr_100px] gap-6 py-7 items-baseline max-md:grid-cols-1 max-md:gap-2"
      data-reveal
      style={staggerStyle}
    >
      <span className="pillar-name">{name}</span>
      <span className="pillar-desc text-[color:var(--color-mute)]">{desc}</span>
      <span
        className="eyebrow text-right max-md:text-left"
        aria-label={weightLabel}
      >
        {weight}
      </span>
    </li>
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
