/**
 * Customer-data enrichment paths.
 * All calls go through the LLM router; none of these functions import provider SDKs.
 * See memory/compliance-risk/data-handling-rules.md §Customer data boundary.
 */

export { generateAltText, AltTextInputSchema } from './alt-text.js';
export type { AltTextInput, AltTextResult } from './alt-text.js';

export { rewriteTitle, TitleRewriteInputSchema } from './title-rewrite.js';
export type { TitleRewriteInput, TitleRewriteResult } from './title-rewrite.js';

export {
  inferAttributes,
  AttributeInferInputSchema,
  VerticalSchema,
  VERTICAL_TEMPLATES,
} from './attribute-infer.js';
export type {
  AttributeInferInput,
  AttributeInferResult,
  InferredAttribute,
  Vertical,
} from './attribute-infer.js';
