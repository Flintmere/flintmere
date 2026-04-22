import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { prisma } from '@/lib/db';
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary';
import { BENCHMARK_FLOOR, BENCHMARK_PUBLISH_FLOOR } from '@/lib/copy';

export const metadata: Metadata = {
  title: 'Research — State of Shopify Catalogs 2026',
  description:
    "Flintmere's rolling benchmark of Shopify catalogs against AI shopping agent requirements. Median scores, grade distributions, and the single biggest catalog mistake by vertical — scanned by FlintmereBot, published monthly, aggregate-only.",
};

// ISR: page re-renders once an hour, matching the /api/benchmark/summary
// cache window. Keeps the published numbers here aligned with the ones
// John cites in concierge audit letters.
export const revalidate = 3600;

// Verticals we currently seed + render. Order matches the /for/<vertical>
// page order and the order they landed in scanner_scans.vertical.
const VERTICALS: Array<{ slug: string; label: string; href: string }> = [
  { slug: 'apparel', label: 'Apparel', href: '/for/apparel' },
  { slug: 'beauty', label: 'Beauty', href: '/for/beauty' },
  {
    slug: 'food-and-drink',
    label: 'Food & drink',
    href: '/for/food-and-drink',
  },
];

interface Published {
  available: boolean;
  preview: boolean;
  n: number;
  floor: number;
  publishFloor: number;
  asOfLabel: string;
  overall: {
    median: number | null;
    grade: string | null;
    distribution: { A: number; B: number; C: number; D: number; F: number };
  };
  byVertical: Array<{
    slug: string;
    label: string;
    href: string;
    n: number;
    median: number | null;
    grade: string | null;
  }>;
}

async function loadBenchmark(): Promise<Published> {
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

  const overallAvailable = summary.available;
  const overall = {
    median: overallAvailable ? summary.overall.medianScore : null,
    grade: overallAvailable
      ? medianGrade(summary.overall.medianScore ?? 0)
      : null,
    distribution: summary.overall.gradeDistribution,
  };

  const byVertical = VERTICALS.map((v) => {
    const bucket = summary.byVertical[v.slug];
    const available = !!bucket && bucket.n >= BENCHMARK_FLOOR;
    return {
      slug: v.slug,
      label: v.label,
      href: v.href,
      n: bucket?.n ?? 0,
      median: available ? (bucket?.medianScore ?? null) : null,
      grade: available ? medianGrade(bucket?.medianScore ?? 0) : null,
    };
  });

  return {
    available: overallAvailable,
    preview: summary.preview,
    n: summary.overall.n,
    floor: BENCHMARK_FLOOR,
    publishFloor: BENCHMARK_PUBLISH_FLOOR,
    asOfLabel: new Date(summary.asOf).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
    }),
    overall,
    byVertical,
  };
}

function medianGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function distributionPct(
  dist: Published['overall']['distribution'],
  grade: 'A' | 'B' | 'C' | 'D' | 'F',
  n: number,
): number {
  if (n === 0) return 0;
  return Math.round((dist[grade] / n) * 100);
}

// Share of the sample that grades D or F — the "not agent-ready" cohort.
// Kept separate from distributionPct so the copy can reference a single
// number without recomputing (and so claim review can point at the math).
function belowCeilingPct(
  dist: Published['overall']['distribution'],
  n: number,
): number {
  if (n === 0) return 0;
  return Math.round(((dist.D + dist.F) / n) * 100);
}

export default async function Research() {
  const data = await loadBenchmark();
  const dist = data.overall.distribution;
  const n = data.n;

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
            <Link href="/#pillars" className="eyebrow">
              Pillars
            </Link>
            <Link href="/pricing" className="eyebrow">
              Pricing
            </Link>
            <Link
              href="/research"
              className="eyebrow"
              aria-current="page"
              style={{ color: 'var(--color-ink)' }}
            >
              Research
            </Link>
          </nav>
          <Link href="/scan" className="btn btn-accent">
            Run a free scan →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-24">
        <p className="eyebrow mb-6">Research · 2026</p>
        <h1 className="max-w-[20ch]">
          The state of <Bracket>Shopify</Bracket> catalogs, measured against
          AI shopping agents.
        </h1>
        <p
          className="mt-8 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.55 }}
        >
          FlintmereBot scans Shopify stores monthly, scoring each catalog
          against seven AI-readiness checks drawn from published Shopify,
          GS1 UK, and Google Merchant Center specs. We publish the aggregate
          numbers &mdash; score, grade distribution, per-vertical gaps &mdash;
          and nothing else. No individual store is ever named.
          {data.available && !data.preview ? (
            <>
              {' '}
              {data.n.toLocaleString()} stores included in this edition,
              refreshed {data.asOfLabel}.
            </>
          ) : data.available && data.preview ? (
            <>
              {' '}
              Early sample &mdash; {data.n.toLocaleString()} stores scanned so
              far. We publish the numbers as they come in, but don&rsquo;t
              frame them as &ldquo;the median Shopify store&rdquo; until the
              dataset clears {data.publishFloor.toLocaleString()} per vertical.
            </>
          ) : (
            <>
              {' '}
              The first bot scans are in flight; numbers appear here as soon
              as the first store lands in the dataset.
            </>
          )}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Add my store to the next edition →
          </Link>
          <Link href="/bot" className="btn">
            How FlintmereBot works
          </Link>
        </div>
      </section>

      {data.available && !data.preview ? (
        <section
          aria-label="Headline finding"
          className="border-y border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
        >
          <div className="mx-auto max-w-[1280px] px-8 py-24 grid md:grid-cols-[auto_1fr] gap-12 items-end">
            <div>
              <p className="eyebrow mb-4">Headline finding</p>
              <p
                style={{
                  fontSize: 'clamp(88px, 14vw, 220px)',
                  fontWeight: 500,
                  letterSpacing: '-0.045em',
                  lineHeight: 0.92,
                }}
              >
                {belowCeilingPct(dist, n)}%
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
            </div>
            <div className="pb-6">
              <p
                className="max-w-[38ch]"
                style={{
                  fontSize: 24,
                  lineHeight: 1.35,
                  letterSpacing: '-0.015em',
                }}
              >
                of the {n.toLocaleString()} mid-market Shopify catalogs in our
                sample score grade D or F against the seven checks AI shopping
                agents run.
              </p>
              <p
                className="mt-6 max-w-[48ch] text-[color:var(--color-ink-2)]"
                style={{ fontSize: 15, lineHeight: 1.55 }}
              >
                Scores cluster inside a narrow band (47–50). The difference
                between the median catalog and the top decile is not
                sophistication; it is structured fields populated.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <hr className="rule" />

      {/* Overall headline number */}
      <section
        aria-label="Overall benchmark"
        className="mx-auto max-w-[1280px] px-8 py-20"
      >
        <div className="grid md:grid-cols-[auto_1fr] gap-12 items-start">
          <div>
            <p className="eyebrow mb-4">
              {data.available && !data.preview
                ? 'Overall median'
                : data.available
                  ? 'Early sample'
                  : 'Overall median'}
            </p>
            <p
              style={{
                fontSize: 112,
                letterSpacing: '-0.05em',
                lineHeight: 0.9,
                fontWeight: 500,
              }}
            >
              {data.available && data.overall.median !== null
                ? data.overall.median
                : '—'}
            </p>
            <p
              className="eyebrow mt-3 text-[color:var(--color-mute)]"
              style={{ fontSize: 12 }}
            >
              {data.available && !data.preview
                ? `/ 100 · grade ${data.overall.grade}`
                : data.available
                  ? `/ 100 · ${data.n.toLocaleString()} store${data.n === 1 ? '' : 's'} so far`
                  : 'awaiting first scan'}
            </p>
          </div>
          <div>
            <h2
              className="max-w-[26ch]"
              style={{ fontSize: 28, letterSpacing: '-0.02em' }}
            >
              {data.available && !data.preview
                ? 'Most Shopify catalogs fail half the checks an AI shopping agent runs before it recommends a store.'
                : data.available
                  ? 'Early signal — the first Shopify catalogs are landing, and the gap between visible and structured data is already loud.'
                  : 'The headline number appears once the first bot scans complete.'}
            </h2>
            <p
              className="mt-5 max-w-[56ch] text-[color:var(--color-ink-2)]"
              style={{ fontSize: 15, lineHeight: 1.55 }}
            >
              {data.available && !data.preview ? (
                <>
                  Across {data.n.toLocaleString()} scanned stores, the median
                  Shopify catalog earns a grade {data.overall.grade} &mdash;
                  strong on visible surfaces (titles, imagery), weak on the
                  structured fields agents depend on (barcodes, attribute
                  metafields, category mapping). The difference between the
                  median store and the top decile is not sophistication; it
                  is fields populated.
                </>
              ) : data.available ? (
                <>
                  The number to the left is the score on the{' '}
                  {data.n.toLocaleString()} store
                  {data.n === 1 ? '' : 's'} scanned so far, not a published
                  median. We don&rsquo;t call it &ldquo;the median Shopify
                  catalog&rdquo; until the per-vertical sample clears{' '}
                  {data.publishFloor.toLocaleString()}. The trend is already
                  visible though: catalogs score high on titles and imagery
                  and low on the structured fields agents actually filter on.
                </>
              ) : (
                <>
                  FlintmereBot is mid-crawl. As soon as the first scan
                  completes, its score appears here. Aggregate framing
                  unlocks at {data.publishFloor.toLocaleString()} stores per
                  vertical; until then this page reports what the dataset
                  can honestly support.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Grade distribution */}
      {data.available ? (
        <section
          aria-label="Grade distribution"
          className="mx-auto max-w-[1280px] px-8 py-20 border-t border-[color:var(--color-line)]"
        >
          <p className="eyebrow mb-6">
            {data.preview ? 'Grade distribution · early sample' : 'Grade distribution'}
          </p>
          <h2 className="max-w-[24ch] mb-10">
            {data.preview
              ? `How the first ${data.n.toLocaleString()} Shopify store${data.n === 1 ? '' : 's'} ${data.n === 1 ? 'lands' : 'land'} against the seven AI-readiness checks.`
              : `How ${data.n.toLocaleString()} Shopify stores stack up.`}
          </h2>
          <ul className="list-none p-0 m-0 border-y border-[color:var(--color-line)]">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => {
              const pct = distributionPct(dist, g, n);
              const count = dist[g];
              return (
                <li
                  key={g}
                  className="grid grid-cols-[80px_1fr_120px] gap-6 py-5 items-center border-t border-[color:var(--color-line-soft)] first:border-t-0"
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 28,
                      letterSpacing: '-0.02em',
                      fontWeight: 700,
                    }}
                  >
                    {g}
                  </span>
                  <div
                    className="h-[18px] bg-[color:var(--color-paper-2)] border border-[color:var(--color-line)]"
                    aria-hidden="true"
                  >
                    <div
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        height: '100%',
                        background: 'var(--color-ink)',
                      }}
                    />
                  </div>
                  <p
                    className="eyebrow text-right text-[color:var(--color-ink)]"
                    style={{ fontSize: 12 }}
                  >
                    {pct}% · {count.toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* By vertical */}
      <section
        aria-label="By vertical"
        className="mx-auto max-w-[1280px] px-8 py-20 border-t border-[color:var(--color-line)]"
      >
        <p className="eyebrow mb-6">By vertical</p>
        <h2 className="max-w-[26ch] mb-10">
          The gap between verticals is bigger than the gap between good and
          bad stores inside any one vertical.
        </h2>
        <div className="grid md:grid-cols-3 gap-0 border-y border-[color:var(--color-line)]">
          {data.byVertical.map((v, idx) => (
            <Link
              key={v.slug}
              href={v.href}
              className={`block p-10 ${
                idx < data.byVertical.length - 1
                  ? 'md:border-r md:border-[color:var(--color-line)]'
                  : ''
              } max-md:border-b max-md:border-[color:var(--color-line-soft)] max-md:last:border-b-0 hover:bg-[color:var(--color-paper-2)]`}
            >
              <p className="eyebrow mb-3">{v.label}</p>
              <p
                style={{
                  fontSize: 72,
                  letterSpacing: '-0.05em',
                  lineHeight: 0.9,
                  fontWeight: 500,
                }}
              >
                {v.median !== null ? v.median : '—'}
              </p>
              <p
                className="eyebrow mt-3 text-[color:var(--color-mute)]"
                style={{ fontSize: 12 }}
              >
                {v.median !== null
                  ? v.n >= BENCHMARK_PUBLISH_FLOOR
                    ? `median · grade ${v.grade} · ${v.n.toLocaleString()} stores`
                    : `early sample · ${v.n.toLocaleString()} store${v.n === 1 ? '' : 's'} · publishing at ${BENCHMARK_PUBLISH_FLOOR}`
                  : 'sample pending'}
              </p>
              <p
                className="mt-4 text-[color:var(--color-ink-2)]"
                style={{ fontSize: 14, lineHeight: 1.55 }}
              >
                {v.slug === 'apparel'
                  ? 'Size, colour, material, gender — the four fields apparel catalogs most often leave unstructured.'
                  : v.slug === 'beauty'
                    ? 'Ingredients, shade, volume, claims — beauty agents filter on all four, and most catalogs ship none of them structured.'
                    : 'Allergens, nutrition, provenance, certifications — the regulatory fields food agents depend on to answer any query safely.'}
              </p>
              <p
                className="eyebrow mt-6"
                style={{ color: 'var(--color-accent-ink)' }}
              >
                Read the {v.label.toLowerCase()} breakdown →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section
        aria-label="Methodology"
        className="mx-auto max-w-[1280px] px-8 py-20 border-t border-[color:var(--color-line)]"
      >
        <p className="eyebrow mb-6">Methodology</p>
        <h2 className="max-w-[26ch] mb-8">
          Scanned by <Bracket>FlintmereBot</Bracket> · aggregate-published ·
          refreshed monthly.
        </h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <p
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 15, lineHeight: 1.6 }}
            >
              FlintmereBot identifies itself as{' '}
              <code className="font-mono text-[13px]">
                FlintmereBot/1.0 (+audit.flintmere.com/bot)
              </code>{' '}
              and rate-limits to one request per two seconds per host. Each
              scan fetches robots.txt, sitemap.xml, llms.txt, products.json,
              and a small sample of product pages. Scores are computed by the
              same rule-based engine that powers the public scanner.
            </p>
          </div>
          <div>
            <p
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 15, lineHeight: 1.6 }}
            >
              We publish medians, means, and grade distributions. We never
              publish the domain of any individual store. Merchants who want
              to be excluded can add FlintmereBot to their robots.txt and
              the next scan will honour it. The underlying dataset is never
              shared or sold.
            </p>
          </div>
        </div>
        <Link href="/bot" className="btn mt-10 inline-flex">
          Full methodology notes →
        </Link>
      </section>

      {/* CTA */}
      <section
        aria-labelledby="research-cta"
        style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24">
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>
            Get your store in the next edition
          </p>
          <h2
            id="research-cta"
            className="mt-6 max-w-[22ch]"
            style={{ color: 'var(--color-paper)' }}
          >
            Run a free scan. Your score sits inside the next monthly refresh.
          </h2>
          <p
            className="mt-8 max-w-[56ch]"
            style={{
              color: 'var(--color-mute-inv)',
              fontSize: 16,
              lineHeight: 1.55,
            }}
          >
            Scans initiated by store owners are tagged separately from
            FlintmereBot crawls and contribute to next month&rsquo;s aggregates.
            You keep your report; we keep the anonymised score. The more stores
            in the dataset, the tighter the benchmark becomes for everyone.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/scan"
              className="btn"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-accent-ink)',
                borderColor: 'var(--color-accent)',
              }}
            >
              Run the free scan →
            </Link>
            <Link
              href="/audit"
              className="btn"
              style={{
                color: 'var(--color-paper)',
                borderColor: 'var(--color-paper)',
              }}
            >
              Or book the £97 concierge audit
            </Link>
          </div>
        </div>
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
            <Link href="/bot" className="eyebrow">
              Bot
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
