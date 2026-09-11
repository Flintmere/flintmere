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

/** The two sub-checks that need a barcode to mean anything. */
const BARCODE_CHECKS = CHECKS.barcodePresence + CHECKS.gtinChecksum;

/**
 * How many products a sampled scan must have read a barcode for before those
 * two sub-checks are allowed to speak for the catalog.
 *
 * Ten, because: the public fetcher aims at 50 (`barcodeSampleSize`), so
 * finishing under ten means the pass aborted early — a failed read, not a
 * sample; and at n = 10 a single product moves barcode coverage by at most
 * 10 percentage points (7.5 of the 75 points), against 100 at n = 1. Below
 * the floor the barcode points leave the denominator and `barcodes-not-read`
 * fires, exactly as they do when nothing was read at all.
 *
 * Issues stay scoped to the products we DID read, floor or no floor:
 * "3 of the products we read carry no barcode" is a true statement about
 * three specific products, and `scanScopeLine` states how many were read.
 * What the floor withholds is the grade, not the finding.
 */
export const MIN_SAMPLED_READS = 10;

export function scoreIdentifiers(input: CatalogInput): PillarResult {
  const productCount = input.products.length;
  const allVariants = input.products.flatMap((p) =>
    p.variants.map((v) => ({ product: p, variant: v })),
  );
  const variantCount = allVariants.length;

  if (variantCount === 0) {
    return emptyResult('empty-catalog');
  }

  // The public fetcher reads barcodes for a sample; anything outside it is
  // marked barcodeRead: false. An absent flag means the source carries
  // barcodes natively (Admin API, fixtures), so absent reads as "read".
  // Counting an unchecked product as a product without a barcode is the
  // false claim this scoping exists to prevent.
  const readProducts = input.products.filter((p) => p.barcodeRead !== false);
  const readVariants = allVariants.filter(
    ({ product }) => product.barcodeRead !== false,
  );
  // A sample only speaks for the catalog above a floor. `readVariants.length
  // > 0` alone let ONE product carry barcodePresence + gtinChecksum = 75 of
  // this pillar's 100 points, and that is reachable in production: one
  // success followed by three consecutive non-404 failures trips the
  // fetcher's BARCODE_FAILURE_CEILING (apps/scanner/src/lib/shopify-fetcher.ts)
  // and ends the pass at barcodesRead === 1 — on a catalog of any size.
  //
  // The floor is absolute, and applies ONLY when some product went unread.
  // Reading every product is a census, not a sample: a five-product store
  // read in full is 100% coverage and must keep its barcode grade, which a
  // proportional floor or an unconditional absolute one would take away.
  const sampled = readProducts.length < productCount;
  const barcodesAssessable =
    readVariants.length > 0 &&
    (!sampled || readProducts.length >= MIN_SAMPLED_READS);

  // --- Sub-check 1: barcode presence on variants we actually read ---
  const variantsWithBarcode = readVariants.filter(
    ({ variant }) => variant.barcode && variant.barcode.trim().length > 0,
  );
  const barcodeCoverage = barcodesAssessable
    ? variantsWithBarcode.length / readVariants.length
    : 0;
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

  const assessedScore = barcodesAssessable
    ? barcodeScore + checksumScore + brandScore + skuScore + uniquenessScore
    : brandScore + skuScore + uniquenessScore;
  const score = Math.round(assessedScore * 100) / 100;
  const maxScore = barcodesAssessable ? 100 : 100 - BARCODE_CHECKS;

  const issues = [];

  if (!barcodesAssessable) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'barcodes-not-read',
      severity: 'low' as const,
      title: 'Not enough barcodes were read',
      description:
        'This scan did not read enough of your products’ barcodes to judge your GTIN coverage either way. The brand and SKU checks ran as normal.',
      affectedCount: 0,
      affectedProductIds: [],
      revenueImpactScore: 0,
    });
  }

  const missingBarcodeProducts = readProducts.filter((p) =>
    p.variants.some((v) => !v.barcode || !v.barcode.trim()),
  );
  if (missingBarcodeProducts.length > 0) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'missing-gtin',
      severity: 'high' as const,
      title: `Missing GTINs on ${missingBarcodeProducts.length} products`,
      description:
        'A product with no GTIN can be limited in where Google Merchant Center shows it. It is not disapproved for that alone.',
      affectedCount: missingBarcodeProducts.length,
      affectedProductIds: missingBarcodeProducts.map((p) => p.id),
      revenueImpactScore: 80,
    });
  }

  const invalidChecksumProducts = readProducts.filter((p) =>
    p.variants.some(
      (v) => v.barcode && v.barcode.trim() && !isValidGtin(v.barcode),
    ),
  );
  if (invalidChecksumProducts.length > 0) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'invalid-gtin-checksum',
      severity: 'critical' as const,
      title: `Invalid GTIN checksum on ${invalidChecksumProducts.length} products`,
      description:
        'Google Merchant Center disapproves a listing whose GTIN is invalid. These values are present but fail the modulo-10 check digit.',
      affectedCount: invalidChecksumProducts.length,
      affectedProductIds: invalidChecksumProducts.map((p) => p.id),
      revenueImpactScore: 100,
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
    maxScore,
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
