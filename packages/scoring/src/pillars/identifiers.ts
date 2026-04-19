import type { CatalogInput, PillarResult } from '../types.js';
import { isValidGtin } from '../utils/gtin.js';

// Sub-check weights (sum to the pillar's 20% weight, in this pillar's internal 100-scale).
const CHECKS = {
  barcodePresence: 45,
  gtinChecksum: 30,
  brandPresence: 10,
  skuPresence: 10,
  skuUnique: 5,
} as const;

export function scoreIdentifiers(input: CatalogInput): PillarResult {
  const productCount = input.products.length;
  const allVariants = input.products.flatMap((p) =>
    p.variants.map((v) => ({ product: p, variant: v })),
  );
  const variantCount = allVariants.length;

  if (variantCount === 0) {
    return emptyResult('empty-catalog');
  }

  // --- Sub-check 1: barcode presence on variants ---
  const variantsWithBarcode = allVariants.filter(
    ({ variant }) => variant.barcode && variant.barcode.trim().length > 0,
  );
  const barcodeCoverage = variantsWithBarcode.length / variantCount;
  const barcodeScore = barcodeCoverage * CHECKS.barcodePresence;

  // --- Sub-check 2: GTIN checksum on present barcodes ---
  const barcodesWithValidChecksum = variantsWithBarcode.filter(({ variant }) =>
    isValidGtin(variant.barcode ?? null),
  );
  const checksumPassRate = variantsWithBarcode.length
    ? barcodesWithValidChecksum.length / variantsWithBarcode.length
    : 0;
  const checksumScore = checksumPassRate * CHECKS.gtinChecksum;

  // --- Sub-check 3: brand metafield or vendor present ---
  const productsWithBrand = input.products.filter(
    (p) =>
      (p.brandMetafield && p.brandMetafield.trim()) ||
      (p.vendor && p.vendor.trim()),
  );
  const brandCoverage = productsWithBrand.length / productCount;
  const brandScore = brandCoverage * CHECKS.brandPresence;

  // --- Sub-check 4: SKU presence on variants ---
  const variantsWithSku = allVariants.filter(
    ({ variant }) => variant.sku && variant.sku.trim().length > 0,
  );
  const skuCoverage = variantsWithSku.length / variantCount;
  const skuScore = skuCoverage * CHECKS.skuPresence;

  // --- Sub-check 5: SKU uniqueness ---
  const skuCounts = new Map<string, number>();
  for (const { variant } of variantsWithSku) {
    if (!variant.sku) continue;
    skuCounts.set(variant.sku, (skuCounts.get(variant.sku) ?? 0) + 1);
  }
  const uniqueSkus = [...skuCounts.values()].filter((c) => c === 1).length;
  const totalSkus = variantsWithSku.length;
  const uniquenessRate = totalSkus ? uniqueSkus / totalSkus : 0;
  const uniquenessScore = uniquenessRate * CHECKS.skuUnique;

  const score = Math.round(
    (barcodeScore + checksumScore + brandScore + skuScore + uniquenessScore) *
      100,
  ) / 100;

  const issues = [];

  const missingBarcodeProducts = input.products.filter((p) =>
    p.variants.some((v) => !v.barcode || !v.barcode.trim()),
  );
  if (missingBarcodeProducts.length > 0) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'missing-gtin',
      severity: 'critical' as const,
      title: `Missing GTINs on ${missingBarcodeProducts.length} products`,
      description:
        'Products without GS1-registered barcodes are excluded from most AI agent matching. See GTIN guidance for your geography.',
      affectedCount: missingBarcodeProducts.length,
      affectedProductIds: missingBarcodeProducts.map((p) => p.id),
      revenueImpactScore: 100,
    });
  }

  const invalidChecksumProducts = input.products.filter((p) =>
    p.variants.some(
      (v) => v.barcode && v.barcode.trim() && !isValidGtin(v.barcode),
    ),
  );
  if (invalidChecksumProducts.length > 0) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'invalid-gtin-checksum',
      severity: 'high' as const,
      title: `Invalid GTIN checksum on ${invalidChecksumProducts.length} products`,
      description:
        'Barcode values are present but fail modulo-10 checksum validation. These may be third-party or resold codes; Amazon and Google Shopping verify against GS1.',
      affectedCount: invalidChecksumProducts.length,
      affectedProductIds: invalidChecksumProducts.map((p) => p.id),
      revenueImpactScore: 80,
    });
  }

  const missingBrandProducts = input.products.filter(
    (p) =>
      !(p.brandMetafield && p.brandMetafield.trim()) &&
      !(p.vendor && p.vendor.trim()),
  );
  if (missingBrandProducts.length > 0) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'missing-brand',
      severity: 'medium' as const,
      title: `Missing brand on ${missingBrandProducts.length} products`,
      description:
        'Populate the brand metafield or vendor field. Agents rely on brand as a structured identifier.',
      affectedCount: missingBrandProducts.length,
      affectedProductIds: missingBrandProducts.map((p) => p.id),
      revenueImpactScore: 50,
    });
  }

  return {
    pillar: 'identifiers',
    weight: 20,
    score,
    maxScore: 100,
    locked: false,
    issues,
  };
}

function emptyResult(reason: string): PillarResult {
  return {
    pillar: 'identifiers',
    weight: 20,
    score: 0,
    maxScore: 100,
    locked: false,
    lockedReason: reason,
    issues: [],
  };
}
