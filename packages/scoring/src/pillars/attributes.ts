import type {
  AdminContextInput,
  AdminMetafield,
  CatalogInput,
  Issue,
  PillarResult,
} from '../types.js';

// Sub-check weights — sum to 100 inside this pillar's internal scale.
// The pillar carries 20% of the composite (PILLAR_WEIGHTS.attributes).
const CHECKS = {
  metafieldPresence: 50,
  metafieldDepth: 30,
  standardTaxonomyUse: 20,
} as const;

// Identifier metafields are graded by the `identifiers` pillar — exclude
// them here so we're measuring *additional* structured-attribute signal,
// not double-counting brand/MPN coverage.
const IDENTIFIER_KEYS = new Set(['brand', 'mpn', 'manufacturer_part_number']);

// Namespaces an AI agent or GMC ingestion treats as "standard structured
// data" rather than free-form merchant scribble. The Shopify standard
// product taxonomy lives under `shopify.*`. Food-vertical canonical
// namespaces follow the conventional patterns used across the apps the
// concierge audits run against.
const STANDARD_NAMESPACES = new Set([
  'shopify',
  'food',
  'nutrition',
  'allergens',
  'dietary',
  'google',
  'mm-google-shopping',
]);

// Depth bands — distinct (namespace,key) pairs per product mapped to a
// 0–100 sub-score (then scaled by CHECKS.metafieldDepth). Six is the
// floor at which a product carries enough structured signal for a
// generalist agent to reason over (size, colour, material, weight,
// dimensions, pack-quantity is a typical apparel set; allergens,
// nutrition, ingredients, dietary tags, country-of-origin, storage is
// the food-vertical equivalent).
function depthBandScore(distinctKeys: number): number {
  if (distinctKeys >= 6) return 100;
  if (distinctKeys >= 4) return 75;
  if (distinctKeys >= 2) return 45;
  if (distinctKeys >= 1) return 20;
  return 0;
}

function isAttributeMetafield(m: AdminMetafield): boolean {
  return !IDENTIFIER_KEYS.has(m.key);
}

export function scoreAttributes(
  input: CatalogInput,
  adminContext: AdminContextInput,
): PillarResult {
  const productCount = input.products.length;

  if (productCount === 0) {
    return {
      pillar: 'attributes',
      weight: 20,
      score: 0,
      maxScore: 100,
      locked: false,
      lockedReason: 'empty-catalog',
      issues: [],
    };
  }

  let productsWithAnyAttribute = 0;
  let productsWithStandardNamespace = 0;
  let depthScoreSum = 0;
  const productsMissingAttributes: string[] = [];
  const productsLowDepth: string[] = [];
  const productsNoStandardNamespace: string[] = [];

  for (const product of input.products) {
    const metafields = adminContext.metafieldsByProduct.get(product.id) ?? [];
    const attributeFields = metafields.filter(isAttributeMetafield);

    if (attributeFields.length > 0) {
      productsWithAnyAttribute++;
    } else {
      productsMissingAttributes.push(product.id);
    }

    const distinctKeys = new Set(
      attributeFields.map((m) => `${m.namespace}.${m.key}`),
    ).size;
    if (distinctKeys < 4) {
      productsLowDepth.push(product.id);
    }
    depthScoreSum += depthBandScore(distinctKeys);

    const hasStandard = attributeFields.some((m) =>
      STANDARD_NAMESPACES.has(m.namespace),
    );
    if (hasStandard) {
      productsWithStandardNamespace++;
    } else {
      productsNoStandardNamespace.push(product.id);
    }
  }

  const presenceRate = productsWithAnyAttribute / productCount;
  const presenceScore = presenceRate * CHECKS.metafieldPresence;

  // depthScoreSum is 0–100 per product; average then scale to sub-check weight.
  const avgDepthScore = depthScoreSum / productCount; // 0–100
  const depthScore = (avgDepthScore / 100) * CHECKS.metafieldDepth;

  const standardRate = productsWithStandardNamespace / productCount;
  const standardScore = standardRate * CHECKS.standardTaxonomyUse;

  const score =
    Math.round((presenceScore + depthScore + standardScore) * 100) / 100;

  const issues: Issue[] = [];

  if (presenceRate < 0.7 && productsMissingAttributes.length > 0) {
    issues.push({
      pillar: 'attributes',
      code: 'missing-structured-attributes',
      severity: presenceRate < 0.3 ? 'critical' : 'high',
      title: `Missing structured attributes on ${productsMissingAttributes.length} products`,
      description:
        'Agents read structured metafields (allergens, nutrition, dietary tags, size, colour, material) to answer questions about your products. Products without metafields fall back to title-and-description text — a much weaker signal that loses to competitors who have published structured data.',
      affectedCount: productsMissingAttributes.length,
      affectedProductIds: productsMissingAttributes,
      revenueImpactScore: 90,
    });
  }

  const lowDepthRate = productsLowDepth.length / productCount;
  if (lowDepthRate >= 0.5 && productsLowDepth.length > 0) {
    issues.push({
      pillar: 'attributes',
      code: 'low-attribute-depth',
      severity: 'high',
      title: `Shallow attribute coverage on ${productsLowDepth.length} products`,
      description:
        'These products carry fewer than four distinct metafields. Agents reasoning about fit, ingredients, certifications, or pack details see thin structured data and either skip the product or hallucinate the missing facts.',
      affectedCount: productsLowDepth.length,
      affectedProductIds: productsLowDepth,
      revenueImpactScore: 65,
    });
  }

  if (standardRate < 0.5 && productsNoStandardNamespace.length > 0) {
    issues.push({
      pillar: 'attributes',
      code: 'no-standard-taxonomy',
      severity: 'medium',
      title: `${productsNoStandardNamespace.length} products use no standard metafield namespace`,
      description:
        'Custom namespaces (`merchant.*`, ad-hoc keys) carry the right values but the wrong labels — agents and GMC ingestion expect Shopify standard taxonomy (`shopify.*`) or canonical food/nutrition/allergens/dietary namespaces. Re-key your metafields under the standard namespaces and the same data starts working harder.',
      affectedCount: productsNoStandardNamespace.length,
      affectedProductIds: productsNoStandardNamespace,
      revenueImpactScore: 45,
    });
  }

  return {
    pillar: 'attributes',
    weight: 20,
    score,
    maxScore: 100,
    locked: false,
    issues,
  };
}
