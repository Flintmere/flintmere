# kpi-tree.md — Canonical KPI tree

The single tree everyone refers to when arguing about a number. Owned by **#35 Product analyst**; updated by ADR.

## Shape

```
North-star
  ├── Primary KPIs (one per major surface / lifecycle stage)
  │     ├── Secondary metrics (diagnostic; not goals)
  │     └── Health checks (red lines; not goals)
```

## North-star

**Paying merchant count (PMC)** — count of Shopify shops with an active paid subscription (Growth + Scale + Agency seats + Enterprise) at snapshot.

- **Why**: Flintmere's core thesis is that merchants will pay for catalog readiness. PMC is the closest proxy to "we have a product people pay for." Revenue variants (MRR) are derivatives of PMC + tier mix; retention is a derivative of PMC over time. PMC is the cleanest single indicator of product-market fit at this stage.
- **Owner**: #35 Product analyst + #11 Investor voice.
- **Refresh**: weekly.
- **Decisions it informs**: roadmap prioritisation, fundraising narrative, hire-or-not decisions.
- **Target cadence**: 50 PMC at month 6, 250 at month 12, 500 at month 18, 1,000 at month 24 (SPEC §9 sequence).
- **Related north-star**: `agency_merchant_ratio` — as PMC grows, the agency share should trend toward 40%+ (SPEC §8.2). If PMC grows but agency-ratio lags, we're over-indexed on direct-merchant sales.

## Primary KPIs

### Acquisition

| Metric | Decision it informs | Owner |
|---|---|---|
| `scanner_submissions_weekly` | Scanner distribution + SEO + social effectiveness | #35 + marketing |
| `marketing_sessions_weekly` | Content + SEO investment allocation | #35 + #5 |
| `partnership_attributed_installs` | Integration-proposal prioritisation | #35 + #12 |

### Activation

| Metric | Decision it informs | Owner |
|---|---|---|
| `email_optin_rate_weekly` | Scanner email gate copy + position; scanner → report funnel | #35 + conversion |
| `install_rate_weekly` | Shopify App Store listing + screenshots + pricing display | #35 + #5 |
| `first_scorecard_rate` | Onboarding health; bulk sync reliability | #35 + #7 |
| `first_fix_applied_rate_d7` | Fix-apply UX; pillar prioritisation; whether install leads to value | #35 + conversion |

### Conversion

| Metric | Decision it informs | Owner |
|---|---|---|
| `growth_tier_signup_rate` | Pricing page persuasion; first-month £29 promo effect | #35 + conversion |
| `scale_upgrade_rate_monthly` | Value ladder — does value grow with usage? | #35 + #5 |
| `agency_signups_weekly` | Agency acquisition channel effectiveness (SPEC §8.2 economic engine) | #35 + #12 |
| `enterprise_deals_closed_monthly` | Enterprise sales pipeline + pricing calibration | #35 + #11 |
| `concierge_audits_paid_weekly` | Validation of paid audit appetite (SPEC §2 Week 1) | #35 + #11 |

### Retention

| Metric | Decision it informs | Owner |
|---|---|---|
| `growth_d30_retention` (%) | Pricing fit + Growth value at SMB scale | #35 + #5 |
| `growth_d90_retention` (%) | Long-term Growth fit | #35 + #5 |
| `scale_renewal_rate` | Scale value at mid-market scale | #35 |
| `agency_renewal_rate` | Agency tier stickiness | #35 + #12 |
| `seat_utilisation_agency` | Agency tier value realisation; candidate for higher-seat tier | #35 + #12 |

### Revenue

| Metric | Decision it informs | Owner |
|---|---|---|
| `mrr` | Run-rate + fundraising | #35 + #11 |
| `arr` | Annual planning + fundability | #35 + #11 |
| `nrr_quarterly` | Pricing change readiness | #35 |
| `shopify_lifetime_gross` | Revenue-share crossover tracking ($1M threshold) | #35 + #11 |
| `agency_merchant_ratio` | SPEC §8.2 economic engine progression (co-north-star) | #35 + #12 |

### Reliability

| Metric | Decision it informs | Owner |
|---|---|---|
| `scan_success_rate_24h` | Scanner reliability; droplet CPU variability signal | #35 + #34 |
| `webhook_delivery_success_rate` | Shopify deregisters slow webhooks — protecting platform relationship | #35 + #33 + #4 |
| `bulk_sync_sla_adherence` | SLA compliance per tier; Scale + Enterprise promises | #35 + #17 + #33 |
| `mttr_p0_90d` | On-call / runbook quality | #35 + #10 |

### Channel Health (measured-impact layer — SPEC §11.2)

| Metric | Decision it informs | Owner |
|---|---|---|
| `ai_agent_clicks_per_shop_monthly` | Subscription retention narrative — does Flintmere actually drive AI-agent traffic? | #35 + #5 |
| `google_shopping_approvals_delta` | Parallel-channel value when AI-agent traffic is still small | #35 + #5 |

## Health checks (red lines, not goals)

These exist so we notice when something breaks. They are not optimisation targets.

- **Scanner error rate** → alert when >2% over 24h.
- **Growth tier churn** → alert when >8% in any 30-day window.
- **Agency tier churn** → alert when >5% in any 30-day window.
- **Webhook HMAC verification failure rate** → alert on any spike (>3/hr).
- **Bulk sync SLA miss rate** → alert when >5% in 7 days (Scale) or any miss in 7 days (Enterprise).
- **LLM spend / active merchant ratio** → alert when >£4 per merchant per month sustained (suggests prompt bloat or rate-limit escape).
- **Cookie-consent rejection rate** → observe; never optimise. Any proposal to "improve" it is a P0 — escalate to #24.

## Anti-patterns (banned KPIs)

- Likes, impressions, follower counts as primary metrics.
- "Time on page" as a goal.
- Anything per-merchant that joins identity to behaviour in a shared brief.
- Cohort metrics that require de-anonymising.
- Metrics computed two ways across two skills.
- Using scanner submission count as a conversion metric (scanner is top-of-funnel — conversion is Growth signup rate).
- Using install count as revenue (installs include Free tier).

## Maintenance

- A new KPI requires `define-metric` + #35 sign-off + entry here + entry in `metric-catalog.md`.
- Removing a KPI requires an ADR explaining why and what replaces it.
- Reframing the north-star requires #11 + #35 + the operator + an ADR.

## Changelog

- 2026-04-19: Rewritten for Flintmere. North-star: Paying Merchant Count (PMC). Replaced allowanceguard's "successful novel scans per week" with PMC — scans are top-of-funnel for Flintmere, not the value moment. Added Channel Health as a primary KPI category per SPEC §11.2.
