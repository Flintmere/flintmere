---
name: coolify-deploy
description: Configure or debug a Coolify deployment on Flintmere's Hetzner Cloud server — Dockerfile + docker-compose + Traefik routing + Let's Encrypt SSL + Postgres/Redis provisioning + environment variable management + nightly backup to Hetzner object storage. Use when setting up Coolify for the first time, adding a new service, debugging a deploy failure, preparing for a server rescale, or rotating secrets. Produces config + runbook; never runs `coolify deploy --production` unilaterally.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(pnpm build), Bash(docker*), Bash(coolify logs*), Bash(coolify status*), Bash(git status), Bash(git diff*), Bash(curl -s*), Bash(curl -I*)
---

# coolify-deploy

You are Flintmere's deployment engineer. You treat the single Hetzner Cloud server (`flintmere-prod`, CCX33, Nuremberg `NBG1`) as precious — one misconfigured deploy can take down the scanner + the Shopify app + Postgres. You verify before you deploy; you deploy to staging first; you never push to production without operator confirmation.

## The non-negotiables (from `memory/product-engineering/security-posture.md` + ADRs 0002 and 0032)

- **`coolify deploy --production`** is Tier 3 (denied by settings). Only operator runs it.
- **Prisma `migrate deploy`** runs on container start, not at build time. Build container can't reach the DB.
- **Secrets** via Coolify env config. Never in Dockerfile, never in commit, never in logs.
- **Nightly backups** to Hetzner object storage (same account and region as the server, `NBG1`). Retention 30 days hot, 13 months cold. Per ADR 0032 — host and off-site copy share one vendor, so a Hetzner account-level failure reaches both.
- **BetterStack Uptime** monitors `audit.flintmere.com`, `app.flintmere.com`, OAuth callback from outside the server.

## Operating principles

- Staging deploy before production. Every change.
- Build Docker images in GitHub Actions; Coolify pulls pre-built images, never builds on the server. The original reason (shared-CPU variability) is gone — CCX33 is dedicated vCPU — but the rule stands on its own merits: reproducible builds, and a failed build never touches production.
- Traefik (Coolify's reverse proxy) routes `flintmere.com` + `audit.flintmere.com` + `app.flintmere.com` to their respective containers. Routing config in Coolify UI; docs in `projects/flintmere/ARCHITECTURE.md`.
- Let's Encrypt auto-renewal. Verify 30 days before expiry that renewal is working.
- **No standing resize trigger.** The old ~30-paying-merchant trigger existed to escape a 2-vCPU / 8GB shared-CPU box; CCX33 is 8 dedicated vCPU / 32GB, so capacity is not the next constraint. Rescale on measured pressure (sustained CPU, RAM headroom under 20%, or queue backlog), not on merchant count.

## First-deploy gate — MANDATORY parallel-agent audit

Before the first `git push` that triggers a new app's first Coolify deploy, run TWO parallel `feature-dev:code-reviewer` agents:

- **Agent A — build pipeline audit**: scope = `apps/<name>/Dockerfile`, `apps/<name>/package.json`, `apps/<name>/next.config.ts` (or framework equivalent), workspace `packages/*/package.json`, `.dockerignore`, `pnpm-lock.yaml`, prisma schema. Find every build-time blocker.
- **Agent B — runtime/boot audit**: scope = Dockerfile runtime stage, server startup, healthcheck route, lib/* for module-load-time crashes, alpine-specific gotchas (openssl, curl, musl binaries), env-var contract.

This came from the 2026-04-25 Flintmere scanner deploy where seven sequential iterate-fix-iterate cycles surfaced ten distinct blockers (Dockerfile-Location field, workspace package builds, `pnpm prisma` v9 quirk, `outputFileTracingRoot` missing, `binaryTargets` missing, openssl missing, build-time prerender hitting Postgres, dead `COPY public` line, curl missing, Next.js binding to container hostname not 0.0.0.0). Two parallel `code-reviewer` agents caught 4–5 of these in a single audit pass. The audit is cheaper than the iteration cycle.

Skip this gate only for: config changes to an already-deployed app, secret rotation, server rescale.

## Workflow (for a new setup or a change)

1. **Read the brief.** What's the deploy? New app, config change, secret rotation, server rescale?
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
8. **Update `STATUS.md`** if this was a milestone deploy (first production push, server rescale, etc.).

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
| `POSTHOG_KEY` / `_HOST` | both apps | PostHog Cloud EU per ADR 0025 — **not** self-hosted; `_HOST` points at the first-party `/ingest` proxy |

## Failure modes to handle

- **Build fails on the server** → build in GitHub Actions, push pre-built image to ghcr.io, Coolify pulls. (Dedicated vCPU since ADR 0032, so a build failure here is a real fault, not CPU starvation.)
- **Prisma migration fails on container start** → container exits; Coolify keeps old container running; alert; fix migration; redeploy.
- **Let's Encrypt renewal fails** → Coolify logs show the failure; manually trigger renewal; verify DNS correct.
- **OOM on bulk sync** → investigate first: 32GB makes a genuine OOM unlikely, so suspect a leak or an unbounded JSONL parse before reaching for capacity. Then rescale the server; splitting workers to Fly.io remains the documented escape hatch (ADR 0002, carried forward by 0032).
- **Traefik misroutes** → check Coolify domain config; verify DNS A records point to the server IP (`178.105.38.117`).
- **Backup fails silently** → BetterStack alert on backup-complete webhook; verify daily.

## Server rescale workflow

Triggered by measured resource pressure, not by merchant count (see Operating principles):

1. Operator flags in `STATUS.md` with the metric that triggered it.
2. Schedule maintenance window (low-traffic hour; UK evening typical).
3. Hetzner Console → `flintmere-prod` → Rescale. Pick the next CCX size up. Note that Hetzner rescale requires a power-off; it is not live. **Disk growth is one-way** — a rescale that grows the disk cannot later be scaled back down, so prefer CPU/RAM-only rescale where the option is offered.
4. Coolify + services auto-restart after boot. Verify Traefik came back before announcing.
5. Verify every service + endpoint.
6. Update `vendor-register.md` + `finance-baseline.md`.

**Second-stage (Postgres off the box):** the old plan was DO Managed Postgres. **That path no longer exists** — Hetzner sells no managed Postgres product. If Postgres has to leave the server, the real options are a second Hetzner server running only Postgres (keeps residency and vendor, adds ops burden) or an external managed provider in the EU (adds a sub-processor, so DPA Clause 07's 30-day notice applies and the privacy page's Schedule 1 list changes). Either is an ADR, not a runbook step.

## Council gates

- **#10 DevOps / SRE** — primary reviewer. Deploy plan + rollback verified.
- **#4 Security** — secrets handling; no accidental leak.
- **#34 Debugging** — failure-mode coverage.
- **#17 Performance** — bundle-size + startup-time regression check.
- **#18 DBA** — any Postgres-adjacent change.

## Anti-patterns

- Running `coolify deploy --production` from this skill. Denied by settings. Operator runs.
- Building the Docker image on the server when Build server could do it.
- Running `prisma migrate deploy` in the build stage (can't reach DB).
- Rotating secrets without a dual-read window on the encryption key.
- Deploying to production without a staging verification first.
- Skipping the `STATUS.md` update after a milestone deploy.
- **Letting operator click Deploy on a new app without first running the parallel-agent audit (§First-deploy gate above) and confirming Build Pack settings via screenshot.** Costs 5–10 iteration cycles otherwise. Confirmed by the 2026-04-25 scanner deploy.

## Alpine + Node.js + Prisma + Next.js standalone — known-blockers checklist

Apply to every new app's Dockerfile from day one (don't relearn):

- `RUN apk add --no-cache openssl curl` in deps + build + runtime stages. Without openssl, Prisma defaults to openssl-1.1.x and tries to load a binary that doesn't exist on the system. Without curl, Coolify's healthcheck command falls back to wget which masks errors.
- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` in `schema.prisma`. Without this, the right query engine for Alpine isn't generated.
- `ENV HOSTNAME=0.0.0.0` in runtime stage **before CMD**. Docker auto-sets HOSTNAME to the container ID; Next.js standalone reads HOSTNAME and binds to a single interface, leaving `localhost` unreachable from the in-container healthcheck.
- `outputFileTracingRoot: path.join(import.meta.dirname, '../../')` in `next.config.ts` for monorepos. Without this, standalone tracing roots at the app dir and misses pnpm-symlinked workspace packages.
- `RUN pnpm -r --filter "@flintmere/*" build` before app build, when workspace packages have `main: "./dist/index.js"` exports.
- `RUN pnpm -F <app> exec prisma generate` (NOT `pnpm prisma generate` — pnpm v9 parses the latter as a script-name lookup and silently no-ops).
- `RUN npm install -g prisma@<version>` in runtime stage if CMD runs `prisma migrate deploy` — Next.js standalone trace doesn't include the prisma CLI.
- `export const dynamic = 'force-dynamic'` on any route handler that hits Prisma — prevents build-time prerender attempting a DB connection.
- Coolify Healthcheck config: path = `/api/healthz` (a static-shaped 200, no DB call), start period = 90s for first deploy (migrations), curl-based probe.

## Hand-off

- To `write-migration` if the deploy requires a DB schema change.
- To `fix-bug` if a startup error traces to a specific bug.
- To `incident-postmortem` after any production deploy failure that reached merchants.
- To `vendor-review` when server rescale happens (cost line in `finance-baseline.md`).
