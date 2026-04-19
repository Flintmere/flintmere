# kpi-tree.md — Canonical KPI tree

The single tree everyone refers to when arguing about a number. Owned by #35 Product analyst; updated by ADR.

## Shape

```
North-star
  ├── Primary KPIs (one per major surface / lifecycle stage)
  │     ├── Secondary metrics (diagnostic; not goals)
  │     └── Health checks (red lines; not goals)
```

## North-star

**Successful, novel scans per week** — the count of scan completions where (a) the scan returned approval data without error and (b) the scanned address was not scanned in the prior 7 days.

- Why: AG's value is realised the moment a wallet sees its approvals. Repeat-scan engagement is a secondary signal (good, but not the value moment). Novelty is the closest proxy to "we made a new wallet safer this week."
- Owner: #35 Product analyst.
- Refresh: weekly.
- Decisions it informs: roadmap prioritisation, fundraising narrative, public transparency posts.

## Primary KPIs

### Acquisition
| Metric | Decision it informs | Owner |
|---|---|---|
| Organic search sessions to `/` + `/blog/*` (weekly) | Content strategy + SEO investment | #35 + marketing analytics |
| Direct + branded sessions (weekly) | Brand health; outreach + PR effectiveness | #35 + #5 |
| Referral sessions from listings (DeFi Llama, Product Hunt, awesome-lists) | Listing-submission ROI | #35 + #12 |

### Activation
| Metric | Decision it informs | Owner |
|---|---|---|
| Scan-rate (scans / sessions, weekly) | Hero clarity; CTA position; Turnstile friction | #35 + conversion |
| Connect-rate (connect-wallet / scan, weekly) | Connect-wallet UX; trust signal placement | #35 + #7 + design |
| First-revoke rate (revokes / scans-with-risky-approvals, weekly) | Risk-flagging clarity; revoke CTA discoverability | #35 + #7 |

### Conversion
| Metric | Decision it informs | Owner |
|---|---|---|
| Pro signup rate (Pro signups / pricing page views, weekly) | Pricing page persuasion | #35 + conversion + #5 |
| Sentinel signups (count, weekly) | Sentinel page persuasion + sales pipeline | #35 + conversion + #5 |
| API tier signups (Developer + Growth, monthly) | API tier positioning + developer funnel | #35 + #6 |

### Retention
| Metric | Decision it informs | Owner |
|---|---|---|
| Pro 30-day retention (% of Pro signups still subscribed at day 30) | Pricing fit + Pro feature value | #35 + #5 |
| Pro 90-day retention | Long-term value validation | #35 + #5 |
| Sentinel renewal rate (annual or monthly per plan) | Sentinel enterprise fit | #35 + #5 |
| API key activity (% of API keys with ≥1 call in last 7 days) | Developer activation health | #35 + #6 |
| Scan-return rate (% of scanning addresses scanning again in 30 days) | Free-tier stickiness | #35 |

### Revenue
| Metric | Decision it informs | Owner |
|---|---|---|
| MRR (Pro + Sentinel + API tiers) | Run-rate + fundraising | #35 + #11 |
| ARR | Annual planning + fundability narrative | #35 + #11 |
| Net revenue retention (Pro + API cohorts) | Pricing change readiness | #35 |
| LTV / CAC ratio (where calculable) | Marketing spend allocation | #35 + #5 |

### Reliability (engineering KPIs)
| Metric | Decision it informs | Owner |
|---|---|---|
| Scan success rate (% of scans returning data without error, weekly) | Indexer / RPC health | #35 + #34 |
| Webhook delivery success rate (Stripe + Coinbase) | Payment reliability | #35 + #30 + #31 |
| MTTR on P0 incidents (rolling 90-day) | On-call / runbook quality | #35 + #10 |

### Distribution (growth KPIs)
| Metric | Decision it informs | Owner |
|---|---|---|
| Grant pipeline value (open applications × amount × estimated probability) | Growth focus + cashflow planning | #35 + #12 |
| Listing-driven sessions per listing (28-day post-listing) | Listing-submission ROI by directory | #35 + #12 |
| Partnership-attributed scans (where partner integration drives traffic) | Integration-proposal prioritisation | #35 + #12 + #6 |

## Health checks (red lines, not goals)

These exist so that we notice when something breaks. They are not optimisation targets.

- **Scan error rate** — alert when >2% over 24h.
- **Pro churn rate** — alert when >5% in any 30-day window.
- **API 5xx rate** — alert when >0.5% over 1h.
- **Webhook signature-verification failure rate** — alert on any spike (>3 in 1h).
- **Cookie-consent rejection rate** — observe; do not optimise. If we see attempts to "improve" this metric, that itself is a red flag.

## Anti-patterns (banned KPIs)

- Likes, impressions, follower counts as primary metrics.
- "Time on page" as a goal.
- Anything per-wallet that joins identity to behaviour.
- Cohort metrics that require de-anonymising.
- Metrics computed two ways across two skills.

## Maintenance

- A new KPI requires `define-metric` + #35 sign-off + an entry here + an entry in `metric-catalog.md`.
- Removing a KPI requires an ADR explaining why and what replaces it.
- Reframing the north-star requires #11 + #35 + the operator.
