# 0026 — Marketing automation pipeline: agents create, the app executes

- **Status:** Accepted
- **Date:** 2026-06-06
- **Layers on:** ADR 0025 (PostHog — Monday's rollup in the daily brief reads the PostHog Query API for the cadence numbers), the 2026-05-11 marketing-launch-and-cadence runbook (superseded by this ADR — its manual-task model is retired), `memory/marketing/outreach.md` (PECR standing rules preserved via the per-batch approve-link mechanism), ADR 0022 (£197 Band 1 audit remains the conversion target, measured through UTM-tagged links in generated content).
- **Independent of:** ADR 0016 / ADR 0017 (pricing axes — unchanged by this ADR).
- **Source:** Operator session 2026-06-06, verbatim: *"i ge t an email every day with tasksthat i should of completed i have not done any of them for two or three weeks... why are these tasks not automated and looped over... lets amke a proper plan for marketing this site thatdoes not entail me doing manual tasks"*. The 2026-05-11 runbook carried its own kill-switch — two consecutive missed weeks fires it. Three weeks had elapsed by decision time, with `content-history.md` and the outreach append-log both empty: the runbook had failed its own test silently.
- **Affects:**
  - `apps/scanner/prisma/schema.prisma` — new `SocialPost` model; `batchId` + `approvedAt` columns on `OutreachTarget`; new migration under `apps/scanner/prisma/migrations/`.
  - `apps/scanner/src/lib/outreach/approval.ts` — HMAC link mint + verify; flips `ready_for_approval` → `queued`.
  - `apps/scanner/src/app/api/approve/route.ts` — GET endpoint behind the HMAC token.
  - `apps/scanner/src/lib/social/x-client.ts` — X API v2 client (OAuth 1.0a user-context).
  - `apps/scanner/src/lib/social/queue.ts` — queue drain + banned-phrase lexical net.
  - `apps/scanner/src/app/api/cron/social-post/route.ts` — hourly drain of due `SocialPost` rows.
  - `apps/scanner/scripts/queue-social-posts.ts` — agent script (`social:queue`).
  - `apps/scanner/scripts/stage-outreach-batch.ts` — agent script (`outreach:stage`).
  - `apps/scanner/src/lib/daily-brief/*` — rewritten from task list to pipeline report; new `posthog-rollup.ts` for Monday's numbers.
  - **Deleted:** `apps/scanner/src/lib/cadence-snapshot.ts` and the `sync-cadence.ts` script (the manual-cadence machinery the runbook depended on).

## Canon pre-flight (2026-05-09 binding)

Three canonical sources named, with what each governs in this ADR:

- `memory/marketing/outreach.md` — the per-batch approve-gate preserves PECR standing rules: sender identification, lawful basis (ICO registration ZC137268), a working opt-out in every message, and the 20-per-fortnight send cap. Approval is the human checkpoint these rules require; nothing sends without it.
- `memory/VOICE.md` — the banned-phrase list is enforced twice for generated content: in-agent at draft time, and again as a lexical net in `queue-social-posts.ts` before a post is enqueued. A post that trips the net is rejected, not posted.
- `apps/scanner/src/lib/audit-pricing.ts` — every pricing claim in generated content (social, blog, outreach) reads the band ladder from code at draft time, so no draft can ship a stale figure.

## Context

The 2026-05-11 runbook assumed roughly five manual hours a week from the operator — draft social, stage outreach, write a fortnightly blog, read the cadence snapshot. The daily email it produced was a task list: *here is what you should have done.* For three consecutive weeks the operator completed none of those tasks. The runbook's two-missed-week kill-switch should have fired at week two; it didn't, because the snapshot machinery measured intent (tasks listed) rather than execution (artefacts shipped), and an empty `content-history.md` read the same as a quiet week. A task list nobody actions is not a cadence — it is a daily reminder of a stalled one.

The diagnosis is structural, not motivational. The bottleneck is the manual step, so the manual step has to leave the critical path. LinkedIn compounds the problem from the other side: the company page can't be created (the platform requires more connections first) and the personal profile has effectively no reach, so any LinkedIn task in the list was unactionable by construction.

## Decision

**Agents create the artefacts; the app executes them. The operator's only recurring job is a fortnightly outreach approval, delivered as a one-click link in the daily email.**

The four operator-confirmed §2 decisions:

1. **The daily email is a report, not a task list.** Three sections — done (shipped in the last 24h), scheduled (queued and dated), needs-you (the only items that require the operator). A deterministic Needs-you footer means a stuck item can't hide: if something is blocked, it appears there within 24 hours.

2. **X posting is automated end-to-end.** A one-time fifteen-minute developer-app setup registers `@flintmere_`; thereafter agents post via the X API v2. Cadence: two to three posts a week.

3. **Outreach stays human-gated, but the gate is one click.** The agent builds a batch (≤20 targets per fortnight); the daily email carries an HMAC approve-link; the operator clicks it (~2 minutes a fortnight). This preserves the #9 Legal / #24 GDPR per-batch checkpoint — nothing sends until a human approves the specific batch.

4. **Blog is fully automated.** The agent opens a PR; it auto-merges on green CI. Cadence: one post a fortnight.

**The approve-link legal-gate mechanism.** The link carries an HMAC token (batch id + expiry, signed with the app secret) and a 7-day TTL. It is a GET with a side effect — normally an anti-pattern, accepted here deliberately: there is a single operator, the action is idempotent (re-clicking an already-approved batch is a no-op), and a one-click link from an email is the lowest-friction gate that still keeps a human in the loop. Approval flips the batch's `OutreachTarget` rows from `ready_for_approval` to `queued`.

**The queued-status implementation choice.** Approval does not introduce a second send path. It flips rows to `queued` so the existing outreach send pipeline — daily-cap ramp, unsubscribe checks, idempotency — runs unchanged. The approve-gate is a new front door onto a proven pipeline, not a parallel one.

**X API adoption for `@flintmere_`.** Four environment keys (API key, API secret, access token, access-token secret), operator-rotated. OAuth 1.0a user-context, because posting as the account requires user context, not app-only auth.

**LinkedIn deferral.** Deferred, not designed-around. The company page can't be created today and the personal profile has no reach, so there is no LinkedIn surface worth automating. Re-entry trigger: the company page becomes creatable (LinkedIn's connection threshold is met). At that point LinkedIn re-enters scope under a follow-up ADR.

**The heartbeat-from-`SocialPost` choice.** Agent liveness is derived from the newest `SocialPost.createdAt` rather than a new heartbeat table. If the most recent queued post is older than the expected cadence, the daily brief flags a stalled agent in the Needs-you footer. One fewer table; the signal already exists in the data we keep.

## Consequences

- **The daily brief is now a report.** It states what shipped and what is scheduled. It asks for action only when action is genuinely required (a pending outreach batch, a stalled agent).
- **Silent failure is now a contract violation.** Every stuck item surfaces in the Needs-you footer within 24 hours. The old failure mode — a stalled cadence reading the same as a quiet one — can't recur, because the brief reports execution, not intent.
- **X free-tier write limits accommodate the cadence.** Two to three posts a week sits comfortably inside the free-tier write allowance; no paid X tier is required at this cadence.
- **Deployment needs an hourly Coolify cron** hitting `/api/cron/social-post` to drain due `SocialPost` rows. This is the one new piece of scheduled infrastructure this ADR introduces.
- **The operator's recurring marketing load drops to ~2 minutes a fortnight** — a single approve-click — from the runbook's assumed five hours a week.
- **The cadence-snapshot machinery is deleted, not deprecated in place.** Leaving it would invite drift between two cadence models; the report model fully replaces it.
