import type { PillarId } from '@flintmere/scoring'
import type { AuditBandSlug } from './audit-pricing'
import { bandBySlug, bandPriceLine } from './audit-pricing'

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

// Sign-off for every customer-facing email. Founder identity is
// Abdur-Rahman Morris; company legal entity is Eazy Access Ltd. Email
// is 1:1 procurement-disclosure surface per BUSINESS.md:19, so the
// named director identity holds here even though marketing copy flips
// to "we" / "the team." The TEAM_LINE caption ("for the Flintmere team")
// preserves team-voice attribution beneath the signed name.
//
// Signature mark: when FOUNDER_SIGNATURE_IMAGE_URL is set, emails render
// that image. Held null until a non-AI-handwriting asset is approved
// (designed monogram or photographed real signature) — emails fall back
// to the heroic bracket-signature pattern, which is canon-aligned,
// plaintext-safe, and has no asset dependency.
export const FOUNDER_SIGNATURE_NAME = 'Abdur-Rahman Morris'
export const FOUNDER_SIGNATURE_TEAM_LINE = 'For the Flintmere team'
export const FOUNDER_SIGNATURE_REPLY_INVITE = 'Reply direct. We read every one.'
export const FOUNDER_SIGNATURE_IMAGE_URL: string | null = null

// The concierge deliverable. A written catalog letter — no video, no call —
// delivered by the Flintmere team. Every customer-facing surface that
// describes what the catalog letter buys must use this wording (or the
// per-band list below). Per ADR 0022 the deliverable depth scales with
// band: Band 1 = full-catalog letter + worst 10 drafted; Band 2 =
// full-catalog letter + worst 25 drafted; Band 3 = representative-sample
// letter + worst 25 drafted.
//
// Single source of truth for deliverable copy is `concierge-deliverable.ts`
// (introduced 2026-05-09 to prevent the spec/page drift caught in the
// deliverable-canon-alignment review). The functions below are
// backward-compat re-exports.

import {
  conciergeDeliverableItems,
  conciergeDeliverableSummary,
  type ConciergeDeliverableItem,
} from './concierge-deliverable'

/** @deprecated use `conciergeDeliverableItems` from concierge-deliverable.ts */
export const conciergeDeliverableListForBand = conciergeDeliverableItems

/** @deprecated use `conciergeDeliverableSummary` from concierge-deliverable.ts */
export const conciergeDeliverableSummaryForBand = conciergeDeliverableSummary

/**
 * Default deliverable list — Band 1 wording — kept as a const export
 * for the marketing page surface. Phase 2's `/catalog-letter` redesign wires
 * per-band rendering; until then this surface shows the Band 1 list
 * with an inline note that Bands 2 + 3 deliver the worst 25.
 */
export const CONCIERGE_DELIVERABLE_LIST: ConciergeDeliverableItem[] =
  conciergeDeliverableItems('band-1')

/**
 * Default summary — Band 1 wording — kept for any non-band-aware
 * surface. Phase 4 cascade migrates the remaining consumers.
 */
export const CONCIERGE_DELIVERABLE_SUMMARY =
  conciergeDeliverableSummary('band-1')

// Re-export for convenience so consumers don't need a second import.
export { bandPriceLine }

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
//   - Consequence = what Google Merchant Center or a crawler does as a
//     result, ≤ 20 words. Never what an AI agent does, sees, skips,
//     ranks or prefers — we cannot cite a source for any of that, and
//     these strings ship in the report email body.
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
      'Google Merchant Center can limit where it shows a product with no GTIN. It is not disapproved for that.',
  },
  'invalid-gtin-checksum': {
    title: 'Barcode numbers fail the check digit',
    consequence:
      'Google Merchant Center disapproves a listing whose GTIN is invalid, so the product stops showing in Shopping.',
  },
  'barcodes-not-read': {
    title: 'Barcodes were not read',
    consequence:
      'We could not read barcodes on this scan, so it says nothing about your GTINs either way.',
  },
  'missing-brand': {
    title: 'Products have no brand name',
    consequence:
      'Google Merchant Center requires a brand on most products. A listing without one can be disapproved.',
  },
  // titles
  'title-over-limit': {
    title: 'Titles are too long',
    consequence:
      'Google Merchant Center caps a title at 150 characters. Anything past that is cut before a shopper sees it.',
  },
  'title-marketing-fluff': {
    title: 'Titles read like marketing, not specs',
    consequence:
      'Google asks titles to lead with brand, product type and size — not words like "premium" or "must-have".',
  },
  'description-too-short': {
    title: 'Descriptions are too thin',
    consequence:
      'Google Merchant Center requires a description, and it is where material, size and use-case detail belongs.',
  },
  // crawlability
  'robots-blocks-all': {
    title: 'Your site blocks every crawler',
    consequence:
      'Your robots.txt tells every crawler to stay out, including Googlebot, so your pages cannot be indexed.',
  },
  'robots-blocks-ai-agents': {
    title: 'Your robots.txt blocks AI crawlers by name',
    consequence:
      'Your robots.txt carries a Disallow rule naming these crawlers, which asks them not to fetch your pages.',
  },
  'missing-llms-txt': {
    title: 'No llms.txt file on your domain',
    consequence:
      'llms.txt is an emerging convention. No search engine or AI company has confirmed it reads one.',
  },
  'malformed-llms-txt': {
    title: 'Your llms.txt is malformed',
    consequence:
      'Your file does not follow the convention. No search engine or AI company has confirmed it reads one.',
  },
  'missing-sitemap': {
    title: 'No sitemap at /sitemap.xml',
    consequence:
      'Google uses a sitemap to discover product URLs it might not reach by following links. You have none.',
  },
  'sitemap-not-referenced': {
    title: 'robots.txt does not point to your sitemap',
    consequence:
      'Google reads the Sitemap line in robots.txt to find your sitemap. Yours does not carry one.',
  },
  // consistency
  'image-missing-alt': {
    title: 'Product images have no alt text',
    consequence:
      'Alt text is how Google Images reads a picture, and how a screen reader describes it.',
  },
  'active-zero-inventory': {
    title: 'Active products show zero stock',
    consequence:
      'A product page showing no stock can trigger a Google Merchant Center availability mismatch, which disapproves the listing.',
  },
  'image-invalid-url': {
    title: 'Image URLs do not load',
    consequence:
      'Google Merchant Center disapproves a listing whose image link does not resolve. The image is a required attribute.',
  },
}

// Verdict templates for the top of the report email and the scan
// results page. Pick one based on the grade.
export function verdictHeader(args: {
  grade: string
  /**
   * The LARGEST single-issue affectedCount among critical and high
   * severity issues — a floor, not a total. Two disjoint issues of 100
   * products each report 100, while 200 products are actually affected.
   *
   * It is deliberately not a union over affectedProductIds: eight issues
   * across crawlability, checkout and identifiers are site-level and
   * carry no product IDs at all, so a union would report ZERO products
   * affected by "your robots.txt blocks every crawler". A floor beats
   * a zero.
   *
   * Because it is a floor, always render it hedged — "at least N" —
   * never as an exact count.
   */
  affectedCount: number
  totalProducts: number
}): { headline: string; subhead: string } {
  const { grade, affectedCount, totalProducts } = args
  const pct = totalProducts > 0 ? Math.round((affectedCount / totalProducts) * 100) : 0
  const affected = affectedCount.toLocaleString()
  const total = totalProducts.toLocaleString()

  // The headline's quantifier is derived from the SAME count the subhead
  // renders. Deriving it from the grade instead let the two flatly
  // contradict each other: a grade-B store with no barcodes at all read
  // "Most of your catalog data is complete." directly above "412 of 412
  // products carry a gap." — and a UK food merchant with no barcodes is
  // exactly the case this product exists to serve.
  if (affectedCount === 0) {
    const strongGrade = grade === 'A+' || grade === 'A' || grade === 'B'
    return {
      headline: strongGrade
        ? `Your catalog data is in good shape.`
        : `No product carries a critical gap.`,
      subhead: `${total} products checked. No critical or high-priority gap affects a product.`,
    }
  }
  // Strict majority — at exactly half, "most" would not be true.
  if (affectedCount * 2 > totalProducts) {
    return {
      headline: `Most of your catalog data is incomplete.`,
      subhead: `At least ${affected} of ${total} products carry a gap — ${pct}% of your catalog. Google Merchant Center can limit where it shows a listing whose data is incomplete.`,
    }
  }
  return {
    headline: `At least ${affected} of your ${total} products carry a data gap.`,
    subhead: `That is ${pct}% of your catalog. Merchant Center can limit where it shows those listings.`,
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

export const SUPPRESSION_LEDE_SUBHEAD =
  'Modelled from your public catalog signals — the actual count depends on your Google Merchant Center account.'

/**
 * The lede for the scan results page — returns a deterministic-anchor
 * headline plus an optional probabilistic subline.
 *
 * The headline anchors on the count of products carrying ≥1 signal —
 * a number reproducible from the merchant's own admin (count of products
 * with a missing barcode, a missing GMC category, or unstructured allergen
 * data). The subline reports the probability-banded suppression range,
 * which used to be the whole headline and read as a guess because the
 * 1-signal probability band (15–35%) puts a ~2.3× spread on the dominant
 * cohort. Anchor first, refine second.
 *
 * Backward compat: when `productsWithAnySignal` is undefined (older scans
 * persisted before this field shipped), fall back to the original single-
 * sentence framing so /score/[shop] re-renders don't crash.
 */
export function suppressionLede(args: {
  low: number
  high: number
  productCount: number
  productsWithAnySignal?: number
}): { headline: string; subline: string | null } {
  const { low, high, productCount, productsWithAnySignal } = args

  if (productCount === 0) {
    return {
      headline: 'No public products found, so we have nothing to estimate against.',
      subline: null,
    }
  }
  if (high === 0 || productsWithAnySignal === 0) {
    return {
      headline:
        'We see no clear suppression signals on this catalog. Every product carries the data Google Shopping looks for.',
      subline: null,
    }
  }

  // Backward-compat path — old persisted scans without the deterministic anchor.
  if (productsWithAnySignal === undefined) {
    if (low === high) {
      return {
        headline: `We estimate ${low.toLocaleString()} of your ${productCount.toLocaleString()} products may not be appearing in Google Shopping right now.`,
        subline: null,
      }
    }
    return {
      headline: `We estimate roughly ${low.toLocaleString()}–${high.toLocaleString()} of your ${productCount.toLocaleString()} products may not be appearing in Google Shopping right now.`,
      subline: null,
    }
  }

  const headline = `${productsWithAnySignal.toLocaleString()} of your ${productCount.toLocaleString()} products are missing data Google Shopping looks for.`
  let subline: string
  if (low === high) {
    subline = `Roughly ${low.toLocaleString()} are likely already suppressed today.`
  } else if (low === 0) {
    subline = `Up to ${high.toLocaleString()} are likely already suppressed today.`
  } else {
    subline = `Roughly ${low.toLocaleString()}–${high.toLocaleString()} are likely already suppressed today.`
  }
  return { headline, subline }
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

// Vertical-neutral phrasing. Earlier draft enumerated "barcodes, GMC
// categories, and allergen statements" — operator caught this 2026-05-05
// when self-testing the scanner against allbirds.com (apparel) and the
// disclosure plastered allergen language across a non-food merchant's
// public report. The scoring engine itself is vertical-aware (allergen
// flags only fire on food products per packages/scoring/.../suppression-
// estimate.ts) but the disclosure boilerplate was vertical-blind. Now
// it lists the signal CATEGORIES (barcodes, GMC categories, product
// attributes) rather than naming food-specific attributes; the actual
// per-merchant findings still surface vertical-correctly via
// suppressionSignalLine() below.
export const REVENUE_LEDE_DISCLOSURE =
  'Modelled from public catalog signals — barcodes, Google Merchant Center categories, and product attributes.'

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
  return `Projected from a ${sampled}-product sample of your ${total}-product catalog. Modelled from public catalog signals — barcodes, Google Merchant Center categories, and product attributes.`
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

/**
 * Revenue-band lede — two-beat with deterministic count-anchor.
 *
 * Headline anchors on a number the merchant can re-derive from their own
 * admin (count of products carrying ≥1 suppression signal). The subline
 * carries the £-band — the wedge pulse, demoted from headline so the
 * 2.3× spread on the band can't read as a guess in isolation. Same
 * pattern as `suppressionLede()`, applied here to the State 1 surface.
 *
 * Backward compat: when `productCount` or `productsWithAnySignal` is
 * undefined (older persisted scans, or callers that haven't been upgraded
 * yet), fall back to the original single-sentence framing so the
 * /score/[shop] re-render path doesn't crash.
 */
export function revenueLede(args: {
  low: number
  high: number
  productCount?: number
  productsWithAnySignal?: number
}): { headline: string; subline: string | null } {
  const { low, high, productCount, productsWithAnySignal } = args
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

  const revenueSentence = (() => {
    if (low === high) {
      return `${fmt(low)} of annual demand is at risk while these stay suppressed.`
    }
    if (low === 0) {
      return `Up to ${fmt(high)} of annual demand is at risk while these stay suppressed.`
    }
    return `Roughly ${fmt(low)}–${fmt(high)} of annual demand is at risk while these stay suppressed.`
  })()

  if (productCount === undefined || productsWithAnySignal === undefined) {
    return { headline: revenueSentence, subline: null }
  }

  const headline = `${productsWithAnySignal.toLocaleString()} of your ${productCount.toLocaleString()} products are missing data Google Shopping looks for.`
  return { headline, subline: revenueSentence }
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
