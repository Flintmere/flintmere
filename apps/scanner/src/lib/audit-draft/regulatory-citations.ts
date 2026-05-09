// Regulatory citation playbook for the audit-engine prompt.
//
// Per the v2.1 audit-engine delta and the canon-source-register §A10:
// the LLM may cite regulations BY NAME + NUMBER only when the citation
// appears in this list, with its source URL on first reference. Anything
// outside the list must be written as `[OPERATOR_VERIFY: regulation
// reference for <topic>]` instead.
//
// Curation: #39 Regulatory Affairs council seat owns accuracy of this
// list. Add a citation only after verifying:
//   - the regulation exists and the cited form is canonical
//   - the source URL is the regulator's own page (not a third-party
//     summary)
//   - the `applies_to` topics are correct
//   - the date `last_reviewed` is set to the day the entry was last
//     verified
//
// This file is part of the canon — protected by the 2026-05-09 binding
// in CLAUDE.md. Edits to this file MUST run canon-audit first.

export interface RegulatoryCitation {
  /** Canonical short form for first-mention in audit prose. */
  shortForm: string
  /** Full official name. */
  fullName: string
  /** Regulator's own page URL — never a third-party summary. */
  sourceUrl: string
  /** Topics this regulation applies to — used by the prompt to
   *  match topic mentions to allowed citations. */
  appliesTo: string[]
  /** ISO date (YYYY-MM-DD) of last verification. */
  lastReviewed: string
  /** Council seat that signed off on the entry. */
  reviewer: 'regulatory_affairs'
  /** Vertical(s) this citation applies to. */
  verticals: Array<'food' | 'beauty' | 'apparel' | 'home' | 'electronics'>
  /** Jurisdiction(s). */
  jurisdictions: Array<'EU' | 'UK' | 'US' | 'global'>
}

export const REGULATORY_CITATIONS: RegulatoryCitation[] = [
  {
    shortForm: 'EU Regulation 1169/2011 (FIC)',
    fullName: 'Regulation (EU) No 1169/2011 — Food Information to Consumers',
    sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2011/1169/oj',
    appliesTo: [
      'nutrition_declarations',
      'ingredient_lists',
      'allergen_declarations',
      'origin_labelling',
      'mandatory_food_information',
    ],
    lastReviewed: '2026-05-09',
    reviewer: 'regulatory_affairs',
    verticals: ['food'],
    jurisdictions: ['EU', 'UK'],
  },
  {
    shortForm: 'FSA Big-14 allergen list',
    fullName:
      'Food Standards Agency — 14 mandatory allergens for UK food labelling',
    sourceUrl:
      'https://www.food.gov.uk/safety-hygiene/food-allergy-and-intolerance',
    appliesTo: [
      'allergen_declarations',
      'allergen_emphasis',
      'natashas_law',
      'pre_packed_for_direct_sale',
    ],
    lastReviewed: '2026-05-09',
    reviewer: 'regulatory_affairs',
    verticals: ['food'],
    jurisdictions: ['UK'],
  },
  {
    shortForm: 'DEFRA UK Geographical Indication register',
    fullName:
      'Department for Environment, Food & Rural Affairs — Protected food and drink names register',
    sourceUrl: 'https://www.gov.uk/protected-food-drink-names',
    appliesTo: [
      'protected_designation_of_origin',
      'protected_geographical_indication',
      'traditional_speciality_guaranteed',
      'origin_labelling',
    ],
    lastReviewed: '2026-05-09',
    reviewer: 'regulatory_affairs',
    verticals: ['food'],
    jurisdictions: ['UK'],
  },
  {
    shortForm: 'GS1 General Specifications',
    fullName: 'GS1 General Specifications — barcode and identifier standards',
    sourceUrl:
      'https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications',
    appliesTo: [
      'gtin_assignment',
      'gtin_13',
      'gtin_14',
      'barcode_format',
      'identifier_uniqueness',
      'identifier_persistence',
    ],
    lastReviewed: '2026-05-09',
    reviewer: 'regulatory_affairs',
    verticals: ['food', 'beauty', 'apparel', 'home', 'electronics'],
    jurisdictions: ['global'],
  },
  {
    shortForm: 'Google Merchant Center — Product data specification',
    fullName: 'Google Merchant Center Help — Product data specification',
    sourceUrl: 'https://support.google.com/merchants/answer/7052112',
    appliesTo: [
      'gtin_requirement',
      'mpn_requirement',
      'brand_field',
      'identifier_exists',
      'condition',
      'availability',
      'product_data_feed',
    ],
    lastReviewed: '2026-05-09',
    reviewer: 'regulatory_affairs',
    verticals: ['food', 'beauty', 'apparel', 'home', 'electronics'],
    jurisdictions: ['global'],
  },
  {
    shortForm: 'Google Merchant Center — Apparel & accessories attributes',
    fullName: 'Google Merchant Center Help — Apparel & accessories attributes',
    sourceUrl: 'https://support.google.com/merchants/answer/6324406',
    appliesTo: [
      'apparel_color',
      'apparel_size',
      'apparel_gender',
      'apparel_age_group',
      'apparel_size_system',
    ],
    lastReviewed: '2026-05-09',
    reviewer: 'regulatory_affairs',
    verticals: ['apparel'],
    jurisdictions: ['global'],
  },
]

/**
 * Filter the citation playbook by vertical. The prompt builder injects
 * the resulting list into the system-prompt so the LLM sees only the
 * citations relevant to this audit's vertical.
 */
export function citationsForVertical(
  vertical: 'food' | 'beauty' | 'apparel' | 'home' | 'electronics' | 'other',
): RegulatoryCitation[] {
  if (vertical === 'other') return []
  return REGULATORY_CITATIONS.filter((c) => c.verticals.includes(vertical))
}

/**
 * Format a citation list for inclusion in the system prompt.
 * Emits a markdown-ish block the LLM treats as the allowed-citations
 * register.
 */
export function formatCitationsForPrompt(
  citations: RegulatoryCitation[],
): string {
  if (citations.length === 0) {
    return 'No regulatory citations available for this vertical. Use [OPERATOR_VERIFY: regulation reference for <topic>] for any regulatory mention.'
  }
  const lines: string[] = []
  lines.push('Allowed regulatory citations (cite by short form + source URL on first mention; never cite outside this list):')
  lines.push('')
  for (const c of citations) {
    lines.push(`  - ${c.shortForm}`)
    lines.push(`      source: ${c.sourceUrl}`)
    lines.push(`      applies to: ${c.appliesTo.join(', ')}`)
  }
  return lines.join('\n')
}
