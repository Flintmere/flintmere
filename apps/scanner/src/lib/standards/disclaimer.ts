/**
 * Standards disclaimer — single source of truth.
 *
 * ADR 0024 §Disclaimer makes this load-bearing: every standards page
 * carries this exact wording, and the wording is what allows publication
 * without a paid regulatory professional in the QC seat. It supersedes
 * ADR 0018 §Disclaimer with a tighter register while preserving the three
 * load-bearing clauses: citation-grade scope, non-legal-advice, and
 * merchant responsibility.
 *
 * #39 Regulatory Affairs holds a veto on any change here. `disclaimer.test.ts`
 * asserts the string verbatim so a well-meaning copy edit fails CI rather
 * than shipping.
 */

export const STANDARDS_DISCLAIMER =
  'This standard is published for citation, education, and Shopify catalog encoding. It is not legal or regulatory advice. Merchants are responsible for compliance with their applicable jurisdictional requirements.' as const;

/**
 * Shorter form for the JSON-LD `disclaimer` property and the Atom feed,
 * where the full sentence would dominate a machine-readable payload. The
 * rendered surfaces always carry the full text — this is for serialised
 * artefacts only.
 */
export const STANDARDS_DISCLAIMER_SHORT =
  'Not legal or regulatory advice. Merchants are responsible for their own compliance.' as const;
