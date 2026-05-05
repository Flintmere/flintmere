export { scoreCatalog } from './score.js';
export { scoreIdentifiers } from './pillars/identifiers.js';
export { scoreTitles, titleWordCount } from './pillars/titles.js';
export { scoreConsistency } from './pillars/consistency.js';
export { scoreCrawlability } from './pillars/crawlability.js';
export { scoreAttributes } from './pillars/attributes.js';
export { scoreMapping } from './pillars/mapping.js';
export { scoreCheckout } from './pillars/checkout.js';
export { estimateSuppression } from './pillars/suppression-estimate.js';
export { estimateAov } from './pillars/aov-estimate.js';
export { summarizeCatalog } from './catalog-summary.js';
export { enrichIssuesWithExamples } from './enrich-issues.js';
export { isValidGtin, gtinLength } from './utils/gtin.js';
export { detectFluff } from './utils/fluff.js';
export {
  stripHtml,
  hasStructuralMarkup,
  hasUseCasePhrase,
  countWords,
} from './utils/text.js';
export {
  CatalogInputSchema,
  ProductInputSchema,
  VariantInputSchema,
  ProductImageSchema,
  PILLAR_WEIGHTS,
} from './types.js';
export type {
  CatalogInput,
  ProductInput,
  VariantInput,
  CompositeScore,
  CrawlabilityInput,
  PillarResult,
  PillarId,
  Issue,
  Severity,
  ScoreOptions,
  AdminContextInput,
  AdminMetafield,
  AdminCheckoutContext,
  SuppressionEstimate,
  AovEstimate,
  RevenueEstimate,
  CatalogSummary,
} from './types.js';
