# 0011 — EU-default Vertex pinning rationale + multi-region trigger

- **Status:** Accepted
- **Date:** 2026-04-25
- **Clarifies:** ADR 0005 §Constraints (EU/UK data residency) — the decision is unchanged; the *reasoning* is corrected.
- **Related:** ADR 0010 (fallback pivot — same correction applied to the fallback path).

## Context

ADR 0005 selected `europe-west1` (Belgium) as the Vertex AI region and cited "EU/UK data residency" under Constraints, framing it as a GDPR Chapter V cross-border-transfer requirement. ADR 0010 surfaced that this framing is over-calibrated — GDPR's transfer rules apply to **personal data**, and catalog text (titles, descriptions, attributes, tags, variants) is not personal data under GDPR Article 4(1) for the typical Shopify product.

The user raised the obvious follow-up: Flintmere will plainly have US merchants too. Why does the *primary* path stay EU-pinned by default? If the original GDPR rationale doesn't survive scrutiny, the EU default needs a fresh justification — or it should change.

This ADR closes that loop: the EU default stays, but the reasoning is rewritten to be honest. It also documents the trigger conditions for introducing per-merchant regional routing in a future ADR.

## Decision

**Keep `europe-west1` as the default Vertex AI region for both primary and hard-case Gemini models.** The default is a sales-narrative + risk-reduction stance, not a GDPR requirement.

**Defer multi-region per-merchant routing to a future ADR**, triggered by specific events listed in §Re-open conditions below.

## Rationale (the five points that survive scrutiny)

1. **Free.** Vertex AI pricing is identical across regions for the models we use. EU vs US is not a cost decision. Picking EU costs nothing; it buys something.

2. **Latency is non-blocking.** The primary path runs in BullMQ workers, asynchronous to merchant-facing requests. Transatlantic RTT for a US merchant is ~150ms; queue lag is in seconds; the merchant never waits on Vertex directly. The user-visible cost is zero. This holds *as long as no synchronous LLM call surfaces to a request handler* — see §Re-open trigger 4.

3. **Edge-case PII insurance.** Even with the customer-data boundary and the sanitizer, occasional catalog text contains personal data: a sole trader's display name in store branding, an email accidentally pasted into a description, a customer testimonial quoted verbatim. EU pinning means there is no Article 44 transfer question for any byte that does cross the wire. The fallback (1% of volume, ADR 0010) accepts this risk consciously; the primary (99%) doesn't need to and shouldn't.

4. **Sales narrative cost-of-defection.** Shopify Plus EU enterprise prospects will ask, "Where does our catalog go?" Answer: "Google Cloud, Belgium." Clean. Single sentence. "Google Cloud, US-Central + Belgium for EU merchants" is more sentences and more questions. Until the operator burden of multi-region pays back through a US enterprise prospect or a US-merchant-friction signal, the simple answer is the right answer.

5. **Reversibility is cheap.** The abstraction is `LLMProvider`. Switching to per-merchant regional routing — `getProvider(merchant.region)` — is a code change, not an architecture rewrite. We introduce it the day a friction signal justifies the engineering, not before.

### What is *not* the rationale (corrected)

- **GDPR does not require it for catalog text.** Catalog text is not personal data. For US merchants GDPR doesn't apply at all. The "ADR 0005 framed it as a transfer-law requirement" framing was wrong; this ADR documents the correction.
- **It is not a UK/EU-only product positioning.** The default is EU-pinned; the *product* is global. US merchants are first-class citizens, billed and supported the same way.
- **It is not a cost optimization.** Pricing parity across regions means cost is neutral.

## Council review

- **#4 Security** — approved. Region pinning is a defence-in-depth control. EU happens to be where most early customers are; the security posture is region-agnostic at the auth/encryption layer.
- **#9 Legal + #23 Regulatory + #24 Data protection** — approved. The corrected framing — "EU is the default for sales-narrative + edge-case PII insurance, not because GDPR requires it for catalog text" — is honest and defensible. No claim of EU residency in marketing copy that would mislead a US buyer.
- **#11 Investor** — approved. Cost-neutral. Sales narrative win. Reversibility cheap. No lock-in.
- **#12 Ecosystem** — approved. EU pinning helps Shopify Plus EU prospects; doesn't hurt US prospects who don't ask the question. If a US prospect *does* ask, the answer is "we support per-merchant regional routing on enterprise tier" once we've shipped that — current state: the trigger is documented; the engineering is deferred.
- **#17 Performance + #33 Backend** — note + approve. Latency cost for US merchants is ~150ms per LLM call, fully absorbed by BullMQ. Re-open the discussion the day a synchronous LLM call lands in a request path or a US merchant raises latency in support.
- **#34 Debugging** — approved. Single-region operation is simpler to reason about than multi-region. One set of latency baselines, one set of error rates, one Vertex regional dashboard.
- **#37 Consumer psychologist** — approved. US merchants don't read "EU-pinned" as exclusionary because we don't market it as such; the residency choice is invisible at sign-up.

## Consequences

- **No code change today.** Vertex region stays at `europe-west1`. Env config unchanged.
- **Documentation correction.** ADR 0005's residency framing is clarified by reference; vendor-register.md and OPERATOR-TASKS.md updates land alongside this ADR if any line needs touching.
- **A US merchant onboarded today is processed via EU Vertex.** This is fine, by design; their catalog data is not personal data, and the latency is queue-absorbed.
- **The "EU residency" sub-processor disclosure on the Privacy/DPA pages** can honestly say: "Vertex AI in `europe-west1` (Belgium); fallback path may route through US per ADR 0010." The disclosure is accurate without claiming the EU pinning is a compliance requirement.
- **Multi-region routing is a future feature**, not a bug. It will be designed once a real trigger fires.

## Re-open conditions (triggers for multi-region routing)

Write a follow-up ADR introducing per-merchant regional routing when **any** of the following fires:

1. **A US merchant raises latency as a friction point** — support ticket, churn signal, or operator-observed delay degrading enrichment SLA. Threshold: one credible report, not a trend; latency complaints are leading indicators.
2. **A US enterprise prospect explicitly demands US-region data residency** — typically a Shopify Plus US buyer with an internal data-locality policy. The contract requirement triggers the ADR; the deal triggers the engineering schedule.
3. **Synchronous LLM calls are introduced** in any request-path code (i.e., a route that awaits Vertex before responding to the merchant). Transatlantic RTT becomes user-visible; multi-region becomes a UX concern, not just a sales-narrative one.
4. **Vertex regional pricing diverges materially** between EU and US (>15% in either direction). The free-region assumption breaks; cost matters.
5. **A regulatory shift** — UK adequacy decision withdrawn, EU-US Data Privacy Framework challenged again, or a new sector-specific rule that constrains region choice. The legal council convenes; the ADR follows.

When any condition fires, the follow-up ADR designs:
- The merchant→region mapping policy (likely: the merchant's billing country, with override on the Settings page).
- The provider construction layer (likely: `getProviderForMerchant(shopId)` builds a `VertexProvider` with the right `location`).
- The observability split (per-region cost rollup, per-region latency baselines).
- The migration path for existing merchants (default = stay where you are; opt-in to switch).

## Numbering note

ADR 0010 §Re-open previously cited "ADR 0011" as the future ADR for the **fallback** EU residency upgrade (sales-gated OpenAI Enterprise residency or AWS Bedrock pivot). That number is now taken by this ADR. The fallback EU upgrade ADR, if it lands, is **ADR 0012**. References across ADR 0010, OPERATOR-TASKS.md, and vendor-register.md have been updated.

## Related

- `decisions/0005-llm-provider-strategy.md` (clarified — primary residency reasoning corrected)
- `decisions/0006-hardcase-llm-lock-gemini-pro.md` (unaffected; same EU region)
- `decisions/0010-fallback-pivot-openai-platform.md` (parallel correction applied to fallback path)
- `memory/admin-ops/vendor-register.md` (sub-processor entries updated)
- `apps/shopify-app/app/lib/llm.server.ts` (the singleton router consumer)
