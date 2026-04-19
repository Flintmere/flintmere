# 0003 — Vercel Cron over external scheduler

**Status:** Accepted. cron-job.org retired.
**Date:** 2026-04-14 (decision made earlier; ADR written during refactor)
**Council:** #10 DevOps / SRE, #4 Security engineer, #17 Performance engineer

## Context

Scheduled jobs (monitoring scans, alert evaluation, email digests, cleanup) were originally triggered by **cron-job.org** hitting public API routes authenticated with a `CRON_SECRET`. This introduced:

- A third-party dependency for every scheduled job.
- A shared secret (`CRON_SECRET`) that had to be rotated and stored.
- Public routes that accepted external traffic and had to defend themselves against replay/abuse.
- Monitoring gap: cron-job.org failures were not surfaced in our observability stack.

Deployment is on Vercel, which offers native Cron via `vercel.json`.

## Decision

Use **Vercel Cron** scheduled in `vercel.json`. No external scheduler. No `CRON_SECRET` — Vercel calls the routes internally through its edge network, which authenticates the invocation.

Current schedule:

- `/api/jobs/process` — every 5 min
- `/api/monitor/cron` — every 15 min
- `/api/rules/evaluate` — every 15 min
- `/api/webhooks/process` — every 5 min
- `/api/email/cron` — daily 10:00 UTC
- `/api/jobs/cleanup` — daily 03:00 UTC

## Consequences

- No more `CRON_SECRET` to rotate or leak.
- Cron failures show up in Vercel logs + Rollbar by default.
- We are tied to Vercel's Cron semantics (invocation timing, retry behaviour).
- Local dev requires a fallback trigger mechanism (manual curl or a dev script).

## Alternatives considered

- **Keep cron-job.org** — rejected: dependency, shared secret, poor observability.
- **GitHub Actions cron** — rejected: 5-minute minimum, less reliable timing, couples CI to production.
- **Self-hosted scheduler** — rejected: we don't run servers; adds ops burden we don't want.
