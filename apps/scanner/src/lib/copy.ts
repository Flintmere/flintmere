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
      'AI shopping agents match on identifiers. With no barcode there is nothing to match these against.',
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
      'No crawler — not ChatGPT, not Perplexity, not Google — is permitted to fetch your catalog.',
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
      headline: `${invisibleCount.toLocaleString()} of your ${totalProducts.toLocaleString()} products carry gaps an agent reads as missing data.`,
      subhead: `Most of your catalog parses cleanly. These are the ones that do not — fixable, but they need attention.`,
    }
  }
  if (grade === 'C') {
    return {
      headline: `${invisibleCount.toLocaleString()} of your ${totalProducts.toLocaleString()} products are missing data an agent needs to match them.`,
      subhead: `That's ${pct}% of your catalog with gaps in the fields agents read first.`,
    }
  }
  // D or F
  return {
    headline: `Your catalog is missing the data agents read first.`,
    subhead: `${invisibleCount.toLocaleString()} of ${totalProducts.toLocaleString()} products fail the checks an agent runs before it can match them.`,
  }
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
