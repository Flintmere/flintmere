import type {
  AdminContextInput,
  CatalogInput,
  Issue,
  PillarResult,
} from '../types.js';

// Sub-check weights — sum to 100 inside this pillar's internal scale.
// The pillar carries 15% of the composite (PILLAR_WEIGHTS.mapping).
const CHECKS = {
  gmcCoverage: 60,
  gmcDepth: 30,
  gmcLeafSpecificity: 10,
} as const;

// "Food, Beverages & Tobacco > Beverages > Coffee > Coffee Beans" — depth 4.
// Anything ≥3 segments is treated as specific enough for ingestion to
// trust the mapping. Top-level umbrellas like "Food, Beverages &
// Tobacco" alone aren't usable — agents and GMC reject them as too
// broad. The split tolerates ` > ` (canonical) and `>` (informal).
function categoryDepth(fullName: string | null | undefined): number {
  if (!fullName || !fullName.trim()) return 0;
  return fullName
    .split(/\s*>\s*/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function scoreMapping(
  input: CatalogInput,
  adminContext: AdminContextInput,
): PillarResult {
  const productCount = input.products.length;

  if (productCount === 0) {
    return {
      pillar: 'mapping',
      weight: 15,
      score: 0,
      maxScore: 100,
      locked: false,
      lockedReason: 'empty-catalog',
      issues: [],
    };
  }

  let withCategory = 0;
  let withDepthThree = 0;
  let withLeafSpecificity = 0;
  const productsMissingCategory: string[] = [];
  const productsTooShallow: string[] = [];

  for (const product of input.products) {
    const fullName = adminContext.googleProductCategoryByProduct.get(product.id);
    const depth = categoryDepth(fullName);

    if (depth > 0) {
      withCategory++;
    } else {
      productsMissingCategory.push(product.id);
    }

    if (depth >= 3) {
      withDepthThree++;
    } else if (depth > 0) {
      // Has a category but it's too shallow (depth 1 or 2).
      productsTooShallow.push(product.id);
    }

    if (depth >= 2) {
      withLeafSpecificity++;
    }
  }

  const coverageRate = withCategory / productCount;
  const coverageScore = coverageRate * CHECKS.gmcCoverage;

  const depthRate = withDepthThree / productCount;
  const depthScore = depthRate * CHECKS.gmcDepth;

  const leafRate = withLeafSpecificity / productCount;
  const leafScore = leafRate * CHECKS.gmcLeafSpecificity;

  const score =
    Math.round((coverageScore + depthScore + leafScore) * 100) / 100;

  const issues: Issue[] = [];

  if (productsMissingCategory.length > 0) {
    issues.push({
      pillar: 'mapping',
      code: 'missing-gmc-category',
      severity: coverageRate < 0.3 ? 'critical' : 'high',
      title: `${productsMissingCategory.length} products have no Google product category`,
      description:
        'Without a Google product category, products are demoted in Google Shopping free listings, dropped from Google AI Overviews, and skipped by agent shopping surfaces that gate on category. Set the category in Shopify admin → Product → Search engine listing → Category.',
      affectedCount: productsMissingCategory.length,
      affectedProductIds: productsMissingCategory,
      revenueImpactScore: 85,
    });
  }

  if (productsTooShallow.length > 0 && depthRate < 0.7) {
    issues.push({
      pillar: 'mapping',
      code: 'gmc-too-shallow',
      severity: 'medium',
      title: `${productsTooShallow.length} products have a category but it is too generic`,
      description:
        'A category like "Food, Beverages & Tobacco" alone is too broad for agents to reason over. Refine to at least three levels (e.g. "Food, Beverages & Tobacco > Beverages > Coffee") so the product surfaces against narrower intents.',
      affectedCount: productsTooShallow.length,
      affectedProductIds: productsTooShallow,
      revenueImpactScore: 55,
    });
  }

  return {
    pillar: 'mapping',
    weight: 15,
    score,
    maxScore: 100,
    locked: false,
    issues,
  };
}
