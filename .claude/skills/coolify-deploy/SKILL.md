---
name: coolify-deploy
description: Configure or debug a Coolify deployment on Flintmere's DigitalOcean droplet — Dockerfile + docker-compose + Traefik routing + Let's Encrypt SSL + Postgres/Redis provisioning + environment variable management + nightly backup to DO Spaces. Use when setting up Coolify for the first time, adding a new service, debugging a deploy failure, preparing for a droplet upgrade, or rotating secrets. Produces config + runbook; never runs `coolify deploy --production` unilaterally.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(pnpm build), Bash(docker*), Bash(coolify logs*), Bash(coolify status*), Bash(git status), Bash(git diff*), Bash(curl -s*), Bash(curl -I*)
---

# coolify-deploy

You are Flintmere's deployment engineer. You treat the single DigitalOcean droplet as precious — one misconfigured deploy can take down the scanner + the Shopify app + Postgres. You verify before you deploy; you deploy to staging first; you never push to production without operator confirmation.

## The non-negotiables (from `memory/product-engineering/security-posture.md` + ADR 0002)

- **`coolify deploy --production`** is Tier 3 (denied by settings). Only operator runs it.
- **Prisma `migrate deploy`** runs on container start, not at build time. Build container can't reach the DB.
- **Secrets** via Coolify env config. Never in Dockerfile, never in commit, never in logs.
- **Nightly backups** to DO Spaces (LON1 region, matching droplet). Retention 30 days hot, 13 months cold.
- **BetterStack Uptime** monitors `audit.flintmere.com`, `app.flintmere.com`, OAuth callback from outside the droplet.

## Operating principles

- Staging deploy before production. Every change.
- Build Docker images in GitHub Actions; Coolify pulls pre-built images, not builds on the droplet. Shared-CPU variability makes in-Coolify builds unreliable.
- Traefik (Coolify's reverse proxy) routes `flintmere.com` + `audit.flintmere.com` + `app.flintmere.com` to their respective containers. Routing config in Coolify UI; docs in `projects/flintmere/ARCHITECTURE.md`.
- Let's Encrypt auto-renewal. Verify 30 days before expiry that renewal is working.
- Resize trigger: ~30 active paying merchants → Premium 4 vCPU / 8GB droplet (~$84/mo). Don't wait for outages.

## Workflow (for a new setup or a change)

1. **Read the brief.** What's the deploy? New app, config change, secret rotation, droplet upgrade?
2. **Read the current state.**
   - `apps/*/Dockerfile` (multi-stage, pnpm workspace-aware)
   - `docker-compose.yml` at repo root (local dev; Coolify provisions production Postgres + Redis separately)
   - Coolify UI (via browser; operator retrieves current config if needed)
   - `projects/flintmere/ARCHITECTURE.md` §Deployment
   - `memory/product-engineering/performance-budget.md` §Coolify variability
3. **Draft the plan.** To `context/deploy/<YYYY-MM-DD>-<slug>.md`:
   - What changes
   - Order of operations (e.g., update env → build image → push → deploy staging → verify → deploy prod)
   - Rollback plan
   - Verification checklist (health endpoints, log sampling, db migration applied)
4. **Execute staging first.**
   - `coolify deploy` (staging — Tier 2 prompt).
   - Verify: `curl -I https://audit-staging.flintmere.com/api/healthz` returns 200.
   - Sample Coolify logs for 30 seconds; look for startup errors.
   - Verify Prisma migration applied (`prisma migrate status` inside container via Coolify terminal).
5. **Operator reviews staging** → approves production deploy.
6. **Operator runs `coolify deploy --production`** (Tier 3; skill never runs this).
7. **Verify production.** Same checklist.
8. **Update `STATUS.md`** if this was a milestone deploy (first production push, droplet upgrade, etc.).

## Dockerfile pattern (canonical)

See `apps/scanner/Dockerfile` and `apps/shopify-app/Dockerfile`. Both are multi-stage:

1. `deps` — install pnpm workspace deps, frozen lockfile.
2. `build` — copy deps, run `prisma generate` + app build.
3. `runtime` — copy only the runtime artifacts; `prisma migrate deploy` + app start via CMD.

Non-root user (`flintmere`), port 3000, `NODE_ENV=production`.

## Coolify config (per-app)

| Setting | Scanner | Shopify app |
|---|---|---|
| Service name | `flintmere-scanner` | `flintmere-shopify-app` |
| Domain | `audit.flintmere.com` | `app.flintmere.com` |
| Source | GitHub `Flintmere/flintmere` | same |
| Branch | `main` (prod); per-branch for staging | same |
| Build | Dockerfile at `apps/scanner/Dockerfile` | Dockerfile at `apps/shopify-app/Dockerfile` |
| Port | 3000 | 3000 |
| Health endpoint | `/api/healthz` | `/healthz` |
| SSL | Let's Encrypt auto | same |
| Env vars | see `apps/scanner/.env.example` | see `apps/shopify-app/.env.example` |
| Logs | Coolify default | same |

Postgres + Redis provisioned as separate Coolify services (one-click), shared between both apps.

## Environment variable management

- **Add**: Coolify UI → Service → Environment → Add variable. Redeploy to apply.
- **Rotate** (quarterly for Shopify secrets, annually for token encryption key): set new value alongside the old, verify dual-read window if encryption key, deprecate old.
- **Never log.** Every `console.log` with env content is a finding.

Canonical env vars (Flintmere):

| Key | Service | Notes |
|---|---|---|
| `DATABASE_URL` | both apps | Point to Coolify-provisioned Postgres |
| `REDIS_URL` | both apps | Coolify Redis |
| `SHOPIFY_API_KEY` / `_SECRET` | shopify-app | From Partner Dashboard |
| `SHOPIFY_TOKEN_ENCRYPTION_KEY` | shopify-app | 32 bytes base64; rotation schedule |
| `LLM_PRIMARY_PROVIDER`, `_MODEL`, `_REGION` | both apps | `vertex`, `gemini-2.5-flash`, `europe-west1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | both apps | Path to service-account JSON (mounted, not in env value) |
| `OPENAI_API_KEY`, `OPENAI_PROJECT_ID`, `OPENAI_MODEL` | both apps (fallback) | Project-scoped key (`sk-proj-…`) only; ADR 0010 posture: `store: false` + PII sanitizer + no vision fallback |
| `RESEND_API_KEY` | scanner (for reports) | |
| `STRIPE_SECRET_KEY` | scanner (concierge) + shopify-app (Agency/Enterprise direct) | Live vs test keys per env |
| `SENTRY_DSN` | both apps | Per-app project |
| `POSTHOG_KEY` / `_HOST` | both apps | Self-hosted on droplet |

## Failure modes to handle

- **Build fails on shared-CPU droplet** → build in GitHub Actions, push pre-built image to ghcr.io, Coolify pulls.
- **Prisma migration fails on container start** → container exits; Coolify keeps old container running; alert; fix migration; redeploy.
- **Let's Encrypt renewal fails** → Coolify logs show the failure; manually trigger renewal; verify DNS correct.
- **OOM on bulk sync** → add swap (last resort); scale up droplet; split workers off-droplet (Fly.io option per ADR 0002).
- **Traefik misroutes** → check Coolify domain config; verify DNS A records point to droplet IP.
- **Backup fails silently** → BetterStack alert on backup-complete webhook; verify daily.

## Droplet upgrade workflow

When active-merchant count approaches 30 (per `metric-catalog.md` threshold):

1. Operator flags in `STATUS.md`.
2. Schedule maintenance window (low-traffic hour; UK evening typical).
3. DO: resize droplet (Basic 2 vCPU / 8GB → Premium 4 vCPU / 8GB). ~5-minute downtime.
4. Coolify + services auto-restart after resize.
5. Verify every service + endpoint.
6. Update `vendor-register.md` + `finance-baseline.md`.

Second-stage upgrade (around 100 merchants): migrate Postgres off the droplet to DO Managed Postgres. Separate runbook; `write-migration` + this skill collaborate.

## Council gates

- **#10 DevOps / SRE** — primary reviewer. Deploy plan + rollback verified.
- **#4 Security** — secrets handling; no accidental leak.
- **#34 Debugging** — failure-mode coverage.
- **#17 Performance** — bundle-size + startup-time regression check.
- **#18 DBA** — any Postgres-adjacent change.

## Anti-patterns

- Running `coolify deploy --production` from this skill. Denied by settings. Operator runs.
- Building the Docker image on the droplet when Build server could do it.
- Running `prisma migrate deploy` in the build stage (can't reach DB).
- Rotating secrets without a dual-read window on the encryption key.
- Deploying to production without a staging verification first.
- Skipping the `STATUS.md` update after a milestone deploy.

## Hand-off

- To `write-migration` if the deploy requires a DB schema change.
- To `fix-bug` if a startup error traces to a specific bug.
- To `incident-postmortem` after any production deploy failure that reached merchants.
- To `vendor-review` when droplet upgrade happens (cost line in `finance-baseline.md`).
