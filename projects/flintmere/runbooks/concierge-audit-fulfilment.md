# Runbook — Concierge audit fulfilment

**Audience.** Anyone fulfilling a paid Concierge audit — current operator, future operator, a contractor, future Claude. Foolproof: every command spelled out, every error mapped to a fix.

**Trigger.** A Stripe `payment_intent.succeeded` webhook fires for a PaymentIntent whose metadata reads `kind=concierge-audit`. That is the only entry point.

**SLA.** Three working days between Stripe charge and delivered email. The customer email already promises this on intake — do not move it.

**Bands (per ADR 0022).**

| Band | SKUs | Price | Drafted fixes | Scope |
|---|---|---|---|---|
| Band 1 | up to 1,500 | £197 | 10 fully drafted | Full per-product |
| Band 2 | 1,501–5,000 | £397 | 25 fully drafted | Full per-product |
| Band 3 | 5,001+ | from £597 | 25 fully drafted | Representative sample |

Band 3 routes through `/contact?topic=concierge`, not Stripe. If a Band 3 lands in the Stripe dashboard, something has gone wrong upstream — page the operator.

---

## The architecture in 30 seconds

Stripe webhook → `apps/scanner/src/app/api/webhooks/stripe/route.ts` → upserts a row into `scanner_concierge_audits` (Prisma model `ConciergeAudit`), sends the customer a confirmation email, sends the operator inbox a notification email. From there the operator runs two CLI scripts on a local laptop:

1. `audit:csv` — pulls the merchant's catalog (public scan + optional Shopify Admin GraphQL when the merchant has shared a token via `/secret`), scores it, writes a per-product CSV plus a catalog-level summary into `data/audits/<domain>-<YYYY-MM-DD>.csv` and `.summary.md`.
2. `audit:deliver` — emails the merchant the operator-drafted letter PDF + the CSV, then stamps `deliveredAt` on the row.

The SLA safety-net is a Coolify scheduled task that runs `audit:sla-monitor` daily and emails the operator inbox a one-line-per-late-audit summary. Configured once, no maintenance.

---

## The full operator workflow

### Step 0 — wait for the Stripe webhook

You will receive an operator notification email subject-lined `New concierge booking — <Band> — <shop URL>`. The body lists customer email, shop URL, payment intent ID, Stripe dashboard URL, and the deliverable promise.

If you have not received this within **10 minutes** of seeing the Stripe charge clear, see Troubleshooting §A.

### Step 1 — wait for the merchant's reply with their admin token

The customer email already asks the merchant to:

1. Create a private app in Shopify admin (Settings → Apps and sales channels → Develop apps → Create app).
2. Tick the `read_products` + `read_product_listings` + `read_metafields` scopes.
3. Install it, copy the `shpat_…` token.
4. Paste the token at `flintmere.com/secret`.
5. Reply to the email with the resulting `flintmere.com/secret/<id>?key=<key>` URL.

Most merchants reply within one working day. If they have not replied within **24 hours**, send a friendly nudge — the audit can still run on public scan signal alone, but three of the seven pillars stay locked (`requires-install`).

### Step 2 — retrieve the admin token

When the merchant replies with the secret URL:

1. Click the link **once**. The page decrypts client-side using the URL fragment after `#`. The link burns on click — if you misclick or close the tab too fast, you have to ask the merchant to generate a new one.
2. Copy the `shpat_…` token. The page has a Copy button.
3. **Do not paste the token anywhere that retains plaintext.** No Slack, no Notion, no Google Doc, no email reply. The token only exists for the duration of one CLI run.

### Step 3 — run audit:csv on your local laptop

```sh
cd ~/Projects/Flintmere
SHOP=merchantdomain.com SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxx pnpm --filter scanner audit:csv
```

Run on **your laptop**, never inside the Coolify container. The script opens a Postgres connection (it needs `DATABASE_URL` set in `apps/scanner/.env.local`) and reaches out to Shopify Admin GraphQL with the token.

If the merchant has not supplied a token, omit `SHOPIFY_ADMIN_TOKEN`. The four public pillars (identifiers, titles, consistency, crawlability) score; the three OAuth-locked pillars (attributes, mapping, checkout) return `requires-install`.

Outputs land in `data/audits/`:

```
data/audits/merchantdomain.com-2026-05-04.csv
data/audits/merchantdomain.com-2026-05-04.summary.md
```

The CSV is per-product worst-first with severity scores, issue codes, and suggested-fix hints. The summary is a Markdown brief of catalog-level findings, including the OAuth-pillar breakdown when the token was supplied.

The directory is gitignored (`/.gitignore` line `data/audits/*`) — you cannot accidentally commit it.

### Step 4 — review the CSV and draft the letter

Open the CSV in Numbers or Excel, sort by `severity_score` descending. Scan for the patterns. Read the summary alongside.

Draft the letter in Pages, Word, or Google Docs. Export to PDF as `data/audits/letter-<domain>-<YYYY-MM-DD>.pdf` (gitignored, lives next to the CSV).

The letter is what the merchant pays for. Cover, in this order:

1. **Headline diagnosis** — one sentence on the catalog's biggest revenue leak.
2. **Per-pillar grade** — seven pillars when admin token was supplied, four when not. Each pillar gets the one signal that moves the grade most.
3. **The Band-N fully-drafted fixes** — the deliverable promise. Band 1: 10 products. Band 2: 25 products. Band 3: 25 products from a representative sample. Each fix shows the current title / description / metafield and the proposed replacement, ready to paste into Shopify admin.
4. **Quick wins beyond the drafted set** — pattern-level recommendations the merchant can apply across the rest of the catalog.
5. **30-day re-scan offer** — restate the promise. "Reply to this email any time after \[deliveredAt + 30 days\] and we'll rescan and write you a one-page progress note."

**Never paste the merchant's `shpat_…` token into the letter.** It serves no purpose there and would propagate the secret. The script never embeds it; you must not either.

### Step 5 — run audit:deliver

```sh
pnpm --filter scanner audit:deliver \
  --intent pi_3xxxxxxxxxxxxxxxxx \
  --letter ./data/audits/letter-merchantdomain.com-2026-05-04.pdf \
  --csv ./data/audits/merchantdomain.com-2026-05-04.csv \
  --notes "Optional one-liner pinned to the email body"
```

The intent ID lives on the operator notification email and on the Stripe dashboard charge page (begins with `pi_`).

This sends one email via Resend with both files attached, then updates `ConciergeAudit { status: 'delivered', deliveredAt: now() }`. The terminal will print:

```
Delivered.
  Email id : <resend-id>
  To       : <customer@example.com>
  Shop     : <merchantdomain.com>
  Letter   : letter-….pdf (X.XX MB)
  CSV      : ….csv (X KB)
```

If you see anything other than `Delivered.`, the database was not updated — re-run after fixing the cause. The script is idempotent: it refuses to re-send if `deliveredAt` is already set, unless you pass `--force`.

### Step 6 — log the day-30 rescan in your calendar

Until the day-30 rescan cron ships, set a calendar reminder for `deliveredAt + 30 days`. The customer email promised it; the SLA-monitor cron does not enforce it.

---

## SLA monitoring — the Coolify scheduled task

This is the safety-net. Without it, an SLA breach is silent. Configure it once, then forget about it.

### One-time setup

The cron runs as an HTTP route on the running scanner, fired by `curl` from a Coolify scheduled task. This is intentional (council 2026-05-03) — the runtime container ships only `node` + `prisma` + `curl`, not `pnpm` or `tsx`, so a direct script invocation fails with `sh: pnpm: not found`. The HTTP-route pattern reuses the running scanner web, needs no Dockerfile changes, and extends cleanly to any future cron.

**Step 1 — generate a 32+ character secret** on your laptop:

```sh
openssl rand -hex 32
```

Copy the 64-character hex output. This is the `CRON_SECRET` value.

**Step 2 — add it to scanner's Coolify env vars:**

1. Coolify dashboard → project **flintmere** → application **scanner** → **Environment Variables**.
2. **+ Add** → Name `CRON_SECRET`, Value `<paste the openssl output>`, **Runtime only** (uncheck Build Time).
3. Save. Coolify will redeploy the scanner. Wait for green.

**Step 3 — find the scanner web container name:**

Coolify scheduled tasks exec inside one of the app's containers. When the app has more than one (which scanner does — Coolify keeps helper containers for healthchecks/logs), Coolify needs the exact container name. Otherwise you get `Job permanently failed: More than one container exists but no container name was provided`.

In the Coolify dashboard → project **flintmere** → application **scanner** → **Containers** tab, copy the running scanner container's name. It looks something like `bbjhn12jicwxbrmifmpgu555-093421` (Coolify's deployment slot id + a suffix).

**Step 4 — add the scheduled task:**

1. Same scanner application → **Scheduled Tasks** in the left sidebar.
2. **+ Add Scheduled Task**.
3. Fill the fields:

   | Field | Value |
   |---|---|
   | Name | `Concierge SLA monitor` |
   | Command | `curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" https://audit.flintmere.com/api/cron/concierge-sla` |
   | Frequency | `0 9 * * 1-5` |
   | Container | `<paste the scanner container name from Step 3>` |

4. Save.
5. Click **Run Now** to test. Healthy idle output (no late audits):

   ```json
   {"event":"concierge-sla-scan","undeliveredCount":0,"lateCount":0,"slaWorkingDays":2,"alertSent":false}
   ```

   With at least one late audit, you'll also see `"alertSent":true` and `"lateCount":N`, and an email lands in the operator inbox.

6. Done. The task runs at 09:00 UTC every Mon–Fri without further input.

**Why public HTTPS, not localhost.** Earlier attempts used `http://localhost:3000` — that only works if the scheduled task happens to run inside the same container Next.js is listening in. Coolify can pick a different container, in which case localhost has no listener and you get `curl: (7) Failed to connect to localhost port 3000`. The public URL routes through Traefik regardless of which container the task runs in. The `CRON_SECRET` is the gate either way — exposing the path on the public internet adds zero risk because the timing-safe secret check fails closed on missing or wrong header.

### Why HTTP, not direct script

The runtime container is a stripped Next.js standalone build. It deliberately doesn't carry pnpm, tsx, or the `apps/scanner/scripts/` directory — only the compiled web bundle plus prisma. Trying to run `pnpm --filter scanner audit:sla-monitor` as a Coolify scheduled-task command fails with `sh: pnpm: not found`.

The HTTP-route pattern keeps the runtime image small, works with any future cron (just add another `/api/cron/<name>/route.ts`), and gives unified logs (cron run output lands in the scanner web logs alongside everything else).

### What it does

Daily at 09:00 UTC (Mon–Fri), the task queries `ConciergeAudit` for any row with `status = 'paid'` and `deliveredAt IS NULL` where the purchase is at least 2 working days old (Saturdays and Sundays excluded). For each late row, it sends one email to the operator inbox. Daily reminder until you run `audit:deliver` and the row drops out of the query.

### What it does not do

- Account for UK bank holidays. If a holiday falls during a fulfilment window, expect one false-positive alert. Acceptable trade-off; the alternative is wiring a holiday calendar.
- Account for time zones. Cron runs UTC; the working-day calculation is also UTC. Edge case: a charge at 23:30 UTC on Friday counts Friday as day-zero. In practice indistinguishable from a Saturday charge at 00:30 UTC.
- Re-alert on the same row idempotently. It alerts daily until delivered. Daily noise is the design — silence-until-action is the wrong default for an SLA gate.

### Optional config

Add to scanner Coolify environment if you want to override defaults:

| Env var | Default | Purpose |
|---|---|---|
| `CONCIERGE_OPS_EMAIL` | `RESEND_REPLY_TO` then `hello@flintmere.com` | Where SLA alerts land |
| `SLA_WORKING_DAYS` | `2` | Threshold in working days |

---

## Troubleshooting

### A. Stripe charge cleared but no operator notification arrived

Most likely the webhook did not fire or HMAC failed.

1. Coolify dashboard → scanner → Logs. Search for `webhooks/stripe` or the payment intent ID. Look for `signature-failed` or `webhook-error`.
2. If signature failed: the `STRIPE_WEBHOOK_SECRET` env var in Coolify does not match the live webhook secret in the Stripe dashboard. Rotate. The Stripe dashboard "Resend webhook" button is idempotent against our upsert.
3. If the webhook fired but no email arrived: check the Resend dashboard → Logs → search by recipient. Look for bounce / suppression. The `to:` address comes from `CONCIERGE_OPS_EMAIL || RESEND_REPLY_TO || hello@flintmere.com`.

### B. `audit:csv` fails with `ShopifyAdminFetchError`

The supplied admin token is wrong, revoked, or missing scopes.

1. Re-run without `SHOPIFY_ADMIN_TOKEN` to deliver on public scan signal.
2. Reply to the merchant: ask them to regenerate the token with `read_products` + `read_product_listings` + `read_metafields` scopes, and to paste it at `/secret` again.

### C. `audit:deliver` exits with `Audit already delivered at …`

You have re-run the script after a successful first delivery. Pass `--force` to re-send (rare; only for follow-up on a Resend failure that left state half-applied).

### D. Local script fails with `Cannot read properties of undefined (reading 'findMany')`

You imported `PrismaClient` from `@prisma/client` instead of `../src/generated/prisma`. The scanner pins its Prisma client to a per-app path so the scanner and the shopify-app can coexist. The two existing scripts (`audit:csv`, `audit:deliver`, `audit:sla-monitor`) already import correctly via `prisma` from `../src/lib/db`. If you are writing a new script, copy that pattern.

### E. Coolify container `mkdir` fails with `Permission denied`

Expected. The scanner container runs as a non-root user. Never write files into the container manually. Scripts deploy via `git push` → Coolify rebuilds the image. The Coolify scheduled task runs the deployed script in-place; you do not copy files in.

### F. SLA monitor email did not arrive

Read the Coolify task log in this order:

1. **`Job permanently failed: More than one container exists but no container name was provided`** — the Container field in the Scheduled Task UI is empty. Fill it with the scanner container name (Coolify dashboard → scanner → Containers tab → copy the running container's name).
2. **`curl: (7) Failed to connect to localhost…`** — you're using a localhost URL but the task runs in a different container. Switch to the public HTTPS URL: `https://audit.flintmere.com/api/cron/concierge-sla`.
3. **`curl: (22) The requested URL returned error: 403`** — the `CRON_SECRET` env var doesn't match what the route expects. Re-paste it into Coolify scanner env vars, redeploy, retry.
4. **`curl: (22) The requested URL returned error: 503`** — `CRON_SECRET` is unset or shorter than 32 chars. Generate a new one with `openssl rand -hex 32` and paste.
5. **`curl: (6) Could not resolve host: audit.flintmere.com`** — DNS issue, or you're using a typo on the URL. Verify the domain resolves on the droplet (`nslookup audit.flintmere.com` from inside the container).
6. **JSON response with `"alertSent":false`, no `alertReason`** — healthy idle. No late audits, no email expected.
7. **JSON response with `"alertSent":true`, `"lateCount":N`** — alert was sent. Check Resend dashboard for delivery status.
8. **JSON response with `"alertSent":false`, `"alertReason":"…"`** — Resend is misconfigured. Check `RESEND_API_KEY` in Coolify scanner env.

### G. Local script run fails after `pnpm --filter scanner audit:sla-monitor`

The `audit:sla-monitor` package script is for **local manual runs only** on the operator's laptop, where pnpm + tsx are installed. The production cron uses the HTTP route (see SLA monitoring above), not this script. If the local run fails, check `DATABASE_URL` in `apps/scanner/.env.local` — must point at the scanner Postgres, not the worker DB.

### G. The operator's clock is wrong / cron fires at unexpected time

Coolify uses the droplet's UTC clock. UK BST is UTC+1 in summer. `0 9 * * 1-5` runs 09:00 UTC = 10:00 London May–Oct. Adjust the cron expression if you want the monitor to fire at a different local time.

---

## Security rules

These are non-negotiable. The leak audit (council 2026-05-03) verified each is currently respected.

1. **`audit:csv` runs on the operator's local laptop only, never via `coolify exec` or inside the running container.** The token is set via process env; inside a container, it would be visible to anyone with access to `/proc/<pid>/environ` for the lifetime of the script.
2. **The merchant's `shpat_…` token never leaves the operator's machine in plaintext.** Not in Slack, not in email replies, not in the letter PDF, not in commit history, not in chat with anyone.
3. **`data/audits/` is gitignored.** Do not override the `.gitignore` rule.
4. **The `/secret/<id>?key=<key>` URL goes to browser history with the fragment.** After clicking the merchant's secret URL, clear that one entry from browser history if you share the laptop. The fragment is the decryption key.
5. **Never re-share a one-time-secret URL.** Once clicked, the link burns. If you need the token again, ask the merchant for a fresh secret URL.

---

## Day-30 rescan (manual, until automated)

When the calendar reminder fires:

1. Re-run `audit:csv` against the same shop. If the merchant gave you a token last time and it still works, use it. Otherwise public scan.
2. Compare the new score against the old. The old `data/audits/<domain>-<YYYY-MM-DD>.summary.md` is the baseline.
3. Draft a one-page progress note: which pillars moved, what fixes landed, where the catalog still has runway. Lighter than the original letter.
4. Email it to the merchant. No script for this yet — use Resend dashboard or a manual mail. Do not stamp `deliveredAt` again; that field reflects the original delivery.

When the day-30 cron lands (open follow-up), this manual flow retires.

---

## Pointers (file)

| What | Where |
|---|---|
| Stripe webhook handler | `apps/scanner/src/app/api/webhooks/stripe/route.ts` |
| Customer email template | `apps/scanner/src/lib/concierge-email.ts` |
| Operator notification template | `apps/scanner/src/lib/concierge-email.ts` (`sendConciergeOpsEmail`) |
| Delivery email template | `apps/scanner/src/lib/concierge-delivery-email.ts` |
| `audit:csv` script | `apps/scanner/scripts/export-audit-csv.ts` |
| `audit:deliver` script | `apps/scanner/scripts/audit-deliver.ts` |
| `audit:sla-monitor` script | `apps/scanner/scripts/concierge-sla-monitor.ts` |
| Band ladder + pricing | `apps/scanner/src/lib/audit-pricing.ts` |
| `ConciergeAudit` model | `apps/scanner/prisma/schema.prisma:89` |
| One-time-secret service | `apps/scanner/src/app/secret/` + `apps/scanner/src/app/api/secret/` |
| Band ladder ADR | `projects/flintmere/decisions/0022-*.md` |

## Open follow-ups

- **Day-30 rescan cron.** Same shape as `audit:sla-monitor`, queries `deliveredAt < now() - 30 days AND notRescanned`, sends rescan offer. Schema change to track rescan state. Land when first audit's `deliveredAt + 30d` is approaching.
- **Working-day calculation respects UK bank holidays.** Trade-off currently accepted; tighten if false-positive alerts become noise.
- **Sentry beforeSend regex scrubber for `shp(at|ca|pa|ss)_…`.** Defence-in-depth from the leak audit. ~30 lines across three Sentry config files.
- **`main().catch` token-scrub wrappers in `audit:csv` + `audit:deliver`.** Defence-in-depth from the leak audit. ~10 lines per script.
