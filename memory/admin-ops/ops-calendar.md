# ops-calendar.md — Recurring deadlines

Single calendar of recurring deadlines that must not slip. `internal-coordination-brief` reads this every Monday; `vendor-review` reads it for renewal windows; `finance-snapshot` reads it for the watchlist.

Operator owns this file. Skills propose additions; operator commits.

## Schema

```
### <event name>
- Type: <vendor renewal | regulatory filing | tax filing | audit | review cadence | calendar standing>
- Cadence: <annual | quarterly | monthly | weekly | one-off>
- Next occurrence: <YYYY-MM-DD>
- Lead time required: <days before>
- Owner: <operator + council #>
- Owning skill: <optional>
- Source of truth: <vendor register, regulator publication>
- Notes:
```

---

## Vendor renewals

Populated from `vendor-register.md`.

### DigitalOcean (droplet + Spaces)
- Type: vendor renewal
- Cadence: monthly
- Next occurrence: rolling
- Lead time: N/A auto-renew; annual review at month 11
- Owner: operator + #36
- Owning skill: `vendor-review`
- Notes: upgrade trigger at ~30 paying merchants (Basic → Premium 4 vCPU)

### Google Cloud — Gemini Enterprise Agent Platform (formerly Vertex AI)
- Type: vendor renewal
- Cadence: per-use (no renewal date)
- Owner: operator + #36
- Owning skill: `vendor-review` (annual cost + quality review)
- Notes: monitor usage via `finance-snapshot`; re-evaluate model selection annually. Rebranded from Vertex AI at Cloud Next '26 (2026-04-22); Customer Agreement / DPA covers Google LLC + Google Ireland sub-processors regardless of product naming.

### Google Cloud — service-account key rotation (`flintmere-llm`)
- Type: security hygiene
- Cadence: every 90 days
- Next occurrence: **2026-08-04**
- Lead time: 1 day (gen new key → swap in Coolify → delete old key)
- Owner: operator + #4
- Source of truth: GCP Console → IAM & Admin → Service Accounts → `flintmere-llm@flintmere-production.iam.gserviceaccount.com` → Keys
- Notes: Mitigation for the JSON-key auth posture per ADR 0005 amendment 2026-05-06. Steps each rotation: (1) **Add Key** → **Create new key** → **JSON** → download. (2) Move new key to `~/Projects/Flintmere/.local-secrets/vertex-sa.json` (overwrite the old one locally — there is one canonical local copy). (3) Update Coolify scanner Storages file mount at `/secrets/vertex-sa.json` with new contents → redeploy. (4) Smoke-test from a Vertex-touching route (or run `packages/llm/scripts/smoke-vertex.mjs` once it exists). (5) After confirmation, return to GCP Console Keys tab and **delete the old key** (don't leave more than one active). (6) Append a one-line entry to STATUS.md Changelog. If rotation slips past the due date, do not panic-rotate during high-traffic hours; pick a maintenance window. **Re-evaluate** the JSON-key posture at: first horizontal-scale event (multi-droplet), first enterprise EU prospect asking about Workload Identity Federation, or 4 successful rotations (then graduate to a quarterly cadence with a calendar-rule script).

### OpenAI Platform (fallback per ADR 0010)
- Type: vendor renewal
- Cadence: per-use
- Owner: operator + #36
- Notes: negligible spend until primary outage; review on `vendor-review` cadence. Project-scoped key (`sk-proj-…`); rotation cadence inherits the same 90-day rhythm if/when fallback traffic exceeds 5% sustained — see ADR 0010 §Re-open conditions.

### Stripe (direct invoicing for Agency + Enterprise)
- Type: vendor renewal
- Cadence: per-transaction
- Owner: operator + #30
- Notes: no renewal; review on `vendor-review` cadence

### Shopify Partner (Managed Pricing + app store)
- Type: vendor relationship
- Cadence: Partner Agreement updated by Shopify periodically
- Owner: operator + #36
- Notes: watch for Partner Agreement updates; `regulatory-change-response` when changed

### Resend
- Type: vendor renewal
- Cadence: monthly (usage-based)
- Owner: operator + #36
- Notes: upgrade trigger at ~3K emails/mo

### Sentry
- Type: vendor renewal
- Cadence: annual (when paid tier reached)
- Owner: operator + #36

### GitHub
- Type: vendor renewal
- Cadence: monthly (annual when Team+)
- Owner: operator + #2 + #36

---

## Regulatory + legal

### UK GDPR — DSAR response
- Type: regulatory filing (per-request)
- Cadence: per-request
- Lead time: **1 month** from receipt
- Owner: operator + #24 + #23
- Owning skill: `support-triage` categorises → operator handles
- Source: ICO guidance (UK GDPR Art. 12)
- Notes: `time-sensitive` tag in support-triage

### Shopify customers/data_request webhook
- Type: regulatory filing (per-request, Shopify-mediated GDPR)
- Cadence: per-request
- Lead time: **30 days** from webhook receipt
- Owner: operator + #24
- Notes: Shopify proxies merchant-customer requests to us. Handler enqueues, operator confirms completion.

### Annual Privacy Policy review
- Type: review cadence
- Cadence: annual
- Lead time: 30 days for review + redraft
- Owner: #24 + #23 + operator
- Owning skill: `legal-page-draft` (Level 1)
- Source: `apps/*/app/privacy/` last-reviewed date
- Notes: also triggered ad-hoc by `regulatory-change-response`

### Cookie consent review
- Type: review cadence
- Cadence: annual + on analytics vendor change
- Owner: #24 + #36
- Notes: cross-check with `vendor-register.md`

### UK VAT filing
- Type: tax filing
- Cadence: quarterly
- Lead time: 60 days before deadline
- Owner: operator + #9 (accountancy routed)
- Notes: HMRC MTD filings

### EU VAT MOSS / OSS
- Type: tax filing
- Cadence: quarterly
- Lead time: 30 days
- Owner: operator + #9
- Notes: digital services across EU; applicable from first EU customer

### Sub-processor list update
- Type: regulatory filing (DPA-driven)
- Cadence: ad-hoc on vendor change
- Lead time: 30 days merchant notification typical
- Owner: #24 + #36
- Owning skill: `legal-page-draft` (Level 1)

---

## Shopify-specific

### Shopify App Store listing review
- Type: review cadence
- Cadence: quarterly + after major version release
- Owner: operator + #5
- Owning skill: `shopify-app-store-submission` (when that skill exists)
- Notes: keep listing copy in sync with current product behaviour

### Built-for-Shopify reapplication / renewal (when earned)
- Type: periodic audit
- Cadence: Shopify-driven (triggered by Shopify)
- Owner: operator + #15
- Notes: monitor Partner Dashboard for cycle

---

## Internal review cadences

### Weekly metrics brief
- Cadence: weekly (Mondays)
- Owner: #35 + operator
- Owning skill: `weekly-metrics-brief`

### Weekly internal coordination brief
- Cadence: weekly (Mondays)
- Owner: #36 + operator
- Owning skill: `internal-coordination-brief`

### Quarterly KPI review
- Cadence: quarterly
- Owner: #35 + operator
- Owning skill: `weekly-metrics-brief` roll-up + `cohort-retention`

### Quarterly vendor review
- Cadence: quarterly
- Owner: #36 + operator
- Owning skill: `vendor-review`

### Quarterly docs coherence audit
- Cadence: quarterly
- Owner: #1 + #36
- Owning skill: `docs-coherence-audit`

### Quarterly design system audit
- Cadence: quarterly
- Owner: Design Council + #36
- Owning skill: `design-system-audit`

### Quarterly security claim audit
- Cadence: quarterly + before fundraising / major announcement
- Owner: #4 + Legal Council + #36
- Owning skill: `security-claim-audit`

### Annual vendor contract review
- Cadence: annual
- Owner: #9 + #36
- Notes: contract terms not just plan + price

### Annual security tabletop exercise
- Cadence: annual
- Owner: #4 + #24 + operator
- Notes: tests incident-disclosure playbook

---

## Standing flags

- Any deadline within 7 days → **P0** in coordination brief.
- Any deadline within 30 days → **P1**.
- Any deadline missed → log in `memory/CORRECTIONS.md` with cause + prevention.

## Anti-patterns

- Letting renewal dates slip past lead-time without `vendor-review`.
- Filing a tax return within 7 days of deadline (insufficient review window).
- Ignoring regulatory cadence because "nothing's changed" — annual reviews are mandatory regardless.
- Burying deadlines in skill-specific files instead of here.

## Maintenance

- Operator updates dates as events pass.
- Skills propose additions via workflow.
- Quarterly sweep by #36 to retire completed one-off events.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Removed Web3-specific items (ecosystem grants, RPGF rounds). Added UK VAT + EU OSS (digital services tax), Shopify App Store review, Built-for-Shopify reapplication, Shopify GDPR webhook per-request window.
