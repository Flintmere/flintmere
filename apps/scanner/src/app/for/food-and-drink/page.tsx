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
  title: 'Flintmere for food & drink — allergens, nutrition, provenance, agent-ready',
  description:
    'The food-and-drink catalog mistakes that make AI shopping agents skip your store — allergens in prose, nutrition panels as images, provenance claims without structured data. Flintmere detects each one.',
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

// Eight food-and-drink-specific mistakes. Observable in real UK Shopify
// catalogs across specialty coffee, wine + spirits, condiments, pantry,
// confectionery, meal-kits. Sequenced: regulatory-critical first (allergens
// + nutrition, where agents trust structured data or skip), then the
// provenance + certifications that drive premium positioning, then the
// commercial ones (unit pricing, GTIN gaps), then the shipping-restriction
// trap that kills alcohol + chilled conversion silently.
const MISTAKES: Mistake[] = [
  {
    n: '01',
    title: 'Allergen declarations buried in description prose',
    symptom:
      "UK Big-14 allergens — gluten, eggs, milk, soya, peanuts, sesame, fish, crustaceans, molluscs, celery, mustard, nuts, lupin, sulphites — belong in a structured allergen field. Yours are written into the description as 'contains gluten and milk'. Agents filtering 'dairy-free' can't trust prose. They skip.",
    pillar: 'Structured attributes',
    fix: "Flintmere checks every product for a structured allergen metafield using the UK FSA taxonomy and flags products with allergen mentions in prose but empty structured fields. Non-negotiable for regulatory-aware agent queries.",
  },
  {
    n: '02',
    title: 'Nutritional panel delivered as a back-of-pack PNG',
    symptom:
      "Your nutrition table is an image — every food brand's is. But agents answering 'low-sugar chocolate' or 'high-protein snack' can't parse a JPG. A shopper gets the brand that published structured per-100g macros. Your product, however good, isn't considered.",
    pillar: 'Structured attributes',
    fix: "We scan for structured nutrition metafields (per 100g: energy_kcal, fat, saturates, carbs, sugars, protein, salt) and flag image-only panels. Even a partial structured fill (energy + sugars + salt) lifts your agent-visibility dramatically.",
  },
  {
    n: '03',
    title: 'Origin and provenance claims without structured country-of-origin',
    symptom:
      "Your description talks about 'single-origin Ethiopian beans' or 'British free-range eggs'. Beautiful; no structured country_of_origin field. Agents serving 'British cheese' or 'Italian pasta' queries depend on this metafield. Your provenance-led positioning is invisible to the filter.",
    pillar: 'Google category match',
    fix: "Flintmere checks for country_of_origin using the ISO 3166-1 spec (GB, IT, ET, FR) and flags products using only prose provenance. We also flag products with Protected Designation of Origin terms in the title but no structured PDO field.",
  },
  {
    n: '04',
    title: 'Certifications sitting inside descriptions, not as structured flags',
    symptom:
      "Organic, Fairtrade, Kosher, Halal, Red Tractor, Soil Association — all mentioned in your descriptions, none structured. A shopper asking for 'organic olive oil' gets brands with a structured certifications array. Your certification investment pays for shelf signage, not agent discovery.",
    pillar: 'Structured attributes',
    fix: "We check for a certifications metafield using the industry standard list (organic, fairtrade, kosher, halal, vegan, vegetarian, gluten-free-certified, red-tractor) and flag products using prose-only certification claims.",
  },
  {
    n: '05',
    title: 'Best-before and shelf-life metafields empty',
    symptom:
      "Agents answering 'subscribe-and-save coffee' or 'gift hamper for next month' lean on shelf_life + best_before metadata. Yours is empty on 100% of perishables. Meal-kit and gift-hamper queries — two of the fastest-growing food agent categories — default to brands that ship the field.",
    pillar: 'Data consistency',
    fix: "Flintmere checks for shelf_life_days or best_before_months metafields on products in perishable categories and flags products that appear perishable (by category or supplier pattern) but ship no shelf-life data.",
  },
  {
    n: '06',
    title: 'Unit pricing missing — no per kg, per 100g, per litre',
    symptom:
      "Agents filter food-and-drink by unit price constantly. 'Coffee under £40/kg.' 'Olive oil under £20/litre.' Your product lists a price for a 250g bag with no unit_price metafield. The filter skips you. The customer chooses the brand that populated the field.",
    pillar: 'Structured attributes',
    fix: "We check for unit_price + unit_pricing_measure on every variant (GBP per kg / litre / 100g / each) and flag missing ones. Legally required on some UK marketplace listings; agent-required on nearly all query types.",
  },
  {
    n: '07',
    title: 'GTINs missing on private-label and subscription box SKUs',
    symptom:
      "Your wholesale-sourced hero products have GTINs. Your own-brand private-label range and your monthly subscription box don't. Agents treat un-GTINed products as unverified; they demote them in comparison results. The subscription box — your highest-margin product — ranks worst.",
    pillar: 'Product IDs',
    fix: "Flintmere flags every variant missing a barcode, validates the checksum on the ones you have, and groups the missing ones by internal vs. wholesale — so you route the GS1 UK purchase decision to the private-label launches first.",
  },
  {
    n: '08',
    title: 'Shipping restrictions invisible to agents (alcohol, chilled, age-restricted)',
    symptom:
      "You ship alcohol, chilled meats, or age-restricted products. An agent recommending your 'artisan charcuterie box' to a shopper in a chilled-delivery blackout zone sends them to a checkout failure. Trust drops; the next agent recommendation goes to a competitor that declared its shipping rules.",
    pillar: 'Agent checkout readiness',
    fix: "Flintmere checks for a shipping_restrictions or requires_age_verification metafield on applicable products and flags products where the title or category implies a restriction but the metafield is empty.",
  },
];

async function getFoodMedian(): Promise<{
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
      vertical: 'food-and-drink',
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
  const bucket = summary.byVertical['food-and-drink'];
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

export default async function FlintmereForFoodAndDrink() {
  const bench = await getFoodMedian();

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
          For food &amp; drink brands · 50–5,000 SKUs · £250K–£25M revenue
        </p>
        <h1 className="max-w-[22ch]">
          Food catalogs don&rsquo;t lose on taste. They lose on a missing{' '}
          <Bracket>allergen</Bracket> field.
        </h1>
        <p
          className="mt-8 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.55 }}
        >
          AI shopping agents filter food-and-drink on allergens, nutrition,
          provenance, certifications, shelf life and unit pricing. When those
          fields live on your back-of-pack imagery and inside description
          prose instead of structured metafields, the agent skips your store
          for the brand that published structured data. Eight food-specific
          mistakes below &mdash; each one concretely observable in a real
          Shopify catalog.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/scan" className="btn btn-accent">
            Scan my food store →
          </Link>
          <Link href="/audit" className="btn">
            Book a £97 concierge audit
          </Link>
        </div>
      </section>

      <section
        aria-label="Food benchmark"
        className="border-y border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-20 grid md:grid-cols-[auto_1fr_auto] gap-10 items-end">
          <div>
            <p className="eyebrow mb-4">
              {bench.available && !bench.preview
                ? 'Food & drink median'
                : bench.available
                  ? 'Food & drink · early sample'
                  : 'Food & drink benchmark'}
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
              ? 'The median food & drink catalog scored by FlintmereBot. Updated monthly. Run your own scan to see where your store sits against it.'
              : bench.available
                ? `Early sample — at ${bench.n.toLocaleString()} food store${bench.n === 1 ? '' : 's'}, this is the score so far, not “the median food catalog.” The median framing publishes at ${BENCHMARK_PUBLISH_FLOOR}. Scan your store and you shift the number.`
                : 'Food scores appear here as soon as the first stores land in the dataset. Run yours to seed it.'}
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
        aria-label="Food-specific mistakes"
        className="mx-auto max-w-[1280px] px-8 py-20"
      >
        <p className="eyebrow mb-6">Eight food-and-drink mistakes</p>
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
        aria-labelledby="food-cta-heading"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
        }}
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24">
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>
            Concierge audit for food &amp; drink
          </p>
          <h2
            id="food-cta-heading"
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
            1,500-word letter pointing at specific SKUs by name (food teams
            get the allergen, nutrition, provenance and certifications reads
            as standard), a per-product fix CSV with the worst ten already
            drafted &mdash; structured allergens, per-100g macros, country
            of origin, certifications &mdash; a 30-day fix sequence, the
            right GS1 UK route for your private-label and subscription SKUs,
            and a 30-day re-scan. No video, no call, no slide deck.
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
