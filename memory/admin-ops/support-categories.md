# support-categories.md — Taxonomy + routing

The categorical scheme used by `support-triage` to bucket support contacts. Categories are stable; new categories require an ADR. Routing tells the triage skill which downstream skill / department picks up a recurring trend.

## Schema

Every ticket maps to **exactly one** primary category + zero or more secondary tags. Aggregation is by primary category × week.

## Primary categories

### billing
- **What it covers**: payment failures, refund requests, plan-change confusion, cancellation requests, invoice questions, double-charge concerns.
- **Routing if trending up**: `implement-checkout-flow` (if a flow defect), `conversion` (if pricing-page confusion), `clarify` (if microcopy ambiguity).
- **Compliance touch**: refund handling per Stripe ToS + UK consumer law (#9).
- **Privacy**: never quote customer email or amount in a brief; counts only.

### auth
- **What it covers**: sign-in failures, password reset issues, magic-link problems, OAuth provider errors, account-lockout situations.
- **Routing if trending up**: `fix-bug` (if defect), `debug-prod-incident` (if outage signal), `design-glass-surface` (if onboarding UX).
- **Security touch**: any spike correlates with potential credential-stuffing — escalate to #4.

### scan-failure
- **What it covers**: "scan didn't return data", "wrong chain", "missing approvals", "scan stuck", "RPC error visible to user".
- **Routing if trending up**: `debug-prod-incident` (if reliability KPI breach), `add-chain` (if chain-specific gap), `fix-bug` (if defect).
- **Cross-check**: against `scan_success_rate_24h` red line.

### revoke-failure
- **What it covers**: "revoke didn't work", "still showing the approval after revoke", "wallet errored on revoke txn", "gas estimation failed".
- **Routing if trending up**: `fix-bug`, `debug-prod-incident`, possibly `design-glass-surface` if UX is misleading users about revoke status.
- **Product invariant**: revoke is on-chain; we do not pre-confirm. Microcopy must reflect this.

### sentinel
- **What it covers**: Sentinel-specific questions — alert frequency, alert content, automated revocation rules, plan limits, "did Sentinel see this?".
- **Routing if trending up**: `conversion` (if pre-purchase confusion), `build-feature` (if feature gap), `design-glass-surface` (if UX).
- **Sales overlap**: Sentinel demos / sales conversations route to operator, not to a skill.

### api
- **What it covers**: API key issues, rate-limit questions, error-code clarification, SDK questions, "can the API do X?".
- **Routing if trending up**: `build-feature` (if defect / feature gap), `writer` (if docs unclear), `design-glass-surface` (if developer dashboard).
- **Cross-check**: against `api_key_active_7d`.

### docs
- **What it covers**: "the docs say X but the product does Y", broken links, missing examples, unclear quickstart.
- **Routing**: `docs-coherence-audit` (if systemic), `writer` (if a single doc), `clarify` (if microcopy in-product).

### feature-request
- **What it covers**: "can you add X?", "would love a Y feature", new chain requests, integration requests.
- **Routing**: aggregate trend → `content-strategy` (for blog/social acknowledgement), `build-feature` (if approved), `add-chain` (if chain), `integration-proposal` (if partner-shaped).
- **Note**: most feature-request tickets get a personal reply from the operator. Aggregates inform roadmap, not individual responses.

### legal
- **What it covers**: privacy questions, GDPR / CCPA data-subject requests (DSARs), terms-of-service questions, deletion requests, jurisdiction questions.
- **Routing**: operator + #9 + #24 immediately. Never auto-routed.
- **Compliance**: DSARs have legal response windows (UK GDPR: 1 month). Triage flags as time-sensitive.

### security-report
- **What it covers**: "I found a vulnerability", "this looks phishable", any responsible-disclosure-shaped contact.
- **Routing**: operator + #4 immediately. Reference `SECURITY.md` disclosure flow.
- **Privacy**: do not publicise. Acknowledged via private channel.

### partner / press
- **What it covers**: B2B inquiries, partnership inbound, press requests, podcast invitations.
- **Routing**: operator + relevant Growth skill (`partnership-brief` for partnerships, `outreach` for press follow-up).
- **Note**: not a support ticket per se but lands in the same inbox; categorised so it doesn't pollute support trends.

### spam / unrelated
- **What it covers**: phishing, sales pitches, off-topic.
- **Routing**: deleted; counted only for inbox health.

## Secondary tags (multi-select)

Used to add granularity within a category:

- `chain:<chainid>` — for scan/revoke/sentinel issues
- `plan:<free|pro|sentinel|api-developer|api-growth>`
- `wallet:<metamask|rabby|coinbase|phantom|ledger|other>` — only if the user volunteered; never inferred
- `mobile|desktop`
- `repeat-contact` — same user contacted before (operator-tagged; never inferred from PII)
- `time-sensitive` — DSAR window, security report, payment-blocking

## Volume thresholds (when to escalate)

A category that exceeds **15% of weekly volume** OR **3× its 4-week baseline** is escalated in the triage brief. Smaller spikes are flagged; not escalated.

## Anti-patterns

- Reporting individual tickets in a brief.
- Quoting user message text.
- Naming users.
- Categorising security reports as "security-report" without immediate operator + #4 notification.
- Treating a feature-request count as a feature-request mandate. Counts inform; the roadmap is owned by the operator + product council.

## Maintenance

- Quarterly review by #36 + #19 + #4.
- New category requires an ADR + #36 sign-off.
- Removing a category requires re-tagging the historical entries; never silently drop.
