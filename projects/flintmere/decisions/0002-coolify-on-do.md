# 0002 — Coolify on existing DigitalOcean droplet as deployment layer

- **Status:** Accepted
- **Date:** 2026-04-19

## Context

Flintmere needs a deployment surface for two Node apps, Postgres, Redis, background workers, and a reverse proxy handling three subdomains. The operator already owns a DigitalOcean Basic 2 vCPU / 8GB droplet with Coolify installed. Other paths considered:

- **Vercel + Fly.io + Neon + Upstash** — managed platform-per-concern split
- **Fly.io only** — single managed Node platform with co-located Postgres + Redis
- **Railway** — similar to Fly, simpler DX
- **AWS ECS / App Runner / Copilot** — hyperscaler path
- **Keep Coolify + DO** — self-hosted, sunk droplet cost

Cost analysis performed earlier in planning conversation (preserved in commit history). Summary:

| Scale | Coolify + DO | Managed (Vercel+Fly+Neon) |
|---|---|---|
| 0–20 merchants | ~£73/mo | ~£64/mo |
| 20–100 | ~£285/mo | ~£375/mo |
| 100–500 | ~£900/mo | ~£1,130/mo |

## Decision

**Coolify on the existing DO droplet, with upgrade triggers.**

- Start on Basic 2 vCPU / 8GB / 160GB (~$48/mo; already paid).
- Upgrade trigger: 30 active paying merchants → Premium 4 vCPU / 8GB (~$84/mo) to escape shared-CPU variability.
- Second upgrade trigger: 100 merchants + SLA concerns → DO Managed Postgres (~$60/mo).
- Fallback trigger: if CPU variability hurts scanner p95 latency or queue backlog sustains >4h above SLA → split the Shopify app to Fly.io first; scanner stays on the droplet.
- Nightly Coolify backups to DO Spaces (~£5/mo for 250GB).

## Rationale

### Council

- **#11 Investor** — sunk droplet cost (~£576/yr paid regardless). Marginal cost of adding Flintmere is near-zero. At 100+ merchants we save meaningful money vs managed.
- **#10 DevOps** — Coolify is mature in 2026 (one-click Postgres 14–18, pgvector support, Let's Encrypt auto-renewal, S3 backups). Not experimental.
- **#34 Debugging** — SSH access + standard Linux tooling beats managed-platform log-dashboard debugging.
- **#4 Security** — single droplet = single security perimeter to harden. Data residency controllable (EU region if needed).
- **#24 Data protection** — "our data stays in EU" is a sellable answer to Shopify Plus buyers. Managed platforms require per-provider DPA review.
- **#17 Performance** — BullMQ workers can run long LLM enrichment jobs without hitting serverless execution limits. Streaming bulk-operation JSONL parsers can keep memory bounded.
- **#33 Backend engineer** — Docker + Postgres + Node is the most portable stack. If we ever need to move, migration cost is days, not weeks.

### Rejected options

- **Vercel + Fly + Neon split**: cheaper at launch (~£64 vs £73/mo) but the free-tier savings don't survive past 30 merchants. Operational overhead of three vendors is not trivial.
- **Fly.io only**: solid platform but CPU-cost curve at scale crosses Coolify-on-DO between 50–100 merchants.
- **AWS ECS / hyperscaler**: overkill for a pre-launch product; locks the cost curve into a hyperscaler ecosystem.

### Tradeoffs accepted

- **Shared CPU variability** on the Basic droplet: Next.js build times can range 2–10 minutes. Mitigated by building Docker images in GitHub Actions and having Coolify pull pre-built images, not build on the droplet.
- **Single-region deployment** (London or Amsterdam): fine for UK/EU-first positioning; not globally optimal if we later sell heavily to US merchants.
- **No built-in horizontal scaling**: Coolify multi-server is beta in 2026. Migrate before we need it, not after.
- **Operator burden**: ~2–4 hours/month in ops (OS patches, Coolify updates, debugging deploys). Accepted as tax for control.

## Consequences

- `Dockerfile` per app is canonical — no Procfile, no nixpacks special-casing.
- Prisma `migrate deploy` runs at container start (not build-time — build container can't reach DB).
- `memory/product-engineering/performance-budget.md` encodes the droplet-variability notes.
- Uptime monitoring (BetterStack) becomes mandatory before App Store submission — single-droplet means single point of failure; visibility is the mitigation.
- Disaster recovery: nightly DO Spaces backups + documented restore runbook before first paying customer.

## Rollout

1. Immediate: Coolify set up with `Flintmere/flintmere` repo, per-branch preview environments on feature branches.
2. Pre-validation-week: apps deployed to `audit-staging.flintmere.com` + `app-staging.flintmere.com` with dummy scoring.
3. Validation week 1 Day 1 (SPEC §12 item 1): DNS for `audit.flintmere.com`, first real scanner deployment.
4. Upgrade to Premium droplet triggered by active-merchant count (~30), not calendar.

## Re-open conditions

- Scanner p95 latency regularly >3s on paper (real-user metric).
- Queue backlog >4h above SLA for >7 days.
- Enterprise customer requires multi-region failover (re-evaluate architecture, not just deployment).
- Coolify multi-server GAs with good production stories — consider before sharding manually.
