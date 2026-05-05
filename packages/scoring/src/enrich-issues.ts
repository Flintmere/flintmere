// Issue enrichment — attaches example product titles + handles to each
// issue so the UI can render per-issue mirror-recognition citations.
//
// Why this exists: scoring pillars emit `affectedProductIds: string[]`
// (cheap, lossless) but a merchant reading "63 products without a barcode"
// wants to see WHICH 63 — or at least three of them — to trust we read
// THIS catalog, not a template. Phase 1 of the strengthening plan added
// the catalog-level "What we read" preamble; Phase 3 (this module) extends
// the same mechanic to every issue.
//
// Pure post-processor: takes the issues a pillar already produced plus
// the catalog they were scored against, returns issues with an extra
// `affectedProductExamples` array. Single touch point — alternative was
// editing every pillar to populate examples inline, which would have
// crossed seven files and re-tested the world. This is one function.

import type { CatalogInput, Issue } from './types.js';

const DEFAULT_EXAMPLE_LIMIT = 3;

/**
 * Attach up to `limit` example products to each issue, looked up by id
 * from the catalog. Examples are sorted alphabetically by title (case-
 * insensitive), tie-broken by handle, so the same input always yields
 * the same output (fixture-friendly + lets the merchant reconcile
 * against their admin's default sort).
 *
 * Issues whose `affectedProductIds` are all unknown to the catalog
 * (orphaned ids — shouldn't happen, but guard for it) get an empty
 * examples array. Issues with no ids in the first place (site-level
 * issues like robots.txt blocking) also get an empty array.
 */
export function enrichIssuesWithExamples(
  issues: readonly Issue[],
  catalog: CatalogInput,
  limit: number = DEFAULT_EXAMPLE_LIMIT,
): Issue[] {
  // Build a single id → product lookup so we don't re-scan the catalog
  // per issue. Catalogs cap at ~1000 products on the public scanner;
  // this is O(N) once, then O(1) per id lookup.
  const productsById = new Map<string, { title: string; handle: string }>();
  for (const product of catalog.products) {
    productsById.set(product.id, {
      title: product.title,
      handle: product.handle,
    });
  }

  return issues.map((issue) => {
    const examples: Array<{ title: string; handle: string }> = [];
    for (const id of issue.affectedProductIds) {
      const hit = productsById.get(id);
      if (hit) examples.push(hit);
    }
    examples.sort((a, b) => {
      const cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      if (cmp !== 0) return cmp;
      return a.handle.localeCompare(b.handle);
    });
    return {
      ...issue,
      affectedProductExamples: examples.slice(0, limit),
    };
  });
}
