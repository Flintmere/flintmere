import type { CatalogInput, Issue, PillarResult } from '../types.js';

const CHECKS = {
  imageUrlsValid: 25,
  imageAltTextPresent: 25,
  stockStatusConsistent: 25,
  publishedStatusCorrect: 25,
} as const;

export function scoreConsistency(input: CatalogInput): PillarResult {
  const productCount = input.products.length;

  if (productCount === 0) {
    return {
      pillar: 'consistency',
      weight: 15,
      score: 0,
      maxScore: 100,
      locked: false,
      lockedReason: 'empty-catalog',
      issues: [],
    };
  }

  const productsWithImages = input.products.filter((p) => p.images.length > 0);
  const productsWithBadImages = input.products.filter((p) =>
    p.images.some((img) => !isValidImageUrl(img.src)),
  );
  const imageValidRate =
    (productsWithImages.length - productsWithBadImages.length) /
    Math.max(productsWithImages.length, 1);
  const imageValidScore = imageValidRate * CHECKS.imageUrlsValid;

  const productsMissingAlt = productsWithImages.filter((p) =>
    p.images.some((img) => !img.altText || !img.altText.trim()),
  );
  const altRate =
    (productsWithImages.length - productsMissingAlt.length) /
    Math.max(productsWithImages.length, 1);
  const altScore = altRate * CHECKS.imageAltTextPresent;

  const activeWithNoStock = input.products.filter((p) => {
    if (p.status && p.status !== 'active') return false;
    return p.variants.every((v) => {
      const qty = v.inventoryQuantity ?? 0;
      const policy = v.inventoryPolicy ?? 'deny';
      return qty <= 0 && policy === 'deny';
    });
  });
  const stockRate =
    (productCount - activeWithNoStock.length) / productCount;
  const stockScore = stockRate * CHECKS.stockStatusConsistent;

  const draftButPublished = input.products.filter(
    (p) => p.status === 'draft' && p.publishedAt,
  );
  const statusRate =
    (productCount - draftButPublished.length) / productCount;
  const statusScore = statusRate * CHECKS.publishedStatusCorrect;

  const score =
    Math.round(
      (imageValidScore + altScore + stockScore + statusScore) * 100,
    ) / 100;

  const issues: Issue[] = [];

  if (productsMissingAlt.length > 0) {
    issues.push({
      pillar: 'consistency',
      code: 'image-missing-alt',
      severity: 'high',
      title: `Missing image alt text on ${productsMissingAlt.length} products`,
      description:
        'Agents use alt text as a fallback descriptor. Missing alt means lost relevance on visual-first queries.',
      affectedCount: productsMissingAlt.length,
      affectedProductIds: productsMissingAlt.map((p) => p.id),
      revenueImpactScore: 55,
    });
  }

  if (activeWithNoStock.length > 0) {
    issues.push({
      pillar: 'consistency',
      code: 'active-zero-inventory',
      severity: 'medium',
      title: `${activeWithNoStock.length} products active with zero inventory`,
      description:
        'Agents penalise catalogs with stock inconsistencies. Set to draft or enable continuous tracking.',
      affectedCount: activeWithNoStock.length,
      affectedProductIds: activeWithNoStock.map((p) => p.id),
      revenueImpactScore: 40,
    });
  }

  if (productsWithBadImages.length > 0) {
    issues.push({
      pillar: 'consistency',
      code: 'image-invalid-url',
      severity: 'medium',
      title: `Invalid image URLs on ${productsWithBadImages.length} products`,
      description:
        'Image URLs must be absolute and reachable. Broken URLs signal catalog drift to agents.',
      affectedCount: productsWithBadImages.length,
      affectedProductIds: productsWithBadImages.map((p) => p.id),
      revenueImpactScore: 35,
    });
  }

  return {
    pillar: 'consistency',
    weight: 15,
    score,
    maxScore: 100,
    locked: false,
    issues,
  };
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
