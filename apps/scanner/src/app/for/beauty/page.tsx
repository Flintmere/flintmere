import Link from 'next/link';
import type { Metadata } from 'next';
import { Bracket } from '@/components/Bracket';
import { prisma } from '@/lib/db';
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary';
import { BENCHMARK_FLOOR, BENCHMARK_PUBLISH_FLOOR } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Flintmere for beauty brands — shades, INCI, claims, agent-ready',
  description:
    'The beauty-catalog mistakes that make AI shopping agents skip your store — shade names only a human could parse, INCI buried in images, claims taxonomy missing. Flintmere detects each one.',
};

export const revalidate = 3600;

interface Mistake {
  n: string;
  title: string;
  symptom: string;
  pillar: string;
  fix: string;
}

// Eight beauty-specific mistakes. Observable in real beauty catalogs —
// clean beauty startups, indie shade-range brands, cruelty-free positioning,
// large archetype-driven collections. Sequenced: ingredients + shade first
// (highest-scoring filter queries), volume + claims next (agent-table
// features), then the structural ones (skin/hair type, GTIN drift), then
// the drift killer (seasonal gondolas).
const MISTAKES: Mistake[] = [
  {
    n: '01',
    title: 'INCI list delivered as a back-of-bottle PNG',
    symptom:
      "Your ingredient panel is a beautiful image — every brand does it. But agents can't read 'fragrance-free' off a 900×1200 JPG. A shopper asking ChatGPT for a niacinamide serum without fragrance gets the one brand that published their INCI as structured text.",
    pillar: 'Structured attributes',
    fix: "Flintmere scans for an ingredients metafield or an in-description INCI block, flags image-only panels, and points you at the five to ten products with the highest search volume to convert first.",
  },
  {
    n: '02',
    title: 'Shade names only a human could parse',
    symptom:
      "'Midnight Kiss.' 'Paper Crane.' 'First Dawn.' Beautiful merchandising; zero structured shade field. An agent answering 'nude lipstick' has no way to map Paper Crane to nude — so your 40-shade range might as well be one shade for agent-discovery purposes.",
    pillar: 'Structured attributes',
    fix: "We check every variant for a structured shade-family field (nude, red, pink, berry, coral, brown, plum, bold) alongside your poetic names. Keep the romance; add the filter agents can match.",
  },
  {
    n: '03',
    title: 'Volume encoded as free text, not structured ml / fl oz',
    symptom:
      "Your variants say 'Travel Size', 'Standard', 'Value Size'. Shoppers know what those mean. Agents don't. The structured size_volume metafield sits empty on 94% of variants, so price-per-ml queries — which agents run constantly — skip your entire catalog.",
    pillar: 'Structured attributes',
    fix: "Flintmere flags free-text volume variants and offers a regex to extract numeric ml / oz values from existing variant titles — so you can bulk-populate the structured field without retyping each SKU.",
  },
  {
    n: '04',
    title: 'Claims written in prose, not a structured taxonomy',
    symptom:
      "Your descriptions say 'vegan', 'cruelty-free', 'fragrance-free' in beautiful hand-crafted sentences. Agents matching 'vegan + fragrance-free cleanser' scan your description for those exact tokens, get inconsistent matches, and default to brands that publish a structured claims array.",
    pillar: 'Structured attributes',
    fix: "We check for a claims or certifications metafield using the industry standard taxonomy (vegan, cruelty-free, fragrance-free, paraben-free, sulfate-free, dermatologically-tested, hypoallergenic) and flag products using prose-only claims.",
  },
  {
    n: '05',
    title: 'Period-after-opening (PAO) metafield empty on every SKU',
    symptom:
      "EU + UK regulations require PAO on packaging but rarely make it into Shopify as structured data. Agents filtering for 'fresh, recently launched' or answering regulatory-aware queries skip products with no PAO. Your clean-beauty positioning depends on this field being present.",
    pillar: 'Data consistency',
    fix: "Flintmere checks for a period_after_opening metafield (standard EU spec: 6M / 12M / 24M / 36M) and flags every product missing it, grouped by category so you can populate by product archetype.",
  },
  {
    n: '06',
    title: 'Skin type / hair type metafield not populated',
    symptom:
      "A shopper asking 'cleanser for oily skin' depends on the agent matching a structured skin_type field. You mention 'oily and combination' in 40% of your descriptions. Agents can't parse it consistently — they return the three brands that ship structured taxonomies.",
    pillar: 'Google category match',
    fix: "We check for skin_type / hair_type metafields using the Sephora-aligned taxonomy (oily, dry, combination, sensitive, normal; fine, thick, curly, coily, straight) and flag products where the field is empty or uses free-text synonyms.",
  },
  {
    n: '07',
    title: 'GTINs present on hero SKUs, missing on limited editions + collabs',
    symptom:
      "Your hero line carries GS1 barcodes. The limited-edition collab you launched last month — the one with 30× the social buzz — has no GTINs. Agents demote it; shoppers asking about it by name don't find it in Amazon or Google Shopping. The hero line gets the halo; the collab disappears.",
    pillar: 'Product IDs',
    fix: "Flintmere flags every variant missing a barcode, validates the checksum on the ones you have, and groups the missing ones by collection — so you route the GS1 UK purchase decision by drop.",
  },
  {
    n: '08',
    title: 'Seasonal + limited products still ACTIVE with zero inventory',
    symptom:
      "Your holiday gift sets, the sold-out collab, the three shades you discontinued in January — all still status=ACTIVE with zero stock. Agents crawl them, send shoppers to dead pages, and your domain's agent-score drops. Limited drops are marketing gold and catalog-hygiene poison.",
    pillar: 'Data consistency',
    fix: "Flintmere cross-checks status × inventory × policy × publish date, ranks the dead pages by traffic cost, and gives you a one-click list of products that should be DRAFT, archived with redirect, or restocked.",
  },
];

async function getBeautyMedian(): Promise<{
  available: boolean;
  preview: boolean;
  n: number;
  median: number | null;
  grade: string | null;
}> {
  const rows = await prisma.scan.findMany({
    where: {
      OR: [{ source: 'bot' }, { publishedToBenchmark: true }],
      status: 'complete',
      vertical: 'beauty',
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
  const bucket = summary.byVertical.beauty;
  if (!bucket || bucket.n < BENCHMARK_FLOOR) {
    return {
      available: false,
      preview: false,
      n: bucket?.n ?? 0,
      median: null,
      grade: null,
    };
  }
  return {
    available: true,
    preview: bucket.n < BENCHMARK_PUBLISH_FLOOR,
    n: bucket.n,
    median: bucket.medianScore,
    grade: medianGrade(bucket.medianScore ?? 0),
  };
}

function medianGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export default async function FlintmereForBeauty() {
  const bench = await getBeautyMedian();

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
            <Link href="/#pillars" className="eyebrow hover:text-[color:var(--color-ink)]">
              Pillars
            </Link>
            <Link href="/pricing" className="eyebrow hover:text-[color:var(--color-ink)]">
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

      <section className="mx-auto max-w-[1280px] px-8 py-20 md:py-28">
        <p className="eyebrow mb-6">
          For beauty brands · 20–2,000 SKUs · £500K–£30M revenue
        </p>
        <h1 className="max-w-[22ch]">
          Beauty catalogs don&rsquo;t lose on shade. They lose on a missing{' '}
          <Bracket>INCI</Bracket> field.
        </h1>
        <p
          className="mt-8 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.55 }}
        >
          AI shopping agents filter beauty on ingredients, shade, volume,
          claims, skin type and regulatory metadata. When those fields live
          in your back-of-pack imagery and hand-written descriptions instead
          of structured metafields, the agent defaults to the brand that
          published structured data. Eight beauty-specific mistakes below
          &mdash; each one concretely observable in a real Shopify catalog.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Scan my beauty store →
          </Link>
          <Link href="/audit" className="btn">
            Book a £97 concierge audit
          </Link>
        </div>
      </section>

      <section
        aria-label="Beauty benchmark"
        className="border-y border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-20 grid md:grid-cols-[auto_1fr_auto] gap-10 items-end">
          <div>
            <p className="eyebrow mb-4">
              {bench.available && !bench.preview
                ? 'Beauty median'
                : bench.available
                  ? 'Beauty · early sample'
                  : 'Beauty benchmark'}
            </p>
            <p
              style={{
                fontSize: 'clamp(88px, 14vw, 220px)',
                fontWeight: 500,
                letterSpacing: '-0.045em',
                lineHeight: 0.92,
              }}
            >
              {bench.available && bench.median !== null ? bench.median : '—'}
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
              className="eyebrow mt-3 text-[color:var(--color-mute)]"
              style={{ fontSize: 12 }}
            >
              {bench.available && !bench.preview
                ? `/ 100 · grade ${bench.grade} · ${bench.n.toLocaleString()} stores`
                : bench.available
                  ? `/ 100 · ${bench.n.toLocaleString()} store${bench.n === 1 ? '' : 's'} so far`
                  : 'awaiting first scan'}
            </p>
          </div>
          <p
            className="max-w-[48ch] pb-4 text-[color:var(--color-ink-2)]"
            style={{ fontSize: 17, lineHeight: 1.5, letterSpacing: '-0.01em' }}
          >
            {bench.available && !bench.preview
              ? 'The median beauty catalog scored by FlintmereBot. Updated monthly. Run your own scan to see where your store sits against it.'
              : bench.available
                ? `Early sample — at ${bench.n.toLocaleString()} beauty store${bench.n === 1 ? '' : 's'}, this is the score so far, not “the median beauty catalog.” The median framing publishes at ${BENCHMARK_PUBLISH_FLOOR}. Scan your store and you shift the number.`
                : 'Beauty scores appear here as soon as the first stores land in the dataset. Run yours to seed it.'}
          </p>
          <Link href="/scan" className="btn btn-accent whitespace-nowrap self-end pb-4">
            {bench.available && !bench.preview
              ? 'See my score →'
              : bench.available
                ? 'Add my score →'
                : 'Run the free scan →'}
          </Link>
        </div>
      </section>

      <section
        aria-label="Beauty-specific mistakes"
        className="mx-auto max-w-[1280px] px-8 py-20"
      >
        <p className="eyebrow mb-6">Eight beauty-specific mistakes</p>
        <h2 className="max-w-[22ch] mb-12">
          Each one is concretely observable. Each one is scored on every scan.
        </h2>
        <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
          {MISTAKES.map((m) => (
            <MistakeRow key={m.n} mistake={m} />
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="beauty-cta-heading"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
        }}
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24">
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>
            Concierge audit for beauty
          </p>
          <h2
            id="beauty-cta-heading"
            className="mt-6 max-w-[22ch]"
            style={{ color: 'var(--color-paper)' }}
          >
            Send your shop URL. Three working days later, a written{' '}
            <Bracket>audit</Bracket> lands in your inbox.
          </h2>
          <p
            className="mt-8 max-w-[56ch]"
            style={{ color: 'var(--color-mute-inv)', fontSize: 16, lineHeight: 1.55 }}
          >
            £97 gets you John reading your catalog product by product: a
            1,500-word letter pointing at specific SKUs by name (beauty teams
            get the INCI, shade-family and claims-taxonomy reads as standard),
            a per-product fix CSV with the worst ten already drafted &mdash;
            shade family, structured volume, structured claims, skin type
            &mdash; a 30-day fix sequence, the right GS1 UK route for your
            product mix, and a 30-day re-scan. No video, no call, no slide
            deck.
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
            <Link href="/pricing" className="hover:text-[color:var(--color-ink)]">
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
