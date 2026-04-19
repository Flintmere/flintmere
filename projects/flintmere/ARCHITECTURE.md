# Flintmere — Architecture

API routes, DB schema, feature gates, integrations. Claude reads this when building / debugging / migrating any surface.

## API routes

| Route | Method | Auth | Rate limit | Notes |
|-------|--------|------|-----------|-------|
| `/api/healthz` | GET | public | none | liveness |
| <add rows> |  |  |  |  |

## DB schema (high level)

- `users` — identity, session, plan
- `subscriptions` — Stripe mirror
- <add tables>

## Migrations

- `migrations/` — numbered SQL files, apply in order
- Rule: IF NOT EXISTS guards, DOWN section for rollback

## Feature gates

- Free tier: <scope>
- Paid tier: <scope>
- Enforcement: `src/lib/feature-gate.ts` (or equivalent)

## External integrations

- **Stripe** — subscriptions + webhook
- **<Redis provider>** — rate limit + cache
- **<Email provider>** — transactional
- <add>

## Cron jobs

- `/api/jobs/…` — <schedule + purpose>

## Observability

- Logs: <platform>
- Errors: <Rollbar / Sentry / …>
- Uptime: <monitor>
