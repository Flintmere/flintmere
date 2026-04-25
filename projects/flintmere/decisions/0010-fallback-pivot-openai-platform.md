# 0010 — Fallback pivot: OpenAI Platform with privacy-by-minimization

- **Status:** Accepted
- **Date:** 2026-04-25
- **Supersedes:** ADR 0005 §Decision/Fallback ("GPT-4o-mini via Azure OpenAI EU")

## Context

ADR 0005 named **Azure OpenAI EU** as the fallback when Vertex AI Gemini errors out, on the basis that the `swedencentral` / `francecentral` regions deliver hard EU data residency and a multi-cloud decorrelation story for enterprise sales.

Two facts surfaced during operator setup that change the analysis:

1. **Azure OpenAI Studio is friction-heavy.** Resource → deployment → endpoint URL surgery → API version pinning → deployment-name-equals-model dance. The provider class (`packages/llm/src/providers/azure-openai.ts`) is 145 lines mostly absorbing that surgery.
2. **OpenAI Platform's project-level EU residency is not exposed in the operator's current self-serve account tier.** The Geography selector is unavailable on project creation. Org-level data controls show "API call logging" but no Geography toggle. Formal EU residency is gated to enterprise procurement (sales-led), not self-serve.

The trade is now: **(a)** stand up Azure OpenAI EU with hard residency + setup friction, or **(b)** stand up OpenAI Platform direct with code-level data minimization but no formal EU residency on the fallback path.

The operator made the call: **(b)**, with explicit code-level guards and a documented commitment to upgrade to formal residency through enterprise procurement when scale or buyer pressure justifies it.

## Decision

### Fallback model: **OpenAI Platform — `gpt-4o-mini` via direct API**

- Project ID: `proj_tm1F1hYtq8pfQXdjPMut18Dw` (project name: `flintmere-fallback`, org: `Eazy Access Ltd`).
- Implementation: `packages/llm/src/providers/openai.ts`.
- Env contract: `OPENAI_API_KEY`, `OPENAI_PROJECT_ID`, `OPENAI_MODEL` (default `gpt-4o-mini`), `OPENAI_BASE_URL` (optional override; reserved for a future EU-pinned routing if OpenAI exposes one to this account).

### Framing — what the privacy posture actually targets

ADR 0005 framed the target market as "UK/EU Shopify merchants" and that bled into a default of "EU-pinned at all costs" everywhere in the stack. That framing is over-calibrated. **GDPR's cross-border transfer rule fires when *personal data* moves outside the EEA — not catalog text.** Catalog text (product titles, descriptions, attributes, tags, variants) is not personal data under GDPR Art 4(1) for the typical Shopify product. For US merchants GDPR doesn't apply at all; Flintmere will obviously have US merchants too.

The real privacy controls on the fallback path are therefore:

1. The **customer-data boundary** (don't send shoppers' PII to LLMs in the first place)
2. The **catalog-only rule** (enrichment touches catalog fields, never customer fields)
3. The **PII sanitizer** (catches inadvertent leakage — a stray email in a description, a personal trading name)
4. The **signed DPA** with each LLM sub-processor

EU residency on the *primary* path (Vertex AI) is high-value because that's where 99% of volume runs, it's the clean enterprise sales line, and we already pay for it. EU residency on the *fallback* path is a sales-narrative nice-to-have for enterprise prospects, **not** a GDPR compliance requirement on the assumption that the four controls above hold.

### Code-level posture (non-negotiable invariants)

1. **`store: false` on every request.** Hard-coded in the provider; not env-configurable. Suppresses OpenAI's 30-day Application State retention. **Note:** this does NOT exempt requests from OpenAI's separate 30-day abuse-monitoring retention of prompts + completions. Per [OpenAI's data-controls guide](https://developers.openai.com/api/docs/guides/your-data), abuse-monitoring exemption requires a Zero Data Retention amendment, which is sales-gated and bundled with EU residency. Neither is in effect on this account tier.
2. **Project-scoped key only.** User keys are rejected at config validation; only `sk-proj-…` keys are accepted.
3. **PII sanitizer (the primary control).** All user-message and system-message text passes through `packages/llm/src/sanitize.ts` before transmission. Strips: email patterns, phone patterns, payment-card patterns, long uniform digit runs. Because OpenAI's abuse-monitoring system retains prompts + completions for up to 30 days regardless of `store`, the sanitizer is what keeps inadvertent PII out of those logs — it is not a defence-in-depth nicety.
4. **No vision fallback.** `OpenAIProvider.completeVision` throws `LLMError('invalid-input', …)`. The router carries `allowVisionFallback: false` by default. Rationale: a sanitizer cannot redact image content, and product images may contain identifiable individuals. Alt-text enrichment failures retry on the next bulk cycle.
5. **Catalog data only.** Apps must not pass merchant customer data through `router.completeBulk` / `completeHardCase`. Enforcement: the `customer/` vs `internal/` boundary in `packages/llm` (ADR 0005), plus the sanitizer as a backstop.
6. **DPA signed at OpenAI org level.** Operator confirms before key activation (Settings → Organization → Data processing addendum).
7. **Redaction signal wired.** `OpenAIProvider.onRedactions` emits a structured warn-level log on every non-zero redaction event so each near-miss surfaces in observability, not just aggregate metrics.

### Known limitations on this account tier (honest disclosure)

- **No formal EU data residency.** Sales-gated; project-creation Geography selector is not exposed.
- **No Zero Data Retention.** Sales-gated; bundled with EU residency. Customer content sits in OpenAI's abuse-monitoring logs for up to 30 days.
- **`store: false` ≠ ZDR.** It only suppresses Application State retention. The abuse-monitoring retention is separate.
- **The dashboard "API call logging" toggle is not ZDR either.** It only controls operator-visible dashboard logs; the underlying retention is unchanged.

### Sub-processor disclosure

The Flintmere DPA must list **OpenAI, OpenAI Ireland Operations Limited** as a sub-processor with the explicit note that the fallback path may route through US infrastructure, triggered only on Vertex AI primary failure. Frequency expectation: <1% of total LLM calls.

## Rationale

### Why OpenAI direct over Azure OpenAI EU (this account, today)

- **Time.** Setup is ~10 minutes vs ~1 hour. Operator is in launch-prep crunch; the fallback is rarely-hit infra, not the primary data path.
- **Code simplicity.** ~50 lines vs ~145. No endpoint URL surgery, no deployment-name coupling, no `api-version` pinning rituals.
- **Cost.** ~10–15% cheaper on the same model.
- **Decorrelation preserved.** Vertex (Google) primary, OpenAI fallback — two distinct control planes, two failure-mode surfaces.

### Why this is acceptable under #24 Data Protection (conditional)

Council reading at this date:

- **GDPR jurisdiction is data-driven, not processor-located.** GDPR Art 44+ cross-border transfer rules apply when personal data moves out of the EEA, not when any byte does. Catalog text is not personal data. For US merchants GDPR doesn't apply at all.
- **Data sent through fallback is catalog-only** — product titles, descriptions, tags, variant attributes. Edge-case PII (seller trading name as a personal name, email in a description) is caught by the sanitizer.
- **Volume is bounded** — fallback is triggered only on Vertex circuit-break, expected at <1% of bulk operations.
- **The defensive controls are real** — sanitizer + boundary rule + DPA produce a defensible posture for catalog-only data even without formal EU residency. `store: false` is part of the posture but is honestly framed: it suppresses app-state retention, not abuse-monitoring retention.
- **Buyer disclosure is honest** — sub-processor list will name OpenAI with the US-routing limitation clearly stated. Enterprise buyers who explicitly require EU-pinned sub-processors trigger ADR 0012 (open OpenAI sales for EU residency + ZDR amendment, or pivot to AWS Bedrock EU).

### Why this is *not* a blanket green-light

- Shopify Plus and Agency tier (£399–£499/mo) EU buyers commonly demand EU-pinned sub-processors regardless of the data being non-personal. **Any deal that surfaces this requirement triggers ADR 0012** — open OpenAI sales for EU residency + ZDR (bundled), or pivot the fallback to AWS Bedrock EU (Frankfurt).
- US merchants are unaffected by all of this; the posture is GDPR-neutral for them.
- The £15–30/month cost projection from `vendor-register.md` carries over from the prior Azure plan; no change.

## Council review

- **#4 Security** — approved. Project-scoped keys + `store: false` (suppresses app-state retention) + PII sanitizer. Note: ZDR is not in effect on this account tier; abuse-monitoring retention applies. Same secret-management posture as Azure path.
- **#9 Legal + #23 Regulatory + #24 Data protection (veto seat)** — approved **conditional** on: sanitizer in place, `store: false` enforced, vision fallback disabled, DPA signed before any production traffic, sub-processor list updated with US-routing disclosure. If any condition fails, fallback must not be enabled in production env.
- **#11 Investor** — approved. Cost parity, faster ship, residency upgrade path is procurement-only (no code rewrite).
- **#12 Ecosystem** — flagged. Some Shopify Plus buyers will object. Mitigation: ADR 0012 trigger documented above; account managers route residency-sensitive deals through it before quoting.
- **#33 Backend + #34 Debugging** — approved. Simpler provider, fewer failure modes, single SDK already in deps.

## Consequences

- **Fallback class swap.** `AzureOpenAIProvider` deleted; `OpenAIProvider` shipped. Type union `ProviderId` updates: `'azure-openai'` → `'openai'`.
- **Env contract change.** `AZURE_OPENAI_*` vars retired; `OPENAI_*` vars added. Coolify env config update at deploy time.
- **Vision fallback disabled.** Alt-text enrichment that hits Vertex outage now fails the batch; retries on next bulk cycle. Acceptable: alt-text is not real-time.
- **Sub-processor + DPA paperwork.** OpenAI added to public sub-processor list; org-level DPA signed.
- **Residency upgrade is procurement-only.** No code rewrite required to escalate to OpenAI Enterprise EU residency or Bedrock — env flip + new provider class instance.
- **Audit trail.** Every non-zero sanitizer redaction emits a structured warn-level log via `OpenAIProvider.onRedactions` (wired in `apps/shopify-app/app/lib/llm.server.ts`). Each event is a near-miss to investigate, not just an aggregate counter. Because OpenAI's abuse-monitoring retention applies to whatever does cross the wire, the bar is "redaction rate ≈ 0," not "redaction rate <5%."

## Rollout

**Immediate (no phases):**

1. Operator: sign DPA, generate Project API key in `flintmere-fallback`, hand to engineering via local file path (never paste in chat).
2. Engineering: ship `OpenAIProvider`, sanitizer, factory swap, env.example updates, vendor-register update, OPERATOR-TASKS update, this ADR.
3. Engineering: smoke test forced fallback against the sanitizer + `store: false` posture; assert provider id `openai`, assert `store: false` on the wire.
4. Operator: update sub-processor list on the public DPA page when legal pages land.

## Re-open conditions

- A Shopify Plus / Agency / Enterprise EU prospect explicitly requires an EU-pinned LLM sub-processor on the fallback path. Write ADR 0012 — open OpenAI sales conversation for EU residency + ZDR (bundled), or pivot to AWS Bedrock EU.
- Any non-zero sanitizer redaction event in production. Each one is a near-miss; investigate the upstream catalog source and tighten the boundary rule before continuing. (This is a "rate ≈ 0" bar, not a "<5%" bar — abuse-monitoring retention means redactions that did transmit are already in OpenAI's logs for 30 days.)
- Fallback traffic share exceeds 5% of LLM volume sustained over a week. The "rare path" assumption breaks; the volume + retention math changes.
- OpenAI Platform exposes self-serve EU residency on the operator's org tier. Re-evaluate whether to migrate the project to EU geography and amend this ADR.
- A merchant data category beyond catalog text starts flowing through the customer-data routes (e.g. customer reviews, support transcripts). The catalog-only assumption no longer holds; re-scope the boundary.

## Related

- `decisions/0005-llm-provider-strategy.md` (superseded clause)
- `decisions/0006-hardcase-llm-lock-gemini-pro.md` (unaffected)
- `memory/admin-ops/vendor-register.md` (sub-processor entry updated)
- `memory/product-engineering/security-posture.md` (secret rules apply unchanged)
- `packages/llm/src/providers/openai.ts` (implementation)
- `packages/llm/src/sanitize.ts` (PII sanitizer)
