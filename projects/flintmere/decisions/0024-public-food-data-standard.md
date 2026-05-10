# ADR 0024 — Public food data standard at standards.flintmere.com

- **Status**: Proposed (Q1–Q12 confirmed by operator 2026-05-10 16:00; canon-audit findings applied 2026-05-10 16:30; ADR commit pending)
- **Date**: 2026-05-10
- **Supersedes**: holding-page rationale at `apps/scanner/src/app/standards/page.tsx:11–18`; ADR 0018 §Surface architecture for v0.1 only (see §Architecture)
- **Related**: ADR 0015 (food-first vertical), ADR 0018 (standards subdomain + cadence), ADR 0019 (six-month strategic gates), `projects/flintmere/strategy/2026-04-26-final-report.md` (workflow > taxonomy moat reframe)

## Context

The v2 strategic report (`projects/flintmere/strategy/2026-04-26-final-report.md`) ratified that the moat is the workflow — ingestion engine + 30-second merchant confirmation flow — not the taxonomy. The standard's role is therefore as a **citation-grade authority artefact**: hold the URL slot at `standards.flintmere.com/food/v1.0/` before a competitor or research lab claims it, ground every paid audit deliverable in a publicly cite-able spec, and deliver Gate 2 proof (≥1 unprompted external citation by 2026-08-10) per ADR 0019.

Web search 2026-05-10 confirmed the slot is open. Open Food Facts is a public *dataset*, not a citable standard. GS1 governs identifiers but has not published a Shopify-shaped agentic-readiness specification. Schema.org's `Product` type carries no first-class allergen field. No competitor is currently claiming "food catalog standard for AI shopping". The window will not stay open indefinitely.

A populated grill-requirement at `context/requirements/2026-05-10-food-standard-v0.1.md` confirmed by the operator on 2026-05-10 16:00 fixes the v0.1 parameters this ADR records.

## Decision

Publish a public food catalog standard at `standards.flintmere.com/food/v1.0/` on or before **2026-05-24** with the parameters below.

### Identity (Q1)

The standard is **Flintmere-branded** — "the Flintmere food catalog standard" — not vendor-neutral.

### Licensing (Q2)

| Asset | Licence |
|---|---|
| Spec text (`/food/v1.0/page.tsx`, `/food/v1.0/spec/page.tsx`) | CC-BY 4.0 |
| JSON-LD schema (`/food/v1.0/spec.json`) and JSON Schema (`/food/v1.0/spec.schema.json`) | CC0 |
| Scoring rubric, remediation prompts, benchmark dataset | proprietary; retained in `apps/scanner/src/lib/audit-draft/` and `packages/scoring/` |

### Contributions (Q3)

Issues and comments accepted from publication; no PRs merged before v1.1. Stated explicitly in the GitHub repo's `CONTRIBUTING.md`. Resumes contribution-merge cadence at v1.1 (next half-yearly cycle).

### DOI registration (Q4)

Deferred. Re-evaluate after first trade-press citation; until then URL stability via the IA citation contract is sufficient for academic citation.

### Cadence (Q5)

Half-yearly publication. Specific months are **not** bound publicly — preserves credibility against missed dates and removes review-deadline pressure on the unpaid #39 reviewer.

**Internal working assumption** (not surfaced publicly per Q5): April + October per ADR 0018 §Cadence — preserves the planning anchor for #39 review scheduling.

### Diff-log transparency (Q6)

Every regulatory-monitor staging entry surfaces the full audit-trail line on publication: "First flagged by automated regulatory monitor on YYYY-MM-DD; reviewed and published by Flintmere Regulatory Affairs on YYYY-MM-DD."

### v0.1 scope (Q7) — eight fields

Each field cites a primary regulator. No field is invented.

| Field | Source standard | What Flintmere adds |
|---|---|---|
| `gtin` | [GS1 General Specifications](https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications) | Shopify metafield encoding rule (`my_fields.gtin` + `barcode` on variant); variable-measure-prefix exclusion |
| `allergen[]` | [FSA Big-14 allergen list](https://www.food.gov.uk/safety-hygiene/food-allergy-and-intolerance) + [EU Reg. 1169/2011 Annex II](https://eur-lex.europa.eu/eli/reg/2011/1169/oj) | `source_phrase` verbatim provenance field — auditable extraction |
| `ingredient[]` | EU FIC Article 18 + Annex VII | bidirectional `allergen_ref` |
| `country_of_origin` | [ISO 3166-1 alpha-2](https://www.iso.org/iso-3166-country-codes.html) + [DEFRA UK GI register](https://www.gov.uk/protected-food-drink-names) | `primary_ingredient_origin` (FIC Article 26.3 — where primary-ingredient country differs from food's country) + `quid_pairs` (FIC Article 22 + Annex VIII — Quantitative Ingredient Declaration where an ingredient is named/imaged on the label) |
| `net_content` | [UCUM](https://ucum.org/) + UK Weights and Measures Act 1985 §47 | UCUM enforcement (most specs free-text); `e_mark` flag |
| `lifecycle` | EU FIC Annex X + FSA storage guidance | `best_before` and `use_by` separated; opened/sealed shelf-life days |
| `dietary_certifications[]` | each certifier's published register (Vegan Society, HMC, KF, Soil Association, Coeliac UK, Red Tractor, PDO/PGI/TSG) | pinned scheme enum (vs free-text in most specs) |
| `production_method` | DEFRA marketing-terms guidance (egg, poultry, fish, organic) — exact source URLs set per #39 review at v0.1 publish | enumerated with regulatory-source pointer per value |

**`allergen[]` enum** — the 14 values (verbatim from FSA): *celery, cereals containing gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, peanuts, sesame, soybeans, sulphur dioxide and sulphites, tree nuts*. The Zod schema at `apps/scanner/src/lib/standards/food-v1-fields.ts` is the canonical source; this list mirrors it for ADR-reviewer convenience.

**Out of scope for v0.1**: nutrition panel, claims encoding ("low fat", "high fibre"), Schema.org/Recipe alignment, beauty INCI, apparel material. Each is a non-trivial surface that would push past the regulatory-citation discipline ADR 0018 commits to.

**Note on URL verification**: GS1, ISO, and EUR-Lex URLs returned 403 / empty body to automated WebFetch in the canon-audit pass (anti-scraping rather than dead links). #39 Regulatory Affairs verifies each URL in a real browser before v0.1 publication; the §Mitigations claim-review gate exercises this operationally.

### Cross-linking (Q8)

Every audit finding that touches one of the 8 fields links to its standard section anchor. `apps/scanner/src/lib/audit-draft/prompt.ts` adds a `standard_reference_url` field; results UI surfaces it as "What this means in the standard →". Every paid concierge audit (£197+) becomes a structural backlink — the citation-graph compounding mechanism.

### Open Food Facts posture (Q9)

OFF is cited explicitly in v0.1 §Related Work as the public *dataset*; Flintmere is positioned as the *encoding standard for Shopify catalogs*. Complementary, not competitive. Future move: send the OFF maintainers our spec for comment via their GitHub org.

### Release window (Q10)

v0.1 publishes as **RC** (release candidate) for 30 days. Freezes to v1.0 with the diff incorporated on day 31. v1.1 cycle is the formal-review moment.

### URL shape (Q11)

Both `/food/v1/` (rolling alias) and `/food/v1.0/` (immutable citation target) live from publication. Trade-press pitch directs to the immutable URL.

### Spec contracts (Q12)

Two files, both rendered from a single Zod schema in `apps/scanner/src/lib/standards/food-v1-fields.ts` via `zod-to-json-schema`:

- `/food/v1.0/spec.json` — JSON-LD, citation-grade artefact, `Content-Type: application/ld+json`, `@context: "https://schema.org/"` extended with our `@vocab` for AI-shopping-specific fields
- `/food/v1.0/spec.schema.json` — JSON Schema 2020-12, validator-targeted

## Architecture (v0.1 — colocated; supersedes ADR 0018 §Surface architecture for v0.1 only)

ADR 0018 + the binding IA defaulted to standalone `apps/standards/`. **v0.1 stays colocated under `apps/scanner/src/app/standards/`** to land the 2-week landgrab on or before 2026-05-24; standalone migration is deferred to v0.5 (week 6) when diff-log + cron operationalisation justify the separate ops surface. The cadence-decoupling, audience-separation, and #39 review-boundary rationales for standalone (per IA §App-architecture decision) remain valid — they're temporally deferred, not abandoned. ADR 0025 (planned, week 6) will formalise the standalone migration.

The existing host-rewrite at `apps/scanner/src/lib/host-routing.ts` (function `rewritePathForHost`, called from `apps/scanner/src/middleware.ts:135`) routes `standards.flintmere.com` → `/standards`.

```
apps/scanner/src/app/standards/
├── page.tsx                          (existing — repurposed index)
├── food/
│   ├── page.tsx                      (food vertical index)
│   ├── v1/page.tsx                   (rolling alias, self-canonical)
│   ├── v1.0/
│   │   ├── page.tsx
│   │   ├── spec/page.tsx
│   │   ├── spec.json/route.ts
│   │   └── spec.schema.json/route.ts
│   └── diff-log/
│       ├── page.tsx                  (empty at v0.1)
│       └── feed.xml/route.ts         (Atom 1.0)
├── about/page.tsx
├── how-to-cite/page.tsx
└── api/healthz/route.ts
```

```
apps/scanner/src/lib/standards/
├── food-v1-fields.ts                 (8-field Zod schema — single source of truth)
├── food-v1-jsonld.ts                 (renders spec.json)
├── food-v1-jsonschema.ts             (renders spec.schema.json)
├── citation-formats.ts               (APA / Chicago / IEEE / MLA / BibTeX — per IA §Citation-fitness; not derived from the Zod schema)
└── disclaimer.ts
```

### Immutability enforcement

A test at `apps/scanner/src/lib/standards/__tests__/immutability.test.ts` hashes `food-v1-fields.ts` and compares against a committed reference hash; CI fails on drift. A pre-commit hook requires every change under `apps/scanner/src/app/standards/food/v1.0/` to carry a paired entry in repo-root `STANDARDS-CHANGELOG.md`.

### Bidirectional links to existing scanner surfaces

- `apps/scanner/src/app/methodology/page.tsx` — every pillar mention links to its standard section anchor
- `apps/scanner/src/app/audit/page.tsx` — concierge audit deliverable list mentions "aligned with the Flintmere food catalog standard v1.0" once
- `apps/scanner/src/app/audit/success/page.tsx` — post-purchase confirmation copy carries the same alignment line
- `apps/scanner/src/lib/audit-draft/prompt.ts` — audit findings include `standard_reference_url`
- `apps/scanner/src/lib/concierge-deliverable.ts` — paid audit deliverable mentions "aligned with the Flintmere food catalog standard v1.0" once
- `apps/scanner/src/components/scan/Results.tsx` — pillar finding cards carry a "What this means in the standard →" inline link

## Disclaimer (load-bearing, per IA §Disclaimer placement contract)

Every standards page footer carries this exact wording: *"This standard is published for citation, education, and Shopify catalog encoding. It is not legal or regulatory advice. Merchants are responsible for compliance with their applicable jurisdictional requirements."*

The disclaimer is rendered from `apps/scanner/src/lib/standards/disclaimer.ts` as the single source of truth.

(Wording supersedes ADR 0018 §Disclaimer with tighter register; preserves the load-bearing semantics — citation-grade scope + non-legal-advice + merchant-responsibility.)

## Consequences

### Positive

- Holds the citation-graph slot before any competitor or AI lab claims it
- Every paid audit deliverable becomes a structural backlink to the standard
- Provides a defensible, reproducible reference for every regulatory claim made in the audit-engine
- Decouples the standard's publication cadence from the workflow's product cadence
- Open licence + GitHub mirror at `flintmere/food-catalog-standard` (one-way mirror; canonical source = `standards.flintmere.com`) makes the spec discoverable to AI crawlers from publication

### Negative / risk

- Regulatory accuracy is now load-bearing across a public surface; one mistake on FSA Big-14 or EU FIC trashes trust
- Operator + #39 (operator-acting) commits to ~12 days/year for review cadence per ADR 0018
- Half-yearly cadence is a public commitment — credibility marker if missed (mitigated by Q5: months not bound)
- Proprietary/open split is now visible; sophisticated readers will note we don't publish the scoring rubric

### Mitigations

- Each field cites a primary regulator URL; `claim-review` gates every regulatory citation with 404-check + LLM-text-vs-regulator-text match per IA §Anti-deviation hard rule
- v0.1 marked RC for 30 days post-publish; corrections become v1.0.1, not in-place edits
- Immutability hash test + pre-commit hook enforce URL-stability contract
- Disclaimer load-bearing on every page

## Gate 2 proof condition (per ADR 0019)

By **2026-08-10**, ≥1 unprompted external reference to `standards.flintmere.com/food/v1.0/` from any of: trade press (The Grocer, Food Manufacture, FoodNavigator, Speciality Food Magazine, *Vittles*), academic / research output, PIM vendor or agency commentary (BluestonePIM, TraceGains, Plytix, Akeneo), Schema.org community archive thread, regulator commentary, OFF maintainer commentary, or merchant adoption notice.

Tracked in `projects/flintmere/STATUS.md` §Gate-tracking.

If zero unprompted citations by the gate date: call-it-honestly review at v1 build. The standard ships regardless (it remains the audit-deliverable backbone), but the citation-graph hypothesis weakens and the trade-press outreach motion needs a deeper pass.

## Skill sequence (after this ADR ratifies)

Per `context/plans/2026-05-10-outreach-and-standards.md` §5, in order:

1. `canon-audit` (read-only) on this ADR + 8-field schema text — completed 2026-05-10 16:30; findings applied
2. `design-marketing-surface` × 4 — per IA §Surfaces: `/` (subdomain index), `/food/v1.0/`, `/food/diff-log/`, `/about` (`/how-to-cite` templated from these)
3. `design-component` — new `CiteAffordance` primitive
4. `build-feature` — routes + serialisers + Atom feed + immutability test
5. `claim-review` × N — every regulatory citation URL + disclaimer + licence. **#39 Regulatory Affairs hard gate** per ADR 0018 + canon-source-register §A15 — every regulatory citation routes through #39 before publication
6. `writer` — launch blog post on `flintmere.com/blog/`
7. `outreach` — three trade-press emails on Day 14

## Council pre-flight references (per 2026-05-09 binding)

1. `projects/flintmere/decisions/0018-standards-subdomain-and-cadence.md` — cadence, open/proprietary split, disclaimer requirement
2. `https://flintmere.com/methodology` — voice register + pillar-name discipline (Identifiers / Attributes / Titles / Mapping / Consistency / Checkout eligibility / Crawlability)
3. `context/design/ia/2026-04-26-standards-flintmere-com.md` — binding IA: routes, versioning, disclaimer placement, citation-fitness

## Canon-audit resolution log (2026-05-10 16:30)

P0 fixes applied:
- DEFRA `marketing-standards-for-eggs` URL was 404 → replaced with text-only "DEFRA marketing-terms guidance (egg, poultry, fish, organic) — exact source URLs set per #39 review at v0.1 publish"; deep links land in `spec.json` at publication where claim-review's URL gate runs
- Middleware citation `:36` was wrong → corrected to `apps/scanner/src/middleware.ts:135` (call site of `rewritePathForHost`, helper at `apps/scanner/src/lib/host-routing.ts`)
- Architecture supersession of ADR 0018 made explicit + scoped to v0.1 only

P1 fixes applied:
- Status header tightened to record Q1–Q12 confirmation timestamp + canon-audit pass
- `country_of_origin` field — `quid_origin_pairs` (which conflated FIC Article 22 and 26.3) split into `primary_ingredient_origin` (Article 26.3) + `quid_pairs` (Article 22 + Annex VIII)
- `allergen[]` 14-name enum enumerated explicitly for ADR-reviewer convenience (Zod schema remains canonical)
- Internal cadence assumption (April + October) recorded as planning anchor — not surfaced publicly
- Manual URL re-verification flag added — GS1, ISO, EUR-Lex returned 403/empty to automated fetch; #39 verifies in browser pre-publish

P2 fixes applied:
- Q3 wording: "Oct 2026" → "next half-yearly cycle" (preserves Q5 month-binding discipline)
- Bidirectional links list extended to include `apps/scanner/src/app/audit/page.tsx` + `audit/success/page.tsx`
- Citation-formats note added: "per IA §Citation-fitness; not derived from the Zod schema"
- Skill sequence step 2 count corrected to × 4 per IA §Surfaces

P3 fixes applied:
- Schema.org claim softened: "no allergen extension" → "no first-class allergen field"
- *Vittles* italicised for publication-name convention
- GitHub mirror one-way relationship made explicit
- Disclaimer wording reconciled with ADR 0018 (tighter register; preserves load-bearing semantics)

#39 hard gate added to skill sequence step 5 (was implicit per ADR 0018; now explicit).
