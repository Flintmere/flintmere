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
  'checkout-eligibility': 'Checkout Readiness',
  crawlability: 'Crawler Access',
}

// One-line explanation of what each dimension measures, in founder-speak.
// Used under the label in the results grid and in the report email.
//
// Each sentence states the CHECKS THE SCORER ACTUALLY RUNS, traced to the
// pillar file in packages/scoring/src/pillars/. Five of them used to assert
// agent behaviour instead ("the codes AI shopping agents use to look it
// up", "an agent can parse", "so agents know what you sell", "whether an
// AI agent can actually complete a purchase", "whether AI shopping agents
// are allowed to read your site") — unciteable per the rule at the head of
// issueCodeToFounderSpeak below, and these strings ship in the report
// email as well as on /score/[shop]. Rewritten 2026-09-10 against the
// pillar source, not against the old sentence.
export const pillarExplanationCustomerFacing: Record<PillarId, string> = {
  // identifiers.ts — barcode presence, GTIN check digit, brand (metafield
  // or vendor), SKU presence, SKU uniqueness.
  identifiers:
    'Whether each product carries a barcode that passes its check digit, a brand, and a unique SKU.',
  attributes:
    'Whether size, colour, material and other structured fields exist — not hidden inside the description.',
  // titles.ts — title ≤150 chars, brand + product type in the title,
  // fluff-free title, description ≥200 chars with structure and use-case.
  titles:
    'Whether titles include brand and product type, stay within 150 characters, avoid marketing hype, and descriptions carry structured detail.',
  // mapping.ts — Google product category present, and at least three
  // levels deep ("Food, Beverages & Tobacco > Beverages > Coffee").
  mapping:
    'Whether each product carries a Google product category, and whether it goes at least three levels deep.',
  consistency:
    'Whether the catalog looks healthy — images load, active products have stock, alt text exists.',
  // checkout.ts — customer-accounts version, inventoryQuantity set per
  // variant, compare-at price strictly above the live price.
  'checkout-eligibility':
    'Whether your store runs Shopify’s new customer accounts, tracks stock per variant, and shows no fake discounts.',
  // crawlability.ts — robots.txt blanket / named-crawler Disallow,
  // sitemap.xml present and referenced, llms.txt present and well-formed.
  crawlability:
    'Whether your robots.txt lets crawlers in, and whether your sitemap and llms.txt are present and well-formed.',
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
      'Google Merchant Center requires a GTIN where the manufacturer assigned one; without it a listing can be limited or disapproved.',
  },
  'invalid-gtin-checksum': {
    title: 'Barcode numbers fail the check digit',
    consequence:
      'Google Merchant Center disapproves a listing whose GTIN is invalid, so the product stops showing in Shopping.',
  },
  'barcodes-not-read': {
    title: 'Not enough barcodes were read',
    consequence:
      'This scan did not read enough of your products’ barcodes to judge your GTIN coverage either way.',
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
      'No crawler — not ChatGPT, not Perplexity, not Googlebot — is permitted to fetch your catalog.',
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

/**
 * The one definition of "good shape" — shared by the verdict headline
 * (below) and the report-email subject line, which used to gate on
 * `grade === 'A'` while the headline gated on A/B and disagreed with it
 * inside a single email.
 *
 * `CompositeScore['grade']` is 'A' | 'B' | 'C' | 'D' | 'F' — there is no
 * 'A+' member, so no caller can produce one.
 */
export function isStrongGrade(grade: string): boolean {
  return grade === 'A' || grade === 'B'
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
  const affected = affectedCount.toLocaleString()
  const total = totalProducts.toLocaleString()
  // No percentage is rendered. affectedCount is a floor, so a percentage
  // derived from it is a floor too — but "49% of your catalog" reads as a
  // measured fact, and two disjoint 200-of-412 issues would render 49%
  // when the true figure is near 97%. The sentence already states the
  // hedged ratio ("at least 200 of 412"); the percentage restated it less
  // precisely and bought nothing.

  // The headline's quantifier is derived from the SAME count the subhead
  // renders. Deriving it from the grade instead let the two flatly
  // contradict each other: a grade-B store with no barcodes at all read
  // "Most of your catalog data is complete." directly above "412 of 412
  // products carry a gap." — and a UK food merchant with no barcodes is
  // exactly the case this product exists to serve.
  if (affectedCount === 0) {
    return {
      headline: isStrongGrade(grade)
        ? `Your catalog data is in good shape.`
        : `No product carries a critical gap.`,
      subhead: `${total} products checked. No critical or high-priority gap affects a product.`,
    }
  }
  // Strict majority — at exactly half, "most" would not be true.
  if (affectedCount * 2 > totalProducts) {
    return {
      headline: `Most of your catalog data is incomplete.`,
      subhead: `At least ${affected} of ${total} products carry a gap. Google Merchant Center can limit where it shows a listing whose data is incomplete.`,
    }
  }
  return {
    headline: `At least ${affected} of your ${total} products carry a data gap.`,
    subhead: `Google Merchant Center can limit where it shows a listing whose data is incomplete.`,
  }
}

// Grade badge anchor. Live median from scanner_scans table when n>=50;
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
