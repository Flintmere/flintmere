# ADR 0027 — Flintmere's stance on Shopify Catalog / UCP: complementary food-regulatory input-quality layer

- **Status:** Accepted (ratified by operator 2026-06-28)
- **Date:** 2026-06-28
- **Number note:** This branch (`chore/cookies-clause-merge`) is **behind `main`**, whose `decisions/` already contains 0025 (`analytics-posthog-cookieless`) and 0026 (`marketing-automation-pipeline`) — neither file is present on this branch yet. The next free number is therefore **0027**. An earlier reconcile pass read this branch's stale `decisions/` folder (which stops at 0024) and wrongly proposed 0025; corrected here against `origin/main`. Branch-staleness flagged separately to operator.
- **Layers on:** ADR 0015 (food-first vertical), ADR 0023 (GMC OAuth ground-truth — the same "be the best, not a guessing, scanner" discipline applies to Catalog/UCP positioning), ADR 0024 (public food data standard — the citation-grade artefact Catalog has no equivalent of), `projects/flintmere/strategy/2026-04-26-final-report.md` (moat = workflow, not taxonomy), SPEC §11 (the competitor table this ADR re-ranks).
- **Independent of:** ADR 0016/0020/0022 (pricing magnitudes unchanged).
- **Source:** Shopify Spring '26 edition (17 Jun 2026 — date pending `claim-review`) — UCP + Catalog expansion. Competitor + canon reconciliation pass, 2026-06-28.
- **Affects:** `projects/flintmere/BUSINESS.md` §Competitors + §Positioning, `projects/flintmere/SPEC.md` §11 + glossary (UCP entry already present), `STATUS.md`, `CLAUDE.md` product snapshot, `memory/marketing/seo.md`. Customer-facing surfaces inherit the Complementary line per the 2026-05-09 canon-protection binding.

## Context

The Shopify Spring '26 edition shipped two platform moves that intersect Flintmere's value directly (all external facts below are gated behind `claim-review` before any public surface):

1. **Shopify Catalog** now "automatically standardizes and enriches product data" for AI agents — image search, product lookup (up to 50 products by ID/URL), richer agentic product data, global catalog. Shopify's own stat claims AI searches via Catalog convert at 2x scraped data.
2. **UCP (Universal Commerce Protocol)** — an open agent-commerce protocol co-built with Google, backed by Amazon/Meta/Microsoft/Stripe/Etsy/Target, covering discovery → cart → checkout via a public MCP endpoint with registered agent profiles. Metafields became more central (checkout-function inputs, analytics dimensions, up to 50 pinned, streamlined GraphQL).

Two readings are both partly true. **Threat:** Shopify is moving into the "make your catalog legible to agents" space — the generic half of our pitch — and bundling it free, auto-enrolled. **Opportunity:** the edition has no food/grocery-specific intelligence. Catalog standardises the FORMAT of data a merchant already holds; it does not create missing data, fix a wrong GTIN, extract an allergen from a back-of-pack photo, or map to a food regulatory taxonomy (allergens, nutrition, EU 1169/2011, FSA). UCP standardises the rails and assumes the data feeding them is already correct.

The existing BUSINESS.md / SPEC §11 framing pre-dates the edition: Shopify Catalog is one line of five ("free, auto-enrolled; basic, not a diagnostic"). That ranking is now wrong. Catalog is no longer "basic," and it is the single largest force shaping where our value commoditises. This ADR fixes the canon and records the stance so every downstream customer-facing surface inherits it consistently.

## Decision

**Adopt the Complementary stance: Flintmere is the food-regulatory input-quality layer that FEEDS Shopify Catalog and UCP. We ride the protocol; we do not fight it.**

1. **Re-rank the competitor canon.** Shopify Catalog (native) is promoted to the *apex commoditisation risk* in BUSINESS.md §Competitors and SPEC §11 — ordered by strategic threat, not alphabetically. UCP is added as *ecosystem context, not a competitor*. (Internal register: "apex commoditisation risk" / "commoditises" stay in canon docs and must not leak verbatim onto public surfaces.)
2. **Hold the complementary boundary line.** Canonical: *"Shopify Catalog standardises the data you have; Flintmere supplies what you're missing — food-compliant, GTIN-correct, checkout-eligible — before the agent ever sees it."* Any Flintmere claim that reduces to "we standardise your catalog data" is now Shopify's claim, free, and is retired.
3. **Make the pillar alignment literal — corrected against `methodology-data.ts` (source of truth):**
   - **Identifiers** = the GTIN gate Catalog cannot fill (Catalog standardises the GTIN field; it does not detect or replace a wrong GTIN).
   - **Attributes** = the allergen / nutrition / provenance / certification fields Catalog has no concept of (FSA Big-14, EU 1169/2011, PDO/PGI/TSG — the **Attributes** pillar, n02). **These are NOT the Mapping pillar.** Mapping = `google_product_category` only; it has nothing to do with allergens/nutrition. Any copy tying allergen/nutrition to "Mapping" is factually wrong and is prohibited.
   - **Checkout eligibility** = regulatory eligibility to transact (HMRC, UK alcohol licensing, age-restriction, allergen-disclosure compliance) — the precondition the agent commerce layer assumes. This **aligns with** UCP transactability; it is **not identical** to it. The pillar predates UCP and measures a regulatory check, not a protocol capability. Do not write "transactability under UCP is exactly what the pillar measures."
4. **Voice guardrails bind.** Do not borrow Shopify's "2x" as a Flintmere promise (it is Shopify's stat about Catalog, not our measured outcome). No outcome promises ("guaranteed visibility", "you will appear in ChatGPT", "rank #1"). The banned-word list continues to apply. GTIN-correctness claims carry the GS1 non-affiliation disclaimer (SPEC §5.3). Extraction is the install-gated app capability and must never be implied of the free public scan.
5. **Route through the bindings.** Catalog/UCP positioning is customer-facing copy → it fires the 2026-05-09 canon-protection binding (name 3 canon-source-register entries before drafting) and routes through `claim-review` before any public surface ships. Every external factual claim about Spring '26 (date, MCP endpoint, agent-profile registration, 50-product cap, co-builder list, 2x stat) clears `claim-review` first.

## Consequences

### Positive
- The competitor canon matches the post-Spring-'26 landscape; sales and marketing stop describing Catalog as "basic."
- A single, defensible boundary line ("standardises vs supplies") protects against the most likely commoditisation path and is reusable across hero, pricing, methodology, and outreach.
- Riding UCP makes the Checkout-eligibility and Identifiers pillars verifiable rather than positional — strengthens the ground-truth posture from ADR 0023.
- Frames Shopify's platform move as a tailwind (more metafield centrality → more value in writing correct food fields).

### Negative / risk
- The complementary stance is durable only while Catalog has no food-regulatory intelligence. If Shopify ships allergen/nutrition extraction or a food taxonomy, the boundary line erodes — revisit this ADR the moment that signal appears (monitor: Shopify dev changelog + each seasonal edition).
- "We feed Catalog" can read as dependence on a platform that could absorb us; positioning must keep the workflow moat (ingestion + 30-second verification) front and centre, not the format layer.
- Re-ranking risks under-stating the direct competitors (Agent IQ, Alhena); the canon must keep them visible.

### Follow-ups
- Update BUSINESS.md §Competitors + §Positioning; SPEC §11 table; CLAUDE.md product snapshot; `memory/marketing/seo.md`.
- `claim-review` pass on the boundary line and every external fact before any public surface.
- Add a STATUS.md monitor note: revisit this ADR if a Shopify edition ships food-specific catalog intelligence.
- The "Catalog Mirror" diff feature is **out of scope of this ADR** and requires its own ADR after a field-exposure spike and a Legal/DPA ruling (the Catalog Lookup API returns a normalised projection, not GTIN/allergen fields; the endpoint modelled in the spec is already deprecated in favour of MCP tools).