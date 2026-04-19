# 0005 — LLM provider strategy

- **Status:** Accepted
- **Date:** 2026-04-19
- **Supersedes:** Nothing (first ADR on LLM choice)
- **Supersedes memory note:** Previous SPEC.md §6.1 line naming Claude Haiku/Sonnet as default is superseded by this ADR.

## Context

Flintmere makes heavy use of LLMs across three workloads:

1. **Bulk enrichment** (high volume, quality-forgiving): alt-text generation from product images, attribute inference from title+description+image, description extension, fluff detection in titles.
2. **Hard cases** (low volume, quality-sensitive): title rewrites to agent-optimal format, ambiguous category classification, vertical-specific template matching.
3. **Internal tooling** (no merchant data): research report generation, synthetic data for tests, internal drafting.

Cost scales aggressively with merchant growth. At 100 paying merchants the LLM spend is real; at 500+ it becomes a meaningful line item. The provider choice is a leverage point.

### Constraints

- **EU/UK data residency** — Flintmere's target market is UK/EU Shopify merchants (SPEC §3.3). Cross-border transfers outside the EEA trigger GDPR Chapter V and require adequacy decisions or Standard Contractual Clauses. Some jurisdictions are not on the adequacy list.
- **Native vision capability** — alt-text generation is a Tier 1 auto-safe fix (SPEC §5.1). Multi-provider vision pipelines double operational complexity.
- **Enterprise provenance** — Shopify Plus and Agency tier buyers (£399–£499/mo, per SPEC §7.1) will ask where their catalog data is processed. The answer must be sellable.
- **API stability** — bulk enrichment SLAs (SPEC §5.2.2) require predictable throughput.
- **Cost efficiency** — the less we spend per enriched product, the lower the price floor, the wider the addressable market.

### Options surveyed

Evaluated 10 providers against the constraints. Cost estimates per 1,000 products enriched (~1500 input + 500 output tokens per product; vision on 10% of products):

| Provider / Model | Cost / 1K products | Vision | EU residency | Verdict |
|---|---|---|---|---|
| Google Gemini 2.5 Flash (Vertex AI) | ~$1.50–2.50 | Native, strong | Vertex AI `europe-west*` | **Primary bulk — selected** |
| Google Gemini 2.5 Flash-Lite | ~$0.50 | Native | Vertex AI EU | Considered for future cost-down |
| Google Gemini 2.5 Pro (Vertex AI) | ~$8.00 | Native, strongest | Vertex AI EU | **Hard-case candidate (benchmark pending)** |
| Amazon Nova Lite (Bedrock) | ~$0.50 | Native | Bedrock EU | Price-competitive; revisit post-launch when more benchmark data available |
| Amazon Nova Pro (Bedrock) | ~$3.00 | Native, strong | Bedrock EU | Hard-case alternative if AWS-first |
| OpenAI GPT-4o-mini (Azure OpenAI) | ~$1.50 | Native, OK | Azure EU | **Fallback — selected** |
| OpenAI GPT-4.1-mini | ~$2.00 | Native, strong | Azure EU | Alternative fallback |
| Claude Haiku 4.5 (Anthropic / Bedrock) | ~$5.00 | Native, strong | Bedrock EU | Quality peer of Gemini Flash, 3–5× more expensive |
| Claude Sonnet 4.6 (Anthropic / Bedrock) | ~$15.00 | Native, strongest | Bedrock EU | **Hard-case candidate (benchmark pending)** |
| Mistral Small 3 (La Plateforme) | ~$1.00 | Weak | EU-native (Paris) | Vision gap excludes it for alt-text |
| DeepSeek V3 + VL | ~$0.30 | Weak (VL) | **China only** | **Rejected** — GDPR, trust, vision all fail |
| Qwen 2.5/3 | ~$0.40 | Native, OK | **China only** (direct API) | Rejected — same GDPR block |

## Decision

### Primary bulk: **Google Gemini 2.5 Flash via Vertex AI**

- Region pinned to `europe-west1` (Belgium) with `europe-west4` (Netherlands) as failover.
- Model ID `gemini-2.5-flash` pinned; upgrade path via env var rollover, never implicit.
- Rationale: 3–5× cheaper than Haiku at peer quality, native multimodal (vision without a second provider), GDPR-clean via Google Cloud's DPA, Google Cloud pedigree reads credible to Shopify Plus buyers, stable enterprise API.

### Hard cases: **benchmark Gemini 2.5 Pro vs Claude Sonnet 4.6, lock in follow-up ADR**

Benchmark plan:
- Eval set: 50 products drawn from the concierge £97 audits (SPEC §2.4) — representative of real title-rewrite and category-classification difficulty.
- Primary metric: human-rated quality score (1–5) by the operator + one agency partner.
- Secondary: cost per 1K products, p95 latency, stability over 500 calls.
- Decision rule: winner takes all unless within 5% on quality, in which case cost wins.
- Deadline: week 2 of MVP build (see Rollout).
- Output: ADR 0006 naming the locked hard-case model.

### Fallback: **GPT-4o-mini via Azure OpenAI EU**

- Triggered by circuit breaker when primary shows >10% error rate over 100 consecutive requests, or p95 latency >5s sustained 60s.
- Same prompt format as primary where possible; fallback-specific prompts documented in `packages/llm/src/fallback.ts`.
- Azure OpenAI EU region: `swedencentral` or `francecentral`.

### Abstraction: **`packages/llm/` workspace**

- Single `LLMProvider` interface with `complete()`, `completeVision()`, `completeStream()`.
- Providers selected via env var `LLM_PRIMARY` / `LLM_HARDCASE` / `LLM_FALLBACK`.
- Both `apps/scanner/` and `apps/shopify-app/` import from `packages/llm` — never the SDK directly.
- New provider = new implementation file + env config. No code change to the apps.

### Internal tooling: **unrestricted, with data-boundary rule**

- Research reports, synthetic test data, internal summaries: any cost-effective model (including DeepSeek, Qwen) provided no merchant-specific data crosses the boundary.
- Enforced by a clear naming convention: `packages/llm/src/internal/*.ts` for internal tools, `packages/llm/src/customer/*.ts` for anything touching merchant data.

### Rejected: DeepSeek, Qwen, other China-hosted direct APIs

- **#24 Data protection (veto)**: China is not on the UK or EU adequacy list. Standard Contractual Clauses alone are insufficient given the current regulatory posture on Chinese cloud infrastructure; a transfer impact assessment would not find adequate safeguards for merchant catalog data.
- **#12 Ecosystem**: Shopify Plus buyer sales objection is near-certain. One lost £499/mo Enterprise deal = 10 months of savings erased.
- **#7 Visual / quality**: DeepSeek-VL lags Haiku and Gemini on e-commerce product imagery in independent benchmarks; alt-text would need a second vision provider, losing the cost advantage.

Re-open triggers:
- An EU-hosted route for DeepSeek or Qwen opens via Azure, Together AI EU, or equivalent.
- Adequacy decision for China is made (low probability short-term).
- A specific internal-only workload where China hosting is acceptable (already covered by the internal-tooling boundary above).

## Council review

- **#4 Security**: approved — Vertex AI / Bedrock / Azure all satisfy secret management and encryption-at-rest requirements. Prompt data not used for model training under each provider's enterprise contract.
- **#9 Legal / #23 Regulatory / #24 Data protection (veto)**: approved — Google Cloud DPA + SCCs cover the processor relationship; no cross-border hop outside EEA when regions are pinned.
- **#11 Investor**: approved — material cost floor reduction ($30K–40K/year at steady state) with no quality downgrade on the enrichment path.
- **#12 Ecosystem**: approved — "We use Google Cloud" reads credible to Shopify Plus; multi-cloud posture removes single-point-of-failure concern in App Store review.
- **#17 Performance / #33 Backend**: approved — Vertex AI SDK (`@google-cloud/vertexai`) stable, rate limits well-documented, streaming supported, region pinning explicit.
- **#34 Debugging**: approved — multi-provider fallback removes single-cloud risk; circuit breaker is standard pattern.
- **#30 Payment systems**: not applicable (no billing surface touched).

Sub-councils convened:
- **Legal Council (#9 + #23 + #24)** — unanimous reject on DeepSeek/Qwen direct APIs, unanimous approve on Gemini Flash primary.

## Consequences

- **Cost**: at 100 merchants ~$180–260/mo (vs ~$900 Claude-all-in). At 500 merchants ~$900–1,300/mo (vs ~$4,500 Claude-all-in). ~$30K–40K/yr saved at steady state.
- **Operational complexity**: three providers in the stack (Vertex AI, Azure OpenAI, + optional Bedrock for hard cases depending on benchmark). Mitigated by `packages/llm` abstraction.
- **Vendor relationships**: we are now GCP-first for LLM, which doesn't affect the app-hosting choice (Coolify on DO). No conflict.
- **Open question**: hard-case model unresolved until ADR 0006 lands (week 2 of MVP).
- **Quality bet**: we are betting Gemini 2.5 Flash delivers Haiku-quality outputs on e-commerce product imagery. Independent benchmarks support this but Flintmere's specific corpus has not yet been tested.

## Rollout

**Week 1 — MVP build start**

- Scaffold `packages/llm/` with `LLMProvider` interface + Gemini Flash implementation.
- Wire up Vertex AI credentials via Coolify env (service account JSON, region pinned).
- Implement `customer/` vs `internal/` boundary.
- Both apps import from `packages/llm` in every enrichment path.

**Week 2 — benchmark + hard-case lock**

- Run 50-product eval set on Gemini Pro and Claude Sonnet.
- Score quality (operator + agency partner), cost, latency, stability.
- Author ADR 0006 naming the locked hard-case model and its env-var ID.

**Week 3 — fallback wire-up**

- GPT-4o-mini via Azure OpenAI EU implemented.
- Circuit breaker in front of primary; triggers on error rate or latency.
- Integration test for failover path.

**Week 4 — observability**

- Per-request logging: provider, model, token count, cost, latency.
- Monthly cost rollup in admin dashboard for operator visibility.
- Drift alarm: if primary cost drifts >20% month-over-month, escalate to re-evaluate.

## Related memory

- `memory/product-engineering/architecture-rules.md` — `packages/llm/` lives under the monorepo structure defined there.
- `memory/product-engineering/security-posture.md` — secret management and encryption-at-rest rules apply to provider credentials.
- `memory/product-engineering/performance-budget.md` — LLM calls happen in BullMQ workers, not the request path.
- SPEC.md §6.1 — previous provider note (Claude default) is superseded by this ADR.

## Re-open conditions

Revisit this ADR when any of these change:

- Gemini Flash pricing moves materially (±30% in either direction).
- Anthropic or AWS announces a competitive price cut on Haiku / Nova Lite.
- An EU-hosted DeepSeek or Qwen route launches via a trusted cloud provider.
- A specific enterprise customer requires a provider not on this list (hyperscaler sovereign offering, etc.) — treat as a special-case ADR, not a primary override.
