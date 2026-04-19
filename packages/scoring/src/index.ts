export { scoreCatalog } from './score.js';
export { scoreIdentifiers } from './pillars/identifiers.js';
export { scoreTitles, titleWordCount } from './pillars/titles.js';
export { scoreConsistency } from './pillars/consistency.js';
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
  PillarResult,
  PillarId,
  Issue,
  Severity,
  ScoreOptions,
} from './types.js';
