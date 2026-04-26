# vendor-register.md — Every paid vendor

Single source of truth for vendor relationships. `vendor-review` reads this; `finance-snapshot` reads this for spend lines; `legal-page-draft` reads this when listing sub-processors in DPA / Privacy Policy. Operator alone modifies. New vendors require #36 + #24 (if data processor) + #9 (if contract).

## Schema

```
### <vendor name>
- Service: <what they provide>
- Plan: <plan name + tier>
- Monthly cost: <approx GBP>
- Renewal: <monthly / annual / per-use>
- Renewal date: <next>
- Lock-in level: <low / medium / high>
- Data processor: <yes / no — if yes, listed in DPA?>
- DPA in place: <yes / no / N/A>
- Sub-processors: <link>
- Alternatives evaluated: <list>
- Last reviewed: <YYYY-MM-DD>
- Notes:
```

### Lock-in level

- **Low**: switching = days. Standard data format.
- **Medium**: switching = weeks. Some reformatting required.
- **High**: switching = months. Proprietary formats, deep integration.

---

## Hosting + infra

### DigitalOcean
- Service: Droplet (Basic 2 vCPU / 8GB / 160GB) + Spaces (backups)
- Plan: Basic (upgrade trigger: Premium 4 vCPU / 8GB at ~30 paying merchants)
- Monthly cost: ~£38 (droplet) + ~£4 (Spaces) ≈ £42
- Renewal: monthly
- Lock-in level: **low** — standard VMs; docker images portable
- Data processor: yes (all operational data)
- DPA in place: yes (DO DPA)
- Sub-processors: DO's own infra
- Alternatives: Hetzner, Vultr, AWS Lightsail
- Last reviewed: 2026-04-19
- Notes: region LON1 primary. See `decisions/0002-coolify-on-do.md`.

### Coolify
- Service: Self-hosted PaaS (open source) — deploys + Traefik + SSL + backups
- Plan: free (open source, self-hosted)
- Monthly cost: £0
- Lock-in level: **low** — Docker + Postgres + Redis stack portable
- Data processor: N/A (runs on our droplet)
- Notes: version pinned; security updates tracked

## Database + queue (on droplet)

### Postgres 16 (Coolify-provisioned)
- Service: primary database
- Cost: £0 (on droplet; included)
- Lock-in: **low** — standard Postgres; pg_dump portable
- Notes: schemas `scanner_*` and `app_*`. Managed-Postgres migration trigger: ~100 paying merchants.

### Redis (Coolify-provisioned)
- Service: BullMQ queue backend, caching
- Cost: £0 (on droplet)
- Lock-in: **low**
- Notes: Upstash migration option if we ever split workers off-droplet.

## LLM providers

### Google Vertex AI (primary)
- Service: Gemini 2.5 Flash (primary bulk) + Gemini 2.5 Pro (hard cases). Region `europe-west1`.
- Plan: pay-per-use enterprise
- Monthly cost: usage-based — ~£150–250 at 100 merchants; scales linearly
- Renewal: per-use
- Lock-in level: **medium** — SDK portable via `packages/llm` abstraction; prompt engineering specific per model
- Data processor: yes (merchant catalog data in prompts)
- DPA in place: yes (Google Cloud DPA covers our use)
- Sub-processors: Google Cloud
- Alternatives evaluated: Anthropic Claude (Bedrock EU), Azure OpenAI, Amazon Nova
- Last reviewed: 2026-04-19
- Notes: region pinning enforced. See `decisions/0005-llm-provider-strategy.md` + `0006-hardcase-llm-lock-gemini-pro.md`.

### OpenAI Platform (fallback) — ADR 0010
- Service: GPT-4o-mini direct API, fallback behind circuit breaker
- Region: Global (US-routed by default; **no formal EU residency on this account tier**)
- Posture: code-level data minimization — `store: false` hard-coded (suppresses 30-day app-state retention; does NOT exempt from abuse-monitoring retention), project-scoped key (`sk-proj-…`) only, PII sanitizer pre-transmission, vision fallback disabled. True Zero Data Retention is sales-gated (bundled with EU residency) and not in effect on this account tier — abuse-monitoring retention of prompts + completions applies for up to 30 days.
- Plan: pay-per-use, hard £200/mo cap configured at platform.openai.com
- Monthly cost: ~£15–30 (fallback traffic only; expected <1% of LLM volume)
- Lock-in: **low** — SDK already in deps, swap is env-flip + provider class instance
- Data processor: yes — must appear on Flintmere DPA sub-processor list with US-routing disclosure
- DPA in place: yes (org-level OpenAI DPA, signed before key activation per ADR 0010)
- Org: Eazy Access Ltd; Project: `flintmere-fallback` (`proj_tm1F1hYtq8pfQXdjPMut18Dw`)
- Re-open triggers (escalate to ADR 0012): enterprise prospect requires EU-pinned sub-processor; fallback traffic >5% of LLM volume sustained; sanitizer redaction rate >5%; OpenAI exposes self-serve EU residency on this org tier
- Last reviewed: 2026-04-25
- Notes: residency upgrade path is procurement-only (no code rewrite). See `decisions/0010-fallback-pivot-openai-platform.md`.

## Payments

### Stripe
- Service: Agency + Enterprise direct invoicing + £97 concierge audit one-offs
- Plan: standard
- Monthly cost: per-transaction (~2.9% + 20p UK, international varies)
- Lock-in level: **high** — customer IDs, subscription history, payment methods in Stripe
- Data processor: yes (payment data)
- DPA in place: yes
- Alternatives: none (Stripe is incumbent for our use case)
- Notes: PCI handled by Stripe. Webhook handlers via `webhook-review`.

### Shopify Managed Pricing
- Service: Growth + Scale tier billing (0% first $1M lifetime, 15% after)
- Plan: default Partner agreement
- Monthly cost: Shopify revenue share on applicable tiers
- Lock-in level: **high** — merchant relationship + Shopify App Store dependent
- Data processor: yes (billing + subscription data)
- Notes: Shopify owns the billing flow; we read subscription state via API.

## Email + comms

### Resend
- Service: transactional email (scanner full reports, drift alerts, support)
- Plan: Free → Pro at volume
- Monthly cost: £0 up to 3K/mo; ~£16/mo at 15K volume
- Renewal: monthly
- Lock-in: **low** — standard SMTP fallback, template migration straightforward
- Data processor: yes (recipient list)
- DPA in place: yes (Resend DPA)
- Sub-processors: AWS
- Alternatives: Postmark, SES, Loops
- Notes: PECR/GDPR consent for outreach. Transactional exempt but we include unsubscribe anyway.

## Observability

### Sentry
- Service: error tracking (both apps)
- Plan: Team (when volume justifies)
- Monthly cost: £0 dev → ~£21 Team tier at scale
- Lock-in: **low**
- Data processor: yes (error event data)
- DPA in place: yes
- Notes: PII scrubbing verified before send. Never Shopify access tokens to Sentry.

### Plausible (Cloud, EU)
- Service: product analytics (cookieless)
- Plan: Growth ($9/mo, 10K monthly pageviews)
- Monthly cost: ~£7/mo (USD-billed)
- Renewal: monthly
- Lock-in level: **low** — open source; Plausible CE self-host migration possible; PostHog migration via re-instrumentation if triggers in ADR 0013 fire
- Data processor: yes (aggregated product events; no IP storage by design)
- DPA in place: yes (Plausible DPA — Estonia / EU; UK→EU adequacy)
- Sub-processors: AWS EU
- Alternatives evaluated: PostHog (cloud + self-host), Umami, Plausible self-host — see ADR 0013
- Last reviewed: 2026-04-26
- Notes: cookieless by design; no consent banner needed; supersedes the
  earlier PostHog plan (see ADR 0013 §Amendment 1 — droplet resource
  pressure forced Cloud over self-host; council pivoted from PostHog to
  Plausible for the cookieless story + measurement quality). Migration
  triggers to PostHog: cohort retention need, 3+ A/B tests/quarter
  consistently, session replay need, enterprise prospect ask, Series A.

### BetterStack Uptime
- Service: uptime monitoring + status page
- Plan: Free tier
- Monthly cost: £0 (upgrade when we exit Free tier)
- Lock-in: **low**
- Notes: monitors `audit.flintmere.com`, `app.flintmere.com`, OAuth callback.

## Source control + CI

### GitHub
- Service: git hosting + Actions CI + Issues
- Plan: Free (individual) → Team at scale
- Monthly cost: £0 → ~£4/user
- Lock-in: **medium** — git portable; Actions + Issues specific
- Data processor: yes (contributor data)
- DPA in place: yes
- Alternatives: GitLab, Codeberg
- Notes: `Flintmere/flintmere` repo (org-owned).

## Identifiers (optional, usage-based)

### GS1 GEPIR API (optional)
- Service: real-time GTIN verification
- Plan: free tier (rate-limited) → paid at volume
- Monthly cost: £0 → ~£10–30 at scale
- Lock-in: **low** — only one provider, but usage is minor
- Data processor: no (verification only; no catalog data sent)
- Notes: use rate-limited per-merchant-tier.

## Anthropic (dev tooling, not production)

### Anthropic (Claude Code)
- Service: Claude API + Claude Code CLI (operator tooling; not in production Flintmere path)
- Plan: per-use
- Monthly cost: usage-based (operator-owned)
- Lock-in: **medium** — Claude Code skills are Claude-specific
- Data processor: N/A for production (does not process merchant data)
- Notes: used for meta-layer + code scaffolding. Not a production vendor.

## Vendors evaluated and rejected

- **DeepSeek (V3 + VL)** — rejected 2026-04-19. Legal Council veto: China hosting fails GDPR cross-border test. See `decisions/0005`.
- **Qwen direct API** — rejected on same grounds.
- **Vercel + Fly.io + Neon** (managed stack) — rejected 2026-04-19. Coolify + DO chosen per `decisions/0002`. Revisit if CPU variability hurts.
- **Drizzle (ORM)** — rejected in favour of Prisma. See `decisions/0004`.

## Renewal calendar

See `ops-calendar.md` for renewal dates. `vendor-review` runs ≥30 days before any annual renewal.

## Sub-processor disclosure

The DPA at `apps/*/app/dpa/` (when built) lists sub-processors. Adding a vendor that processes user data requires:

1. Vendor entry here.
2. `legal-page-draft` updates DPA.
3. `legal-page-draft` updates Privacy Policy if a new category of processing.
4. #24 sign-off.
5. Merchant notification per DPA terms (typically 30 days for material changes).

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard vendor list (Vercel, Neon, Cloudflare, Coinbase Commerce) with Flintmere list (DigitalOcean + Coolify, Vertex AI + Azure OpenAI, Stripe + Shopify Managed Pricing, Resend, Sentry, PostHog, BetterStack, GitHub). Added rejected-vendors audit trail.
