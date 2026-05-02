import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * /methodology — How Flintmere scores catalogs and maintains the food standard.
 *
 * Spec: context/requirements/2026-05-02-methodology-page.md.
 *
 * Substantiation gate for /pricing's "We maintain it" claim. Reads as a
 * credibility document — show our work, no sell, source-cited regulatory
 * claims, explicit about limitations.
 *
 * Council pre-flight references (per reference-register.md binding):
 *   1. The Pudding — section anchors, ledger-precise tone, citation density.
 *   2. Stripe API docs — single-column, generous whitespace, type-led pacing.
 *   3. Apple Privacy white paper — claim-then-evidence rhythm, restraint as
 *      confidence.
 *
 * Bracket budget (per ADR 0021 §4):
 *   - Hero h1: [ standard ] Saks chord — continuity with /pricing hero.
 *   - Pillars section: each of the seven pillar h3 headings carries one
 *     [ 0X ] identifier bracket (each pillar is its own <section> with its
 *     own h3, so each carries one bracket per the §4 rule — not a comparison-
 *     set, just per-section budget honoured).
 *
 * Pillar weights are read from packages/scoring/src/types.ts §PILLAR_WEIGHTS
 * and are the source of truth. If those weights change, this page must be
 * updated in lockstep.
 */

export const metadata: Metadata = {
  title: 'Methodology — How Flintmere scores and maintains',
  description:
    'How Flintmere computes the seven-pillar catalog readiness score, where the regulatory data comes from, how the food catalog standard is maintained, and what the score does not measure.',
  alternates: { canonical: 'https://flintmere.com/methodology' },
};

const LAST_UPDATED = '2026-05-02';

interface Pillar {
  n: string;
  id: string;
  name: string;
  weight: number;
  measures: string;
  why: string;
  sources: string;
  installGated: boolean;
  notMeasured: string;
}

const PILLARS: Pillar[] = [
  {
    n: '01',
    id: 'identifiers',
    name: 'Identifiers',
    weight: 20,
    measures:
      'Whether your variants carry valid GTINs (with checksum verification), brand names, MPNs, and unique SKUs. Sub-checks: barcode presence on every variant (45% of pillar), GTIN checksum validity (30%), brand presence (10%), SKU presence and uniqueness (15%).',
    why: 'Google Shopping, Amazon Fresh, Ocado, and emerging AI shopping channels all verify against GS1’s database. A missing or invalid identifier is the most common reason a product is suppressed from a feed.',
    sources:
      'GS1 General Specifications (gs1.org), GTIN-13/GTIN-14 checksum algorithm (Mod-10).',
    installGated: false,
    notMeasured:
      'Whether the GTIN you have was purchased from your local GS1 office (we cannot verify provenance from public data).',
  },
  {
    n: '02',
    id: 'attributes',
    name: 'Attributes',
    weight: 20,
    measures:
      'Whether your products carry the structured attributes a food catalog needs: allergens (FSA Big-14), nutrition declarations (EU 1169/2011), provenance claims (PDO/PGI/TSG), certifications (organic, Fairtrade, RSPCA, etc.), and ingredient lists at the product-data level rather than only in description text.',
    why: 'AI shopping channels and merchant-side filters work on structured fields, not on free-text descriptions. A product with allergens buried in HTML is invisible to a query like "show me dairy-free granola."',
    sources:
      'FSA Big-14 allergen list (food.gov.uk), EU Regulation 1169/2011 (Food Information to Consumers), DEFRA UK GI register, certification-body schemas.',
    installGated: true,
    notMeasured:
      'Marketing claims that are not regulatory ("artisan," "premium," "small-batch"). Image-based claims that are not also in structured data.',
  },
  {
    n: '03',
    id: 'titles',
    name: 'Titles',
    weight: 15,
    measures:
      'Whether your product titles are the right length (<= 150 chars), free of marketing fluff, structured (brand + product type), and whether your descriptions hit the >= 200-character minimum with structural markup and use-case language.',
    why: 'A title with "Buy Now! Best Value!" gets demoted by Google Shopping’s quality classifier. A description without paragraph structure is harder for AI agents to extract. The shape of the prose decides whether a product is shown.',
    sources:
      'Google Merchant Center title requirements, Schema.org Product type, observed quality-classifier behaviour from public Google Shopping documentation.',
    installGated: false,
    notMeasured:
      'SEO ranking, conversion rate from titles, image quality, A/B-tested copy variants.',
  },
  {
    n: '04',
    id: 'mapping',
    name: 'Mapping',
    weight: 15,
    measures:
      'Whether your products are mapped to the right google_product_category, whether the mapping is consistent across variants, and whether your category choice matches what the product actually is.',
    why: 'A misnamed category sends your product to the wrong feed shelf. "Beverages > Coffee" vs "Pantry > Coffee" is the difference between appearing in the search a coffee buyer actually runs.',
    sources:
      'Google Merchant Center taxonomy (published category list), GMC mapping requirements.',
    installGated: true,
    notMeasured:
      'Marketplace-specific categorisations beyond Google (Amazon Fresh, Ocado have their own taxonomies; we read GMC as the lingua franca).',
  },
  {
    n: '05',
    id: 'consistency',
    name: 'Consistency',
    weight: 15,
    measures:
      'Whether image URLs resolve, whether images carry alt-text, whether stock status is consistent across the variants of a product, and whether your published-status fields match what is actually live on each channel.',
    why: 'A 404 on a product image is a hard demotion across every channel. A variant marked in-stock while the parent is out-of-stock is a returns risk. Cross-channel parity is the trust commitment.',
    sources:
      'HTTP 200/4xx/5xx response checks, Schema.org ImageObject validation, Shopify Admin API published-status fields.',
    installGated: false,
    notMeasured:
      'Image aesthetic quality. Whether the alt-text is meaningful (we measure presence, not semantic accuracy).',
  },
  {
    n: '06',
    id: 'checkout-eligibility',
    name: 'Checkout eligibility',
    weight: 10,
    measures:
      'Whether the product can complete a checkout flow on the channel it claims to ship to. Tax registration, shipping origin, age-restriction handling, alcohol licensing, allergen-disclosure regulatory compliance.',
    why: 'A product that ranks beautifully but cannot complete checkout is worse than not appearing — it spends ad budget without conversion. The checkout-eligibility pillar is the gate from "discoverable" to "purchasable."',
    sources:
      'HMRC tax-registration rules, UK alcohol licensing (Licensing Act 2003), age-restriction product schemas, shipping-zone declarations.',
    installGated: true,
    notMeasured:
      'Per-merchant payment-processor approval (separate ML risk-score signal). Customer-side bank declines (out of our scope).',
  },
  {
    n: '07',
    id: 'crawlability',
    name: 'Crawlability',
    weight: 5,
    measures:
      'Whether your robots.txt allows the AI agents that increasingly arbitrate product discovery (GPTBot, ClaudeBot, PerplexityBot, etc.), whether your sitemap is present and references product URLs, and whether you publish an llms.txt artefact for AI-agent guidance.',
    why: 'Discovery is shifting from search engines to AI agents. The agents that aren’t allowed to crawl your store can’t recommend your products. The crawlability pillar measures whether you’re ready for that.',
    sources:
      'IETF robots.txt specification, Schema.org sitemap conventions, llms.txt proposed convention (llmstxt.org).',
    installGated: false,
    notMeasured:
      'AI-agent ranking signal (each agent uses its own opaque scoring). Whether the agent likes your prose (we measure access, not preference).',
  },
];

const TOTAL_PUBLIC_WEIGHT = PILLARS.filter((p) => !p.installGated).reduce(
  (sum, p) => sum + p.weight,
  0,
);

const DATA_SOURCES = [
  {
    domain: 'Allergens',
    source: 'FSA Big-14 allergens list',
    url: 'https://www.food.gov.uk/safety-hygiene/allergen-and-intolerance-information',
    purpose: 'Canonical UK allergen schema; informs the Attributes pillar.',
  },
  {
    domain: 'Food information',
    source: 'EU Regulation 1169/2011 (FIC)',
    url: 'https://eur-lex.europa.eu/eli/reg/2011/1169/oj',
    purpose: 'Food Information to Consumers regulation; nutrition + ingredient declaration requirements.',
  },
  {
    domain: 'Geographic indications',
    source: 'DEFRA UK GI register',
    url: 'https://www.gov.uk/guidance/protected-food-name-scheme-uk-gis',
    purpose: 'Post-Brexit UK PDO/PGI/TSG register; informs provenance attributes.',
  },
  {
    domain: 'Geographic indications (EU)',
    source: 'EU DOOR / GIView',
    url: 'https://www.tmdn.org/giview/',
    purpose: 'EU PDO/PGI/TSG register; cross-checked when products claim EU geographic origin.',
  },
  {
    domain: 'Organic certification',
    source: 'Soil Association (UK)',
    url: 'https://www.soilassociation.org/certification/',
    purpose: 'Largest UK organic certification body; certification scope + audit cadence.',
  },
  {
    domain: 'Identifiers',
    source: 'GS1 General Specifications',
    url: 'https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications',
    purpose: 'GTIN structure and checksum algorithm; informs the Identifiers pillar.',
  },
  {
    domain: 'Product taxonomy',
    source: 'Google Merchant Center taxonomy',
    url: 'https://www.google.com/basepages/producttype/taxonomy.en-GB.txt',
    purpose: 'Canonical product-category list; informs the Mapping pillar.',
  },
  {
    domain: 'AI-agent crawler list',
    source: 'llmstxt.org convention',
    url: 'https://llmstxt.org/',
    purpose: 'Proposed convention for AI-agent guidance; informs the Crawlability pillar.',
  },
];

export default function Methodology() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main"
        className="flintmere-main bg-[color:var(--color-paper)]"
      >
        {/* Hero — bracket-1 Saks chord on [ standard ] for continuity with
            /pricing hero. Amber-radial atmosphere blooms behind. */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative isolate overflow-hidden bg-[color:var(--color-paper)]"
        >
          <div
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{
              inset: 0,
              background: 'var(--gradient-amber-radial)',
              transform: 'translate(0, -10%) scale(1.15)',
              opacity: 0.85,
            }}
          />

          <div
            className="relative mx-auto max-w-[1280px]"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 64px)',
              paddingRight: 'clamp(24px, 4vw, 64px)',
              paddingTop: 'clamp(72px, 9vw, 128px)',
              paddingBottom: 'clamp(48px, 6vw, 96px)',
            }}
          >
            <p className="eyebrow mb-10">Methodology</p>
            <h1
              id="hero-heading"
              className="font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)] max-w-[18ch]"
              style={{ fontSize: 'clamp(40px, 7vw, 112px)' }}
            >
              How we compute the score and maintain the{' '}
              <Bracket size="saks">standard</Bracket>.
            </h1>
            <p
              className="font-sans"
              style={{
                marginTop: 'clamp(32px, 4vw, 56px)',
                maxWidth: '60ch',
                fontSize: 'clamp(15px, 1.1vw, 17px)',
                lineHeight: 1.55,
                fontWeight: 400,
                color: 'var(--color-mute)',
              }}
            >
              Seven pillars, weighted to sum to 100. Source-cited regulatory references. Half-yearly publication of the food catalog standard with a public change log between. Last updated {LAST_UPDATED}.
            </p>
          </div>
        </section>

        {/* Section: The seven pillars (intro + grid) */}
        <section
          id="pillars"
          aria-labelledby="pillars-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(64px, 8vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-4">The seven pillars</p>
          <h2
            id="pillars-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            Each pillar measures a different way a catalog can break.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            The composite score is a weighted average of the seven pillars below. Public scans (no Shopify install) measure the four pillars that read from public sources — identifiers, titles, consistency, and crawlability — and report a partial score against {TOTAL_PUBLIC_WEIGHT}% of the weight. The remaining 45% (attributes, mapping, checkout eligibility) is reachable only after the Shopify app is installed, since those signals come from authenticated Admin-API reads.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(16px, 2vw, 24px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            Weights below are the source of truth read from <span className="font-mono" style={{ fontSize: '0.92em' }}>packages/scoring/src/types.ts</span>. Each pillar is a self-contained module under <span className="font-mono" style={{ fontSize: '0.92em' }}>packages/scoring/src/pillars/</span> — the code is open to inspection by any merchant or trade journalist who asks.
          </p>
        </section>

        {/* Each pillar gets its own <section> with its own h3 — bracket budget
            per ADR 0021 §4 ("≤1 bracket per section") preserved by the per-
            section h3 hierarchy. */}
        {PILLARS.map((pillar) => (
          <PillarSection key={pillar.id} pillar={pillar} />
        ))}

        {/* Section: The food catalog standard */}
        <section
          id="standard"
          aria-labelledby="standard-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(64px, 8vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-4">The food catalog standard</p>
          <h2
            id="standard-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            What &ldquo;the standard&rdquo; actually is.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            The food catalog standard is a JSON Schema plus a human-readable spec defining what a complete food product record looks like for UK Shopify merchants pushing to Google Merchant Center, Amazon Fresh, Ocado, Deliveroo, and emerging AI shopping channels. Fields, types, allowed values, regulatory citations, and version history. It publishes at <span className="font-mono" style={{ fontSize: '0.92em' }}>standards.flintmere.com/food/v1</span>.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(16px, 2vw, 24px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            <strong style={{ fontWeight: 500 }}>Status:</strong> the subdomain is provisioned with a DNS A-record. The v1 publication target is end-Q3 2026. Until then, this page describes the artefact; the artefact itself does not yet exist in published form. We will not pretend otherwise.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(16px, 2vw, 24px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            <strong style={{ fontWeight: 500 }}>Why a standard, not a checklist:</strong> a checklist is a list of things to do; a standard is a versioned, dated, citation-backed contract. A standard can be referenced by trade journalists, regulatory consultants, and other vertical PIM tools. A checklist cannot. The standard is the moat we are building, not the scanner.
          </p>
        </section>

        {/* Section: Data sources */}
        <section
          id="data-sources"
          aria-labelledby="data-sources-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(64px, 8vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-4">Data sources</p>
          <h2
            id="data-sources-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            Every regulatory claim links to its primary source.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            We read from primary regulators, not from second-hand summaries. If we cite a rule, the citation links to the regulator&rsquo;s own published page. This is the table of every external source the scoring engine reads from.
          </p>
          <ul
            className="list-none p-0 m-0 mt-10 border-y border-[color:var(--color-line)]"
          >
            {DATA_SOURCES.map((src) => (
              <li
                key={src.url}
                className="grid md:grid-cols-[160px_1fr_2fr] gap-6 py-6 border-t border-[color:var(--color-line-soft)] first:border-t-0 items-start"
              >
                <p
                  className="font-mono uppercase text-[color:var(--color-mute-2)]"
                  style={{ fontSize: 11, letterSpacing: '0.14em' }}
                >
                  {src.domain}
                </p>
                <p style={{ fontSize: 15, fontWeight: 500 }}>
                  <a
                    href={src.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="underline decoration-[color:var(--color-line)] hover:decoration-[color:var(--color-accent)]"
                    style={{ textUnderlineOffset: 4 }}
                  >
                    {src.source} &rarr;
                  </a>
                </p>
                <p
                  className="text-[color:var(--color-ink-2)]"
                  style={{ fontSize: 14, lineHeight: 1.55 }}
                >
                  {src.purpose}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Section: Maintenance cadence */}
        <section
          id="maintenance"
          aria-labelledby="maintenance-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(64px, 8vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-4">Maintenance cadence</p>
          <h2
            id="maintenance-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            How &ldquo;we maintain it&rdquo; works.
          </h2>
          <dl
            className="grid md:grid-cols-[200px_1fr] gap-x-8 gap-y-6"
            style={{ marginTop: 'clamp(28px, 4vw, 48px)' }}
          >
            <dt className="font-mono uppercase text-[color:var(--color-mute-2)]" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
              Cadence
            </dt>
            <dd
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.7 }}
            >
              <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>Half-yearly publication</strong> of the major standard version (v1, v1.1, v2). This is the load-bearing commitment.
            </dd>

            <dt className="font-mono uppercase text-[color:var(--color-mute-2)]" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
              Between publications
            </dt>
            <dd
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.7 }}
            >
              A <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>public change log</strong> tracks every regulatory update we observe between major publications. Each entry: source URL, observed date, scope of change, action we took.
            </dd>

            <dt className="font-mono uppercase text-[color:var(--color-mute-2)]" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
              Monitoring
            </dt>
            <dd
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.7 }}
            >
              An automated cron monitors regulator RSS feeds, the EU Official Journal, DEFRA updates, and certification-body announcements. Surfacing is AI-assisted (Vertex AI / Gemini 2.5 Pro on EU residency); decisions are human.
            </dd>

            <dt className="font-mono uppercase text-[color:var(--color-mute-2)]" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
              Review
            </dt>
            <dd
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.7 }}
            >
              Every change is reviewed by the council&rsquo;s <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>Regulatory Affairs</strong> seat before merging into the public change log. The seat holds a binding veto on standards-publication accuracy.
            </dd>

            <dt className="font-mono uppercase text-[color:var(--color-mute-2)]" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
              Versioning
            </dt>
            <dd
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.7 }}
            >
              Major versions (v1, v2) are breaking; minor versions (v1.1, v1.2) are additive. Every published version stays accessible at its versioned URL. Breaking changes never silently rewrite history.
            </dd>
          </dl>
        </section>

        {/* Section: Limitations honest */}
        <section
          id="limitations"
          aria-labelledby="limitations-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(64px, 8vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-4">Limitations</p>
          <h2
            id="limitations-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            What the score does not measure.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            Being explicit about what we do not measure is what separates an honest score from a black-box marketing number. The Flintmere score does not measure:
          </p>
          <ul
            className="list-none p-0 m-0 space-y-3 text-[color:var(--color-ink-2)]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Marketing copy quality, tone-of-voice, or brand strength.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>SEO ranking outside identifier and title structural concerns.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Image aesthetic quality (we measure presence, alt-text, and structured-data linkage; we do not judge composition or lighting).</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Conversion-rate optimisation. A high score does not guarantee sales; it reduces the rate at which catalogs lose impressions to data quality.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Customer-service quality, returns handling, fulfilment speed.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>The truthfulness of regulatory claims (we measure presence and structure of declarations; we do not lab-test the product).</span>
            </li>
          </ul>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(28px, 4vw, 40px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            Things we cannot yet measure but are tracked as next-quarter targets:
          </p>
          <ul
            className="list-none p-0 m-0 space-y-3 text-[color:var(--color-ink-2)]"
            style={{
              marginTop: 'clamp(16px, 2vw, 24px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Real-time GMC suppression status (requires merchant authentication; on roadmap).</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Amazon Fresh listing status (no public API; partnership track).</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>AI-shopping-channel inclusion (channels not standardised across providers).</span>
            </li>
          </ul>
        </section>

        {/* Section: Conflicts of interest */}
        <section
          id="conflicts"
          aria-labelledby="conflicts-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(64px, 8vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-4">Conflicts of interest</p>
          <h2
            id="conflicts-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            What we sell and what we don&rsquo;t.
          </h2>
          <ul
            className="list-none p-0 m-0 space-y-4 text-[color:var(--color-ink-2)]"
            style={{
              marginTop: 'clamp(28px, 4vw, 40px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Flintmere is <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>not affiliated with GS1</strong>. We do not sell GTINs. We route merchants to their local GS1 office (GS1 UK for UK-based merchants).</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Flintmere does <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>not take affiliate commissions</strong> from certification bodies, regulatory consultants, GS1 offices, or platform integrations. We monetise via subscriptions, audits, and embedded apps only.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>Flintmere is a trading name of <strong style={{ fontWeight: 500, color: 'var(--color-ink)' }}>Eazy Access Ltd</strong>, Companies House 13205428, registered office 71&ndash;75 Shelton Street, Covent Garden, London, WC2H 9JQ. Accountable director: John Morris. Eazy Access Ltd is not VAT-registered, so prices shown are the full price.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
              <span>The standard is published openly. Anyone may cite it without permission; anyone may build a competing scoring tool against the same regulatory sources. We do not own the regulations; we curate the structure.</span>
            </li>
          </ul>
        </section>

        {/* Section: How to challenge a score */}
        <section
          id="challenge"
          aria-labelledby="challenge-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(64px, 8vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-4">How to challenge a score</p>
          <h2
            id="challenge-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            If we got your score wrong.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            Email{' '}
            <a
              href="mailto:hello@flintmere.com?subject=Score%20challenge"
              className="underline"
              style={{ textUnderlineOffset: 4, fontWeight: 500 }}
            >
              hello@flintmere.com
            </a>
            {' '}with your store, the disputed pillar, and your reasoning. We respond within five business days with the underlying data we read and the rule we applied.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[68ch]"
            style={{
              marginTop: 'clamp(16px, 2vw, 24px)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            If we agree we got it wrong, the score updates and the underlying rule updates. The change appears in the public change log so other merchants benefit from your challenge. If we disagree, the rule and the reasoning stay published; you can decide whether the disagreement is material.
          </p>
        </section>

        {/* Bottom CTA — close the loop */}
        <section
          aria-label="Run a free scan"
          className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
        >
          <div
            className="mx-auto max-w-[1024px]"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 48px)',
              paddingRight: 'clamp(24px, 4vw, 48px)',
              paddingTop: 'clamp(48px, 6vw, 96px)',
              paddingBottom: 'clamp(48px, 6vw, 96px)',
            }}
          >
            <h2
              className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
              style={{
                fontSize: 'clamp(28px, 3.4vw, 36px)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Now run the scan and see your score.
            </h2>
            <p
              className="text-[color:var(--color-ink-2)] max-w-[58ch]"
              style={{
                marginTop: 'clamp(16px, 2vw, 24px)',
                fontSize: 16,
                lineHeight: 1.55,
              }}
            >
              You read how we measure. The scan takes 60 seconds and reads the four public-source pillars without an install. The full seven-pillar score lands when you install the Shopify app.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4"
              style={{ marginTop: 'clamp(24px, 3vw, 40px)' }}
            >
              <Link href="/scan" className="btn btn-accent whitespace-nowrap">
                Run a free scan &rarr;
              </Link>
              <a
                href="mailto:hello@flintmere.com?subject=Methodology%20question"
                className="btn whitespace-nowrap"
              >
                Email regulatory affairs &rarr;
              </a>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

interface PillarSectionProps {
  pillar: Pillar;
}

function PillarSection({ pillar }: PillarSectionProps) {
  const headingId = `pillar-${pillar.id}-heading`;
  return (
    <section
      id={`pillar-${pillar.id}`}
      aria-labelledby={headingId}
      className="mx-auto max-w-[1024px] border-t border-[color:var(--color-line-soft)]"
      style={{
        paddingLeft: 'clamp(24px, 4vw, 48px)',
        paddingRight: 'clamp(24px, 4vw, 48px)',
        paddingTop: 'clamp(48px, 6vw, 80px)',
        paddingBottom: 'clamp(48px, 6vw, 80px)',
      }}
    >
      <div className="grid md:grid-cols-[120px_1fr] gap-x-8 gap-y-4 items-start">
        <div>
          {/* Bracketed pillar identifier — single bracket per section per ADR
              0021 §4. Uses .bracket-inline to honour the 0.16em em-margin
              canon (operator binding 2026-05-02). */}
          <p
            className="bracket-inline font-mono text-[color:var(--color-ink)]"
            aria-hidden="true"
            style={{
              fontSize: 'clamp(40px, 5vw, 56px)',
              fontWeight: 500,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {pillar.n}
          </p>
          <p
            className="font-mono uppercase text-[color:var(--color-mute-2)]"
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              marginTop: 12,
            }}
          >
            {pillar.weight}% of score
            {pillar.installGated ? ' — install-gated' : ''}
          </p>
        </div>

        <div>
          <h3
            id={headingId}
            className="font-medium text-[color:var(--color-ink)]"
            style={{
              fontSize: 'clamp(24px, 2.8vw, 32px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {pillar.name}
          </h3>

          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 16,
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            <strong
              style={{ fontWeight: 500, color: 'var(--color-ink)' }}
            >
              What it measures.
            </strong>{' '}
            {pillar.measures}
          </p>

          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            <strong
              style={{ fontWeight: 500, color: 'var(--color-ink)' }}
            >
              Why it matters.
            </strong>{' '}
            {pillar.why}
          </p>

          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <strong
              style={{ fontWeight: 500, color: 'var(--color-ink)' }}
            >
              Sources.
            </strong>{' '}
            {pillar.sources}
          </p>

          <p
            className="text-[color:var(--color-mute)] max-w-[64ch]"
            style={{
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            <strong
              style={{ fontWeight: 500, fontStyle: 'normal' }}
            >
              Not measured:
            </strong>{' '}
            {pillar.notMeasured}
          </p>
        </div>
      </div>
    </section>
  );
}
