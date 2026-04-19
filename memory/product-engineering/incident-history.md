# incident-history.md

Append-only log of production incidents, root causes, and fixes. Owned by #34 Full-stack debugging engineer + #10 DevOps. Read before any change in an area with incident history — the past is evidence.

## Entry format

```
## YYYY-MM-DD — <short title>

- **Surface:** <what broke>
- **Severity:** <P0 | P1 | P2 | P3>
- **Duration:** <detected → resolved>
- **Impact:** <user-visible effect, rows affected, revenue impact if known>
- **Trigger:** <commit / deploy / external / traffic spike>
- **Root cause:** <one paragraph, no hedging>
- **Fix:** <what shipped, link to commit or PR>
- **Follow-ups:** <preventive work spawned by this incident, link to tickets>
- **Council review:** <which members convened, any new invariants>
```

## Rules

- Append-only. Do not edit past incidents; add a follow-up entry if new information surfaces.
- Log every P0 and P1. Log P2s that produced a root-cause lesson. Skip P3s unless the lesson is reusable.
- Entries written within 5 business days of resolution. Longer and memory degrades.
- Link to the post-mortem (longer form) when one exists. This file is the short, searchable index.

## Why this lives here

- Prevents repeating the same bug. Before touching a subsystem, grep this file.
- Surfaces drift. Repeated incidents in one area = missing test, missing rate limit, missing monitor.
- Feeds the council. New invariants that come out of incidents get promoted to `architecture-rules.md`, `security-posture.md`, or `performance-budget.md`.

## Log

<!-- Append entries below in reverse chronological order (newest first). -->

<!-- No incidents logged yet under this department structure. Past incidents live in git history and post-mortems; backfill here as they become relevant. -->
