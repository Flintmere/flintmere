/**
 * JSON-LD renderer for the food catalog standard v1.0.
 *
 * Derived artefact — never hand-edit. The source of truth is
 * `food-v1-fields.ts`; this module only reshapes it. Served at
 * `/food/v1.0/spec.json` with `Content-Type: application/ld+json`.
 *
 * This is the citation-grade machine-readable artefact per ADR 0024 §Q12.
 * The URL is immutable once published: AI crawlers, RDF tooling, and
 * academic citations resolve here, so the shape is a contract. Additive
 * changes only within v1.x; anything else is v2.0 at a new URL.
 *
 * `@context` is schema.org extended with a Flintmere `@vocab` for the
 * AI-shopping-specific terms schema.org has no vocabulary for (allergen
 * provenance, QUID pairs, UCUM-enforced net content).
 */

import { STANDARDS_DISCLAIMER_SHORT } from './disclaimer';
import {
  CANONICAL_URL,
  FOOD_V1_FIELDS,
  FREEZES_AT,
  PUBLISHED_AT,
  STANDARD_STATUS,
  STANDARD_VERSION,
  type FieldDescriptor,
} from './food-v1-fields';

export const VOCAB_URL = 'https://standards.flintmere.com/food/v1.0/vocab#';

interface JsonLdCitation {
  '@type': 'CreativeWork';
  name: string;
  url: string;
}

interface JsonLdProperty {
  '@type': 'PropertyValueSpecification';
  name: string;
  description: string;
  valueRequired: boolean;
  multipleValues: boolean;
  valueName: string;
  citation: readonly JsonLdCitation[];
  valuePattern?: readonly string[];
}

function renderField(field: FieldDescriptor): JsonLdProperty {
  const property: JsonLdProperty = {
    '@type': 'PropertyValueSpecification',
    name: field.name,
    description: field.summary,
    valueRequired: field.required,
    multipleValues: field.cardinality === 'array',
    valueName: field.primitive,
    citation: field.sources.map((source) => ({
      '@type': 'CreativeWork' as const,
      name: source.label,
      url: source.url,
    })),
  };

  if (field.enumValues) {
    return { ...property, valuePattern: field.enumValues };
  }
  return property;
}

/**
 * The full JSON-LD document. Returned as a plain object so the route
 * handler owns serialisation and caching headers.
 */
export function renderFoodV1JsonLd(): Record<string, unknown> {
  return {
    '@context': ['https://schema.org/', { '@vocab': VOCAB_URL }],
    '@type': 'DefinedTermSet',
    '@id': CANONICAL_URL,
    name: 'Flintmere Food Catalog Standard',
    alternateName: `Flintmere food catalog standard v${STANDARD_VERSION}`,
    version: STANDARD_VERSION,
    creativeWorkStatus: STANDARD_STATUS === 'rc' ? 'Draft' : 'Published',
    datePublished: PUBLISHED_AT,
    ...(STANDARD_STATUS === 'rc' ? { expires: FREEZES_AT } : {}),
    url: CANONICAL_URL,
    inLanguage: 'en-GB',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    publisher: {
      '@type': 'Organization',
      name: 'Flintmere',
      url: 'https://flintmere.com/',
    },
    description:
      'A versioned, citable encoding standard for food product data in Shopify catalogs. Each field maps to a primary regulator or standards body.',
    disclaimer: STANDARDS_DISCLAIMER_SHORT,
    hasDefinedTerm: FOOD_V1_FIELDS.map(renderField),
  };
}
