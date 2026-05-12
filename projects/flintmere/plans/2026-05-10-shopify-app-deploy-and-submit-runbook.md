---
title: Shopify app — deploy + App Store submission runbook
date: 2026-05-10
owner: operator (with Claude Code support on engineering tasks)
status: draft
supersedes: none
canon_sources:
  - apps/shopify-app/Dockerfile
  - apps/shopify-app/Dockerfile.worker
  - apps/shopify-app/shopify.app.toml
  - apps/shopify-app/.env.example
  - projects/flintmere/OPERATOR-TASKS.md (Stage 2 + Stage 3 + Stage 4)
  - projects/flintmere/decisions/0002-coolify-on-do.md
  - projects/flintmere/decisions/0017-plus-tier-private-beta-gate.md
  - memory/product-engineering/security-posture.md
canon_audit_run: skipped (pure plumbing per CLAUDE.md 2026-05-09 binding)
---

# Premise

The `apps/shopify-app/` Remix app is code-complete for the scoring + auto-fix MVP. OAuth, the four mandatory GDPR compliance webhooks, AES-256-GCM token storage, the Polaris-shelled embedded surfaces, the Flintmere island components, BullMQ queues with a separate worker process, the Shopify Bulk Operations sync, three Tier-2 enrichment paths, the Prisma schema, and Sentry instrumentation are all shipped in code. Per `STATUS.md` it is "operator-gated for launch."

This runbook covers the path from "scaffolding complete" to "first BFS-approved listing live in the Shopify App Store." It assumes the scanner is already deployed at `audit.flintmere.com` (it is, per STATUS) and that operator stages 1–2 of `OPERATOR-TASKS.md` are partially done (Vertex, Sentry, BetterStack, Stripe, Resend exist as accounts; only the Shopify Partner account, dev store, and app draft remain operator-side).

This runbook is **plumbing** — the BFS reviewer reads the listing copy, the install screen, and the embedded UX. They do not read this document. Internal use only.

This runbook does not commit to a calendar. The 2026-05-05 launch decision still stands: marketing + audit funnel ship first, the embedded app is post-launch. This runbook is the artefact you reach for when the operator decides the post-launch window has opened.

# What this runbook builds on

`OPERATOR-TASKS.md` already covers the broad-strokes "create accounts, point DNS, paste secrets, click deploy" path for both apps. That document is the source of truth for prerequisites. **This runbook adds the parts that document leaves implicit:**

- A local dev-store smoke-test procedure that catches OAuth misconfig before it hits production.
- A Coolify config for the BullMQ **worker** service (Stage 3 only configures the web service; the worker is not covered).
- A reproducible GDPR-webhook compliance verification procedure with curl commands.
- A 5-second webhook-response stress test BFS reviewers actually time.
- The Built-for-Shopify checklist enumerated as concrete verifications, not "run the skill."
- Listing-asset requirements at the level of "what dimensions, what content."
- Decision gates: when to abort, when to downscope, when to rollback.

# Phase A — Local dev-store install validation (smoke before deploy)

Goal: prove the OAuth install flow, GDPR webhooks, scoring pipeline, and at least one fix-apply path work end-to-end against a dev store, on the operator's laptop, before any production deploy.

**Preconditions** (from OPERATOR-TASKS Stage 1 + 2):
- Local Postgres + Redis up via `docker-compose`.
- `apps/shopify-app/.env.local` has Vertex SA path, OpenAI fallback key, Stripe test keys, Resend key, Sentry DSN, `SHOPIFY_TOKEN_ENCRYPTION_KEY`, and Shopify Partner client id/secret pasted in.
- `pnpm -F shopify-app prisma migrate dev --name init_app` has run cleanly.
- Shopify dev store created (Partner Dashboard → Stores → Add store → Development store, plan: developer-preview).
- Dev store has been seeded with at least 30 dummy products spanning vendors, GTINs, allergens, sizes, and intentionally-broken metadata. The Shopify Partner Dashboard has a "populate dev store" button — use it for synthetic data, then manually break ~5 products to exercise issue detection (remove GTIN, blank vendor, drop alt text).

**Procedure:**

1. From `apps/shopify-app/`, run `shopify app dev`. The Shopify CLI tunnels traffic to your laptop, prompts for the dev store, installs the app, and opens the embedded admin in a browser tab.
2. Watch the terminal: OAuth completes, the `Session` row writes, the encrypted access token writes to `app_shops`, the `app/uninstalled` webhook subscription registers, and the four GDPR-compliance webhook subscriptions register. Any failure here is a Partner Dashboard config issue (scopes mismatch, redirect URL mismatch) — fix in `shopify.app.toml` or the Partner Dashboard, never bypass.
3. In the embedded admin, click **Run scan**. The `score-catalog` BullMQ job enqueues and the worker (running in-process during `shopify app dev`) consumes it. Within ~30 seconds the dashboard should populate the score ring, pillar grid, and issue list.
4. Open `app.issues._index`, drill into one issue, and click **Apply fix**. The `apply-fix` job enqueues. Verify the `app_fixes` row writes with `status=applied`, `revertableUntil` 30 days out, and the underlying Shopify product mutation succeeds (check the product in the dev-store admin).
5. Click **Revert**. Verify the `before_state` JSON restores correctly and `revertedAt` populates.
6. Trigger a GDPR webhook locally using the Shopify CLI:
   ```bash
   shopify app webhook trigger \
     --topic CUSTOMERS_DATA_REQUEST \
     --address https://<your-tunnel>.trycloudflare.com/webhooks/customers-data-request \
     --api-version 2025-07
   ```
   Repeat for `CUSTOMERS_REDACT` and `SHOP_REDACT`. Verify each returns 200 within 5 seconds and that an `app_gdpr_events` row writes with `deadlineAt` 30 days out.
7. Uninstall the app from the dev store. Verify the `app/uninstalled` webhook fires, the `Shop.uninstalledAt` populates, the `purgeScheduledAt` populates 30 days out, and the BullMQ purge job enqueues with the correct delay.

**Gate A — proceed only if:**
- All five surfaces (`app._index`, `app.issues._index`, `app.issues.$issueId`, `app.fixes._index`, `app.gtin`) render without errors in the embedded iframe.
- All four GDPR webhooks return 200 < 5s with the right rows written.
- One full apply → revert cycle works end-to-end against a dev-store product.
- The OAuth install + uninstall lifecycle leaves the database in a consistent state (no orphaned encrypted tokens, no leaked sessions).

If any of these fail, fix locally before continuing. A production deploy of broken OAuth is a brand event.

# Phase B — Coolify deploy (web + worker as two services)

The web image (`Dockerfile`) serves HTTP on port 3000 and runs `prisma migrate deploy` on container start. The worker image (`Dockerfile.worker`) has no HTTP surface, no Traefik route, and no migrations — it pulls jobs from Redis. **They are two Coolify applications**, not one. OPERATOR-TASKS Stage 3 covers the web service only; this section adds the worker.

**Web service** (already in OPERATOR-TASKS Stage 3 — verify each):

- Source: `Flintmere/flintmere` GitHub, branch `main`.
- Build: Dockerfile → `apps/shopify-app/Dockerfile`. Build context: repo root.
- Domain: `app.flintmere.com`. Traefik handles TLS via Let's Encrypt automatically; no extra config.
- Port: `3000`.
- Health check: `GET /healthz` → expect 200.
- Env vars per `apps/shopify-app/.env.example`. **Critical: every secret must be marked Runtime-only in Coolify.** Do not mark any secret as Buildtime — Coolify bakes Buildtime values into the image and they persist across re-deploys with stale values.
- File secret: Vertex service-account JSON, mounted at the path referenced by `GOOGLE_APPLICATION_CREDENTIALS`.

**Worker service** (new — not in OPERATOR-TASKS):

- Source: same repo, same branch.
- Build: Dockerfile → `apps/shopify-app/Dockerfile.worker`. Build context: repo root.
- **No domain. No Traefik route.** The worker has no HTTP surface — Coolify must be told this is a "service" deployment, not a "web" deployment.
- **No port exposure.**
- Health check: TCP-only check is unsupported on a service with no port; rely on Sentry alerting + the `worker-job-failed` log line emitted from `app/queue/worker.server.ts` to detect worker death. Add a BetterStack heartbeat monitor (the worker periodically pings `https://uptime.betterstack.com/api/v1/heartbeat/<key>` from inside `scripts/worker.ts` — this is a small code change worth making before deploy if BFS or operator wants worker-uptime visibility).
- Env vars: identical set to the web service. Same `DATABASE_URL`, same `REDIS_URL`, same Vertex SA mount, same Sentry DSN. The worker imports the same `app/queue/connection.server.ts` and `app/queue/jobs/*` as the web process.
- Restart policy: `unless-stopped`. The worker should auto-recover from crashes; BullMQ + Redis owns job-retry semantics so a process restart does not lose jobs.

**Order of operations:**

1. Deploy the web service first. Wait for the migration to run and the `/healthz` check to go green.
2. Deploy the worker service second. Verify the Coolify logs show `Worker(name=sync) ready`, `Worker(name=score) ready`, etc., from the BullMQ startup messages.
3. Confirm both services point at the **same** Postgres + Redis instances. Schema for the Shopify app is `app` (not `scanner`); both services must connect with `?schema=app` in the `DATABASE_URL`.
4. Add three BetterStack monitors (the OPERATOR-TASKS spec already mentions these as ⏸ pending):
   - `https://app.flintmere.com/healthz` (60s).
   - `https://app.flintmere.com/auth` (60s) — verifies OAuth handler is reachable; expect 302 to Shopify.
   - The worker heartbeat URL if you wired the heartbeat code.

**Gate B — proceed only if:**
- `https://app.flintmere.com/healthz` returns 200 from the public internet.
- The web service's Sentry project receives the test event from `instrumentation.server.mjs` startup.
- The worker logs show all five BullMQ queues registered and the connection to Redis is alive.
- Both services hold for 24 hours without crash-loop. **Coolify's free-tier droplet has variable I/O and the build container competes for the same CPU as the running app — a clean 24-hour soak rules out marginal-resource crashes that show up only after the deploy excitement fades.**

# Phase C — Production OAuth install + GDPR compliance verification

You repeat Phase A's procedures against the production deploy. The key differences: real domains, real TLS, real Traefik in the path, real Coolify env vars (not `.env.local`), and Shopify reviewers will run something like this themselves during the BFS gate.

**Procedure:**

1. From the dev store (the same one Phase A used), uninstall the local-tunnel install if it's still listed.
2. Update `shopify.app.flintmere.toml` to point `application_url = "https://app.flintmere.com"` and `redirect_urls` to the production callbacks. Run `shopify app deploy` (only deploys the *config*, not code — code lives in Coolify).
3. From the dev store, install the app fresh via the Partner Dashboard "Test on store" button. Watch every callback hit `https://app.flintmere.com` with a real cert.
4. Repeat all six smoke tests from Phase A against the production install.
5. **GDPR webhook compliance verification — the version BFS reviewers actually run:**

   For each of the three GDPR-compliance webhooks (`customers/data_request`, `customers/redact`, `shop/redact`), curl directly with a forged-but-valid HMAC-signed body and verify three properties:
   ```bash
   # generate test payload
   PAYLOAD='{"shop_id":12345,"shop_domain":"<dev-store>.myshopify.com","customer":{"id":1,"email":"x@example.com"}}'
   SECRET=<your SHOPIFY_API_SECRET>
   SIG=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

   curl -i -X POST https://app.flintmere.com/webhooks/customers-data-request \
     -H "Content-Type: application/json" \
     -H "X-Shopify-Topic: customers/data_request" \
     -H "X-Shopify-Shop-Domain: <dev-store>.myshopify.com" \
     -H "X-Shopify-Hmac-Sha256: $SIG" \
     --data "$PAYLOAD"
   ```
   The response must:
   - Return 200 in **under 5 seconds** wall-clock. Time it with `\time`. BFS reviewers reject handlers that exceed this budget.
   - Reject the same payload with a deliberately-wrong signature and return 401 (don't process it).
   - Be idempotent: hitting the same `X-Shopify-Webhook-Id` header twice writes a single `app_webhook_events` row, not two.

6. Repeat with deliberate omission of the HMAC header — must 401.
7. Verify in Sentry that no PII from the webhook payload leaked into a captured event (the `beforeSend` scrubber strips `request.body` and the four `X-Shopify-*` signature headers; spot-check a real captured error payload to confirm).

**Gate C — proceed only if:**
- A full install → scan → apply-fix → revert → uninstall → 30-day-purge-scheduled lifecycle works on the production deploy.
- All four GDPR webhooks (the three compliance ones plus `app/uninstalled`) handle in <5s, idempotently, with HMAC verification working.
- No PII surfaces in Sentry.

# Phase D — Built-for-Shopify readiness checks (executable, not "run skill")

The `shopify-app-store-submission` skill packages this as a structured submission flow. This phase is what you actually *check*, item by item, before invoking the skill. The skill prepares the listing; the verifications below prove the listing has substance behind it.

**Performance budget** (BFS gates these — public Shopify Web Vitals reports are part of the review):
- The embedded `app._index` first contentful paint < 2.5s on a throttled Fast-3G connection. Open Chrome DevTools, throttle Network → Fast 3G + CPU 4× slowdown, reload, measure. If LCP > 2.5s, identify the largest blocking asset and address before submission.
- Total JS bundle on `app._index` < 1MB uncompressed. `pnpm -F shopify-app build` then check `apps/shopify-app/build/client/`.
- Worker job p95 latency: not directly BFS-graded, but a slow `score-catalog` (>2 minutes for a 500-product store) means the dashboard sits on a "scanning…" state for too long. Acceptable upper bound: 90 seconds for 500 products.

**App Bridge correctness:**
- Every navigation in `app/routes/app.*.tsx` uses `<Link>` from `@remix-run/react`, not raw `<a>`, so App Bridge intercepts. Grep for `<a href` under `app/routes/app/` and inspect any hits.
- The session-token auth path works: confirm `shopify.server.ts` calls `authenticate.admin(request)` on every loader/action under `app.*`. Grep for the pattern; missing call = exposed route.
- iframe-busting headers present on every `app.*` response (App Bridge needs `Content-Security-Policy: frame-ancestors https://*.myshopify.com https://admin.shopify.com`). Verify with `curl -I https://app.flintmere.com/app` from outside the iframe context.

**Polaris correctness:**
- Every page renders inside `<AppProvider>` from `@shopify/polaris` (check `app/routes/app/route.tsx`).
- The Flintmere island components (`IslandFrame`, `ScoreRing`, `PillarGrid`) render *inside* Polaris primitives, not as replacements for them. Confirm: dashboard uses `<Page>`, `<Layout>`, `<Card>` as the chrome and the island only appears within `<Card>` bodies. The 2026-04 design review locked this rule.
- No restyled Polaris primitives. Grep for `Polaris-` class overrides in `apps/shopify-app/app/**/*.css` and `*.tsx` style props. Any hit is a BFS rejection risk.

**Accessibility (Noor's veto applies):**
- Run `npx playwright test` with axe-core checks on `app._index`, `app.issues.$issueId`, `app.fixes.$fixId`. Zero `serious` or `critical` findings. The strict `prefers-reduced-motion` contract on island components is required for BFS — verify `motion.css` contains the appropriate media-query branch.
- Keyboard navigation through the score ring → pillar grid → issue list → drill-down → fix-apply works without a mouse.

**Billing posture:**
- The BFS gate does not require Shopify Managed Pricing for embedded apps that bill via Shopify Billing API. Per ADR 0009, the choice between Managed Pricing and the Billing API is "use Managed Pricing for App Store-distributed simple subscriptions; use the Billing API only when complex (Stripe-side already exists for non-Shopify customers)." For the post-launch app, Managed Pricing is the lower-friction path. Configure two plans in Partner Dashboard:
  - Growth — £49/mo (canonical price; ladder restructure per v2 strategy is gated behind the WTP study and is a separate workstream).
  - Scale — £149/mo.
- **Plus tier stays unlisted** (per ADR 0017, `betaGated: true` in `pricing.ts`). The App Store listing must not advertise Plus or any "from £1,200/mo" anchor. Plus is enquiry-only.
- Test mode: install on the dev store, click upgrade-to-Growth, complete the Shopify-side approval flow, verify the `Shop.planTier` updates in Postgres.

**Listing copy + privacy claims:**
- The privacy disclosure on the listing must reconcile with `apps/scanner/src/app/privacy/page.tsx` and `apps/scanner/src/app/dpa/page.tsx`. The Shopify-app Privacy Policy URL pointed to from the Partner Dashboard listing form is `https://flintmere.com/privacy`.
- The DPA URL is `https://flintmere.com/dpa`.
- The "What data does this app access?" section of the listing matches `shopify.app.toml` `access_scopes` exactly: read_products, write_products. Add `read_product_listings`, `write_metaobject_definitions`, `write_metaobjects` if the env file's `SHOPIFY_SCOPES` differs from `shopify.app.toml` — those two must be reconciled before submission. (As of 2026-05-10 they differ: `.env.example` lists more scopes than `shopify.app.toml` declares. Fix this in Phase A.)

**Gate D — proceed only if:**
- Performance budgets met on a throttled connection.
- Polaris + island posture verified.
- a11y suite passes.
- Billing test passes on dev store.
- All listing claims verified against canonical sources.
- Scope declarations match between `.toml` and `.env.example` and what's described in the listing.

# Phase E — App Store listing assets

The `shopify-app-store-submission` skill drafts these. Below is what BFS reviewers check for substance, not the skill's drafting workflow.

**Required assets:**
- App icon: 1200×1200 PNG. Already in `apps/shopify-app/design-sources/1200x1200icon.psd` and `apps/shopify-app/public/icon.svg`.
- Feature image: 1600×900 JPG/PNG. Lossless compression. No "designed in Figma" UI mockups — BFS prefers an actual product surface.
- Screenshots: 1600×900 PNG, minimum 3, maximum 6. Capture from the dev-store install with synthetic but plausible data. The BFS rule: "screenshots must show the app in real use, not labeled mockups."
- Demo video: 60s max. Captioned. MP4. Showcase: install → first scan → issue drill-down → apply a Tier 1 fix → see the score change. The recording happens on the dev store.

**Listing copy:**
- Tagline ≤ 70 characters. Avoid "AI-readiness" framing per the v2 strategy — the dead-inventory wedge is the conversion message. **But the wedge engineering ship state determines what you can claim.** If the suppression-estimate module isn't live in the embedded app at submission time, the tagline cannot mention "£X/month suppressed" — claim only what ships.
- Description: lead with what changes for the merchant in the first 7 days of use. Avoid the founder voice (per memory feedback, always team voice — "we" / "the team" / no John Morris signature on listings).
- Categories: Inventory & products → Catalog management. Add Marketing → Conversion optimisation if the dead-inventory wedge ships.

**Verification handoff:**

The `claim-review` skill runs over every public claim before submission. Every "X% improvement" / "Y SKUs scored" / "Z-minute fix" needs a backing source in `apps/scanner/src/lib/` or a published research piece. Don't ship listing copy with a number you can't trace to code.

**Gate E — proceed only if:**
- Listing draft is fully populated in the Partner Dashboard.
- `claim-review` skill returns no P0 or P1 findings on the listing copy.
- Screenshots and video were captured on the production deploy, not on a local tunnel.
- Privacy + DPA URLs return 200 from the public internet and the content matches what the listing summarises.

# Phase F — Submit + revision loop

Submission is a single button in the Partner Dashboard. The work is everything before it and the iteration cycle after it.

**Initial submission:** push **Submit for review** in the Partner Dashboard. Shopify's automated checks run within minutes. Manual review is typically 5–10 business days for first-time apps; expect longer for the BFS-grade gate (often 3–4 weeks elapsed including the revision cycle).

**Common revision categories** (budget for at least one round; 70% of first-submission apps get one):

- **OAuth + scope issues**: usually a mismatch between declared scopes and used scopes, or the install screen wording. Cheap to fix — update `shopify.app.toml`, redeploy.
- **GDPR webhook timing**: a reviewer's curl showed a >5s response. Profile the handler, find the slow operation (often a synchronous LLM call that should be enqueued instead), refactor.
- **Polaris violation**: a reviewer flags a custom-styled component that should use a Polaris primitive. Replace.
- **Missing accessibility affordance**: keyboard-trap inside a modal, or an ARIA label missing. Add.
- **Listing inaccuracy**: a claim doesn't match the app's actual behaviour. Edit the listing, not the app.

**Revision response procedure:**
- Read every reviewer comment in full before responding to any of them. They often interconnect.
- Group fixes into one merge: a single PR titled `bfs-revision-1` containing all the changes, deployed once, retested by the operator on the dev store, then the reply to Shopify cites the new build SHA.
- Never argue. The reviewer's framing is the gate; if you disagree with a finding, fix it anyway and explain in the reply why your fix differs from their suggestion. Combative replies extend review cycles.

**Gate F — submission complete when:**
- BFS-approved badge appears on the Partner Dashboard listing.
- The app is searchable in the Shopify App Store from a dev-store admin.
- The first cold-install from a non-dev store completes the full lifecycle without operator intervention.

# Decision gates — when to abort or downscope

**Abort if Gate A fails repeatedly** (>2 attempts to get the local OAuth + GDPR + apply-fix smoke clean). The local environment is not the launch surface — but if the code can't pass smoke locally, the production deploy will fail BFS regardless. Stop, investigate, return to engineering.

**Downscope at Gate D if performance budgets miss.** If `app._index` LCP exceeds 2.5s on Fast-3G, the fix is rarely a quick optimisation — it's usually structural (too much synchronous work in the loader). Strip the dashboard back to score ring + issue count + a single "view details" link, defer the pillar grid + Channel Health to a sub-route. A simpler dashboard ships, a complex one doesn't.

**Downscope at Gate E if claim-review flags a P0.** The claim is wrong. Don't ship a wrong claim into a Shopify App Store listing — the listing copy is harder to revise than the app code, and BFS reviewers re-review the listing on every revision cycle.

**Rollback after submission only if:** a security-relevant finding (HMAC bypass, leaked PII, scope-creep request) emerges from a real install. In that case: pull the listing from the Partner Dashboard ("Pause distribution"), keep the production app running for any installed merchants, fix, redeploy, resubmit. Never delete the Partner Dashboard app itself — that orphans installed merchants' encrypted access tokens with no recovery path.

# Open questions for the operator

These are the calls only the operator can make. Surface them in this order before invoking this runbook.

1. **Which pricing plans live in Shopify Managed Pricing at submission time?** The v2 strategy proposes a per-channel ladder, but the magnitudes await the WTP study (ADR 0016). Default: ship Growth £49 + Scale £149 as the BFS-submission-only plans; the per-channel ladder lands in a post-BFS revision once WTP completes.
2. **Plus tier listing posture.** Default per ADR 0017: not listed. Confirm.
3. **Wedge engineering before or after submission.** The dead-inventory suppression-estimate is a 3–4 week scanner-side project (not embedded-app-side). It does not block the embedded app's submission. But the listing copy that mentions "suppression in Google Shopping" cannot ship until the wedge does. Decide: submit a generic "catalog readiness scoring" listing first and revise after the wedge, or hold submission until the wedge is live and ship one listing with the stronger conversion message.
4. **Sentry project and BetterStack monitor budget.** Per OPERATOR-TASKS, both are pending for the shopify-app. Sentry's free tier covers two projects; BetterStack's free tier covers ten monitors. Confirm there's headroom or budget the upgrade.
5. **Worker scaling posture.** Default concurrency in `worker.server.ts` (sync=2, score=4, drift=8, fixTier1=2, gdpr=1) is sized for a single-droplet single-worker deployment. If install volume exceeds ~20 stores in the first month, the worker becomes the bottleneck. Pre-decide whether to vertical-scale the droplet or run a second worker container.

---

*End of runbook. The `shopify-app-store-submission` skill picks up at Phase D and runs the structured submission flow. The skill's output is the listing draft + asset package; this runbook is the engineering work that gives the listing something true to claim.*
