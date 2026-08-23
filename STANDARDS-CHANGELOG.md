# Standards changelog

Every change to a published Flintmere standard, dated. Required by
ADR 0024 §Immutability enforcement: `apps/scanner/src/lib/standards/__tests__/immutability.test.ts`
hashes the source of truth and fails CI on any drift, and the accompanying
pre-commit hook refuses a change under `app/standards/food/v1.0/` that
does not carry an entry here.

Corrections to a **published** standard ship as a new version at a new URL
(v1.0.1), never as in-place edits. Edits during the RC window are amendments
to an unfrozen document and are recorded here as such.

---

## food v1.0 — RC, published 2026-08-23, freezes 2026-09-22

### 2026-08-23 — regulatory citation verification pass (#39)

Every one of the 14 regulatory citations was opened in a real browser and
confirmed to state what the field claims it states. `isPublishable()` now
returns true; before this pass all 14 were unverified and the gate was shut.

Automated fetching could not do this: GS1, ISO, and EUR-Lex return 403 to
non-browser clients, which is precisely why ADR 0024 §Mitigations put the
check behind a human.

**Verified as recorded (10)** — GS1 General Specifications; EU Reg. 1169/2011
(cited three times: Annex II for allergens, Article 18 + Annex VII for
ingredients, Annex X for lifecycle); ISO 3166-1; DEFRA protected food and
drink names register; UCUM; Weights and Measures Act 1985 s.47; Soil
Association organic certification; Red Tractor assurance.

**Corrected (4)** — each original URL either 404'd or resolved to a document
that did not carry the cited content:

| Field | Was | Now | Why |
|---|---|---|---|
| `allergen[]` | `food.gov.uk/safety-hygiene/food-allergy-and-intolerance` | `gov.uk/government/publications/allergen-labelling-for-food-manufacturers/allergen-labelling-for-food-manufacturers` | The old URL is an FSA consumer-advice stub that does not enumerate the Big-14. The new page lists all fourteen and is FSA-attributed. Label updated to match. |
| `lifecycle` | `food.gov.uk/safety-hygiene/best-before-and-use-by-dates` | `gov.uk/understanding-food-labelling/best-before-and-use-by-dates` | Old URL redirected to a broad labelling overview rather than the best-before/use-by document. |
| `dietary_certifications[]` | `vegansociety.com/your-business/vegan-trademark` | `vegansociety.com/vegan-trademark` | 404. Page moved. |
| `dietary_certifications[]` | `coeliac.org.uk/information-and-support/your-business/` | `coeliac.org.uk/food-industry-professionals/crossed-grain-trademark/` | 404. The replacement is the published register of licensed brands (last updated August 2026) — a stronger citation than the marketing page it replaces, and what ADR 0024 §Q7 asks for ("each certifier's published register"). Label updated to match. |

The FSA corrections both trace to the same cause: FSA content has migrated
onto GOV.UK since the URLs were recorded during ADR 0024 review on
2026-05-10, leaving stubs behind at the old paths.

### 2026-08-23 — RC dates set to real publication

`PUBLISHED_AT` moved 2026-07-28 → 2026-08-23 and `FREEZES_AT` 2026-08-27 →
2026-09-22. The original pair was written on the day the schema modules were
built, in anticipation of a publication that did not happen — the work sat
uncommitted for four weeks. The 30-day RC window per ADR 0024 §Q10 runs from
actual publication, not from authorship.

### Note on field count

food v1.0 ships **seven** fields, not the eight in ADR 0024 §Q7.
`production_method` was deferred to v1.0.1 during the 2026-07-28 build: the
DEFRA marketing-terms guidance is split across separate egg, poultry, fish,
and organic pages and the recorded URL 404'd. Publishing a field with no
working regulator citation would contradict the standard's own premise.
