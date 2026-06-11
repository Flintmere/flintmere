/**
 * Author registry — E-E-A-T "Author" signal (editorial standard §B). Every post
 * declares an author id that resolves here. Bios MUST be truthful: Google's
 * E-E-A-T penalises fabricated author profiles and our own canon bans invented
 * credibility (#23 regulatory veto). Do NOT add awards/credentials that aren't
 * real.
 *
 * OPERATOR ACTION before first publish: confirm "John Morris" is a real
 * contributor and replace `role`/`bio` with his genuine credential line, or
 * switch the byline to the accountable director. (BUSINESS.md decision-making
 * framework restricts naming individuals — reconcile there too.)
 */

export interface Author {
  id: string;
  name: string;
  /** Short, truthful role line shown under the byline + in JSON-LD. */
  role: string;
  /** One-sentence bio. Truthful only — no invented credentials. */
  bio: string;
  /** Optional canonical author URL (LinkedIn / about page) for sameAs. */
  url?: string;
}

export const AUTHORS: Record<string, Author> = {
  'john-morris': {
    id: 'john-morris',
    name: 'John Morris',
    role: 'Catalog data & AI shopping, Flintmere',
    bio: 'John Morris writes about catalog data quality and AI shopping visibility at Flintmere.',
  },
};

export function getAuthor(id: string): Author {
  const author = AUTHORS[id];
  if (!author) throw new Error(`unknown blog author "${id}" — add to authors.ts`);
  return author;
}

export function authorExists(id: string): boolean {
  return id in AUTHORS;
}
