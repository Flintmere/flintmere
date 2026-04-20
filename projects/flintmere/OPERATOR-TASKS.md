# Flintmere — Operator task checklist

Things only you can do. Claude Code writes files, runs tests, deploys via `git push` — but accounts, domains, money, legal, and physical services are yours.

Sections are ordered roughly by **when you need them**. Do Stage 1 first; Stage 5 is launch-week.

---

## Stage 1 — Before the first local build

### Local tooling

- [ ] Install **Node 22+**: `brew install node@22` (macOS) or download from [nodejs.org](https://nodejs.org)
- [ ] Install **pnpm 9+**: `npm install -g pnpm@9`
- [ ] Install **Docker Desktop**: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- [ ] Install the **Shopify CLI**: `npm install -g @shopify/cli @shopify/theme`
- [ ] Install **Prisma CLI** (comes with pnpm install; verify `pnpm -F scanner prisma --version`)

### Repo bootstrap

- [ ] `cd /Users/abuaa/Projects/Flint_Shop`
- [ ] `pnpm install` — installs all workspace dependencies (root + `apps/*` + `packages/*`)
- [ ] `docker-compose up -d` — starts local Postgres 16 + Redis
- [ ] Copy env templates:
  - [ ] `cp apps/scanner/.env.example apps/scanner/.env.local`
  - [ ] `cp apps/shopify-app/.env.example apps/shopify-app/.env.local`
- [ ] Generate token encryption key for the Shopify app:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
  Paste into `apps/shopify-app/.env.local` as `SHOPIFY_TOKEN_ENCRYPTION_KEY=...`
- [ ] Run first migrations:
  - [ ] `pnpm -F scanner prisma migrate dev --name init_scanner`
  - [ ] `pnpm -F shopify-app prisma migrate dev --name init_app`

### Verify scanner runs locally

- [ ] `pnpm -F scanner dev`
- [ ] Open `http://localhost:3000`
- [ ] Test the scanner with a real Shopify store URL (e.g. `allbirds.com`, `gymshark.com`, or any `*.myshopify.com`)
- [ ] Check the `POST /api/scan` route responds with a real score and pillar breakdown
- [ ] Check the `GET /api/healthz` endpoint returns `{ status: 'ok' }`

---

## Stage 2 — Accounts + domains

### Domain + DNS

- [ ] Verify ownership of **flintmere.com** (SPEC says owned — confirm in your registrar)
- [ ] Point these subdomains at your DigitalOcean droplet IP (A records):
  - [ ] `flintmere.com` → droplet IP (or leave for marketing-site setup later)
  - [ ] `audit.flintmere.com` → droplet IP
  - [ ] `app.flintmere.com` → droplet IP
  - [ ] `status.flintmere.com` → droplet IP (for BetterStack Uptime)
  - [ ] (optional) `audit-staging.flintmere.com` + `app-staging.flintmere.com` for preview environments

### Shopify Partner account

- [ ] Create a **Shopify Partner account** at [partners.shopify.com](https://partners.shopify.com) — $19 one-time
- [ ] Verify company details (Flintmere Ltd, UK)
- [ ] Create a **development store** for testing (Partner Dashboard → Stores → Add store → Development store)
- [ ] Create the **Flintmere app** in Partner Dashboard → Apps → Create app
  - [ ] Name: `Flintmere`
  - [ ] Distribution: App Store (set later; draft for now)
  - [ ] App URL: `https://app.flintmere.com`
  - [ ] Allowed redirection URLs: `https://app.flintmere.com/auth/callback`
- [ ] Copy **Client ID** and **Client Secret** from the app config page
- [ ] Paste into `apps/shopify-app/.env.local`:
  - `SHOPIFY_API_KEY=<client id>`
  - `SHOPIFY_API_SECRET=<client secret>`
- [ ] Link the local app config to Shopify:
  ```bash
  cd apps/shopify-app && shopify app config link
  ```

### Google Cloud (Vertex AI)

- [ ] Create a **Google Cloud account** at [cloud.google.com](https://cloud.google.com)
- [ ] Add billing (required even for Vertex AI trial credits)
- [ ] Create a project: `flintmere-production`
- [ ] Enable **Vertex AI API** in the project
- [ ] Set region pinning to `europe-west1` (Belgium)
- [ ] Create a **service account**: IAM & Admin → Service Accounts → Create
  - [ ] Grant role: `Vertex AI User`
  - [ ] Create key → JSON → download
  - [ ] Store the JSON securely; upload to Coolify env config at deploy time
  - [ ] Local dev: save as `apps/shopify-app/.secrets/vertex-sa.json` (gitignored via `.secrets/`)
- [ ] Note the project ID for `GOOGLE_CLOUD_PROJECT` env var

### Azure OpenAI (fallback)

- [ ] Create an **Azure account** at [portal.azure.com](https://portal.azure.com)
- [ ] Request **Azure OpenAI Service access** (takes 1–3 business days — do early)
- [ ] Once approved: create an Azure OpenAI resource in `swedencentral` or `francecentral`
- [ ] Deploy the `gpt-4o-mini` model in that resource
- [ ] Copy the endpoint URL + API key
- [ ] Paste into `apps/shopify-app/.env.local` (and scanner if you decide scanner needs fallback)

### Stripe

- [ ] Create a **Stripe account** at [stripe.com](https://stripe.com) (UK entity)
- [ ] Complete the business verification
- [ ] Get **test mode** API keys + webhook signing secret for local dev
- [ ] Configure the **£97 concierge audit** as a one-off Stripe Product (`STRIPE_PRICE_CONCIERGE_AUDIT`)
- [ ] Configure **Agency tier** as a recurring subscription product (£399/mo)
- [ ] Configure **Enterprise tier** as a template subscription (custom quotes)
- [ ] Set up the webhook endpoint (for Coolify later): `https://app.flintmere.com/api/webhooks/stripe`

### Resend (email)

- [ ] Create a **Resend account** at [resend.com](https://resend.com)
- [ ] Verify the sender domain (`flintmere.com`) — add DNS records (SPF, DKIM, DMARC) per Resend's instructions
- [ ] Create an API key
- [ ] Paste into `apps/scanner/.env.local` as `RESEND_API_KEY`

### Sentry

- [ ] Create a **Sentry account** at [sentry.io](https://sentry.io)
- [ ] Create two projects:
  - [ ] `flintmere-scanner` (Next.js platform)
  - [ ] `flintmere-shopify-app` (Remix platform)
- [ ] Copy each DSN into the corresponding `.env.local`
- [ ] Verify PII scrubbing is enabled (project settings)
- [ ] Set retention to 90 days (hot) + 13 months cold

### BetterStack Uptime

- [ ] Create a **BetterStack account** at [betterstack.com](https://betterstack.com)
- [ ] Add uptime monitors:
  - [ ] `https://audit.flintmere.com/api/healthz` (60s interval)
  - [ ] `https://app.flintmere.com` (60s interval)
  - [ ] `https://app.flintmere.com/auth` (60s interval)
- [ ] Set up status page at `status.flintmere.com` (optional; recommended before public launch)

### PostHog

- [ ] Decide: self-hosted on droplet (recommended; matches data-residency story) or cloud free tier
- [ ] If self-hosted: defer until Coolify is set up; provision via docker-compose add-on
- [ ] If cloud: create account at [posthog.com](https://posthog.com), select EU region

### GS1 (deferred — when you first hit GTIN guidance needs)

- [ ] Don't do this yet. Only relevant when you start recommending GTIN purchases to merchants.
- [ ] When ready: explore GS1 UK partnership conversation (SPEC §5.3) at month 4–6 when you have volume.

---

## Stage 3 — Coolify + deployment

Assumes the droplet already has Coolify installed (you said it does).

### Coolify setup

- [ ] Log into Coolify dashboard
- [ ] **Connect GitHub** — go to Sources → add GitHub App → authorise `Flintmere/flintmere` repo
- [ ] **Provision services** (one-click):
  - [ ] Postgres 16 (name: `flintmere-pg`)
  - [ ] Redis 7 (name: `flintmere-redis`)
- [ ] Note the internal connection strings Coolify generates

### Deploy scanner

- [ ] Create new Coolify application:
  - [ ] Source: `Flintmere/flintmere` GitHub repo, branch `main`
  - [ ] Build: Dockerfile → `apps/scanner/Dockerfile`
  - [ ] Domain: `audit.flintmere.com`
  - [ ] Port: `3000`
  - [ ] Health check: `/api/healthz`
- [ ] Add environment variables (from `apps/scanner/.env.example`):
  - `DATABASE_URL` — Coolify Postgres internal URL + `?schema=scanner`
  - `REDIS_URL` — Coolify Redis internal URL
  - `NEXT_PUBLIC_APP_URL=https://audit.flintmere.com`
  - `RESEND_API_KEY`
  - `SENTRY_DSN`
  - `POSTHOG_KEY` + `POSTHOG_HOST`
  - `IP_HASH_SALT` — generate a random string (operator secret)
- [ ] Deploy. Verify `https://audit.flintmere.com/api/healthz` returns 200.
- [ ] Run first migration via Coolify's "Execute Command" feature:
  ```bash
  pnpm -F scanner prisma migrate deploy
  ```
- [ ] Test a real scan end-to-end.

### Deploy Shopify app

- [ ] Create new Coolify application:
  - [ ] Source: same repo, branch `main`
  - [ ] Build: Dockerfile → `apps/shopify-app/Dockerfile`
  - [ ] Domain: `app.flintmere.com`
  - [ ] Port: `3000`
  - [ ] Health check: `/healthz` (shipped at `apps/shopify-app/app/routes/healthz.tsx`)
- [ ] Add environment variables (from `apps/shopify-app/.env.example`):
  - `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET`
  - `SHOPIFY_APP_URL=https://app.flintmere.com`
  - `SHOPIFY_SCOPES=read_products,write_products,read_product_listings,write_metaobject_definitions,write_metaobjects`
  - `SHOPIFY_TOKEN_ENCRYPTION_KEY` (from Stage 1)
  - `DATABASE_URL` — Coolify Postgres + `?schema=app`
  - `REDIS_URL` — Coolify Redis
  - `GOOGLE_APPLICATION_CREDENTIALS` — path to Vertex AI service-account JSON (mount as a secret file)
  - `LLM_PRIMARY_PROVIDER=vertex` / `LLM_PRIMARY_MODEL=gemini-2.5-flash` / `LLM_HARDCASE_MODEL=gemini-2.5-pro` / `LLM_PRIMARY_REGION=europe-west1`
  - `LLM_FALLBACK_PROVIDER=azure-openai` + Azure env vars when available
  - `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `SENTRY_DSN`
- [ ] Upload Vertex service-account JSON via Coolify's File Secret feature
- [ ] Deploy. Verify the embedded app loads inside a dev-store install flow.
- [ ] Run first migration:
  ```bash
  pnpm -F shopify-app prisma migrate deploy
  ```

### Backups

- [ ] **DO Spaces bucket** in region `lon1`: `flintmere-backups`
- [ ] Coolify → Backups → schedule nightly Postgres backup to Spaces
- [ ] Retention: 30 days hot, 13 months cold

---

## Stage 4 — Shopify App Store submission prep

Do these in the weeks before submitting (Week 7–10 of SPEC §9).

- [ ] Run the full **Built-for-Shopify checklist** via the `shopify-app-store-submission` skill
- [ ] Verify GDPR webhook tests pass (HMAC verification + idempotency)
- [ ] Verify 5-second webhook budget on load (stress test in dev store)
- [ ] Write app listing copy via `writer` skill → `claim-review` → operator
- [ ] Capture real screenshots on the dev store (no mockups)
- [ ] Record a short demo video (≤60s, captions on)
- [ ] Set pricing in Shopify Managed Pricing config:
  - [ ] Growth: £49/mo
  - [ ] Scale: £149/mo
- [ ] Enterprise + Agency bill via Stripe direct (not Managed Pricing)
- [ ] Submit via Partner Dashboard

---

## Stage 5 — Business + legal

### Company

- [ ] Register **Flintmere Ltd** (Companies House, UK) if not yet done
- [ ] Open a **business bank account** (Mettle, Starling, Tide, Monzo Business — pick what your accountant recommends)
- [ ] Engage an **accountant** (for quarterly VAT + year-end accounts)

### Tax

- [ ] **UK VAT registration** (mandatory when turnover exceeds £90K/year; voluntary before)
- [ ] **EU VAT MOSS / OSS** registration (digital services across EU — first EU customer triggers this)
- [ ] **R&D tax credits** — consult accountant once SaaS dev spend is material

### Insurance

- [ ] **Cyber liability insurance** quote (Hiscox, Superscript, Zego — UK providers)
- [ ] **Professional indemnity (E&O)** for SaaS — often bundled with cyber
- [ ] Target coverage: £1M minimum for pre-launch; scale with customer count

### Legal

- [ ] Engage a **UK commercial lawyer** for:
  - [ ] Terms of Service review
  - [ ] Privacy Policy review (GDPR + UK DPA)
  - [ ] Data Processing Agreement
  - [ ] Cookie Policy
- [ ] Generate initial drafts via `legal-page-draft` skill → lawyer review → ship
- [ ] **DPA templates** for Agency + Enterprise customers (they'll ask)

### SOC 2 (deferred)

- [ ] Not needed pre-launch. Revisit when the first Enterprise prospect mentions it.
- [ ] Budget: ~£15K + ~3 months prep for SOC 2 Type I; Type II requires 6+ months of evidence.

---

## Stage 6 — Pre-launch content + outreach (SPEC §2 Week 1)

### Founder presence

- [ ] Update **LinkedIn** profile → Flintmere founder, catalog readiness for AI agents
- [ ] Draft the launch LinkedIn post per `memory/marketing/outreach.md` §Canonical templates
- [ ] Set up **X/Twitter** account if not already
- [ ] Join **Shopify Partner Slack** (Partner Dashboard → Community → Slack invite)
- [ ] Join **r/shopify**, **r/ecommerce** — build a few weeks of karma via genuine helpful posts before launch-posting

### Week 1 launch (from SPEC §12)

- [ ] **Day 1**: DNS verified, scanner live at `audit.flintmere.com`
- [ ] **Day 2**: scoring working on real stores; test with 5 public Shopify sites (Allbirds, Gymshark, Meridian Coffee, etc.)
- [ ] **Day 3**: write the hooks (3 drafts: LinkedIn + Reddit + cold DM)
- [ ] **Day 4**: ship the £97 concierge landing page
- [ ] **Day 5**: LinkedIn post + Reddit post + Shopify Partner Slack
- [ ] **Day 6–7**: cold outreach (50 agencies via `outreach` skill + 100 low-scoring merchants)

### Success gates (SPEC §2.2)

- ≥50 scanner submissions
- ≥40% email opt-in rate
- ≥5 paid £97 audits
- ≥20% DM-response rate

Miss 2+ gates → pause. Reposition before writing more code.

---

## Stage 7 — Ongoing (monthly/quarterly)

### Weekly

- [ ] Monday: run `weekly-metrics-brief` skill against exports in `context/data-intelligence/`
- [ ] Monday: run `internal-coordination-brief` for cross-dept blockers
- [ ] Triage support inbox via `support-triage`
- [ ] Open-source PR triage (if we open any packages) — 5-day first-response SLA

### Monthly

- [ ] Finance snapshot via `finance-snapshot` skill
- [ ] Ship one "State of AI Readiness in [Vertical]" research piece (month 2+)
- [ ] Sentry error review — patterns, P0/P1 if any

### Quarterly

- [ ] `vendor-review` skill across all vendors
- [ ] `docs-coherence-audit` across user-facing docs
- [ ] `design-system-audit` across shipped surfaces
- [ ] `security-claim-audit` across every public claim
- [ ] `cohort-retention` for Pro → Scale → Agency ladders
- [ ] Privacy Policy + Terms of Service review (legal council)

### Annually

- [ ] Rotate `SHOPIFY_TOKEN_ENCRYPTION_KEY` (dual-read window)
- [ ] Annual legal review
- [ ] Cyber insurance renewal review
- [ ] Tabletop incident-response exercise
- [ ] Revisit `decisions/0006-hardcase-llm-lock-gemini-pro.md` benchmark (month 3 or at 50 concierge audits — whichever first)

---

## How to use this document

- Update state as you go. Tick items when complete.
- Tasks blocked by external parties (legal, accountant, GS1) — flag the blocker and move on.
- When a stage triggers a new ADR (e.g. SOC 2 posture decision), write the ADR first; don't ad-hoc it.
- Operator owns this file. Claude proposes additions but does not tick items on your behalf.

## Current state (updated 2026-04-20)

**Code complete**:

- `packages/scoring` — six-pillar engine, unit-tested, scanner-mode pillars live
- `packages/llm` — Vertex (Gemini Flash + Pro) + Azure OpenAI (GPT-4o-mini) + circuit breaker + mock for tests (ADRs 0005 + 0006)
- `apps/scanner` — Next.js 15, full scanner flow + marketing home + `/pricing` + `/research` + `/audit` + `/audit/success` + `/unsubscribe`; API routes: `/api/scan`, `/api/scan/:id`, `/api/lead` (Resend), `/api/unsubscribe`, `/api/concierge/checkout` (Stripe), `/api/webhooks/stripe`, `/api/healthz`
- `apps/shopify-app` — Remix + OAuth + Polaris + mandatory GDPR webhooks + product drift webhooks + Prisma app schema + AES-256-GCM token encryption + BullMQ queues + streaming JSONL bulk-catalog-sync + three Tier 2 enrichment paths (alt text, title rewrite, attribute inference) + `/healthz` + `/api/rescan` + `/api/enrichment/preview`

**Operator-blocked (can't progress without you)**:

- Any Stage 2 account creation (domains, Shopify, Google, Azure, Stripe, Resend, Sentry, BetterStack)
- Any Stage 3 Coolify deploy (needs you to paste credentials)
- Any Stage 5 business/legal work

**Not yet built (code, next up)**:

- Fix History UI + `/api/fix/:id/revert` endpoint (SPEC §5.2.1 — schema + fix_batches table exist)
- Shareable badge + share-for-trial loop (SPEC §2.1.2 + §2.1.3)
- Worker Dockerfile for separate Coolify service (BullMQ worker currently bundled with web)
- Legal pages (Privacy / Terms / DPA / Cookie Policy)
