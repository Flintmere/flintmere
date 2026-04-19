import type { CatalogInput, Issue, PillarResult } from '../types.js';
import { detectFluff } from '../utils/fluff.js';
import {
  countWords,
  hasStructuralMarkup,
  hasUseCasePhrase,
  stripHtml,
} from '../utils/text.js';

const TITLE_MAX_CHARS = 150;
const DESCRIPTION_MIN_CHARS = 200;

const CHECKS = {
  titleLength: 20,
  titleFluffFree: 25,
  titleHasBrandType: 15,
  descriptionLength: 20,
  descriptionStructural: 10,
  descriptionUseCase: 10,
} as const;

export function scoreTitles(input: CatalogInput): PillarResult {
  const productCount = input.products.length;

  if (productCount === 0) {
    return {
      pillar: 'titles',
      weight: 15,
      score: 0,
      maxScore: 100,
      locked: false,
      lockedReason: 'empty-catalog',
      issues: [],
    };
  }

  const longTitles = input.products.filter(
    (p) => p.title.length > TITLE_MAX_CHARS,
  );
  const titleLengthRate =
    (productCount - longTitles.length) / productCount;
  const titleLengthScore = titleLengthRate * CHECKS.titleLength;

  const fluffyTitles = input.products.filter(
    (p) => detectFluff(p.title).length > 0,
  );
  const fluffFreeRate = (productCount - fluffyTitles.length) / productCount;
  const fluffFreeScore = fluffFreeRate * CHECKS.titleFluffFree;

  const titlesWithBrandType = input.products.filter((p) => {
    const title = p.title.toLowerCase();
    const brand = (p.vendor ?? p.brandMetafield ?? '').toLowerCase();
    const type = (p.productType ?? '').toLowerCase();
    const hasBrand = Boolean(brand && title.includes(brand));
    const hasType = Boolean(type && title.includes(type));
    return hasBrand && hasType;
  });
  const brandTypeRate = titlesWithBrandType.length / productCount;
  const brandTypeScore = brandTypeRate * CHECKS.titleHasBrandType;

  const productsWithDescription = input.products.map((p) => ({
    product: p,
    plain: stripHtml(p.bodyHtml ?? ''),
  }));

  const shortDescriptions = productsWithDescription.filter(
    (row) => row.plain.length < DESCRIPTION_MIN_CHARS,
  );
  const descriptionLengthRate =
    (productCount - shortDescriptions.length) / productCount;
  const descriptionLengthScore = descriptionLengthRate * CHECKS.descriptionLength;

  const descriptionsWithStructure = productsWithDescription.filter((row) =>
    hasStructuralMarkup(row.product.bodyHtml ?? null),
  );
  const structureRate = descriptionsWithStructure.length / productCount;
  const structureScore = structureRate * CHECKS.descriptionStructural;

  const descriptionsWithUseCase = productsWithDescription.filter((row) =>
    hasUseCasePhrase(row.plain),
  );
  const useCaseRate = descriptionsWithUseCase.length / productCount;
  const useCaseScore = useCaseRate * CHECKS.descriptionUseCase;

  const score =
    Math.round(
      (titleLengthScore +
        fluffFreeScore +
        brandTypeScore +
        descriptionLengthScore +
        structureScore +
        useCaseScore) *
        100,
    ) / 100;

  const issues: Issue[] = [];

  if (longTitles.length > 0) {
    issues.push({
      pillar: 'titles',
      code: 'title-over-limit',
      severity: 'high',
      title: `${longTitles.length} titles exceed 150 characters`,
      description:
        'Agents struggle to parse long titles. Trim to the key brand + product type + differentiator.',
      affectedCount: longTitles.length,
      affectedProductIds: longTitles.map((p) => p.id),
      revenueImpactScore: 60,
    });
  }

  if (fluffyTitles.length > 0) {
    issues.push({
      pillar: 'titles',
      code: 'title-marketing-fluff',
      severity: 'high',
      title: `${fluffyTitles.length} titles flagged for marketing fluff`,
      description:
        'Phrases like "BEST EVER!!!" or "LIMITED!" reduce agent parseability. Agents skip products whose titles read as ads.',
      affectedCount: fluffyTitles.length,
      affectedProductIds: fluffyTitles.map((p) => p.id),
      revenueImpactScore: 70,
    });
  }

  if (shortDescriptions.length > 0) {
    issues.push({
      pillar: 'titles',
      code: 'description-too-short',
      severity: 'medium',
      title: `${shortDescriptions.length} descriptions under 200 characters`,
      description:
        'Short descriptions lack the structured detail agents need to answer product questions.',
      affectedCount: shortDescriptions.length,
      affectedProductIds: shortDescriptions.map((row) => row.product.id),
      revenueImpactScore: 50,
    });
  }

  return {
    pillar: 'titles',
    weight: 15,
    score,
    maxScore: 100,
    locked: false,
    issues,
  };
}

export function titleWordCount(title: string): number {
  return countWords(title);
}
