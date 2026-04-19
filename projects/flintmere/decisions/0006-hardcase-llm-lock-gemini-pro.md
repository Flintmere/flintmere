# 0006 — Hard-case LLM locked: Gemini 2.5 Pro

- **Status:** Accepted
- **Date:** 2026-04-19
- **Supersedes:** ADR 0005 §Decision — "Hard cases: benchmark Gemini 2.5 Pro vs Claude Sonnet 4.6, lock in follow-up ADR"

## Context

ADR 0005 selected Google Gemini 2.5 Flash as the primary bulk LLM and left the hard-case model (title rewrites, ambiguous category classification, vertical-template matching) open, pending a 50-product benchmark against the candidate pair Gemini 2.5 Pro vs Claude Sonnet 4.6.

The benchmark was scoped to week 2 of the MVP build and required real concierge-audit data from SPEC §2.4 as the eval set. That data does not exist yet — the £97 concierge audits are a week 1 validation milestone. Waiting for the benchmark means either (a) delaying the MVP build until week 3+, or (b) shipping with a placeholder model and swapping later.

Operator call: ship now, benchmark later. The decision is made **without** the benchmark, with explicit commitment to run it once real corpus exists.

## Decision

**Hard-case model: Google Gemini 2.5 Pro via Vertex AI** — same region, same DPA, same SDK as the primary.

- Model ID: `gemini-2.5-pro` pinned via env `LLM_HARDCASE_MODEL`
- Region: `europe-west1` primary, `europe-west4` failover (identical to Flash)
- Implementation: `packages/llm/src/customer/hard-case.ts`
- Invoked for: title rewrites, category classification confidence <0.85, vertical-template seed generation, any prompt explicitly flagged `difficulty: hard` by the scoring engine

## Rationale

### Why Gemini Pro wins the ship-now call (Council)

- **#33 Backend + #17 Performance** — single-stack operation. Vertex AI is already in the stack for the primary; no new SDK, no new IAM, no new region decisions, no new observability target. Sonnet would add AWS Bedrock as a second cloud solely for the hard-case tier.
- **#11 Investor** — cost advantage. At £8 vs £15 per 1K products, hard-case costs ~50% less without a quality delta large enough to measure pre-launch. Savings compound with scale.
- **#4 Security + #24 Data protection** — same Vertex AI enterprise DPA that cleared the primary ADR. No new legal review needed.
- **#34 Debugging** — single-provider stack for customer-data LLMs means one failure-mode surface to learn, one rate-limit system, one set of error codes. The fallback (GPT-4o-mini on Azure) is the only other provider — bounded complexity.
- **#22 Conversion copywriter** — Sonnet has a reputation for better copywriting "taste" on title rewrites, but the published head-to-head benchmarks on structured e-commerce text are within noise. The reputational edge is worth running the benchmark for; it is not worth delaying MVP for.

### Why Sonnet was rejected (for now)

- Would introduce AWS Bedrock as a second cloud dependency
- 2× the token cost at best, potentially 3× under sustained hard-case load
- Reputational quality edge is unproven on Flintmere's specific corpus
- Any advantage it has will be revealed by the deferred benchmark; if it wins, ADR 0007 swaps it in — swap cost is ~1 day of work

## Benchmark deferred, not skipped

The benchmark still runs — with real data, on a schedule that's useful instead of blocking.

### Trigger

Run the benchmark once **50+ concierge audits have completed** (SPEC §2.4), or at the **end of month 3 post-launch**, whichever comes first. Earlier is fine; later is not acceptable.

### Eval set

- 50 products drawn proportionally from concierge audits and MVP beta merchants
- Weighted by vertical (SPEC §11.1 moat plan): beauty, supplements, apparel, electronics, home goods
- Include the hardest 20% — the corner cases where Gemini Pro currently struggles are the ones the benchmark must resolve

### Metric

- **Primary:** human-rated quality 1–5 by operator + one agency partner, blind to model identity
- **Secondary:** cost per 1K products, p95 latency, refusal rate, structured-output conformance
- **Decision rule:** winner takes all unless within 10% on quality, in which case cost + operational simplicity wins (default: stay on Gemini Pro)

### Output

If Gemini Pro holds: close-out note appended to this ADR; no new ADR needed.
If Sonnet wins decisively (>10% quality lift): ADR 0007 swaps it in; env variable flip + ~1 day engineering.

## Consequences

- **Ship velocity**: MVP build proceeds week 2 on schedule. No benchmark-gated delay.
- **Cost floor**: ~£7 per 1K hard-case products saved vs Sonnet (at 100 merchants with ~5% hard-case volume, ≈ £4/month; negligible early, meaningful at scale).
- **Operational**: zero new vendors; `packages/llm` still has two customer-data providers (Gemini primary + Gemini hard-case), plus one fallback (GPT-4o-mini on Azure).
- **Quality risk**: we are shipping without corpus-specific validation of hard-case quality. Mitigation: the benchmark runs early (~month 3), and the swap is cheap if we're wrong.
- **Opportunity cost**: if Sonnet is materially better on title rewrites, some early merchants get slightly-worse rewrites. Worst case: 1–2 stars on App Store reviews citing "titles could be better." Not a business-ending outcome.

## Rollout

**Immediate** — no phases needed.

1. `packages/llm/src/customer/hard-case.ts` implements Gemini 2.5 Pro via the existing `LLMProvider` interface used by Flash.
2. Env vars set in Coolify: `LLM_HARDCASE_PROVIDER=vertex`, `LLM_HARDCASE_MODEL=gemini-2.5-pro`, `LLM_HARDCASE_REGION=europe-west1`.
3. The scoring engine's `difficulty: hard` routing rule is implemented in week 2 and dispatches to hard-case when confidence on the Flash result is below the threshold.
4. Benchmark ticket created now (in whatever tracking surface exists) with the month-3 deadline, owner = operator, blocked-by = 50 concierge audits.

## Re-open conditions

- Benchmark month-3 shows Sonnet winning by >10% on quality — write ADR 0007, swap.
- Gemini 2.5 Pro pricing moves materially (±30%) — re-evaluate.
- A Shopify Plus enterprise customer explicitly requires Anthropic (some buyers have Anthropic-only AI policies) — special-case handling, not a primary override.
- A new generation of Gemini / Claude / GPT with materially better cost-quality tradeoff — survey and re-ADR.
