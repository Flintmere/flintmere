# ADR 0013 — Product analytics: Plausible Cloud (EU)

- **Status**: Accepted (amended 2026-04-25 evening — see §Amendment 1)
- **Date**: 2026-04-25
- **Decider**: Abu Aaliyah (operator) on council recommendation
- **Supersedes**: implicit "PostHog self-hosted" assumption baked into Privacy Policy clause 05 + DPA Annex 2 + Cookie Policy clause 02.2 (consent banner commitment for `ph_distinct_id`). Those documents will be updated in lockstep with this decision.

## Amendment 1 (2026-04-25 evening) — Self-host → Cloud

Original decision: Plausible Community Edition self-hosted on Coolify. Amended to **Plausible Cloud (EU region)** after droplet resource check revealed the existing DigitalOcean droplet is under-resourced for its current workload, let alone an additional analytics stack.

Droplet ground truth as of 2026-04-25 22:36 UTC:
- 2 vCPU, 7.8GB RAM, 154GB disk
- 4.2GB RAM available BUT 1.5GB of 2GB swap actively used (kernel swapping)
- 15-min load average 4.35 on 2 vCPUs = ~218% sustained CPU saturation
- Hosts 7+ services across THREE unrelated projects (SalafiMasjid, pageperfect, Flintmere); shopify-app deploy adds 3 more services in the next stage
- Adding Plausible CE stack (~1.5GB RAM + ClickHouse CPU appetite) would push the box past breaking point and risk cascade failures across ALL three projects, not just Flintmere

Cost of the amendment: $9/mo Plausible Cloud subscription. Cost of NOT amending: blast-radius risk across unrelated production businesses, plus ongoing droplet ops pain.

The privacy posture is preserved: Plausible Cloud is also cookieless (the entire reason we picked Plausible over PostHog stays intact). DPA gains one EU sub-processor (Plausible, Estonia). UK→EU adequacy applies — no IDTA paperwork needed. No consent banner needed. No `ph_distinct_id`-equivalent cookie. No Cookie Policy maintenance.

The "self-hosted" framing was about the privacy story, which was about cookieless + EU residency. Plausible Cloud delivers both. The literal-self-hosted-bit is conceded for $9/mo and the elimination of all operational complexity.

A separate concern surfaced during the resource check: the droplet itself needs attention (resize OR migrate non-Flintmere projects off OR both). That's logged as a known issue in STATUS.md but is not part of this ADR's scope.

## Context

Flintmere needs product analytics to answer six validation-week and first-12-months questions:

1. How many merchants visit `/scan`?
2. How many start a scan?
3. How many submit email for the report?
4. How many click "concierge audit"?
5. How many install the Shopify app (post-launch)?
6. (Later) Cohort retention 30/60/90 across paying tiers.

Stripe already covers payment events. Sentry covers error tracking. BetterStack covers uptime. The gap: funnel events.

Three serious candidates:

| Tool | Profile |
|---|---|
| **PostHog Cloud (EU)** | Heavyweight feature set (events + funnels + cohorts + session replay + feature flags + surveys + A/B testing). 1M events/mo free, then ~£60–£500/mo at growth tiers. Cookies (`ph_distinct_id`) require consent banner under PECR/UK GDPR. EU region available. |
| **Plausible Community Edition (self-host)** | Pageviews + custom events + basic funnels. Cookieless by design — no consent banner required. Self-hostable on Coolify; needs Postgres + ClickHouse (~1.5GB RAM stack, not the 50MB previously claimed in initial comparison). EU company (Estonia). Free. |
| **Plausible Cloud** | Same product, $9/mo from day one, no ops. |

## Decision (amended)

**Plausible Cloud (EU region — `eu.plausible.io`)**, $9/mo. No subdomain needed. Site `audit.flintmere.com` registered as the tracked domain.

Original decision was self-hosted on Coolify; superseded by Amendment 1 above after droplet resource check.

## Reasoning (council vote 8–2 in favour, with veto pressure from #37)

The decisive insight came from **#37 Consumer psychologist** under veto pressure: cookie consent banners suppress 30–50% of analytics signal at typical EU opt-in rates. PostHog's richer feature set is worthless if a third of visitors are unmeasured AND we add UX friction at the worst moment (the marketing → scanner conversion point). Cookieless analytics measures **100% of traffic** with **zero friction**.

Other supporting voices:

- **#15 Staff engineer**: switching cost later (Plausible → PostHog) is bounded — ~2 days of work + 1 month of dual-tracking when the migration is justified. The "pick once, stay forever" optimization is a trap; every tool gets migrated eventually. Bigger concern: building + maintaining a consent banner is more engineering than the analytics tool itself.
- **#24 Data Protection**: cookieless tools age better against tightening EU privacy regulation. Self-hosted = no cross-border transfer paperwork, no sub-processor in DPA, simpler SOC 2 audit later.
- **#36 Ops manager**: Plausible self-host = ~1 h/year ops (single CE container + Postgres + ClickHouse). PostHog full self-host = ~10–20 h/year (8+ containers including Kafka).
- **#4 Security**: events stay on our droplet (zero data egress to a cloud analytics vendor). Cleanest security posture.
- **#22 Conversion**: we cannot optimize what we cannot measure cleanly. Banner + 30–50% suppression = noisy data + worse decisions.

Voices against (acknowledged):

- **#5 Product marketing**: PostHog wins on analytical depth (cohort analysis, channel ROI breakdown, funnel attribution by source) — but at validation-week and first-12-months scale, those features are over-built. Council margin: revisit when the question gets to "show me retention by acquisition channel" — not before.
- **#34 Debugging**: PostHog's session replay is genuinely useful for support debugging — see what the user clicked. Sentry already provides stack traces with breadcrumbs, so this is marginal at our scale.

## The compounding-cost insight (the long-term framing)

The case for Plausible isn't "it's better." It's "**its costs are flat over time**" while PostHog's compound:

| Cost dimension | Plausible self-host (5-year horizon) | PostHog cloud (5-year horizon) |
|---|---|---|
| Vendor bill | £0 | £500–£2000/year by year 3 |
| Engineering (consent banner build + maintenance) | £0 (cookieless) | ~3 hours initial + ongoing tweaks per regulatory shift |
| Privacy doc churn (sub-processor reviews, DPA updates) | None (no sub-processor change) | Each PostHog policy update propagates to our DPA |
| Ops time | ~5 hours total | 0 (cloud is cloud) |
| Cookie Policy + Privacy Policy maintenance | Simpler — one fewer cookie row, no banner clause | Recurring updates to consent flow + cookie disclosures |

The compounding-cost gap exceeds the feature gap.

## Resource correction (honest)

Initial council comparison stated Plausible self-host = "~50MB RAM, single container." **This was wrong.** Plausible Community Edition v2 stack is:

- `plausible/community-edition` (the app — ~200MB)
- `postgres:14+` (~150MB at idle)
- `clickhouse-server` (~800MB–1GB at idle)

Total realistic footprint: **~1.2–1.5GB RAM**. Recommended droplet: 2 vCPU / 4GB RAM minimum — the existing Coolify droplet should accommodate this if it has ≥6GB free, but a resource check is mandatory before installation. If the droplet is constrained, options are:

1. Resize the droplet (one DO size step, ~$24/mo additional)
2. Use a separate small droplet for analytics ($12–24/mo isolated stack)
3. Reverse to Plausible Cloud ($9/mo, zero ops, identical product)
4. Switch to Umami (lighter — ~200MB stack — but less mature; same cookieless story)

Resource gate is baby step 1 of the implementation plan.

## Consequences

### Immediate (within one week of decision)

- **Privacy Policy clause 05**: update to reflect Plausible (Estonia, self-hosted) replacing PostHog (US, self-hosted). Sub-processor list mention deleted entirely if self-hosted; updated to PostHog → Plausible if cloud.
- **DPA Annex 2**: same update.
- **Cookie Policy clauses 02.2 + 05**: delete `ph_distinct_id` row, delete consent-banner commitment, replace with "we use Plausible (cookieless) — no consent banner required because no tracking technology is set."
- **`memory/admin-ops/vendor-register.md`**: replace PostHog row with Plausible row.
- **`memory/data-intelligence/`**: any PostHog-specific tooling references updated to Plausible API patterns.

### Long-term

- We accept that we will **migrate to PostHog** if any of the trigger conditions below fire. Plan for it: name events portably from day one (`scan_started`, `email_captured`, NOT `ps_001` or auto-IDs). Migration cost when triggered: ~2 days work + 1 month dual-tracking.
- We benefit from a cleaner privacy posture indefinitely while the decision holds.
- We avoid an entire class of work (consent banner UX, cookie management library, GPC honour code path).

## Triggers to revisit (codified — when ANY fires, re-evaluate)

| # | Trigger | Likely action |
|---|---|---|
| T1 | The `cohort-retention` skill needs analysis Plausible can't deliver (cohort segmentation by acquisition source × tier × first-action) | Migrate to PostHog Cloud EU. ~2 days work. |
| T2 | We're running 3+ A/B tests per quarter for two consecutive quarters | Migrate (PostHog has native experiment infrastructure). |
| T3 | Support team needs session replay to debug merchant-reported UI bugs (Sentry breadcrumbs aren't enough) | Migrate (and update Cookie Policy to add consent banner — significant new work). |
| T4 | An enterprise prospect requires session replay or feature-flag rollouts as part of vendor evaluation | Migrate. |
| T5 | Series A fundraising — investor explicitly asks for funnel-by-source breakdown that Plausible can't render | Migrate. |
| T6 | Plausible self-host costs >5 hours/quarter in ops time | Switch to Plausible Cloud ($9/mo) or migrate to PostHog. |
| T7 | Droplet resource pressure means Plausible can't co-exist with production services | Move Plausible to a dedicated small droplet ($12/mo) OR switch to Plausible Cloud. |

None of these are validation-week or first-12-months concerns at realistic adoption.

## Alternatives considered

- **PostHog Cloud (EU)** — rejected per council vote (8–2 against). Compounding costs + consent-banner UX hit + measurement suppression outweigh the feature depth.
- **PostHog self-host** — rejected even more strongly: all the disadvantages of PostHog Cloud plus heavy ops burden (8+ containers including Kafka).
- **Umami self-host** — viable lighter alternative (~200MB RAM stack, single container + Postgres). Less mature UI than Plausible, smaller ecosystem. Held in reserve as the resource-constrained fallback.
- **Plausible Cloud ($9/mo)** — viable if droplet resource check fails. Operationally simpler. Concedes the "self-hosted" story (Plausible Inc., Estonia, becomes a sub-processor).
- **No analytics tool — Stripe + server logs only** — rejected: insufficient for funnel optimization. We need event-level data for the marketing → scan → email → audit conversion path.
- **Vercel Web Analytics, Cloudflare Analytics** — rejected: tied to platforms we don't use.

## References

- Council session 2026-04-25 (this session's transcript — captured to `STATUS.md` Changelog).
- ADR 0010 (LLM fallback pivot — same compounding-cost vs feature-depth framing).
- Privacy Policy clause 05 (sub-processor list — needs update post-decision).
- DPA Annex 2 (sub-processor list — needs update post-decision).
- Cookie Policy clauses 02.2 + 05 (cookie inventory + control mechanisms — needs update post-decision).
- `memory/admin-ops/vendor-register.md` (vendor row — needs update post-decision).
