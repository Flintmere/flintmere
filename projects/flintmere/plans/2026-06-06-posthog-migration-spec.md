---
title: Plausible → PostHog Cloud EU migration (full feature surface)
date: 2026-06-06
status: approved (operator, 2026-06-06 — cookieless-max · free tier · auto-proceed)
supersedes_runtime: ADR 0013 (Plausible Cloud) — ADR 0025 to be authored in this work
canon_sources:
  - projects/flintmere/decisions/0013-analytics-plausible-self-host.md
  - apps/scanner/src/lib/plausible.ts (event taxonomy)
  - memory/product-engineering/security-posture.md
  - memory/CONSTRAINTS.md
canon_audit_run: fires during workstream G (legal/ADR) via claim-review + canon-audit
---

# Spec — Plausible → PostHog Cloud EU (cookieless-max, free tier)

## Context

Plausible Cloud stopped tracking when the 30-day trial lapsed (Plausible has no
free tier). ADR 0013 anticipated a PostHog migration via triggers T1–T7 and
mandated portable event names; none of T1–T7 fired — the actual trigger is
vendor trial lapse + a £0 budget requirement. PostHog Cloud EU's permanent free
tier (1M events/mo, 5k replays/mo) removes the expiry failure mode.

Operator decisions (2026-06-06):

1. **Hosting**: PostHog Cloud EU (Frankfurt). Self-host rejected — droplet
   ground truth in ADR 0013 Amendment 1 (2 vCPU, swap-thrashing) cannot carry
   PostHog's stack; a dedicated droplet costs more than the problem.
2. **Consent posture**: **cookieless-max** — no cookies, no localStorage
   tracking identifiers, no consent banner. Preserves the ADR 0013 council
   rationale (100% measurement, zero conversion friction). Cross-session
   visitor stitching and persistent flag assignment are knowingly forgone;
   hybrid banner upgrade documented as a one-sprint follow-up if ever needed.
3. **Budget**: free tier only. Usage alerts configured; no card on file
   requirement. Paid add-ons documented-out with re-entry triggers.
4. **Scope**: maximal within (2) and (3) — "all the bells and whistles",
   decided now in writing so no capability resurfaces later as an unplanned
   gap.

## Scope — IN

| # | Capability | Notes |
|---|---|---|
| 1 | Custom events (existing taxonomy) | Names unchanged — ADR 0013 designed them portable |
| 2 | Autocapture + pageleave + heatmaps | Retroactive answers; anonymous events are the cheap kind |
| 3 | Web vitals autocapture | Replaces Plausible CWV note in `instrumentation-client.ts:29` |
| 4 | Session replay | Mask all inputs + explicit masking for email/shop-domain fields; canvas recording; network performance capture |
| 5 | Pre-provisioned dashboards + funnels via PostHog API | Scripted (idempotent, runs when personal API key present): acquisition funnel; `scan_started → email_captured → concierge_clicked → concierge_paid`; web-vitals board; replay triage board |
| 6 | Server-side capture (`posthog-node`) | `concierge_paid` from the Stripe webhook — closes the funnel to revenue |
| 7 | Feature flags + experiments wrappers | `lib/flags.ts` helper + documented usage pattern; works for anonymous users within cookieless constraints |
| 8 | Surveys enabled | SDK support + CSP allowances |
| 9 | Reverse proxy | Next.js rewrites `/ingest/*` → `eu.i.posthog.com` (PostHog's documented pattern) — ad-blocker-resistant |
| 10 | Admin health signal | `_signals/plausible.ts` → `_signals/posthog.ts` on the Query API (HogQL, yesterday's pageviews by `$host`) |
| 11 | Daily-brief + weekly-metrics-brief integration | Prompt text + `memory/data-intelligence/data-sources.md` |
| 12 | ADR 0025 + docs sweep | Supersedes 0013; vendor-register, data-sources, STATUS.md, stray comments (`middleware.ts`, `host-routing.ts`) |
| 13 | Legal pages | `cookies/page.tsx` vendor swap (cookieless claim must stay TRUE); `privacy/page.tsx` sub-processor swap + NEW session-replay disclosure clause |
| 14 | Toolbar | No code; usable on prod once logged in |

## Scope — OUT (decided, documented, not forgotten)

| Capability | Why out | Re-entry trigger |
|---|---|---|
| PostHog error tracking | Sentry is canonical (hard-won integration; double capture = noise + cost) | Sentry bill exceeds PostHog error-tracking cost, or Sentry sunset |
| Group analytics | Paid add-on; `shop` is already an event property | Need shop-level rollup analytics AND budget approval |
| Data warehouse / pipelines | Paid add-ons | First external BI requirement |
| Cross-session identity / `identify()` | Blocked by cookieless posture | Operator approves hybrid banner (one-sprint follow-up) |
| Shopify-app instrumentation | Third-party script inside embedded admin iframe is a BFS review risk | Decide at BFS submission |
| Hybrid consent banner | ADR 0013 council 8–2 rationale stands | Any of: enterprise vendor-eval demands identity; 3+ A/B tests/quarter needing persistent assignment |

## Architecture

### A. Client SDK (apps/scanner)

- Add `posthog-js` (official SDK; the `@posthog/wizard` cannot express
  cookieless config — written deviation per anti-waste rule 1).
- Init alongside Sentry in `src/instrumentation-client.ts`.
- **Config decision rule (research-gated, not guessed)**: Workstream R
  verifies against current PostHog docs whether PostHog's *cookieless
  server-hash mode* supports session replay + within-day funnel stitching on
  Cloud EU. If yes → use it (Plausible-equivalent daily hash, best funnel
  quality without storage). If no/partial → `persistence: 'memory'`
  (within-SPA-session stitching only). Either way: **zero cookies, zero
  localStorage identifiers** — verified in QA with devtools.
- `person_profiles: 'identified_only'` + no `identify()` calls → all events
  anonymous (free-tier-cheap).
- Autocapture ON, pageview-on-history-change ON, pageleave ON, web vitals ON.
- `api_host` points at the `/ingest` proxy; `ui_host` at `https://eu.posthog.com`.
- Public `phc_` key: hardcoded constant per anti-waste rule 6 (postcard test).
  Stub `phc_REPLACE_ME` until operator supplies it; verification step blocks on
  the real key and is marked pending-operator if absent.
- `src/lib/plausible.ts` → `src/lib/analytics.ts`: same `track(event, props)`
  signature backed by `posthog.capture`; never throws; SSR/no-op safe. ~10
  call-site import updates; event names unchanged.
- Remove both Plausible `<Script>` tags from `layout.tsx`.

### B. Proxy + CSP

- `next.config` rewrites: `/ingest/static/*` → `eu-assets.i.posthog.com`,
  `/ingest/*` → `eu.i.posthog.com` (exact pattern from current PostHog docs,
  research-gated).
- `middleware.ts` CSP: remove `plausible.io` from script-src + connect-src.
  With the proxy, capture traffic is same-origin; add PostHog hosts only if
  the researched pattern requires them (e.g. replay assets). Keep the CSP
  comment block accurate.
- Confirm middleware matcher does not intercept `/ingest/*`.

### C. Server-side events

- `posthog-node` client in a small `src/lib/analytics-server.ts` (lazy
  singleton, immediate-flush configuration for serverless safety, swallows
  errors).
- Stripe webhook handler: fire `concierge_paid` with `{ shop, band, amount }`
  on checkout completion (locate handler; follow its existing idempotency).
  Gated by `webhook-review` skill pass.

### D. Health signal + briefs

- `_signals/posthog.ts`: HogQL query — yesterday's pageviews grouped by
  `$host` (`flintmere.com` vs `audit.flintmere.com`), same `SignalResult`
  contract, dashboard URL → PostHog project home. Env:
  `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` (genuinely secret →
  env vars, Coolify). Update `.env.example`, `daily-brief/health-check.ts`
  prompt text, `admin/health/page.tsx` wiring.

### E. Dashboards-as-code

- `apps/scanner/scripts/provision-posthog.ts`: idempotent (lookup-by-name,
  create-if-missing) via PostHog API; creates the four boards/funnels in §IN-5.
  Runs manually (`npx tsx`); skips gracefully without the personal API key.

### F. Flags / experiments / surveys

- `src/lib/flags.ts`: thin wrapper (`isFlagEnabled`, `getFlagPayload`) +
  React hook; documented cookieless caveat (assignment is per-visitor-hash or
  per-session depending on §A config outcome).
- Surveys: enable in SDK config; CSP already covered by proxy/static host.
- Usage pattern documented in `memory/data-intelligence/data-sources.md`.

### G. Legal + ADR + docs (canon-protection binding fires)

- `cookies/page.tsx`: vendor swap; the "cookieless" claim must remain
  literally true under the shipped config — claim-review verifies.
- `privacy/page.tsx`: sub-processor row → PostHog Inc. (US entity, EU data
  residency Frankfurt — wording via claim-review; UK GDPR Art. 28 framing);
  new session-replay disclosure clause (what is recorded, masking, retention,
  lawful basis).
- ADR 0025: supersedes 0013 runtime decision; honest trigger framing; records
  every OUT row + re-entry triggers; error-tracking/Sentry rationale.
- Sweep: `memory/admin-ops/vendor-register.md`,
  `memory/data-intelligence/data-sources.md`, `projects/flintmere/STATUS.md`
  changelog, "evaluate via Plausible" comments in `middleware.ts:27` +
  `host-routing.ts:25`, `audit-draft` comment references, README if it names
  Plausible.
- Gates: `claim-review` (legal copy), `canon-audit` (ADR + customer-facing
  strings).

## Event taxonomy (unchanged + one addition)

`scan_started`, `email_captured`, `audit_cta_from_scan`, `band_preselected`,
`band_switched`, `audit_prefill_applied`, `concierge_clicked`,
`audit_draft_generated` (client, existing) + **`concierge_paid`** (server,
new).

## Verification (definition of done)

1. `npm run build` + typecheck + existing test suite green in the worktree.
2. Grep sweep: no live `plausible` references outside ADR history/changelogs
   (the English adjective in `suppression-estimate.ts` is exempt).
3. With real `phc_` key: events visible in PostHog activity; replay recorded
   with inputs masked; funnel renders; **devtools shows zero cookies and zero
   tracking localStorage entries**; no CSP violations; `/ingest` proxy returns
   200s; health signal green next day. (Pending-operator until key supplied.)
4. `webhook-review`, `claim-review`, `canon-audit` passes recorded.
5. No file exceeds 600 lines; conventions per `memory/OUTPUT.md`.

## Operator checklist (the only manual inputs)

1. Create PostHog account → **EU Cloud** → org "Flintmere" → project
   "Flintmere web". Copy the `phc_` project API key + create a personal API
   key (scopes: insight/dashboard read-write, query read).
2. Paste both keys to Claude (or drop in `context/`); add
   `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` to Coolify.
3. In PostHog project settings: confirm session replay ON with masking;
   set usage alerts; (if §A research selects server-hash mode) toggle
   cookieless server hash mode ON.
4. Review + merge the PR; redeploy via Coolify.

## Risks

- **Cookieless server-hash mode maturity** — mitigated by research gate +
  memory-persistence fallback baked into §A.
- **Free-tier replay quota (5k/mo)** — far above current traffic; usage
  alerts catch growth.
- **Autocapture event volume** — anonymous events, 1M/mo ceiling; alerts.
- **PostHog Inc. is a US entity** (EU residency ≠ EU entity) — privacy copy
  must say "EU data residency", not "EU company"; claim-review enforces.
