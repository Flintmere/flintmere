# Architecture Decision Records

One file per significant decision. Name them `NNNN-slug.md` (4-digit zero-padded).

## Index

| ADR | Title | Status | Summary |
|---|---|---|---|
| [0001](0001-single-repo-monorepo.md) | Single-repo monorepo (`apps/` + `packages/`) | Accepted | Two apps, two shared packages, pnpm workspace |
| [0002](0002-coolify-on-do.md) | Coolify on DigitalOcean | Accepted | Existing droplet + Traefik; UK/EU data residency |
| [0003](0003-canon-neutral-bold-bracket.md) | Canon — neutral-bold hybrid + legibility bracket | Accepted | Apple-bold structure + Geist + `[ word ]` signature |
| [0004](0004-prisma-over-drizzle.md) | Prisma over Drizzle | Accepted | Migrations tooling + team familiarity won |
| [0005](0005-llm-provider-strategy.md) | LLM provider strategy | Accepted | Gemini 2.5 Flash primary + GPT-4o-mini fallback; DeepSeek + Qwen rejected by Legal Council |
| [0006](0006-hardcase-llm-lock-gemini-pro.md) | Hard-case LLM locked to Gemini 2.5 Pro | Accepted | Benchmark deferred to month 3 / 50 concierge audits |
| [0007](0007-canon-amber-signature.md) | Amber signature + asymmetric wordmark | Accepted | Glowing Amber `#F8BF24` as sole accent; sulphur retired |
| [0008](0008-merchant-store-identity.md) | Merchant / store identity model | Accepted | Shop-as-PK Phase 1; additive agency overlay deferred to Phase 2 |
| [0009](0009-billing-api-shape.md) | Billing API shape | Accepted | Shopify Billing for Growth/Scale; Stripe Payment Element for Agency/Enterprise; flat-rate, no usage metering |
| [0010](0010-fallback-pivot-openai-platform.md) | Fallback pivot to OpenAI Platform | Accepted | Privacy-by-minimization (`store: false`, project-scoped key, PII sanitizer, no vision); EU residency upgrade deferred to enterprise procurement |
| [0011](0011-eu-default-vertex-rationale.md) | EU-default Vertex pinning rationale | Accepted | EU stays the default; multi-region routing deferred to a later ADR triggered by US-merchant friction or enterprise residency demand |
| 0012 | (reserved — fallback EU residency upgrade) | Reserved | Triggered when enterprise procurement requires EU-pinned fallback or volume exceeds 5% |
| [0013](0013-analytics-plausible-self-host.md) | Analytics: Plausible (Cloud, EU) | Accepted | Cookieless, EU residency, no consent banner; ADR amendment 1 pivoted self-host → Cloud after droplet resource check |
| 0014 | (reserved — tiered-infrastructure strategy) | Reserved | Codifies Tier 1 (paying-customer projects on dedicated droplet) / Tier 2 (shared) / Tier 3 (PaaS free tiers) per 2026-04-25 council session |
| [0015](0015-food-first-vertical-strategy.md) | Food-first vertical strategy | Accepted | Food spearhead per liability + channel-surface + standard-authority math; beauty + apparel pages stay live, no public cadence |
| [0016](0016-pricing-axis-vertical-distribution.md) | Pricing axis: vertical × distribution mode | Accepted | Two orthogonal axes; council launch ladder leads with food single-store £99; existing customers grandfathered; WTP study Month 1–2 calibrates |
| [0017](0017-plus-tier-private-beta-gate.md) | Plus tier private-beta gate + price-on-enquiry | Accepted | Public £1,500+ floor withdrawn; anchor "from £1,200/mo on enquiry"; re-list when embedded app's first installable food-vertical build ships |
| [0018](0018-standards-subdomain-and-cadence.md) | `standards.flintmere.com` + half-yearly food cadence + AI-assisted diff log | Accepted | Q3c at ~£200/yr (recalibrated from infeasible £20–25k/yr contractor); #39 Regulatory Affairs review; upgrade to Q3d on first volunteer reviewer landing |
| [0019](0019-strategic-gate-window-six-month.md) | Strategic gate: 6-month window, 2026-10-26 | Accepted | Latest-by date; earlier qualifying citation passes early; mid-window check 2026-07-26 |
| [0020](0020-per-channel-pricing-axis.md) | Per-channel pricing axis — outbound channel surface area | Accepted | Layers on ADR 0016 (does not supersede). Three orthogonal axes: vertical × distribution mode × channel multiplier. Six launch channels (GMC, TikTok Shop, Amazon, Perplexity Shopping, Ocado, Deliveroo). Option B (spec-coverage) for launch; Option A (feed-running) deferred to Phase 3. Magnitudes WTP-pending — every pound figure is a hypothesis until the May–June 2026 WTP study closes. |
| [0021](0021-canon-relaxation.md) | Canon relaxation — visual variation expands within neutral-bold | Accepted | Layers on ADR 0003 + 0007 (does not retract). Eight axes: sage decorative accent, paper-1 shadow, paper-warmth + amber-radial gradients, per-section bracket budget, line-art second imagery mode, display-700 weight at ≥80px, ink-slab promoted, motion vocabulary expanded. Noor's accessibility conditions binding. |

## Template

```
# NNNN — <Decision title>

- **Status:** Proposed / Accepted / Superseded by NNNN
- **Date:** YYYY-MM-DD
- **Context:**
  What problem are we solving. What constraints are in play.
- **Decision:**
  What we chose.
- **Consequences:**
  What changes as a result. What trade-offs we're accepting.
- **Rollout:**
  Phased? Immediate? What needs to happen to land this.
```

Write ADRs for anything you'd want to explain to a future collaborator in three months. "Why did we pick X?" answers live here, not in commit messages.

## When to write one

- A decision with multi-month consequences (stack, framework, pricing model, legal posture).
- A decision that reverses or supersedes a prior ADR — supersede explicitly in both.
- A choice between two reasonable options where the rationale isn't obvious from the code.

## When to supersede

When a later decision makes an earlier one wrong, mark the earlier ADR's **Status:** `Superseded by NNNN` and add a new ADR explaining the change. Do not edit superseded ADRs beyond the status line — they are the historical record.
