/**
 * Unit tests for the food catalog standard v1.0.
 *
 * Covers all four foundation modules together because they are one
 * artifact: the descriptors are the source of truth and the two
 * serialisers plus the disclaimer are only meaningful relative to them.
 * The load-bearing assertions here are the ones that would let a
 * regulatory error ship silently — the FSA Big-14 wording, the
 * every-field-cites-a-regulator rule, the publication gate, and the
 * verbatim disclaimer.
 */

import { describe, expect, it } from 'vitest';
import { STANDARDS_DISCLAIMER, STANDARDS_DISCLAIMER_SHORT } from './disclaimer';
import {
  ALLERGEN_ENUM,
  CANONICAL_URL,
  DEFERRED_FIELDS,
  FOOD_V1_FIELDS,
  FREEZES_AT,
  PUBLISHED_AT,
  STANDARD_STATUS,
  STANDARD_VERSION,
  allCitations,
  foodV1Schema,
  isPublishable,
  unverifiedCitations,
} from './food-v1-fields';
import { VOCAB_URL, renderFoodV1JsonLd } from './food-v1-jsonld';
import { SCHEMA_DIALECT, renderFoodV1JsonSchema } from './food-v1-jsonschema';

describe('FOOD_V1_FIELDS', () => {
  it('publishes exactly the seven v0.1 fields, in spec order', () => {
    expect(FOOD_V1_FIELDS.map((f) => f.name)).toEqual([
      'gtin',
      'allergen',
      'ingredient',
      'country_of_origin',
      'net_content',
      'lifecycle',
      'dietary_certifications',
    ]);
  });

  it('cites at least one primary regulator for every field', () => {
    for (const field of FOOD_V1_FIELDS) {
      expect(field.sources.length).toBeGreaterThan(0);
      for (const source of field.sources) {
        expect(source.label.length).toBeGreaterThan(0);
        expect(source.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('states what Flintmere adds and how the field encodes into Shopify', () => {
    for (const field of FOOD_V1_FIELDS) {
      expect(field.flintmereAdds.length).toBeGreaterThan(0);
      expect(field.shopifyEncoding.length).toBeGreaterThan(0);
    }
  });

  it('records production_method as deferred with a reason', () => {
    expect(FOOD_V1_FIELDS.map((f) => f.name)).not.toContain('production_method');
    const deferred = DEFERRED_FIELDS.find((f) => f.name === 'production_method');
    expect(deferred).toBeDefined();
    expect(deferred!.reason).toMatch(/404|verified/i);
    expect(deferred!.plannedFor).toBe('v1.0.1');
  });
});

describe('ALLERGEN_ENUM', () => {
  // The FSA Big-14, verbatim. A copy edit here is a regulatory error, not
  // a style change — this test is the guard.
  it('is exactly the FSA Big-14, verbatim', () => {
    expect(ALLERGEN_ENUM).toHaveLength(14);
    expect(ALLERGEN_ENUM).toEqual([
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
    ]);
  });

  it('is the value set the allergen field publishes', () => {
    const allergenField = FOOD_V1_FIELDS.find((f) => f.name === 'allergen');
    expect(allergenField!.enumValues).toEqual(ALLERGEN_ENUM);
  });
});

describe('publication gate', () => {
  // ADR 0024 §Mitigations: #39 Regulatory Affairs verifies every citation
  // in a real browser. GS1 / ISO / EUR-Lex all 403 automated fetches, so
  // no build step can do this. The gate stays shut until a human acts.
  it('counts every citation across every field', () => {
    const total = FOOD_V1_FIELDS.reduce((n, f) => n + f.sources.length, 0);
    expect(allCitations()).toHaveLength(total);
  });

  it('ties publishability to the unverified count', () => {
    expect(isPublishable()).toBe(unverifiedCitations().length === 0);
  });

  it('stays publishable now that every citation is verified', () => {
    // Flipped 2026-08-23 in the same commit as the `verified` flags, with
    // the STANDARDS-CHANGELOG.md entry the guard asks for. All 14 citations
    // were opened in a real browser; 4 URLs were corrected in the process.
    // If this ever goes red again, a citation regressed — fix the URL, do
    // not relax the assertion.
    expect(isPublishable()).toBe(true);
    expect(unverifiedCitations()).toHaveLength(0);
  });
});

describe('version metadata', () => {
  it('ships v1.0 as a release candidate with a freeze date', () => {
    expect(STANDARD_VERSION).toBe('1.0');
    expect(STANDARD_STATUS).toBe('rc');
    expect(PUBLISHED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(FREEZES_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(FREEZES_AT).getTime()).toBeGreaterThan(
      new Date(PUBLISHED_AT).getTime(),
    );
  });

  it('pins the immutable citation URL', () => {
    expect(CANONICAL_URL).toBe('https://standards.flintmere.com/food/v1.0/');
  });
});

describe('foodV1Schema', () => {
  const valid = {
    gtin: '05012345678900',
    allergen: ['milk'],
    ingredient: [{ name: 'Whole milk', allergen_ref: 'milk' }],
    country_of_origin: 'GB',
    net_content: { value: 250, unit: 'g', e_mark: true },
  };

  it('accepts a conforming product record', () => {
    expect(foodV1Schema.safeParse(valid).success).toBe(true);
  });

  it('rejects an allergen outside the Big-14', () => {
    const result = foodV1Schema.safeParse({
      ...valid,
      allergen: ['peanut butter'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-alpha-2 country code', () => {
    expect(
      foodV1Schema.safeParse({ ...valid, country_of_origin: 'GBR' }).success,
    ).toBe(false);
  });

  it('rejects a non-positive net content value', () => {
    expect(
      foodV1Schema.safeParse({
        ...valid,
        net_content: { value: 0, unit: 'g' },
      }).success,
    ).toBe(false);
  });

  it('treats lifecycle and certifications as optional', () => {
    expect(foodV1Schema.safeParse(valid).success).toBe(true);
    expect(
      foodV1Schema.safeParse({
        ...valid,
        lifecycle: { durability_type: 'use_by', shelf_life_sealed_days: 5 },
        dietary_certifications: ['soil-association'],
      }).success,
    ).toBe(true);
  });
});

describe('renderFoodV1JsonLd', () => {
  const doc = renderFoodV1JsonLd();

  it('is a schema.org DefinedTermSet at the canonical URL', () => {
    expect(doc['@type']).toBe('DefinedTermSet');
    expect(doc['@id']).toBe(CANONICAL_URL);
    expect(doc.url).toBe(CANONICAL_URL);
  });

  it('extends schema.org with the Flintmere vocab', () => {
    expect(doc['@context']).toEqual([
      'https://schema.org/',
      { '@vocab': VOCAB_URL },
    ]);
  });

  it('renders one defined term per published field', () => {
    const terms = doc.hasDefinedTerm as { name: string }[];
    expect(terms).toHaveLength(FOOD_V1_FIELDS.length);
    expect(terms.map((t) => t.name)).toEqual(FOOD_V1_FIELDS.map((f) => f.name));
  });

  it('carries every regulator citation through to the payload', () => {
    const terms = doc.hasDefinedTerm as { citation: { url: string }[] }[];
    const rendered = terms.flatMap((t) => t.citation.map((c) => c.url)).sort();
    const source = allCitations()
      .map((c) => c.url)
      .sort();
    expect(rendered).toEqual(source);
  });

  it('marks the RC as Draft and carries the freeze date', () => {
    expect(doc.creativeWorkStatus).toBe('Draft');
    expect(doc.expires).toBe(FREEZES_AT);
    expect(doc.datePublished).toBe(PUBLISHED_AT);
  });

  it('carries the licence and the disclaimer', () => {
    expect(doc.license).toBe('https://creativecommons.org/licenses/by/4.0/');
    expect(doc.disclaimer).toBe(STANDARDS_DISCLAIMER_SHORT);
  });

  it('serialises to JSON without throwing', () => {
    expect(() => JSON.stringify(doc)).not.toThrow();
  });
});

describe('renderFoodV1JsonSchema', () => {
  const schema = renderFoodV1JsonSchema();

  it('declares JSON Schema 2020-12 and a stable $id', () => {
    expect(schema.$schema).toBe(SCHEMA_DIALECT);
    expect(schema.$id).toBe(`${CANONICAL_URL}spec.schema.json`);
  });

  it('renders a property per published field', () => {
    const properties = schema.properties as Record<string, unknown>;
    expect(Object.keys(properties)).toEqual(FOOD_V1_FIELDS.map((f) => f.name));
  });

  it('marks exactly the required fields as required', () => {
    expect(schema.required).toEqual(
      FOOD_V1_FIELDS.filter((f) => f.required).map((f) => f.name),
    );
  });

  it('gives every object-shaped field a real sub-shape', () => {
    const properties = schema.properties as Record<
      string,
      { type?: string; items?: { type?: string; properties?: unknown } }
    >;
    for (const field of FOOD_V1_FIELDS.filter(
      (f) => f.primitive === 'object',
    )) {
      const node = properties[field.name];
      const shape = field.cardinality === 'array' ? node.items : node;
      expect(shape?.type).toBe('object');
      expect(shape?.properties).toBeDefined();
    }
  });

  it('constrains the allergen array to the Big-14', () => {
    const properties = schema.properties as Record<
      string,
      { items?: { enum?: readonly string[] } }
    >;
    expect(properties.allergen.items?.enum).toEqual(ALLERGEN_ENUM);
  });

  it('serialises to JSON without throwing', () => {
    expect(() => JSON.stringify(schema)).not.toThrow();
  });
});

describe('disclaimer', () => {
  // ADR 0024 §Disclaimer. #39 holds a veto on this wording — the exact
  // string is what allows publication without a paid regulatory
  // professional in the QC seat.
  it('matches the ADR 0024 wording verbatim', () => {
    expect(STANDARDS_DISCLAIMER).toBe(
      'This standard is published for citation, education, and Shopify catalog encoding. It is not legal or regulatory advice. Merchants are responsible for compliance with their applicable jurisdictional requirements.',
    );
  });

  it('keeps the load-bearing clauses in the short form', () => {
    expect(STANDARDS_DISCLAIMER_SHORT).toMatch(
      /not legal or regulatory advice/i,
    );
    expect(STANDARDS_DISCLAIMER_SHORT).toMatch(/merchants are responsible/i);
  });
});
