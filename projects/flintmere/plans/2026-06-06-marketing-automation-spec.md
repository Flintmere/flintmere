---
spec: marketing-automation-pipeline
date_written: 2026-06-06
operator: Abdur-Rahman Morris
audience: operator (internal) + implementing agents
canon_sources:
  - projects/flintmere/plans/2026-05-11-marketing-launch-and-cadence.md (superseded by this spec)
  - memory/marketing/outreach.md (PECR rules, templates, append-log format)
  - memory/VOICE.md (banned phrases — binding on all generated content)
  - apps/scanner/src/lib/audit-pricing.ts + pricing.ts (price ground truth)
canon_audit_run: not required — operator-internal spec; canon gates fire per-artifact inside the agent pipeline (§6)
status: approved-design, awaiting implementation plan
---

# Marketing Automation Pipeline (Option C — hybrid)

## 1. Problem

The 2026-05-11 cadence runbook assumed 5 manual operator hours/week. Reality after
three weeks: zero posts shipped (`content-history.md` empty), zero outreach sent
(append log empty), LinkedIn company page blocked by the platform ("not enough
connections"). The runbook's own kill-switch fired ("two consecutive bandwidth-crash
weeks = the cadence assumption was wrong"). Meanwhile the daily-brief email keeps
narrating the dead plan, training the operator to ignore it.

**This spec replaces the runbook.** Agents create, the app executes, the operator
reads a daily report and clicks one approve link per fortnight.

## 2. Decisions (operator-confirmed 2026-06-06)

| Decision | Choice |
|---|---|
| Operator touch floor | Daily email = report ("done / scheduled / needs-you"), not a task list |
| X posting | One-time 15-min developer-app setup; agents post to **@flintmere_** via API thereafter |
| Outreach | Agent builds batches; **approve via one-click link in the daily email** (keeps #9/#24 gate, ~2 min/fortnight) |
| Blog | Fully automated: agent PR, auto-merge on green CI |
| LinkedIn | **Deferred** — platform-blocked (company page needs connections; personal profile has ~no reach). No tasks depend on it. Email may *suggest* connection-building; never as a task |
| Cadence | X 2–3/wk · blog 1/fortnight · outreach 20/fortnight · PostHog numbers in Monday's email |

## 3. Architecture

```
┌ weekly Claude agent (/schedule, Tue 09:00 London) ────────────┐
│ every week:    /social → 2–3 X drafts → SocialPost rows        │
│ fortnight A:   /seo → /writer → /claim-review → /canon-audit   │
│                → blog PR (auto-merge on green)                 │
│ fortnight B:   /outreach → 20 targets enriched + queued        │
│                (status ready_for_approval, batchId stamped)    │
│ always:        append content-history.md / outreach.md in PR   │
└────────────────────────────────────────────────────────────────┘
            │ writes rows / opens PRs
            ▼
┌ apps/scanner (deterministic, Coolify cron) ───────────────────┐
│ /api/cron/social-post   → posts due SocialPost rows via X API  │
│ /api/cron/outreach-*    → EXISTING send pipeline; eligibility  │
│                           predicate now requires approvedAt    │
│ /api/approve?token=…    → HMAC verify → stamp approvedAt       │
│ /api/cron/daily-brief   → REWRITTEN: live pipeline state in,   │
│                           report + approve links out           │
└────────────────────────────────────────────────────────────────┘
            │ daily email (Resend)
            ▼
        operator: reads; clicks approve fortnightly
```

## 4. Data model (one migration)

### 4.1 New model `SocialPost`

```prisma
model SocialPost {
  id           String    @id @default(cuid())
  channel      String    // 'x' only for now
  body         String    @db.Text
  altText      String?   @map("alt_text") @db.Text   // future media posts
  utmCampaign  String    @map("utm_campaign")
  status       String    @default("queued")          // queued | posted | failed
  scheduledAt  DateTime  @map("scheduled_at")
  postedAt     DateTime? @map("posted_at")
  externalId   String?   @map("external_id")         // X post id
  errorMessage String?   @map("error_message") @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")

  @@index([status, scheduledAt])
  @@map("scanner_social_posts")
}
```

### 4.2 `OutreachTarget` additions

- `batchId String? @map("batch_id")` — stamped by the agent when it queues a batch.
- `approvedAt DateTime? @map("approved_at")` — stamped by `/api/approve`.
- New status value `ready_for_approval` between `pending` and the send-eligible state.
- The initial-send cron's eligibility predicate gains `approvedAt != null` for
  agent-queued targets. Targets created via existing operator/admin paths are
  unaffected (backwards-compatible: `batchId IS NULL` ⇒ old behaviour).

No approval-token table: approve links are stateless HMAC URLs (§5.2).

## 5. App plumbing

### 5.1 X posting — `POST /api/cron/social-post`

- Auth: same shared-secret header pattern as the existing cron routes.
- Picks `SocialPost` rows where `status='queued' AND scheduledAt <= now()`, oldest
  first, max 3 per run (defensive; cadence is 2–3/week).
- Posts via X API v2 `POST /2/tweets`, OAuth 1.0a user context.
- New lib: `apps/scanner/src/lib/social/x-client.ts` (signing + post; per
  anti-waste rule 1, first check the official/canonical Node client and prefer it).
- Env (Coolify, operator-rotated → env vars are correct per anti-waste rule 6):
  `X_API_KEY`, `X_API_KEY_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`.
- Success → `status='posted'`, `postedAt`, `externalId`. Failure → `status='failed'`,
  `errorMessage`; failed posts are NOT retried automatically (the daily email flags
  them; the next agent run re-queues or rewrites). Idempotency: row status is the
  guard; the cron never posts a non-`queued` row.

### 5.2 Approval — `GET /api/approve?token=…`

- Token: `base64url(payload).hmacSHA256(payload, secret)` where payload =
  `{ kind: 'outreach-batch', batchId, exp }`. Secret: reuse the existing app-level
  signing secret used by magic links (do not mint a new env var if one fits).
- Expiry 7 days. Idempotent: if the batch already has `approvedAt`, render
  "already approved" — links in old emails stay safe.
- On verify: stamp `approvedAt` on all `ready_for_approval` targets in the batch →
  next outreach-initial cron run sends them through the existing pipeline
  (unsubscribe checks, idempotent sends, Resend webhooks all unchanged).
- Response: minimal HTML confirmation page, canon-styled, one line:
  "[ approved ] — 20 emails will send within the hour." GET-with-side-effect is
  accepted here deliberately: single-operator internal link, HMAC-gated,
  idempotent; the alternative (POST form) doubles the operator's clicks.

### 5.3 Daily brief rewrite (existing `lib/daily-brief/`)

- **`state.ts`**: drop the cadence-snapshot import (file + `sync-cadence` script
  retired). Collect instead:
  - `SocialPost`: queued (next 7 days), posted (last 24h), failed (any, unresolved).
  - Outreach: existing snapshot + batches in `ready_for_approval` (count, batchId,
    sample subjects) + replies since yesterday.
  - Blog: PRs opened/merged by the agent in last 24h (GitHub API or a marker the
    agent leaves; implementation plan decides — prefer zero new credentials).
  - Agent heartbeat: last weekly-run timestamp (the agent stamps a row or file the
    app can read; >8 days stale = flag).
  - Monday only: PostHog Query API rollup (visitors, scans, scan→audit funnel) via
    the existing `/admin/health` PostHog client.
- **`compose.ts`**: system prompt reframed — "report what the pipeline did and will
  do; list operator actions ONLY when something genuinely needs a human (approve
  link, failed post, X keys missing)." Voice rules unchanged. Approve links passed
  through verbatim.
- **Pipeline-health footer** (deterministic, not LLM): failed posts, batches
  awaiting approval >72h, agent heartbeat stale, cron errors — one sharp line each.
  Nothing stuck is ever silent.

## 6. Weekly content agent (Claude scheduled routine)

- Schedule: Tue 09:00 Europe/London via `/schedule`; repo checkout, full skill access.
- **Every run:** draft 2–3 X posts (`/social`, X register, banned-phrase +
  canon-audit gates in-session, UTM per the existing scheme) → insert `SocialPost`
  rows spread Tue/Thu/Sat via a small script (`scripts/queue-social-posts.ts`,
  takes JSON, validates voice-bans lexically as a second net).
- **Fortnight A (blog):** `/seo` brief → `/writer` draft → `/claim-review` →
  `/canon-audit` → land via `/web-implementation` → PR with `content-history.md`
  append → auto-merge on green CI. Cross-promo X post queued for publish day.
- **Fortnight B (outreach):** `/outreach` builds 20 targets (public sources only —
  Plus Partner directory, list articles; existing discover scripts), runs the
  existing enrich path, sets `ready_for_approval` + `batchId`, appends intent to
  `memory/marketing/outreach.md` in a PR. Email approve link does the rest.
- **Honesty rules:** real numbers only (post 4 rule: "if N is 12, it's 12");
  pricing claims read from `audit-pricing.ts`/`pricing.ts` at draft time.
- Agent failure = missed heartbeat = flagged in next morning's email.

## 7. Operator one-time setup

1. **Today:** merge PR #60 + Coolify redeploy (pre-existing PostHog handover item).
2. **X developer app (~15 min):** developer.x.com → free tier → create app on
   @flintmere_ → generate the 4 keys → paste into Coolify scanner env → redeploy.
   Click-by-click steps will be included in the daily email until done; the
   pipeline queues posts regardless and flags "X keys missing" rather than failing.
3. That's all. Recurring: read the email; click approve fortnightly.

## 8. Failure handling summary

| Failure | Behaviour |
|---|---|
| X API error | Row → `failed` + reason; email flags; agent re-queues next run |
| Vertex down (brief) | Existing deterministic fallback keeps the channel alive |
| Agent run missed | Heartbeat stale → email flags; nothing else breaks |
| Approve link expired | Batch stays `ready_for_approval`; email re-issues link daily |
| Resend bounce/complaint | Existing webhook path unchanged |
| Operator ignores email | Content + X still ship (zero-touch); only outreach waits |

## 9. Testing

- HMAC token sign/verify round-trip + tamper + expiry cases.
- X client request signing against recorded fixtures; cron route with mocked client
  (success / failure / empty queue).
- Approval route: idempotency, expired token, unknown batch.
- `state.ts` new collectors with seeded DB; compose prompt-shape tests updated.
- Existing 602-test suite stays green.

## 10. Non-goals

- LinkedIn automation (platform-blocked; revisit when a company page is possible).
- Carousel-render route, newsletter, paid ads, podcast outreach (Phase-4 material,
  reassess after 8 weeks of pipeline data).
- Auto-send outreach without approval (legal gate retained by operator choice).

## 11. Success criteria (8-week horizon, measured in Monday emails)

- Pipeline ships ≥2 X posts/week and 1 blog post/fortnight with zero operator
  drafting minutes — measured from `SocialPost` + merged PRs.
- ≥2 outreach batches sent (operator clicks happened) with reply tracking live.
- Daily email reports pipeline truth; zero silent failures (every stuck item
  surfaced within 24h).
- Primary business metric unchanged from the runbook: **paid £197 audits
  attributable via UTM**, now measured in PostHog.

## 12. Records

- New ADR (number next in sequence) records: runbook → pipeline supersession,
  the approve-link legal-gate mechanism, X API adoption, LinkedIn deferral.
- `cadence-snapshot.ts` + `sync-cadence.ts` retired in the implementing PR.
