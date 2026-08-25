/**
 * Flintmere food catalog standard — v1.0 field descriptors.
 *
 * SINGLE SOURCE OF TRUTH. Per ADR 0024 §Q12 (amended 2026-07-28: the
 * descriptor array is the source, not the Zod schema — Zod cannot carry
 * regulator citations, and the citations are the load-bearing half of a
 * publication whose whole claim is "no field is invented"). Three
 * artefacts derive from `FOOD_V1_FIELDS`:
 *
 *   - the Zod schema        → `foodV1Schema` (below)
 *   - the JSON-LD spec      → `food-v1-jsonld.ts`     → /food/v1.0/spec.json
 *   - the JSON Schema       → `food-v1-jsonschema.ts` → /food/v1.0/spec.schema.json
 *
 * Editing a field here changes the page, the JSON-LD, and the JSON Schema
 * together. That is the contract. Do not hand-edit the serialisers.
 *
 * IMMUTABILITY: this file is hashed by `__tests__/immutability.test.ts`
 * against a committed reference. Any change under `/food/v1.0/` requires a
 * paired entry in repo-root `STANDARDS-CHANGELOG.md` (ADR 0024
 * §Immutability enforcement). Corrections ship as v1.0.1, never as
 * in-place edits to a published citation target.
 *
 * v0.1 SCOPE: seven fields. `production_method` is deferred to v1.0.1 —
 * the DEFRA marketing-terms URLs recorded in ADR 0024 returned 404 in the
 * canon-audit pass and no verified primary source exists yet. Publishing a
 * field without a working regulator citation would contradict the
 * standard's own premise. Operator decision, 2026-07-28.
 */

import { z } from 'zod';

export const STANDARD_VERSION = '1.0' as const;
export const STANDARD_VERTICAL = 'food' as const;

/**
 * Release status. Per ADR 0024 §Q10 the first publication ships as a
 * release candidate for 30 days so corrections land as v1.0.1 rather than
 * as in-place edits to an immutable URL. Flip to 'stable' on the freeze
 * date with a STANDARDS-CHANGELOG.md entry.
 */
export const STANDARD_STATUS = 'rc' as const;
export const PUBLISHED_AT = '2026-08-23' as const;
export const FREEZES_AT = '2026-09-22' as const;

export const CANONICAL_URL =
  'https://standards.flintmere.com/food/v1.0/' as const;

/**
 * The FSA Big-14, verbatim. Order and wording match the Food Standards
 * Agency list exactly — this array is the canonical source and the ADR
 * table mirrors it, not the other way round. Changing a value here is a
 * breaking schema change (v2.0), not a patch.
 */
export const ALLERGEN_ENUM = [
  'celery',
  'cereals containing gluten',
  'crustaceans',
  'eggs',
  'fish',
  'lupin',
  'milk',
  'molluscs',
  'mustard',
  'peanuts',
  'sesame',
  'soybeans',
  'sulphur dioxide and sulphites',
  'tree nuts',
] as const;

export type Allergen = (typeof ALLERGEN_ENUM)[number];

/**
 * A citation to a primary regulator or standards body.
 *
 * `verified` is an operator gate, not a formality. ADR 0024 §Mitigations
 * puts every regulatory citation behind a #39 Regulatory Affairs check in
 * a real browser — GS1, ISO, and EUR-Lex all return 403 to automated
 * fetching, so no build step can confirm these. `isPublishable()` below
 * refuses to publish while any citation is unverified.
 */
export interface RegulatorCitation {
  /** Human-readable name of the standard or regulation. */
  readonly label: string;
  /** Primary-source URL. Must resolve in a browser before publication. */
  readonly url: string;
  /** Flipped to true only after a human opens the URL and confirms it
   *  states what this field claims it states. */
  readonly verified: boolean;
}

export type FieldCardinality = 'single' | 'array';
export type FieldPrimitive = 'string' | 'number' | 'boolean' | 'object';

export interface FieldDescriptor {
  /** Field identifier as it appears in the spec and in Shopify metafields. */
  readonly name: string;
  readonly cardinality: FieldCardinality;
  readonly primitive: FieldPrimitive;
  /** One sentence: what this field carries. */
  readonly summary: string;
  /** Primary regulator sources. At least one, all must verify to publish. */
  readonly sources: readonly RegulatorCitation[];
  /** What Flintmere adds beyond the source standard. */
  readonly flintmereAdds: string;
  /** How the field encodes into a Shopify catalog. */
  readonly shopifyEncoding: string;
  /** Fixed value set, where the field is enumerated. */
  readonly enumValues?: readonly string[];
  /** Whether a conforming product record must carry this field. */
  readonly required: boolean;
}

export const FOOD_V1_FIELDS: readonly FieldDescriptor[] = [
  {
    name: 'gtin',
    cardinality: 'single',
    primitive: 'string',
    summary: 'The GS1 Global Trade Item Number identifying the sellable unit.',
    sources: [
      {
        label: 'GS1 General Specifications',
        url: 'https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications',
        verified: true,
      },
    ],
    flintmereAdds:
      'Shopify metafield encoding rule (my_fields.gtin plus barcode on the variant) and an explicit exclusion for variable-measure prefixes, which are not stable product identifiers.',
    shopifyEncoding:
      'variant.barcode, mirrored to the my_fields.gtin metafield on the product.',
    required: true,
  },
  {
    name: 'allergen',
    cardinality: 'array',
    primitive: 'string',
    summary:
      'Declared allergens present in the product, drawn from the FSA Big-14.',
    sources: [
      {
        label: 'FSA allergen labelling guidance for food manufacturers (Big-14)',
        url: 'https://www.gov.uk/government/publications/allergen-labelling-for-food-manufacturers/allergen-labelling-for-food-manufacturers',
        verified: true,
      },
      {
        label: 'EU Regulation 1169/2011, Annex II',
        url: 'https://eur-lex.europa.eu/eli/reg/2011/1169/oj',
        verified: true,
      },
    ],
    flintmereAdds:
      'A source_phrase provenance field carrying the verbatim label text an allergen was read from, so every declaration is auditable back to the pack.',
    shopifyEncoding:
      'my_fields.allergens as a list.single_line_text_field, one entry per allergen.',
    enumValues: ALLERGEN_ENUM,
    required: true,
  },
  {
    name: 'ingredient',
    cardinality: 'array',
    primitive: 'object',
    summary:
      'The ingredient list in descending order of weight at the time of manufacture.',
    sources: [
      {
        label: 'EU Regulation 1169/2011, Article 18 and Annex VII',
        url: 'https://eur-lex.europa.eu/eli/reg/2011/1169/oj',
        verified: true,
      },
    ],
    flintmereAdds:
      'A bidirectional allergen_ref linking each ingredient entry to its allergen declaration, so the two lists cannot drift apart.',
    shopifyEncoding:
      'my_fields.ingredients as a list.single_line_text_field in declared order.',
    required: true,
  },
  {
    name: 'country_of_origin',
    cardinality: 'single',
    primitive: 'string',
    summary:
      'Country of origin or place of provenance for the food, as an ISO 3166-1 alpha-2 code.',
    sources: [
      {
        label: 'ISO 3166-1 country codes',
        url: 'https://www.iso.org/iso-3166-country-codes.html',
        verified: true,
      },
      {
        label: 'DEFRA protected food and drink names register',
        url: 'https://www.gov.uk/protected-food-drink-names',
        verified: true,
      },
    ],
    flintmereAdds:
      'primary_ingredient_origin, for the case where the primary ingredient comes from a different country than the food itself (FIC Article 26.3); and quid_pairs, capturing Quantitative Ingredient Declarations where an ingredient is named or pictured on the label (FIC Article 22 and Annex VIII).',
    shopifyEncoding:
      'my_fields.country_of_origin as a single_line_text_field holding the alpha-2 code.',
    required: true,
  },
  {
    name: 'net_content',
    cardinality: 'single',
    primitive: 'object',
    summary: 'The net quantity of the food, as a value and a unit.',
    sources: [
      {
        label: 'UCUM — Unified Code for Units of Measure',
        url: 'https://ucum.org/',
        verified: true,
      },
      {
        label: 'Weights and Measures Act 1985, section 47',
        url: 'https://www.legislation.gov.uk/ukpga/1985/72/section/47',
        verified: true,
      },
    ],
    flintmereAdds:
      'UCUM unit enforcement, where most catalog specs leave net content as free text; plus an e_mark flag for packs carrying the average-quantity estimated sign.',
    shopifyEncoding:
      'my_fields.net_content_value (number_decimal) and my_fields.net_content_unit (single_line_text_field, UCUM code).',
    required: true,
  },
  {
    name: 'lifecycle',
    cardinality: 'single',
    primitive: 'object',
    summary: 'Durability dates and storage conditions for the product.',
    sources: [
      {
        label: 'EU Regulation 1169/2011, Annex X',
        url: 'https://eur-lex.europa.eu/eli/reg/2011/1169/oj',
        verified: true,
      },
      {
        label: 'FSA best before and use-by date guidance',
        url: 'https://www.gov.uk/understanding-food-labelling/best-before-and-use-by-dates',
        verified: true,
      },
    ],
    flintmereAdds:
      'best_before and use_by held as separate fields rather than one conflated date, plus opened and sealed shelf-life in days — the distinction is a safety boundary, not a formatting preference.',
    shopifyEncoding:
      'my_fields.shelf_life_sealed_days and my_fields.shelf_life_opened_days (number_integer); date type carried in my_fields.durability_type.',
    required: false,
  },
  {
    name: 'dietary_certifications',
    cardinality: 'array',
    primitive: 'string',
    summary:
      'Third-party dietary or provenance certifications held by the product.',
    sources: [
      {
        label: 'The Vegan Society trademark register',
        url: 'https://www.vegansociety.com/vegan-trademark',
        verified: true,
      },
      {
        label: 'Soil Association organic certification',
        url: 'https://www.soilassociation.org/certification/',
        verified: true,
      },
      {
        label: 'Coeliac UK Crossed Grain Trademark register',
        url: 'https://www.coeliac.org.uk/food-industry-professionals/crossed-grain-trademark/',
        verified: true,
      },
      {
        label: 'Red Tractor assurance',
        url: 'https://redtractor.org.uk/',
        verified: true,
      },
    ],
    flintmereAdds:
      'A pinned scheme enum, where most catalog specs accept free text — free-text certification claims are unverifiable and unqueryable by a shopping channel.',
    shopifyEncoding:
      'my_fields.certifications as a list.single_line_text_field, one pinned scheme identifier per entry.',
    required: false,
  },
] as const;

/**
 * Fields named in ADR 0024 but held back from this publication, with the
 * reason. Rendered on the spec page so readers see the omission and its
 * cause rather than inferring an oversight.
 */
export const DEFERRED_FIELDS: readonly {
  readonly name: string;
  readonly reason: string;
  readonly plannedFor: string;
}[] = [
  {
    name: 'production_method',
    reason:
      'No verified primary-source URL. The DEFRA marketing-terms guidance is split across egg, poultry, fish, and organic pages, and the URL recorded during ADR 0024 review returned 404. Publishing an unciteable field would contradict the premise that every field cites a primary regulator.',
    plannedFor: 'v1.0.1',
  },
] as const;

/** Every citation across every field, flattened. */
export function allCitations(): readonly RegulatorCitation[] {
  return FOOD_V1_FIELDS.flatMap((field) => field.sources);
}

/** Citations still awaiting #39 Regulatory Affairs browser verification. */
export function unverifiedCitations(): readonly RegulatorCitation[] {
  return allCitations().filter((c) => !c.verified);
}

/**
 * Publication gate. The standard is publishable only when every regulatory
 * citation has been opened and confirmed by a human. Route handlers and the
 * page renderer consult this; the test suite asserts it.
 */
export function isPublishable(): boolean {
  return unverifiedCitations().length === 0;
}

/** Zod schema derived from the descriptors. One of three derived artefacts. */
export const foodV1Schema = z.object({
  gtin: z.string().min(8).max(14),
  allergen: z.array(z.enum(ALLERGEN_ENUM)),
  ingredient: z.array(
    z.object({
      name: z.string().min(1),
      allergen_ref: z.enum(ALLERGEN_ENUM).optional(),
    }),
  ),
  country_of_origin: z.string().length(2),
  net_content: z.object({
    value: z.number().positive(),
    unit: z.string().min(1),
    e_mark: z.boolean().optional(),
  }),
  lifecycle: z
    .object({
      durability_type: z.enum(['best_before', 'use_by']),
      shelf_life_sealed_days: z.number().int().positive().optional(),
      shelf_life_opened_days: z.number().int().positive().optional(),
    })
    .optional(),
  dietary_certifications: z.array(z.string()).optional(),
});

export type FoodV1Product = z.infer<typeof foodV1Schema>;
