/**
 * Methodology page data — pillar weights are source-of-truth-aligned with
 * `packages/scoring/src/types.ts §PILLAR_WEIGHTS`. If those weights change,
 * this file MUST update in lockstep or the public claim diverges from the
 * code that produces the score.
 */

export const LAST_UPDATED = '2026-05-02';
export const STANDARD_VERSION = 'v1';
export const STANDARD_TARGET = 'Q3 2026';

export interface Pillar {
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

export const PILLARS: Pillar[] = [
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

export const TOTAL_PUBLIC_WEIGHT = PILLARS.filter((p) => !p.installGated).reduce(
  (sum, p) => sum + p.weight,
  0,
);

export const DATA_SOURCES = [
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
