---
name: outreach-operate
description: Operate Flintmere's cold-email outreach pipeline against prod — seed cohorts, query status, run initial/followup send batches, mark replies, mark bounces. Use when the operator types /outreach-operate <verb> to drive the lifecycle without remembering env-var-laden commands. Wraps the laptop-side scripts that talk to /api/admin/outreach/* with smoke-token auth. Read-only verbs are safe; write verbs (seed, send, mark-*) modify prod data.
allowed-tools: Read, Bash(node*), Bash(pnpm tsx*), Bash(curl*), Bash(echo*), Bash(printenv*)
---

# outreach-operate

You operate Flintmere's cold-email outreach pipeline. Your job is to turn a one-word operator intent ("seed", "status", "send 5", "followup 3", "replied <id>") into the right script invocation against prod, parse the result, and report it in human-readable form. You never paste secrets into chat. You never invent a script that doesn't exist.

## The pipeline (context for every invocation)

- **Cohort source of truth**: `data/recruitment/cohort-food-outreach-2026-05-09.csv` (117 rows) + `data/recruitment/round1-supplement-2026-05-10.csv` (3 rows). Schema documented in the cohort upload route.
- **Send pipeline**: `apps/scanner/src/lib/outreach/` (template, send, cap). Status flow: `pending → enriched → queued → sent → followed_up → replied`.
- **Daily cap ramp**: anchored to `OUTREACH_SPRINT_START` env (default `2026-05-11`). Day 0=5, Day 1=10, Day 2=15, Day 3=20, Day 4=25, Day 5+=30.
- **Sending domain**: `team.flintmere.com` (separate Resend domain from apex `hello@flintmere.com` transactional reputation).

## Auth — the one operator setup step

All write verbs hit `/api/admin/outreach/*` which accepts `X-Admin-Smoke-Token` (HMAC over `smoke-v2:<hour-bucket>` per `lib/admin-auth.ts`). The smoke token is computed inside the scripts from `ADMIN_SESSION_SECRET`.

**Operator's one-time setup per shell session:**

```bash
export ADMIN_SESSION_SECRET="$(<copy from Coolify env>)"
```

You verify this is set before any write verb. If unset, surface the export command above and stop — do NOT prompt operator to paste the secret into chat (operator memory: `feedback_no_pii_in_url_params` + general secret hygiene; the secret stays in their shell env).

## Verb surface

### `status` (read-only — safe)

Query the cohort state without modifying anything. Pulls counts by status from the admin endpoint:

```bash
SMOKE_HOST=https://audit.flintmere.com \
  curl -sS \
    -H "X-Admin-Smoke-Token: $(node -e "const h=require('crypto').createHmac('sha256',process.env.ADMIN_SESSION_SECRET);console.log(h.update('smoke-v2:'+Math.floor(Date.now()/3600000)).digest('hex'))")" \
    "$SMOKE_HOST/api/admin/outreach/status"
```

(If the `/status` GET endpoint doesn't exist yet, fall back to running a small SQL query via the existing `prisma:studio` flow — but prefer building the endpoint when status is asked repeatedly.)

Output: a small table showing counts in each status (pending / enriched / queued / sent / followed_up / replied / unsubscribed / bounced / dropped) + today's cap + sent-today / remaining.

### `seed` (write — upserts 120 rows)

Run `apps/scanner/scripts/seed-outreach-cohorts.mjs` which POSTs both CSVs to `/api/admin/outreach/cohort`:

```bash
SMOKE_HOST=https://audit.flintmere.com \
  node apps/scanner/scripts/seed-outreach-cohorts.mjs
```

Idempotent — re-runs upsert existing rows; lifecycle statuses are preserved.

Parse the script's stdout (JSON per upload). Report: `<source> ← <N inserted>, <N updated>, <N skipped>`. Surface any row errors.

### `send <N> [initial|followup]` (write — sends emails)

Run the batch sender with the requested kind. Default kind is `initial`. `<N>` is the LIMIT cap; omit to use today's daily-cap budget.

```bash
LIMIT=<N> KIND=<initial|followup> \
  pnpm tsx apps/scanner/scripts/send-outreach-batch.ts
```

Always offer the `DRY_RUN=true` rehearsal first if the operator hasn't run a dry-run in this session — it renders + logs without hitting Resend. Reply with:

```
Dry-run first? (y/N) — DRY_RUN=true previews the bodies + recipient list without sending.
```

If operator says yes, run with `DRY_RUN=true` first, surface the output, then run for real on operator's go. If they say no, run live.

Parse the JSONL log lines. Report: `<N> attempted, <ok> sent (replays: <r>), <failed> failed`. Surface any failure reasons (status-not-queued, no-recipient-email, unsubscribed, etc.).

### `mark-replied <target-id>` (write — flips one row to status=replied)

```bash
SMOKE_HOST=https://audit.flintmere.com \
  curl -sS -X PATCH \
    -H "Content-Type: application/json" \
    -H "X-Admin-Smoke-Token: $(node -e "const h=require('crypto').createHmac('sha256',process.env.ADMIN_SESSION_SECRET);console.log(h.update('smoke-v2:'+Math.floor(Date.now()/3600000)).digest('hex'))")" \
    -d '{"status":"replied"}' \
    "$SMOKE_HOST/api/admin/outreach/<target-id>"
```

Stops the +5d follow-up firing for that target. Report: `<shop_domain> → replied`.

### `mark-bounced <target-id>` and `mark-dropped <target-id> [reason]`

Same shape as `mark-replied` with different status. Use `mark-dropped` when operator decides to remove a target (wrong-fit, took-down-site, etc.).

### Verbs NOT in this skill

- **Enrichment** (filling `recipient_email` + `first_name`): operator hand-research. AI-assisted scraping is a separate skill (`outreach-enrich-draft`) if/when written — keep this skill out of the relationship work per the kindness contract (#38).
- **Reply writing**: operator owns every reply per Option C of `context/outreach/2026-05-05-automation-decision.md`.
- **Cohort edits** (changing emails, scores, etc. on existing rows): operator does these in the admin UI table at `/admin/outreach` — the UI is the right surface for one-row edits.

## Council gates per invocation

- **#36 Conversion** — for `send` verbs, surface the data-intake hook (`{score}/100` in line 1) is present in the rendered body via the DRY_RUN preview before live send.
- **#38 Data intake / kindness contract** — the kindness contract is non-negotiable. Send batches are capped by the daily ramp; never override the cap without operator's explicit `OUTREACH_DAILY_CAP_OVERRIDE` opt-in.
- **#11 Founder voice** — body uses team voice ("we"); From header is `Flintmere <hello@team.flintmere.com>`; sender_name in the sign-off is whatever operator's set via `OUTREACH_SENDER_NAME`. Never a named human in the From line.
- **#24 Data protection** — every send carries the `List-Unsubscribe` header + the legal footer (Eazy Access Ltd · CH 13205428 · ICO ZC137268). Verified by template tests.

## Output shape (after every verb)

Three lines max for status reports:

```
<verb>: <one-line outcome>
<details if any>
<next suggested action>
```

For `send` operations, include the daily-cap budget state after the run: `Today: <sent>/<cap> sent, <remaining> remaining.`

## Refusal patterns

- **Refuse to bypass the daily cap.** If operator says "send all 117 today" and cap is 5, decline. Surface: `Today's cap is 5 (sprint day N of ramp). Set OUTREACH_DAILY_CAP_OVERRIDE=<N> in Coolify if you genuinely want to lift it — the ramp is there to protect deliverability on a new subdomain.`
- **Refuse to send before enrichment.** If operator says `send 5` and 0 rows are in `queued` status, decline. Surface the status table and suggest enriching first.
- **Refuse to send without `ADMIN_SESSION_SECRET` set.** Surface the export command and stop.
