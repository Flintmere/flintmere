# metric-catalog.md — Every metric, defined once

The canonical definition of every metric AG measures. One row per metric. New metrics enter via the `define-metric` skill and an ADR-style sign-off from #35.

Format:

```
### <metric name>
- Definition: <plain-English; one sentence>
- Formula: <numerator / denominator / window>
- Source: <data source from `data-sources.md`>
- Refresh cadence: <real-time | hourly | daily | weekly | on-demand>
- Owner: <council member by number>
- Decision informed: <one sentence>
- Target / threshold: <if any>
- Aggregation level: <surface / cohort / global>
- PII risk: <none | low — verify aggregation | high — VETO without #24 sign-off>
- Cross-references: <links to dashboards, related metrics>
- Defined: YYYY-MM-DD
- Last reviewed: YYYY-MM-DD
```

---

## Acquisition

### organic_sessions_weekly
- Definition: Weekly count of unique sessions arriving from organic search.
- Formula: count(distinct session_id where source = 'organic' and timestamp in [week_start, week_end))
- Source: Vercel Analytics export (CSV)
- Refresh cadence: weekly
- Owner: #35
- Decision informed: SEO + content investment allocation
- Target / threshold: trend up week-over-week; quarterly +20%
- Aggregation level: global
- PII risk: none (no IP, no device fingerprint)
- Defined: 2026-04-17
- Last reviewed: 2026-04-17

### direct_branded_sessions_weekly
- Definition: Weekly sessions arriving direct or via a branded search query (e.g. "allowance guard").
- Formula: count(distinct session_id where source in ('direct', 'branded'))
- Source: Vercel Analytics export
- Refresh cadence: weekly
- Owner: #35
- Decision informed: brand health; PR / outreach effectiveness
- PII risk: none
- Defined: 2026-04-17

## Activation

### scan_rate_weekly
- Definition: Fraction of homepage sessions that complete a scan.
- Formula: scans_completed / homepage_sessions per week
- Source: Vercel Analytics + scan logs (aggregated)
- Refresh cadence: weekly
- Owner: #35 + conversion
- Decision informed: hero copy + CTA placement; Turnstile friction
- Target: ≥35% (baseline tuned per kpi-tree)
- PII risk: low — verify aggregation by route, not by wallet
- Defined: 2026-04-17

### connect_rate_weekly
- Definition: Fraction of completed scans where the user connected a wallet.
- Formula: wallet_connects / scans_completed per week
- Source: aggregated scan logs
- Refresh cadence: weekly
- Owner: #35 + #7
- Decision informed: connect UX + trust signals
- PII risk: low — never join wallet address to session
- Defined: 2026-04-17

### first_revoke_rate_weekly
- Definition: Of scans surfacing a risky approval, the fraction that resulted in at least one revoke action in the same session.
- Formula: scans_with_revoke / scans_with_risky_approval per week
- Source: aggregated scan logs
- Refresh cadence: weekly
- Owner: #35 + #7
- Decision informed: risk-flag clarity + revoke CTA placement
- PII risk: low — bucket by risk type, not by address
- Defined: 2026-04-17

## Conversion

### pro_signup_rate_weekly
- Definition: Pro signups divided by `/pricing` views.
- Formula: pro_signups / pricing_page_views per week
- Source: Stripe export + Vercel Analytics
- Refresh cadence: weekly
- Owner: #35 + conversion + #5
- Decision informed: pricing page persuasion
- PII risk: low — counts only
- Defined: 2026-04-17

### sentinel_signups_weekly
- Definition: New Sentinel subscriptions per week.
- Formula: count(subscriptions where plan in ('sentinel_monthly','sentinel_annual') and created in week)
- Source: Stripe export
- Refresh cadence: weekly
- Owner: #35 + #5
- Decision informed: Sentinel page persuasion + sales pipeline
- PII risk: low — counts; never customer email tied to behaviour
- Defined: 2026-04-17

### api_tier_signups_monthly
- Definition: API key activations split by tier (Developer / Growth) per month.
- Formula: count(api_keys where tier in ('developer','growth') and activated in month)
- Source: API key issuance log (aggregated)
- Refresh cadence: monthly
- Owner: #35 + #6
- Decision informed: API tier positioning + developer funnel
- PII risk: low — counts by tier
- Defined: 2026-04-17

## Retention

### pro_d30_retention
- Definition: Of Pro signups in cohort month M, the fraction still subscribed at day 30.
- Formula: pro_active_at_d30(M) / pro_signups(M)
- Source: Stripe export
- Refresh cadence: monthly (cohort closes at month-end + 30 days)
- Owner: #35 + #5
- Decision informed: pricing fit + Pro feature value
- Target: ≥70% (initial target; refine after 3 cohorts)
- PII risk: low — cohort counts only
- Defined: 2026-04-17

### pro_d90_retention
- Definition: Of Pro signups in cohort month M, the fraction still subscribed at day 90.
- Formula: pro_active_at_d90(M) / pro_signups(M)
- Source: Stripe export
- Refresh cadence: monthly
- Owner: #35 + #5
- Decision informed: long-term Pro fit
- Defined: 2026-04-17

### sentinel_renewal_rate
- Definition: Renewal rate at billing cycle end for Sentinel subscriptions.
- Formula: renewed / due_for_renewal per cycle
- Source: Stripe export
- Refresh cadence: monthly
- Owner: #35 + #5
- Defined: 2026-04-17

### api_key_active_7d
- Definition: Fraction of API keys with ≥1 successful call in the last 7 days.
- Formula: keys_with_call_7d / total_active_keys
- Source: API access log (aggregated)
- Refresh cadence: weekly
- Owner: #35 + #6
- Decision informed: developer activation health
- Defined: 2026-04-17

### scan_return_30d
- Definition: Fraction of scanning addresses (hashed bucket) that scan again within 30 days.
- Formula: returning_buckets / new_buckets in cohort
- Source: aggregated scan logs (bucket = hashed address mod N — never the address itself)
- Refresh cadence: monthly
- Owner: #35
- Decision informed: free-tier stickiness
- PII risk: **medium** — requires bucketing; verify with #19 before any change to bucket scheme
- Defined: 2026-04-17

## Revenue

### mrr
- Definition: Monthly recurring revenue across Pro + Sentinel + API tiers.
- Formula: sum(active_subscription.monthly_value) at snapshot
- Source: Stripe export
- Refresh cadence: weekly snapshot, month-end canonical
- Owner: #35 + #11
- Defined: 2026-04-17

### arr
- Definition: MRR × 12 at snapshot.
- Formula: mrr × 12
- Source: derived
- Refresh cadence: weekly
- Owner: #35 + #11
- Defined: 2026-04-17

### nrr_quarterly
- Definition: Net revenue retention for Pro + API cohorts at quarterly close.
- Formula: (cohort_revenue_q_end - new_in_quarter + churn) / cohort_revenue_q_start
- Source: Stripe export
- Refresh cadence: quarterly
- Owner: #35
- Defined: 2026-04-17

## Reliability

### scan_success_rate_24h
- Definition: Fraction of scan attempts in last 24h that returned data without an error code.
- Formula: scans_ok / scans_attempted (rolling 24h)
- Source: scan logs (aggregated)
- Refresh cadence: real-time (alerting); reported in weekly brief
- Owner: #35 + #34
- Threshold (red line): >2% error rate triggers alert
- Defined: 2026-04-17

### webhook_delivery_success_rate
- Definition: Fraction of incoming Stripe + Coinbase webhooks processed successfully.
- Formula: webhooks_processed_ok / webhooks_received
- Source: webhook log (aggregated)
- Refresh cadence: hourly aggregation
- Owner: #35 + #30 + #31
- Threshold: >1% failure triggers investigation
- Defined: 2026-04-17

### mttr_p0_90d
- Definition: Mean time to resolution on P0 incidents over rolling 90 days.
- Formula: mean(resolved_at - opened_at) for P0 incidents in window
- Source: incident log (`memory/product-engineering/incident-history.md`)
- Refresh cadence: monthly
- Owner: #35 + #10
- Defined: 2026-04-17

## Distribution

### grant_pipeline_value
- Definition: Sum across open grant applications of (amount requested × estimated probability of award).
- Formula: sum(amount × p_award) over status='open'
- Source: `memory/growth/grants-history.md`
- Refresh cadence: weekly
- Owner: #35 + #12
- Defined: 2026-04-17

### listing_referral_sessions_28d
- Definition: Sessions attributed to a listing in the 28 days after submission go-live.
- Formula: count(sessions where source matches listing referrer in [go_live, go_live+28d])
- Source: Vercel Analytics
- Refresh cadence: per-listing on a 28-day window
- Owner: #35 + #12
- Defined: 2026-04-17

---

## Removed metrics (kept for audit trail)

_None yet._
