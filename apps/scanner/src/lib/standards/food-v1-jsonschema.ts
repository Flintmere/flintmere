/**
 * JSON Schema 2020-12 renderer for the food catalog standard v1.0.
 *
 * Derived artefact — never hand-edit. The source of truth is
 * `food-v1-fields.ts`. Served at `/food/v1.0/spec.schema.json`.
 *
 * Distinct from `/food/v1.0/spec.json` (JSON-LD) in audience: the JSON-LD
 * is the citation artefact for crawlers and academic reference; this is
 * the validator target a merchant or integrator points a linter at to
 * check whether a product record conforms. Per ADR 0024 §Q12 both render
 * from the same descriptors, so they cannot disagree.
 *
 * Note this is NOT the same artifact as `lib/audit-draft/json-schema.ts`,
 * which is a hand-written OpenAPI-3-subset schema constrained by what
 * Vertex/Gemini accepts as a `responseSchema`. This one targets public
 * validators and uses the full 2020-12 vocabulary.
 */

import {
  ALLERGEN_ENUM,
  CANONICAL_URL,
  FOOD_V1_FIELDS,
  STANDARD_VERSION,
  type FieldDescriptor,
} from './food-v1-fields';

export const SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';

interface SchemaNode {
  type?: string;
  description?: string;
  items?: SchemaNode;
  enum?: readonly string[];
  properties?: Record<string, SchemaNode>;
  required?: readonly string[];
  minimum?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Object-shaped fields carry sub-structure the flat descriptor cannot
 * express. Held here rather than in the descriptor so the descriptor stays
 * a readable regulatory document; the two are joined by field name and the
 * test suite asserts every 'object' field has an entry.
 */
const OBJECT_SHAPES: Record<string, SchemaNode> = {
  ingredient: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Ingredient as declared on the label.',
      },
      allergen_ref: {
        type: 'string',
        enum: ALLERGEN_ENUM,
        description: 'Links this ingredient to its allergen declaration.',
      },
    },
    required: ['name'],
  },
  net_content: {
    type: 'object',
    properties: {
      value: { type: 'number', minimum: 0, description: 'Net quantity.' },
      unit: { type: 'string', minLength: 1, description: 'UCUM unit code.' },
      e_mark: {
        type: 'boolean',
        description: 'Average-quantity estimated sign.',
      },
    },
    required: ['value', 'unit'],
  },
  lifecycle: {
    type: 'object',
    properties: {
      durability_type: {
        type: 'string',
        enum: ['best_before', 'use_by'],
        description: 'Which durability statement the pack carries.',
      },
      shelf_life_sealed_days: { type: 'integer', minimum: 1 },
      shelf_life_opened_days: { type: 'integer', minimum: 1 },
    },
    required: ['durability_type'],
  },
};

function renderField(field: FieldDescriptor): SchemaNode {
  const leaf: SchemaNode =
    field.primitive === 'object'
      ? (OBJECT_SHAPES[field.name] ?? { type: 'object' })
      : {
          type: field.primitive,
          ...(field.enumValues ? { enum: field.enumValues } : {}),
        };

  if (field.cardinality === 'array') {
    return {
      type: 'array',
      description: field.summary,
      items: leaf,
    };
  }

  return { ...leaf, description: field.summary };
}

/** The full JSON Schema document, as a plain object. */
export function renderFoodV1JsonSchema(): Record<string, unknown> {
  const properties: Record<string, SchemaNode> = {};
  for (const field of FOOD_V1_FIELDS) {
    properties[field.name] = renderField(field);
  }

  return {
    $schema: SCHEMA_DIALECT,
    $id: `${CANONICAL_URL}spec.schema.json`,
    title: `Flintmere Food Catalog Standard v${STANDARD_VERSION}`,
    description:
      'Validator target for food product records encoded to the Flintmere food catalog standard.',
    type: 'object',
    properties,
    required: FOOD_V1_FIELDS.filter((f) => f.required).map((f) => f.name),
    additionalProperties: true,
  };
}
