# 0015 — Food-first vertical strategy

- **Status:** Accepted
- **Date:** 2026-04-26
- **Source:** `projects/flintmere/strategy/2026-04-26-final-report.md` §3, ratified per `projects/flintmere/strategy/2026-04-26-final-report-council-review.md`.

## Context

The strategic review identified Flintmere's only durable moat as the vertical regulatory taxonomies in `apps/scanner/src/app/for/{apparel,beauty,food-and-drink}/page.tsx`. Prior posture treated all three verticals at equal depth, producing a homepage that read as a generic seven-pillar scanner rather than a specialist tool. Maintenance investment and content output were spread evenly across three regulatory surfaces despite finite resources.

Of the three verticals, food and drink wins on three dimensions:

- **Liability-to-visibility ratio** — allergen mislabelling is a recall event with FSA involvement and direct retailer liability. Beauty PAO mistakes are paperwork; apparel labelling is lighter still. Food merchants have already been told by their compliance officer that catalog correctness matters.
- **Channel surface** — UK food retailers push to GMC, Amazon Fresh, Ocado, Deliveroo, ChatGPT shopping, Perplexity. Each channel that delists for missing allergen data is a quantifiable revenue stream in the audit letter.
- **Standard authority** — UK FSA Big-14, ISO 3166-1, PDO/PGI, certifications taxonomy are *already* recognised authorities. Flintmere standardises the *encoding* into Shopify metafields rather than inventing a taxonomy.

## Decision

**Food is the spearhead vertical.** Concentration of:

- maintenance investment,
- content output,
- outbound effort,
- standards publication (per ADR 0018),
- pricing structure (per ADR 0016).

Beauty + apparel pages stay live as marketing surfaces — they catch SEO, hedge against food not compounding, and earn organic interest. Page copy is reframed: *"Beauty and apparel standards are in development. Food is our spearhead — see `standards.flintmere.com/food/v1` for the live cadence."* No public standard cadence is committed for them.

## Consequences

- Homepage IA reorder (Phase 2): vertical picker leads, seven pillars demoted to `/methodology`. Food card occupies the primary position.
- Standards publication scoped to food only (ADR 0018).
- Pricing ladder leads with food single-store / food agency / food+beauty bundle (ADR 0016).
- `BUSINESS.md` positioning section rewritten to lead with food merchants (100–5,000 SKUs, £500K–£20M revenue, pushing to GMC + Amazon Fresh + Ocado + Deliveroo + emerging AI shopping channels).
- Beauty + apparel pages: stay live, copy reframed, no cadence commitment.
- Quarterly `/research` data refresh: food-first dataset, beauty + apparel as secondary cells.

## Rollout

- **Phase 1 (this commit):** ADR landed; `BUSINESS.md` Positioning rewrite; `CLAUDE.md` product snapshot edit pointing at food-first.
- **Phase 2:** `grill-requirement` × 3 (homepage IA, pricing axis, standards surface). `design-information-architecture` on the new vertical-led homepage.
- **Phase 3 (Month 1):** homepage code reorder, vertical picker live, beauty/apparel reframe copy.
- **Phase 4 (Month 2):** food standard publication (per ADR 0018) cements the concentration.

## Re-open conditions

- Food fails to gain traction by 6-month gate (ADR 0019, 2026-10-26): re-evaluate which vertical to spearhead. Beauty has the second-strongest liability story; apparel the weakest.
- Beauty or apparel signal materially exceeds food (organic scan volume ≥2× food, or inbound from a non-food vertical for the concierge audit ≥food-volume): reconsider concentration.
- Shopify ships a vertical-aware catalog mapping covering food before Flintmere's first publication: defensive pivot to a deeper layer (regulatory citations + diff log) rather than mapping itself.
