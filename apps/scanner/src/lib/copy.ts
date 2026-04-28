import type { PillarId } from '@flintmere/scoring'

// Two-tier floor. BENCHMARK_FLOOR gates whether we render a number at all;
// BENCHMARK_PUBLISH_FLOOR gates the "State of Shopify Catalogs" publishing
// claim (median-of-N framing, aggregate report). Below the publish floor
// the same numbers still surface, but framed as an early sample — never as
// "the median Shopify store scores X". #38 data-intake + claim-review
// council authored this split on 2026-04-22 after the first 150-store
// compile pass yielded only 8 validated stores (apparel 5 / beauty 1 /
// food-and-drink 2); the integrity line is "show the data, don't claim
// the stat". Bump the publish floor nowhere else — this is the only place.
export const BENCHMARK_FLOOR = 1
export const BENCHMARK_PUBLISH_FLOOR = 100

// The one sentence every report/page uses to answer "who are you?"
// Must cite verifiable external authorities. Scored by #21 technical
// copywriter for accuracy, #37 consumer psychologist for parse-on-skim.
export const AUTHORITY_LINE =
  'The checks map to Shopify product data requirements, GS1 UK identifier rules, and Google Merchant Center specs.'

// Door 3 (soft reply link) in emails and on concierge page. Per
// BUSINESS.md:19 — customer-facing surfaces use team framing. Email
// signatures (1:1 procurement) keep the named director.
export const REPLY_SLA = 'The team usually replies within two working days.'

// First-person sign-off for every customer-facing email. Founder
// identity is John Morris; company legal entity is Eazy Access Ltd.
// Email is 1:1 procurement-disclosure surface per BUSINESS.md:19, so
// the named director identity holds here even though marketing copy
// flips to "we" / "the team."
export const JOHN_SIGNATURE_NAME = 'John Morris'
export const JOHN_SIGNATURE_TITLE = 'Flintmere founder'
export const JOHN_SIGNATURE_REPLY_INVITE = 'Reply direct. We read every one.'

// The concierge deliverable. Written audit — no video, no call —
// delivered by the Flintmere team. Every customer-facing surface that
// describes what £97 buys must use this wording (or the list below).
// If you change the deliverable shape, update all five surfaces in
// the same commit.
export const CONCIERGE_DELIVERABLE_SUMMARY =
  'We read every product, write a detailed audit letter pointing at exactly what to fix, and send a per-product CSV with the worst 10 products already drafted for you. A 30-day re-scan is included. Delivered within three working days.'

// Five-item list used on the /audit page and in the report email
// Door 1 expansion. Keep in this order — #37 sequenced it for
// objection handling (letter first = personal; CSV second = scale;
// plan third = immediacy; GS1 fourth = authority; re-scan fifth =
// accountability).
export const CONCIERGE_DELIVERABLE_LIST: Array<{
  title: string
  body: string
}> = [
  {
    title: 'A written audit letter',
    body:
      'We read your store product by product, then write a 1,500-word letter pointing at specific products by name with annotated screenshots. Not a generic template — a read of your store.',
  },
  {
    title: 'A per-product fix CSV',
    body:
      'Every product that has a problem, which problem, and the fix. For the worst 10 offenders, we draft the full replacement text — title, description, metafield values — ready to paste into Shopify.',
  },
  {
    title: 'A 30-day fix sequence',
    body:
      'A one-page plan: what to do Day 1, Week 1, Week 2, Week 3-4 — ranked by how many products each fix unblocks first.',
  },
  {
    title: 'A GS1 UK barcode path',
    body:
      'The right GS1 office for where your business is registered, what to buy, and how to import the codes into Shopify without breaking your theme.',
  },
  {
    title: 'A 30-day re-scan',
    body:
      'Included. The scanner re-runs on day 30 and emails you a progress report, so you know whether the fixes moved the score.',
  },
]

// Words that fail the #37 veto on Copy Council: Flintmere-internal or
// Shopify-developer jargon that a non-technical founder will not parse
// on one skim. Never ship any of these in customer-facing surfaces.
// This list is referenced by the /design-critique skill too.
export const BANNED_JARGON = [
  'pillar',
  'pillars',
  'crawlability',
  'metafield',
  'metafields',
  'identifier',
  'identifiers',
  'mapping',
  'eligibility',
  'ceiling',
  'GTIN-less',
] as const

// Customer-facing labels for each scoring dimension. These replace the
// internal pillar IDs everywhere a merchant sees text. Rules:
//   - No word from BANNED_JARGON.
//   - Answers "what does this measure from the buyer's side?"
//   - Title case, ≤ 4 words.
export const pillarLabelCustomerFacing: Record<PillarId, string> = {
  identifiers: 'Product IDs',
  attributes: 'Structured Attributes',
  titles: 'Title & Description Quality',
  mapping: 'Google Category Match',
  consistency: 'Data Consistency',
  'checkout-eligibility': 'Agent Checkout Readiness',
  crawlability: 'AI Agent Access',
}

// One-line explanation of what each dimension measures, in founder-speak.
// Used under the label in the results grid and in the report email.
export const pillarExplanationCustomerFacing: Record<PillarId, string> = {
  identifiers:
    'Whether each product carries the codes AI shopping agents use to look it up (barcode, brand, MPN).',
  attributes:
    'Whether size, colour, material and other structured fields exist — not hidden inside the description.',
  titles:
    'Whether product titles and descriptions read like spec sheets an agent can parse, not marketing copy.',
  mapping:
    'Whether your products carry a Google Merchant Center category, so agents know what you sell.',
  consistency:
    'Whether the catalog looks healthy — images load, active products have stock, alt text exists.',
  'checkout-eligibility':
    'Whether an AI agent can actually complete a purchase without human intervention.',
  crawlability:
    'Whether AI shopping agents are allowed to read your site at all — robots rules, sitemaps, llms.txt.',
}

// Per-issue founder-speak. Every issue code the scoring package emits
// has a plain-language title and a consequence sentence. If you add a
// new issue code in packages/scoring, add its entry here in the same PR
// — or the scanner will fall through to the raw code.
//
// Rules enforced by #37:
//   - Title = what the problem IS, in ≤ 8 words, zero jargon.
//   - Consequence = what an AI agent does as a result, ≤ 20 words.
//   - No mention of "pillar", "score", "ceiling".
export interface FounderSpeak {
  title: string
  consequence: string
}

export const issueCodeToFounderSpeak: Record<string, FounderSpeak> = {
  // identifiers
  'missing-gtin': {
    title: 'Products have no barcode',
    consequence:
      'AI shopping agents cannot match these to the product graph — they stay invisible when a buyer searches by item.',
  },
  'invalid-gtin-checksum': {
    title: 'Barcode numbers fail the checksum',
    consequence:
      'Agents reject these as fake codes, so the product is dropped from results.',
  },
  'missing-brand': {
    title: 'Products have no brand name',
    consequence:
      'Agents filter by brand first. No brand field means the product is filtered out before it ever gets ranked.',
  },
  // titles
  'title-over-limit': {
    title: 'Titles are too long',
    consequence:
      'Agents truncate and lose the specs at the end — buyers see a stub, not the full name.',
  },
  'title-marketing-fluff': {
    title: 'Titles read like marketing, not specs',
    consequence:
      'Words like "premium" and "must-have" tell a buyer nothing an agent can use to match their query.',
  },
  'description-too-short': {
    title: 'Descriptions are too thin',
    consequence:
      'Agents have nothing to extract — no material, no dimensions, no use-case. The product looks generic next to competitors.',
  },
  // crawlability
  'robots-blocks-all': {
    title: 'Your site blocks every crawler',
    consequence:
      'No AI agent — not ChatGPT, not Perplexity, not Google — can see your catalog. You are invisible by default.',
  },
  'robots-blocks-ai-agents': {
    title: 'Your robots.txt blocks AI agents specifically',
    consequence:
      'ChatGPT, Claude, and Perplexity are told to stay out — so they do. Google may still see you, agents will not.',
  },
  'missing-llms-txt': {
    title: 'No llms.txt file on your domain',
    consequence:
      'llms.txt is the emerging standard for telling AI agents what to read. Without it, you rely on them guessing.',
  },
  'malformed-llms-txt': {
    title: 'Your llms.txt is broken',
    consequence:
      'Agents skip files they cannot parse, so a malformed file is worse than no file at all.',
  },
  'missing-sitemap': {
    title: 'No sitemap at /sitemap.xml',
    consequence:
      'Agents use sitemaps to discover every product URL. Without one, they see whatever they stumble across.',
  },
  'sitemap-not-referenced': {
    title: 'robots.txt does not point to your sitemap',
    consequence:
      'Even when the sitemap exists, agents will miss it if robots.txt does not list it.',
  },
  // consistency
  'image-missing-alt': {
    title: 'Product images have no alt text',
    consequence:
      'Alt text is how an agent understands an image when the image itself cannot be read. No alt = no signal.',
  },
  'active-zero-inventory': {
    title: 'Active products show zero stock',
    consequence:
      'Agents send buyers to out-of-stock pages and it looks like your catalog is unreliable.',
  },
  'image-invalid-url': {
    title: 'Image URLs do not load',
    consequence:
      'Broken images tell an agent the data is stale — they deprioritise the whole catalog.',
  },
}

// Verdict templates for the top of the report email and the scan
// results page. Pick one based on the grade.
export function verdictHeader(args: {
  grade: string
  invisibleCount: number
  totalProducts: number
}): { headline: string; subhead: string } {
  const { grade, invisibleCount, totalProducts } = args
  const pct = totalProducts > 0 ? Math.round((invisibleCount / totalProducts) * 100) : 0

  if (grade === 'A' || grade === 'A+') {
    return {
      headline: `Your catalog is ready for AI shopping agents.`,
      subhead: `${totalProducts.toLocaleString()} products scanned. ${invisibleCount.toLocaleString()} still have gaps an agent will treat as missing.`,
    }
  }
  if (grade === 'B') {
    return {
      headline: `${invisibleCount.toLocaleString()} of your ${totalProducts.toLocaleString()} products are already visible to AI shopping agents.`,
      subhead: `The rest have gaps that cause an agent to skip them — fixable, but they need attention.`,
    }
  }
  if (grade === 'C') {
    return {
      headline: `${invisibleCount.toLocaleString()} of your ${totalProducts.toLocaleString()} products are invisible to AI shopping agents right now.`,
      subhead: `That's ${pct}% of your catalog a ChatGPT or Perplexity buyer will never see.`,
    }
  }
  // D or F
  return {
    headline: `Your catalog is invisible to AI shopping agents.`,
    subhead: `${invisibleCount.toLocaleString()} of ${totalProducts.toLocaleString()} products fail the checks an agent runs before it will recommend you.`,
  }
}

// ----------------------------------------------------------------------
// Suppression-estimate (dead-inventory wedge) — v2 strategic report §7
// ----------------------------------------------------------------------
// The lede the scan results page uses to surface the suppression range
// AHEAD of the score + pillar breakdown. Range copy is deliberately
// scoped to this module so Copy Council can polish it later — this is
// the seam, per the wedge build plan.
//
// Constraints (#11 + #37 + claim-review):
//   - Range expressed as low–high; never a point estimate.
//   - "Likely suppressed" — never "are suppressed" without verification.
//   - Mention the three signals so the merchant can audit the claim.
//   - No banned-jargon words from BANNED_JARGON above.
//   - No revenue-impact framing in this MVP — that comes Phase 2 with AOV.

export const SUPPRESSION_LEDE_EYEBROW = 'Likely suppressed in Google Shopping'

// Disclosure tone softened 2026-04-28 per #37 Consumer psychologist lens.
// Old subhead read as accusatory + demand-led ("Install Flintmere to confirm
// exact figures..."). New subhead frames as honest projection + path-forward
// ("verify and prioritise the biggest wins"). Same substance, less anxiety.
export const SUPPRESSION_LEDE_SUBHEAD =
  'Modelled from your public catalog signals — the actual count depends on your Google Merchant Center account. Install Flintmere to verify, then prioritise the fixes that move the most products.'

/**
 * The lede headline for the scan results page.
 *
 * Returns a single sentence stating the modelled range. Wrapping
 * component handles the Bracket signature on key nouns.
 *
 * Tone (softened 2026-04-28 per #37):
 *   - "aren't appearing" instead of "are likely suppressed" — matter-of-fact,
 *     less accusatory. "Suppressed" is the canonical GMC dashboard term and
 *     stays in the eyebrow; the body uses everyday English.
 *   - "Roughly" prefix signals modelled-not-measured and matches "we estimate".
 *   - Drop "today" tail — present-tense urgency without it.
 */
export function suppressionLede(args: {
  low: number
  high: number
  productCount: number
}): string {
  const { low, high, productCount } = args

  if (productCount === 0) {
    return 'No public products found, so we have nothing to estimate against.'
  }
  if (high === 0) {
    return 'We see no clear suppression signals on this catalog. Every product carries a barcode, a category, and (for food items) an allergen statement.'
  }
  if (low === high) {
    return `We estimate ${low.toLocaleString()} of your ${productCount.toLocaleString()} products may not be appearing in Google Shopping right now.`
  }
  return `We estimate roughly ${low.toLocaleString()}–${high.toLocaleString()} of your ${productCount.toLocaleString()} products may not be appearing in Google Shopping right now.`
}

/**
 * Per-signal breakdown shown beneath the lede headline.
 *
 * Tone (rewritten 2026-04-28 per #37):
 *   - Old version dot-separated three blunt failures ("63 products with no
 *     barcode · 31 food products with no allergen statement · 29 products
 *     with no Google Shopping category"). Read as a checklist of broken.
 *   - New version frames as "what we found" + comma-separated prose. Same
 *     numbers, conversational diagnostic cadence instead of telegram-style
 *     enumeration. Reduces cognitive load on phone-skim per #37 plain-
 *     language test.
 */
export function suppressionSignalLine(args: {
  missingGtin: number
  ambiguousAllergen: number
  missingGmcCategory: number
}): string {
  const { missingGtin, ambiguousAllergen, missingGmcCategory } = args
  const parts: string[] = []
  if (missingGtin > 0) {
    parts.push(
      `${missingGtin.toLocaleString()} ${missingGtin === 1 ? 'product' : 'products'} without a barcode`,
    )
  }
  if (ambiguousAllergen > 0) {
    parts.push(
      `${ambiguousAllergen.toLocaleString()} food ${ambiguousAllergen === 1 ? 'product' : 'products'} where the allergen statement isn’t in a structured field`,
    )
  }
  if (missingGmcCategory > 0) {
    parts.push(
      `${missingGmcCategory.toLocaleString()} ${missingGmcCategory === 1 ? 'product' : 'products'} without a Google Merchant Center category`,
    )
  }
  if (parts.length === 0) return ''
  if (parts.length === 1) return `What we found: ${parts[0]}.`
  if (parts.length === 2) return `What we found: ${parts[0]}, and ${parts[1]}.`
  return `What we found: ${parts[0]}, ${parts[1]}, and ${parts[2]}.`
}

// ----------------------------------------------------------------------
// Revenue-band lede — dead-inventory wedge finish arc
// ----------------------------------------------------------------------
// Copy Council seam: all four lenses (#1, #20, #22, #37) review before hero ships.
// Claim-review seam: #9 + #23 review before hero ships (ASA / CAP Code).
// Framing: "annual demand at risk" per requirement Q-C Option 3 (no defensible
// monthly turn source).
export const REVENUE_LEDE_EYEBROW = 'Annual demand at risk'

export const REVENUE_LEDE_DISCLOSURE =
  'Modelled from public catalog signals — missing barcodes, GMC categories, and allergen statements. Install Flintmere to verify against your Google Merchant Center account.'

/**
 * Disclosure variant when the scan was truncated and figures are projected
 * from a sample. Per BUSINESS.md:19 council ruling 2026-04-27 #4: when
 * scaling applies, the disclosure must say so. Honest projection beats
 * silent inflation.
 */
export function sampledRevenueDisclosure(args: {
  sampledCount: number
  actualProductCount: number | null
}): string {
  const sampled = args.sampledCount.toLocaleString()
  const total =
    args.actualProductCount !== null
      ? args.actualProductCount.toLocaleString()
      : `${sampled}+`
  return `Projected from a ${sampled}-product sample of your ${total}-product catalog. Modelled from public signals — missing barcodes, GMC categories, and allergen statements. Install Flintmere to verify against your full catalog and Google Merchant Center account.`
}

/**
 * Scope line shown above every results lede — gives the merchant
 * calibration on what we scanned BEFORE they read the £-figure. Per
 * BUSINESS.md:19 council ruling 2026-04-27 #3: trust-anchor sits ahead of
 * the headline so the merchant absorbs the sampling story before the
 * number lands.
 */
export function scanScopeLine(args: {
  sampledCount: number
  actualProductCount: number | null
  truncated: boolean
}): string {
  const sampled = args.sampledCount.toLocaleString()
  if (!args.truncated) {
    return `Scanned ${sampled} products · 60 seconds`
  }
  const total =
    args.actualProductCount !== null
      ? args.actualProductCount.toLocaleString()
      : `${sampled}+`
  return `Scanned ${sampled} of ${total} products · 60 seconds`
}

export function revenueLede(args: { low: number; high: number }): string {
  const { low, high } = args
  // £-formatter polish per operator + #21 Tech copywriter 2026-04-27.
  // For ≥£100k, drop the decimal — "£210k" reads cleaner than "£210.1k".
  // For ≥£10m, round to whole millions. For £1k–£99k and £1m–£9m, keep
  // one-decimal where non-round, drop where round.
  const fmt = (n: number) => {
    if (n >= 10_000_000) return `£${Math.round(n / 1_000_000)}m`
    if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`
    if (n >= 100_000) return `£${Math.round(n / 1_000).toLocaleString()}k`
    if (n >= 1_000) return `£${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`
    return `£${n.toLocaleString()}`
  }
  return `Roughly ${fmt(low)}–${fmt(high)} of annual demand may be going to competitors while these products stay suppressed.`
}

// Grade badge anchor. Live median from scanner_scans table when n≥50;
// otherwise falls back to a copy that does not over-claim.
export function gradeBadgeAnchor(args: {
  grade: string
  median?: string
  nScanned?: number
}): string {
  const { grade, median, nScanned } = args
  if (median && nScanned !== undefined && nScanned >= 50) {
    return `Grade ${grade} · median across ${nScanned.toLocaleString()} stores: ${median}`
  }
  // Fallback while the benchmark dataset is still thin.
  return `Grade ${grade} · based on Shopify + Google Merchant Center requirements`
}
