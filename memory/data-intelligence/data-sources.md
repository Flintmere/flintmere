# data-sources.md — Registered data sources

Every source a data-intelligence skill may reference. Skills are read-only against local exports under `context/`. **No skill calls a live API or hits Postgres directly.**

## Format

```
### <source name>
- Owner (operational): <person/role>
- Owner (council): <#>
- Access pattern: read-only via local export under `context/<path>`
- Export cadence: <how often operator drops a fresh export>
- Retention (in source): <source's own retention>
- Retention (in context/): <≤30 days unless pinned>
- Lawful basis: <legitimate interest | consent | contract | legal obligation>
- PII present in raw export: <yes/no — fields enumerated>
- Aggregation required before analysis: <yes/no — minimum bucket size>
- Privacy Policy reference:
```

---

## Plausible Cloud (EU)

- Owner (operational): operator
- Owner (council): #35 + #24
- Access pattern: Plausible Stats API export → `context/data-intelligence/plausible/<YYYY-MM-DD>.csv`
- Export cadence: weekly (Mondays)
- Retention (in source): per Plausible Cloud Pro tier (rolling visitor data)
- Retention (in context/): 30 days
- Lawful basis: legitimate interest (cookieless analytics; no consent banner required per ADR 0013 + Cookie Policy clauses 02.2 + 05)
- PII present: no (cookieless by design; IP addresses hashed server-side at Plausible)
- Aggregation required: per-event + per-day at report level; custom property dimensions (e.g. `hero_variant` per `metric-catalog.md` §Event-prop registry) read as cohort splits.
- Privacy Policy reference: analytics + cookies section
- Site: `audit.flintmere.com` (registered against the Eazy Access Ltd Plausible org).
- Adopted 2026-04-25 per ADR 0013 (replaces self-hosted PostHog plan that was infeasible on the shared droplet at scan-time resource budget).

## Shopify Partner Dashboard

- Owner (operational): operator
- Owner (council): #35 + #11 + #5
- Access pattern: CSV export from Partner Dashboard → `context/data-intelligence/shopify-partner/<YYYY-MM-DD>.csv`
- Export cadence: weekly
- Retention (in source): Shopify-controlled
- Retention (in context/): 30 days
- Lawful basis: contract (Partner Program Agreement)
- PII present: shop domain + install date + merchant email (in some exports). **Drop email column at import.**
- Aggregation required: yes — by tier + week. Shop domain retained only as a hashed cohort key for retention analysis.
- Privacy Policy reference: Shopify Partner section

## Stripe export

- Owner (operational): operator
- Owner (council): #35 + #30 + #11
- Access pattern: Stripe dashboard CSV → `context/data-intelligence/stripe/<YYYY-MM-DD>.csv`
- Export cadence: weekly; month-end canonical for MRR
- Retention (in source): per Stripe terms
- Retention (in context/): 30 days
- Lawful basis: contract (paid Agency + Enterprise subscribers; £97 concierge)
- PII present: yes (customer email, customer ID, billing country, payment method last 4)
- Aggregation required: **YES** — drop email + customer ID + last 4 at import. Use hashed customer ID only as cohort key.
- Privacy Policy reference: payments + billing section

## Postgres (apps data — both schemas)

- Owner (operational): operator (no direct read by data-intelligence)
- Owner (council): #18 + #35
- Access pattern: **engineering generates aggregated exports**; data-intelligence does not connect.
  - Scanner leads + scans: weekly aggregated → `context/data-intelligence/scanner/<YYYY-MM-DD>.csv` with counts only
  - Shopify app merchants + scores + fixes: weekly aggregated → `context/data-intelligence/shopify-app/<YYYY-MM-DD>.csv`
  - Shop domain, scoring, fix data **NEVER leaves Postgres at row level for this dept**
- Export cadence: weekly
- Retention (in source): per `memory/product-engineering/security-posture.md`
- Retention (in context/): 30 days
- Lawful basis: legitimate interest (operating service); aggregation mandatory
- PII present in export to context/: **no — engineering pre-aggregates**
- Aggregation required: bucket size ≥ 50
- Privacy Policy reference: service operation section

## Vertex AI + Azure OpenAI billing

- Owner (operational): operator
- Owner (council): #35 + #17 + #36
- Access pattern: Google Cloud Billing + Azure Cost exports → `context/data-intelligence/llm-spend/<YYYY-MM-DD>.csv`
- Export cadence: weekly
- Retention (in source): per provider
- Retention (in context/): 30 days
- Lawful basis: contract (our billing with providers)
- PII present: no (aggregate cost + model + region)
- Aggregation required: by model + week
- Notes: cost per merchant calculated downstream, never joined to merchant identity in shared briefs

## BullMQ metrics

- Owner (operational): operator
- Owner (council): #35 + #17 + #33
- Access pattern: Coolify log export → `context/data-intelligence/bullmq/<YYYY-MM-DD>.csv`
- Export cadence: weekly
- Retention (in source): per Coolify
- Retention (in context/): 30 days
- Lawful basis: legitimate interest (ops)
- PII present: shop_domain appears in job metadata — **strip at export**
- Aggregation required: yes (queue × week + success/failure counts)

## Sentry

- Owner (operational): operator
- Owner (council): #4 + #35
- Access pattern: Sentry aggregated export → `context/data-intelligence/sentry/<YYYY-MM-DD>.csv`
- Export cadence: weekly (or on-demand for incident analysis)
- Retention (in source): 90 days hot, 13 months cold, then deleted
- Retention (in context/): 30 days
- Lawful basis: legitimate interest (ops)
- PII present: no (PII scrubbing enabled at Sentry project config)
- Aggregation required: by error type + week

## BetterStack Uptime

- Owner (operational): operator
- Owner (council): #35 + #10
- Access pattern: BetterStack export → `context/data-intelligence/uptime/<YYYY-MM-DD>.csv`
- Export cadence: weekly
- Retention (in source): per BetterStack
- Retention (in context/): 30 days
- Lawful basis: legitimate interest
- PII present: no
- Aggregation required: no at row level (monitor-based), yes at report level

## GitHub (open-source metrics)

- Owner (operational): operator + #2
- Owner (council): #2 + #35
- Access pattern: GitHub API → operator-generated weekly JSON → `context/data-intelligence/github/<YYYY-MM-DD>.json`
- Export cadence: weekly
- Retention: 30 days in context/
- Lawful basis: public information
- PII present: yes (GitHub usernames — public)
- Aggregation required: usernames are public but never joined to behavioural data outside GitHub

## Support inbox

- Owner (operational): operator + #36
- Owner (council): #36 + #24 + #35
- Access pattern: aggregated weekly export of categorised tickets → `context/data-intelligence/support/<YYYY-MM-DD>.csv`
- Export cadence: weekly
- Retention (in source): per support tool + privacy policy
- Retention (in context/): 30 days; aggregated trends pinned longer
- Lawful basis: legitimate interest
- PII present: **NO — categories + counts only.** No quotes from user messages, no email addresses.
- Aggregation required: yes; bucket = category × week
- Privacy Policy reference: support + contact section

## Incident log

- Owner (operational): operator + #10
- Owner (council): #10 + #35
- Access pattern: read `memory/product-engineering/incident-history.md`
- Export cadence: live (file is canonical)
- Retention: append-only; never deleted
- Lawful basis: internal records; no PII
- PII present: no

## Experiment log + marketing experiments

- Owner (operational): operator
- Owner (council): #35
- Access pattern: read `memory/data-intelligence/experiment-log.md` + `memory/marketing/experiments.md`
- Export cadence: live
- Retention: append-only

---

## Banned sources

- Live Postgres connection from a data-intelligence skill.
- Live Stripe / Shopify / Vertex AI API calls from data-intelligence.
- Any third-party tracking pixel data (we don't run any).
- Any source whose data was collected outside the live Privacy Policy scope.
- Any source that requires de-anonymising a merchant's shop domain or customer-level Shopify data.

## Onboarding a new source

1. Operator + #35 propose the source.
2. #24 + #23 review for lawful-basis fit + Privacy Policy alignment.
3. If approved, register here with the full template.
4. Engineering builds the export pipeline if needed.
5. First export treated as a dry-run; aggregation correctness verified before brief writing.

## Changelog

- 2026-04-28: PostHog source block replaced with Plausible Cloud (EU). PostHog was the original analytics plan but never landed; ADR 0013 (2026-04-25) reversed to Plausible Cloud after the droplet resource check found self-hosted infeasible. Source block was stale on this file until now.
- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard sources (Vercel Analytics, production scan/indexer data, Coinbase webhooks) with Flintmere sources (PostHog, Shopify Partner Dashboard, Postgres on droplet, Vertex AI + Azure OpenAI billing, BullMQ, BetterStack).
