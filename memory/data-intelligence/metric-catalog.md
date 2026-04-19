# metric-catalog.md — Every metric, defined once

Canonical definition of every metric Flintmere measures. One row per metric. New metrics enter via `define-metric` and an ADR-style sign-off from #35.

## Format

```
### <metric name>
- Definition: <plain-English; one sentence>
- Formula: <numerator / denominator / window>
- Source: <data source from data-sources.md>
- Refresh cadence: <real-time | hourly | daily | weekly | on-demand>
- Owner: <council #>
- Decision informed: <one sentence>
- Target / threshold: <if any>
- Aggregation level: <surface / cohort / global>
- PII risk: <none | low — verify aggregation | high — VETO without #24 sign-off>
- Cross-references:
- Defined: YYYY-MM-DD
- Last reviewed: YYYY-MM-DD
```

---

## Acquisition

### scanner_submissions_weekly
- Definition: Public scanner URL submissions completed per week.
- Formula: `count(scanner_scans where status='complete' and created_at in week)`
- Source: scanner Postgres export (aggregated weekly)
- Refresh: weekly (Mondays)
- Owner: #35
- Decision informed: scanner distribution + SEO + social effectiveness
- Target: ≥50 in Week 1 validation (SPEC §2.2)
- PII risk: none (URL + timestamp only, no email)
- Defined: 2026-04-19

### marketing_sessions_weekly
- Definition: Weekly unique sessions to flintmere.com marketing surfaces.
- Formula: `count(distinct session_id where path matches '/(?:|pricing|research|blog.*|audit).*' and timestamp in week)`
- Source: PostHog aggregated weekly export
- Refresh: weekly
- Owner: #35
- Decision informed: content + SEO investment allocation
- PII risk: none (PostHog self-hosted, no cross-site tracking)
- Defined: 2026-04-19

### email_optin_rate_weekly
- Definition: Fraction of completed scanner submissions that submit email for full report.
- Formula: `count(leads_created) / count(scans_complete) per week`
- Source: scanner Postgres export
- Refresh: weekly
- Owner: #35 + conversion
- Decision informed: email gate copy + position
- Target: ≥40% (SPEC §2.2)
- PII risk: low — counts only, no email values
- Defined: 2026-04-19

### concierge_audits_paid_weekly
- Definition: £97 concierge audits paid per week.
- Formula: `count(stripe_payments where product='concierge' and status='succeeded' and created_at in week)`
- Source: Stripe export
- Refresh: weekly
- Owner: #35 + #11
- Decision informed: validation of paid audit appetite (SPEC §2.2)
- Target: ≥5 in Week 1
- PII risk: low — counts only
- Defined: 2026-04-19

## Activation

### install_rate_weekly
- Definition: Shopify App Store installs per week from listing views.
- Formula: `count(installs) / count(listing_views) per week`
- Source: Shopify Partner Dashboard export
- Refresh: weekly
- Owner: #35 + #5
- Decision informed: Shopify listing copy, screenshots, pricing display
- PII risk: none (aggregates from Shopify)
- Defined: 2026-04-19

### first_scorecard_rate
- Definition: Of new installs in week W, fraction that see their first scorecard within 24h of install.
- Formula: `count(scorecards_rendered) / count(installs) in 24h-post-install window`
- Source: shopify-app Postgres export
- Refresh: weekly
- Owner: #35 + #7
- Decision informed: onboarding flow health; bulk sync reliability
- Target: ≥95%
- PII risk: none (counts only)
- Defined: 2026-04-19

### first_fix_applied_rate_d7
- Definition: Of installs at day 0, fraction that have applied at least one Tier 1 fix within 7 days.
- Formula: `count(shops with ≥1 tier1 fix applied in 7d) / count(installs at d0)`
- Source: shopify-app Postgres export
- Refresh: weekly
- Owner: #35 + conversion
- Decision informed: fix-apply UX + pillar prioritisation
- PII risk: none
- Defined: 2026-04-19

## Conversion

### growth_tier_signup_rate
- Definition: Growth tier subscriptions divided by pricing page views.
- Formula: `count(growth_subscriptions_created) / count(pricing_views) per week`
- Source: Shopify Managed Pricing + PostHog
- Refresh: weekly
- Owner: #35 + conversion
- Decision informed: pricing page persuasion; first-month £29 promo effect
- PII risk: low — counts only
- Defined: 2026-04-19

### scale_upgrade_rate_monthly
- Definition: Monthly Growth → Scale tier upgrades.
- Formula: `count(upgrades where from='growth' and to='scale' in month)`
- Source: Shopify Managed Pricing export
- Refresh: monthly
- Owner: #35 + #5
- Decision informed: value ladder — measures whether value grows with usage
- PII risk: none
- Defined: 2026-04-19

### agency_signups_weekly
- Definition: New Agency tier subscriptions per week.
- Formula: `count(stripe_subscriptions where plan='agency' and status='active' and created_at in week)`
- Source: Stripe export
- Refresh: weekly
- Owner: #35 + #12
- Decision informed: Agency acquisition channel effectiveness (SPEC §8.2 economic engine)
- PII risk: none
- Defined: 2026-04-19

### enterprise_deals_closed_monthly
- Definition: Enterprise contracts signed per month.
- Formula: `count(stripe_subscriptions where plan='enterprise' and created_at in month)`
- Source: Stripe export + operator-maintained pipeline log
- Refresh: monthly
- Owner: #35 + #11
- Defined: 2026-04-19

## Retention

### growth_d30_retention
- Definition: Of Growth tier signups in cohort month M, fraction still subscribed at day 30.
- Formula: `growth_active_at_d30(M) / growth_signups(M)`
- Source: Shopify Managed Pricing export
- Refresh: monthly (cohort closes at month-end + 30 days)
- Owner: #35 + #5
- Target: ≥70%
- PII risk: low — cohort counts only
- Defined: 2026-04-19

### growth_d90_retention
- Definition: Of Growth tier signups in cohort month M, fraction still subscribed at day 90.
- Formula: `growth_active_at_d90(M) / growth_signups(M)`
- Source: Shopify Managed Pricing export
- Refresh: monthly
- Owner: #35 + #5
- Defined: 2026-04-19

### scale_renewal_rate
- Definition: Renewal rate at billing cycle end for Scale tier.
- Formula: `renewed / due_for_renewal per cycle`
- Source: Shopify Managed Pricing export
- Refresh: monthly
- Owner: #35
- Defined: 2026-04-19

### agency_renewal_rate
- Definition: Renewal rate at billing cycle end for Agency tier direct Stripe subscriptions.
- Formula: `renewed / due_for_renewal per cycle`
- Source: Stripe export
- Refresh: monthly
- Owner: #35 + #12
- Defined: 2026-04-19

### seat_utilisation_agency
- Definition: For Agency subscribers, mean active client seats / 25 max per agency.
- Formula: `mean(active_client_seats_per_agency)` at snapshot
- Source: shopify-app Postgres export (aggregated)
- Refresh: weekly
- Owner: #35 + #12
- Decision informed: Agency tier value realisation; candidate for larger-agency tier if utilisation tops out
- PII risk: low — per-agency counts; agencies not named
- Defined: 2026-04-19

## Revenue

### mrr
- Definition: Monthly recurring revenue across all tiers (Shopify Managed + Stripe direct).
- Formula: `sum(active_subscription.monthly_value)` at snapshot
- Source: Shopify Managed Pricing + Stripe
- Refresh: weekly snapshot, month-end canonical
- Owner: #35 + #11
- Defined: 2026-04-19

### arr
- Definition: MRR × 12 at snapshot.
- Formula: `mrr × 12`
- Source: derived
- Refresh: weekly
- Owner: #35 + #11
- Defined: 2026-04-19

### shopify_lifetime_gross
- Definition: Cumulative gross revenue through Shopify Managed Pricing, for 15% revenue share crossover tracking.
- Formula: `sum(shopify_managed_gross) from install to now`
- Source: Shopify Partner Dashboard
- Refresh: weekly
- Owner: #35 + #11
- Threshold: approaching **$1M** → prepare for 15% cut
- Defined: 2026-04-19

### nrr_quarterly
- Definition: Net revenue retention for Growth + Scale cohorts at quarterly close.
- Formula: `(cohort_revenue_q_end - new_in_quarter + expansion - contraction - churn) / cohort_revenue_q_start`
- Source: Shopify Managed Pricing + Stripe exports
- Refresh: quarterly
- Owner: #35
- Defined: 2026-04-19

### agency_merchant_ratio
- Definition: Share of MRR derived from Agency tier (inc. agency-referred stores counted as contributing to the agency's MRR).
- Formula: `agency_mrr / total_mrr` at snapshot
- Source: Stripe + Shopify Managed Pricing
- Refresh: weekly
- Owner: #35 + #12
- Decision informed: SPEC §8.2 economic engine progression. Target progression: >10% (M3), >25% (M6), >40% (M12).
- PII risk: none
- Defined: 2026-04-19

## Reliability

### scan_success_rate_24h
- Definition: Fraction of scanner submissions in last 24h that return a valid score.
- Formula: `scans_ok / scans_attempted (rolling 24h)`
- Source: scanner Postgres (real-time)
- Refresh: real-time alert; weekly brief
- Owner: #35 + #34
- Threshold: >2% error → alert
- Defined: 2026-04-19

### webhook_delivery_success_rate
- Definition: Fraction of incoming Shopify + Stripe webhooks processed successfully within 5s budget.
- Formula: `webhooks_200_within_5s / webhooks_received`
- Source: webhook_events table (aggregated)
- Refresh: hourly
- Owner: #35 + #33 + #4
- Threshold: >1% failure → investigate; Shopify deregisters subscribers that trend low
- Defined: 2026-04-19

### bulk_sync_sla_adherence
- Definition: Fraction of bulk enrichment jobs completed within tier SLA.
- Formula: `jobs_on_time / jobs_completed`
- Source: BullMQ metrics export
- Refresh: daily
- Owner: #35 + #17 + #33
- Target: ≥95% for Scale; ≥99% for Enterprise
- Defined: 2026-04-19

### mttr_p0_90d
- Definition: Mean time to resolution on P0 incidents over rolling 90 days.
- Formula: `mean(resolved_at - opened_at)` for P0 in window
- Source: `memory/product-engineering/incident-history.md`
- Refresh: monthly
- Owner: #35 + #10
- Defined: 2026-04-19

## Channel Health (the measured-impact layer)

### ai_agent_clicks_per_shop_monthly
- Definition: Monthly AI-agent-attributed clicks to merchant store (from UTM on external-URL metafield).
- Formula: `sum(sessions where utm_source='flintmere' and utm_medium='ai_agent') per month per shop`
- Source: shopify-app Postgres (merchant self-reports GA4/Shopify-analytics via export); aggregated cross-merchant
- Refresh: monthly
- Owner: #35
- Decision informed: Channel Health widget value; subscription retention narrative (SPEC §11.2)
- PII risk: low — aggregated; per-shop reported only to that shop
- Defined: 2026-04-19

### google_shopping_approvals_delta
- Definition: Change in Google Shopping approvals month-over-month for merchants who ran fixes.
- Formula: `shop_level: approvals_post - approvals_pre`; aggregated as median across shops
- Source: merchant-provided Google Merchant Center exports (aggregated)
- Refresh: monthly
- Owner: #35
- Defined: 2026-04-19

## Distribution

### partnership_attributed_installs
- Definition: Installs attributed to a Shopify ecosystem or PIM-vendor integration announcement.
- Formula: `count(installs where referrer matches partnership window and source)`
- Source: Shopify Partner Dashboard + PostHog
- Refresh: per-campaign, with 28-day window
- Owner: #35 + #12
- Defined: 2026-04-19

---

## Removed / replaced metrics

- `connect_rate_weekly`, `first_revoke_rate_weekly`, `scan_return_30d`, `api_key_active_7d`, `sentinel_renewal_rate`, `grant_pipeline_value`, `listing_referral_sessions_28d` — all allowanceguard-specific metrics, retired 2026-04-19. Replaced by Flintmere equivalents above where applicable.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced wallet-scanner/Pro/Sentinel/API metrics with Flintmere metrics (scanner submissions, concierge audits, install rate, tier signups, agency_merchant_ratio, Channel Health). Added `shopify_lifetime_gross` for revenue-share crossover tracking.
