/**
 * Bibliographic citation formats for standards pages.
 *
 * Per the binding IA (`context/design/ia/2026-04-26-standards-flintmere-com.md`
 * §Citation-fitness), every standards page carries a "Cite this page"
 * affordance offering the same five formats, and `/how-to-cite` documents
 * them. This module renders all five from one descriptor so the formats
 * can never drift between the two surfaces.
 *
 * Not to be confused with `lib/audit-draft/regulatory-citations.ts`, which
 * is the regulator-reference playbook injected into the audit LLM prompt.
 * This module is bibliographic: how an academic or trade-press writer
 * cites the standard itself.
 *
 * Deliberately NOT derived from the Zod schema — ADR 0024 §Architecture
 * lists `citation-formats.ts` alongside the derived artefacts precisely
 * because it is the one that is not. Citation style is a property of the
 * document, not of the fields it specifies.
 *
 * Author is always the corporate author. Per ADR 0015's public-framing
 * rule, customer-facing surfaces never use single-named-individual
 * framing — so no personal byline appears in any format, including
 * BibTeX where the double-brace `{{...}}` form stops BibTeX from
 * reinterpreting the name as "Firstname Lastname".
 */

/** Corporate author, verbatim, across every format. */
export const CITATION_AUTHOR = 'Flintmere Regulatory Affairs' as const;

/** Publisher line. Same string; the two roles coincide for this standard. */
export const CITATION_PUBLISHER = 'Flintmere Regulatory Affairs' as const;

export interface CitableDocument {
  /** Title in sentence case. Formats apply their own casing rules. */
  readonly title: string;
  /** Absolute, explicit-pinned URL. Never a rolling alias. */
  readonly url: string;
  /** ISO date (YYYY-MM-DD) the cited version was published. */
  readonly publishedAt: string;
  /** BibTeX citation key. Lowercase, no spaces. */
  readonly bibtexKey: string;
}

export type CitationStyle = 'apa' | 'chicago' | 'ieee' | 'mla' | 'bibtex';

export const CITATION_STYLES: readonly {
  readonly id: CitationStyle;
  readonly label: string;
}[] = [
  { id: 'apa', label: 'APA 7' },
  { id: 'chicago', label: 'Chicago (author-date)' },
  { id: 'ieee', label: 'IEEE' },
  { id: 'mla', label: 'MLA 9' },
  { id: 'bibtex', label: 'BibTeX' },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTHS_ABBR = [
  'Jan.',
  'Feb.',
  'Mar.',
  'Apr.',
  'May',
  'Jun.',
  'Jul.',
  'Aug.',
  'Sep.',
  'Oct.',
  'Nov.',
  'Dec.',
] as const;

interface DateParts {
  readonly year: string;
  readonly monthIndex: number;
  readonly day: number;
}

/**
 * Parse an ISO date without constructing a Date.
 *
 * `new Date('2026-08-23')` parses as midnight UTC and then renders in the
 * server's local zone, which west of Greenwich silently shows the previous
 * day. A citation that names the wrong publication date is a citation
 * defect, so this does string arithmetic instead.
 */
function parseIsoDate(iso: string): DateParts {
  const [year, month, day] = iso.split('-');
  const monthIndex = Number(month) - 1;
  if (
    !year ||
    Number.isNaN(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    !day
  ) {
    throw new Error(`citation-formats: unparseable ISO date "${iso}"`);
  }
  return { year, monthIndex, day: Number(day) };
}

/** Title Case For Styles That Require It (Chicago, MLA). */
function titleCase(title: string): string {
  const minor = new Set([
    'a',
    'an',
    'and',
    'as',
    'at',
    'but',
    'by',
    'for',
    'in',
    'nor',
    'of',
    'on',
    'or',
    'the',
    'to',
    'up',
    'via',
  ]);
  const words = title.split(' ');
  return words
    .map((word, i) => {
      const bare = word.replace(/[^A-Za-z]/g, '');
      const isMinor = minor.has(bare.toLowerCase());
      // First and last word always capitalise; minor words between don't.
      if (i !== 0 && i !== words.length - 1 && isMinor) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function formatCitation(
  doc: CitableDocument,
  style: CitationStyle,
): string {
  const { year, monthIndex, day } = parseIsoDate(doc.publishedAt);
  const monthLong = MONTHS[monthIndex]!;
  const monthAbbr = MONTHS_ABBR[monthIndex]!;
  const titled = titleCase(doc.title);

  switch (style) {
    case 'apa':
      return `${CITATION_AUTHOR}. (${year}, ${monthLong} ${day}). ${doc.title}. ${CITATION_PUBLISHER}. ${doc.url}`;

    case 'chicago':
      return `${CITATION_AUTHOR}. ${year}. "${titled}." ${CITATION_PUBLISHER}. ${monthLong} ${day}, ${year}. ${doc.url}.`;

    case 'ieee':
      return `${CITATION_AUTHOR}, "${doc.title}," ${CITATION_PUBLISHER}, ${monthAbbr} ${day}, ${year}. [Online]. Available: ${doc.url}`;

    case 'mla':
      return `${CITATION_AUTHOR}. ${titled}. ${CITATION_PUBLISHER}, ${day} ${monthLong} ${year}, ${doc.url.replace(/^https:\/\//, '')}.`;

    case 'bibtex':
      return [
        `@misc{${doc.bibtexKey},`,
        `  title  = {${titled}},`,
        `  author = {{${CITATION_AUTHOR}}},`,
        `  year   = {${year}},`,
        `  month  = {${monthIndex + 1}},`,
        `  url    = {${doc.url}},`,
        `  note   = {Maintained by Flintmere Regulatory Affairs (council seat #39); half-yearly publication cadence}`,
        `}`,
      ].join('\n');
  }
}

/** Every format for one document, in the order `/how-to-cite` presents them. */
export function allCitationFormats(
  doc: CitableDocument,
): readonly { style: CitationStyle; label: string; text: string }[] {
  return CITATION_STYLES.map(({ id, label }) => ({
    style: id,
    label,
    text: formatCitation(doc, id),
  }));
}
