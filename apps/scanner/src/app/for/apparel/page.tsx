import Link from 'next/link';
import type { Metadata } from 'next';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { prisma } from '@/lib/db';
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary';
import { BENCHMARK_FLOOR, BENCHMARK_PUBLISH_FLOOR } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Flintmere for apparel brands — size, colour, material, agent-ready',
  description:
    'The apparel-catalog mistakes that make AI shopping agents skip your store — size charts buried in images, colour names only a human can parse, composition hidden in description prose. Flintmere detects each one.',
};

// Belt-and-braces: render per request so build never hits the DB.
export const dynamic = 'force-dynamic';

interface Mistake {
  n: string;
  title: string;
  symptom: string;
  pillar: string;
  fix: string;
}

// Eight apparel-specific mistakes. Each must be concretely observable in a
// real apparel catalog; generic AI-readiness bullet points fail the #37
// parse-on-skim test. Sequenced for objection handling: size/colour first
// (immediate recognition), then the hidden ones (composition, size-chart
// images), then the structural ones (GTIN long tail, grouped-SKU products),
// then drift (seasonal ghost SKUs), then the quiet killer (gender metafield).
const MISTAKES: Mistake[] = [
  {
    n: '01',
    title: 'Size options written as free-text, not structured data',
    symptom:
      "Your variants say 'Small' on some products, 'S' on others, 'small' on the ones imported from a 2022 spreadsheet. An agent answering 'show me medium dresses' can't tell they're the same size, so it skips yours for a competitor whose sizes normalise.",
    pillar: 'Structured attributes',
    fix: "Flintmere checks each variant for the structured size metafield and flags the free-text ones. We show you the exact product IDs to fix and the canonical size token for each.",
  },
  {
    n: '02',
    title: 'Colour names only a human could parse',
    symptom:
      "Midnight Oasis. Forest Whisper. Dusty Rose Quartz. Beautiful copy — every apparel merchandiser writes it — but agents asked for 'red dress' don't know Dusty Rose Quartz is red. Your catalog scores zero on colour-filterable queries.",
    pillar: 'Structured attributes',
    fix: "We scan every variant for a structured colour field with a normalised token (red, blue, green …) alongside your merchandised name. Keep the romance copy; add the token agents can match.",
  },
  {
    n: '03',
    title: 'Material composition buried in description prose',
    symptom:
      "Your description says 'buttery-soft signature blend'. Shoppers love it, agents don't parse it. The next merchant writes '95% cotton, 5% elastane' in a structured field and wins every composition-filtered query.",
    pillar: 'Structured attributes',
    fix: "Flintmere flags products missing a composition metafield and offers a regex that extracts composition strings from existing descriptions — so you can bulk-populate the field without re-typing every product.",
  },
  {
    n: '04',
    title: 'Size chart delivered as a 1,200×800 PNG',
    symptom:
      "Your size chart is a designed image. Stunning for shoppers, invisible to agents. Returns rate stays high because agents can't answer 'will a UK 12 fit me?' and shoppers order one size up 'just in case'.",
    pillar: 'Data consistency',
    fix: "We detect image-only size charts via image-to-text ratio and flag products pointing to a size-chart metafield that isn't structured. Recommended fix: a table metafield agents can parse row-by-row.",
  },
  {
    n: '05',
    title: 'GTINs missing across the supplier-sourced long tail',
    symptom:
      "Your hero line and own-design products carry GS1 barcodes. The dropship and supplier-basic SKUs don't. Your hero products rank on Google Shopping, the long tail is silently delisted — and the long tail is often a third of catalog revenue.",
    pillar: 'Product IDs',
    fix: "We flag every variant missing a barcode, validate the checksum on the ones you have, and group the missing ones by supplier — so you can route the GS1 UK purchase decision to the supplier relationships that matter.",
  },
  {
    n: '06',
    title: 'One product with six colours grouped as variants',
    symptom:
      "Your 'Rainbow Pack T-Shirt' lists six colours as variants. Tidy for your ops team; invisible to agents. A shopper asking 'black t-shirt' gets none of your six because the product itself has no colour — only its variants do, and they're buried.",
    pillar: 'Structured attributes',
    fix: "Flintmere detects multi-colour variant groupings and flags them against the agent-best-practice pattern (one product per colour, shared size range). We show you which SKUs this applies to before you decide whether to restructure.",
  },
  {
    n: '07',
    title: 'Seasonal products still ACTIVE after the season ended',
    symptom:
      "380 summer 2025 products are still status=ACTIVE with zero stock and policy=deny. Agents crawl them, send shoppers to dead pages, and your domain's agent-score quietly drops. It looks like a catalog that isn't maintained, so agents prefer one that is.",
    pillar: 'Data consistency',
    fix: "Flintmere cross-checks product status × inventory × policy × publish date and gives you a ranked list of products that should be DRAFT, archived, or restocked. The dead-page rate is one of the fastest-moving levers on agent trust.",
  },
  {
    n: '08',
    title: 'Target-gender metafield empty on unisex-branded lines',
    symptom:
      "Your streetwear line is marketed 'for everyone'. The Shopify target_gender metafield sits empty on all 240 products. Agents filtering 'men's hoodies' or 'women's oversized tees' skip your entire streetwear catalog — the field can't be inferred, it must be set.",
    pillar: 'Google category match',
    fix: "We check every product for target_gender using Google's spec values (unisex | male | female) and flag both missing fields and non-standard strings ('mens', 'womens' — both rejected by Google Merchant Center).",
  },
];

async function getApparelMedian(): Promise<{
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
      vertical: 'apparel',
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
  const bucket = summary.byVertical.apparel;
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

export default async function FlintmereForApparel() {
  const bench = await getApparelMedian();

  return (
    <main id="main">
      <section className="mx-auto max-w-[1280px] px-8 py-20 md:py-28">
        <p className="eyebrow mb-6">
          For apparel brands · 50–5,000 SKUs · £1M–£50M revenue
        </p>
        <h1 className="max-w-[22ch]">
          Apparel catalogs don&rsquo;t lose to trends. They lose to a missing{' '}
          <Bracket>size</Bracket> field.
        </h1>
        <p
          className="mt-8 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.55 }}
        >
          AI shopping agents filter apparel on size, colour, material and
          gender. When those fields live in your product descriptions instead
          of structured metafields, the agent skips your store. Eight
          apparel-specific mistakes below &mdash; each one observable in a
          real Shopify catalog, each one scored on every Flintmere scan.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Scan my apparel store →
          </Link>
          <Link href="/audit" className="btn">
            Book a £97 concierge audit
          </Link>
        </div>
      </section>

      <section
        aria-label="Apparel benchmark"
        className="border-y border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-20 grid md:grid-cols-[auto_1fr_auto] gap-10 items-end">
          <div>
            <p className="eyebrow mb-4">
              {bench.available && !bench.preview
                ? 'Apparel median'
                : bench.available
                  ? 'Apparel · early sample'
                  : 'Apparel benchmark'}
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
              ? 'The median apparel catalog scored by FlintmereBot. Updated monthly. Run your own scan to see where your store sits against it.'
              : bench.available
                ? `Early sample — at ${bench.n.toLocaleString()} apparel store${bench.n === 1 ? '' : 's'}, this is the score so far, not “the median apparel catalog.” The median framing publishes at ${BENCHMARK_PUBLISH_FLOOR}. Scan your store and you shift the number.`
                : 'Apparel scores appear here as soon as the first stores land in the dataset. Run yours to seed it.'}
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
        aria-label="Apparel-specific mistakes"
        className="mx-auto max-w-[1280px] px-8 py-20"
      >
        <p className="eyebrow mb-6">Eight apparel-specific mistakes</p>
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
        aria-labelledby="apparel-cta-heading"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
        }}
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24">
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>
            Concierge audit for apparel
          </p>
          <h2
            id="apparel-cta-heading"
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
            £97 gets you the team reading your catalog product by product: a
            1,500-word letter pointing at specific SKUs by name (apparel
            teams get the size-chart and colour-token reads as standard),
            a per-product fix CSV with the worst ten already drafted &mdash;
            title, structured size, structured colour, composition &mdash;
            a 30-day fix sequence, the right GS1 UK route for your supplier
            mix, and a 30-day re-scan. No video, no call, no slide deck.
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

      <SiteFooter />
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
