import { scoreConsistency } from './pillars/consistency.js';
import { scoreCrawlability } from './pillars/crawlability.js';
import { scoreIdentifiers } from './pillars/identifiers.js';
import { scoreTitles } from './pillars/titles.js';
import {
  PILLAR_WEIGHTS,
  type CatalogInput,
  type CompositeScore,
  type Issue,
  type PillarId,
  type PillarResult,
  type ScoreOptions,
} from './types.js';

export function scoreCatalog(
  input: CatalogInput,
  options: ScoreOptions = {},
): CompositeScore {
  const productCount = input.products.length;
  const variantCount = input.products.reduce(
    (sum, product) => sum + product.variants.length,
    0,
  );

  const locked = new Set<PillarId>(options.locked ?? []);

  const identifiers = applyLock(scoreIdentifiers(input), locked);
  const titles = applyLock(scoreTitles(input), locked);
  const consistency = applyLock(scoreConsistency(input), locked);

  const crawlability = options.crawlability
    ? applyLock(scoreCrawlability(options.crawlability), locked)
    : lockedPillar('crawlability', 'crawlability-not-fetched');

  const attributes = lockedPillar('attributes', 'requires-install');
  const mapping = lockedPillar('mapping', 'requires-install');
  const checkout = lockedPillar('checkout-eligibility', 'requires-install');

  const pillars: PillarResult[] = [
    identifiers,
    attributes,
    titles,
    mapping,
    consistency,
    checkout,
    crawlability,
  ];

  const composite = computeComposite(pillars);
  const gtinlessCeiling = computeGtinlessCeiling(pillars);
  const fullCeiling = computeFullCeiling(pillars);

  const allIssues: Issue[] = pillars.flatMap((p) => p.issues);
  allIssues.sort(
    (a, b) =>
      severityWeight(b.severity) * b.revenueImpactScore -
      severityWeight(a.severity) * a.revenueImpactScore,
  );

  return {
    shopDomain: input.shopDomain,
    scoredAt: input.scoredAt ?? new Date().toISOString(),
    productCount,
    variantCount,
    score: composite,
    gtinlessCeiling,
    fullCeiling,
    grade: gradeFor(composite),
    pillars,
    issues: allIssues,
  };
}

function applyLock(
  result: PillarResult,
  locked: Set<PillarId>,
): PillarResult {
  if (!locked.has(result.pillar)) return result;
  return {
    ...result,
    locked: true,
    lockedReason: result.lockedReason ?? 'locked-by-caller',
    score: 0,
    issues: [],
  };
}

function lockedPillar(pillar: PillarId, reason: string): PillarResult {
  return {
    pillar,
    weight: PILLAR_WEIGHTS[pillar],
    score: 0,
    maxScore: 100,
    locked: true,
    lockedReason: reason,
    issues: [],
  };
}

function computeComposite(pillars: readonly PillarResult[]): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const pillar of pillars) {
    if (pillar.locked) continue;
    totalWeight += pillar.weight;
    weightedSum += (pillar.score / pillar.maxScore) * pillar.weight;
  }
  if (totalWeight === 0) return 0;
  const normalised = (weightedSum / totalWeight) * 100;
  return Math.round(normalised);
}

function computeGtinlessCeiling(pillars: readonly PillarResult[]): number {
  const unlocked = pillars.filter((p) => !p.locked);
  const totalWeight = unlocked.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return 0;
  const identifiersWeight =
    unlocked.find((p) => p.pillar === 'identifiers')?.weight ?? 0;
  const reachableWeight = totalWeight - identifiersWeight * 0.6;
  return Math.round((reachableWeight / totalWeight) * 100);
}

function computeFullCeiling(pillars: readonly PillarResult[]): number {
  return pillars.some((p) => p.locked) ? 100 : 100;
}

function severityWeight(severity: Issue['severity']): number {
  switch (severity) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

function gradeFor(score: number): CompositeScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
