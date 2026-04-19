# security-posture.md

Security invariants for `apps/*`. **#4 Security** owns this file and holds veto on anything that weakens the posture. Goes hand-in-hand with `memory/CONSTRAINTS.md` and `shopify-api-rules.md`.

## Authentication

### Scanner (audit.flintmere.com)

- Public endpoint. No user auth. Email collection is pre-auth lead capture, not identity.
- Lead submissions rate-limited per IP and per submitted email domain.
- Every scan request signed via a short-lived server-issued token (replay protection on the scan queue).

### Shopify app (app.flintmere.com)

- OAuth via `@shopify/shopify-app-remix`. Never reimplement.
- Access tokens **encrypted at rest** — Postgres column-level AES-256-GCM, key via env `SHOPIFY_TOKEN_ENCRYPTION_KEY` (32 bytes, base64, rotated every 12 months with a documented dual-read window).
- App Bridge session tokens verified on the server side for every client → server action.
- `app/uninstalled` webhook handler scrubs tokens within 60 seconds of receipt.
- **#4 Security VETO** on any change under `apps/shopify-app/src/lib/auth/`, `apps/shopify-app/src/routes/auth.*`, or the token-encryption helper.

## Secrets

- All secrets via environment variables. Never committed, never logged.
- `.env.local` gitignored. `.env.example` lists every required key with a placeholder value.
- Production secrets in Coolify environment configuration. Rotated on a documented schedule (quarterly for Shopify API secrets, annually for Stripe, on-demand for incident response).
- Never send secrets to Sentry. Redact tokens in structured logs. Allowlist what's safe to log (shop domain, request ID, status code) rather than blocklist what isn't.

## Content Security Policy

- CSP configured per app — `apps/scanner/middleware.ts` and `apps/shopify-app/middleware.ts`. One canonical source per app.
- `default-src 'self'`; script allowlist explicit, no inline scripts without a nonce.
- Shopify app: `frame-ancestors https://*.myshopify.com https://admin.shopify.com` — required for embedded App Bridge.
- Scanner: `frame-ancestors 'none'` — not embeddable.
- CSP reports routed to Sentry for review.

## CSRF

- State-changing same-origin routes check a CSRF cookie via middleware. Never per-route re-implementation.
- CORS: explicit origin allowlist for any cross-origin mutation. Never `*`.
- Shopify app: OAuth nonce + `shop` parameter verified on the callback. Shopify's helper does this; do not bypass.

## Rate limiting

- `apps/<app>/src/lib/ratelimit.ts` is canonical per app. Every new route declares its bucket + key.
- Defaults: per-IP and per-user/shop. Scanner route has its own, stricter bucket.
- Shopify GraphQL cost-based rate limit tracked separately — see `shopify-api-rules.md`.
- Tiered limits documented in `projects/flintmere/ARCHITECTURE.md` so operators can tune them.

## Webhook verification

### Shopify webhooks

- `X-Shopify-Hmac-SHA256` header verified against the raw request body + `SHOPIFY_API_SECRET` before any side effect.
- GDPR webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) handled within 30 days, logged, responded to per App Store requirements.
- Mismatch = 401 + log + no processing. Never partial-processing.

### Stripe webhooks (concierge audit only)

- `stripe-signature` header + `STRIPE_WEBHOOK_SECRET`. Verified before side effect.
- Idempotency keyed on Stripe event ID. Replays return 200 without re-processing.

### Universal webhook rules

- 5-second response budget (Shopify deregisters slow subscribers). Enqueue the heavy work; return 200 fast.
- Idempotency stored in Postgres with a 30-day retention.
- Webhook handler never trusts the payload — every field used is explicitly validated.

## Input validation

- Every user-controlled input parsed by Zod at the route / loader / action boundary.
- No string concatenation into SQL. Prisma parameterises. Ad-hoc SQL in migrations uses placeholders.
- URL inputs (scanner form, external product URL) validated as HTTPS, public hostname, no private IP ranges.
- Shop domain validated against Shopify's domain format (`*.myshopify.com` or declared custom domain).
- File uploads: none at launch. If introduced, hard limits on size + MIME + malware scan before storage.

## Output handling

- Never render raw user input into HTML. React / Remix escape by default; `dangerouslySetInnerHTML` requires a justification comment + a schema for what's allowed.
- Error responses never leak internals. No stack traces to users. No DB error details. No token fragments.
- Merchant-visible error messages framed around the merchant's action, not the internal fault.

## Logging

- Log the what, not the secret. Redact tokens, API keys, session IDs, Shopify access tokens.
- Structured logs (JSON) over free-text.
- Never log full product data in aggregate — individual product logs OK for debugging, but never a bulk dump.
- Correlate by request ID (generated at the edge, propagated through queue jobs).

## Data retention

- Scanner leads: retained 24 months unless the user opts out (email footer link).
- Shopify catalog data: retained while the app is installed. Within 60 seconds of `app/uninstalled`, tokens are scrubbed; within 30 days, scoring data is purged unless the merchant re-installs.
- GDPR `customers/redact`: customer-level data removed within 30 days, confirmation logged.
- Logs: 90 days hot (Sentry + structured log store), archived for 13 months cold, then deleted.

## Permission tiers (enforced by `.claude/settings.json`)

Commands are classified by **blast radius**, not by command name. This gives skills enough capability to finish work without gating on every routine action, while keeping irreversible actions behind a deliberate human step.

### Tier 1 — auto-allowed (reversible, local, recoverable)

Skills may run these without prompting. The harness allow-list covers them.

- `pnpm install`, `pnpm -F <app> dev / build / test / lint / typecheck`, `pnpm -r build / test / lint`
- `prisma generate`, `prisma migrate dev`, `prisma migrate reset`, `prisma studio`, `prisma format`, `prisma validate` (all dev-scoped)
- `git status / diff / log / show / add / commit / branch / checkout / switch / stash / fetch / pull`
- `git push`, `git push origin`, `git push -u origin <branch>` (non-force, any branch including main — main-discipline is enforced by commit review, not push blocks, while we're solo)
- `gh pr view / list / create / diff / checks`, `gh issue view / list / create`, `gh repo view`, `gh run view / list`, `gh api repos/*`
- `rm -rf` on **build artifacts only**: `node_modules/`, `.next/`, `apps/*/.next`, `apps/*/dist`, `apps/*/build`, `packages/*/dist`, `packages/*/build`, `build/`, `dist/`, `.turbo/`, `.cache/`, `coverage/`
- Read-only `curl`, `ls`, `tree`, `wc -l`, `mkdir -p`, `cp -R`, `mv`

### Tier 2 — prompts the user (visible or production-scoped)

Not in allow or deny; harness default is "ask." Skills proposing these actions surface them clearly.

- Direct `coolify deploy` to staging (user confirms each)
- `gh release create`
- Shopify live-store API writes during manual testing (dev-store writes are Tier 1 inside skill scope)
- Any `rm` of a path not on the allow-list
- Adding new top-level dependencies

### Tier 3 — denied (irreversible or catastrophic)

The harness deny-list blocks these. If a workflow truly needs one, the operator runs it from a separate terminal with explicit intent, not through a skill.

- `git push --force`, `git push -f`, `git push --force-with-lease`
- `git reset --hard origin/*`, `git rebase -i`
- `prisma migrate deploy`, `prisma db push`, `prisma db execute`, `prisma migrate resolve` (all prod-facing)
- `pnpm run deploy`, `pnpm -r deploy`
- `psql`, `pg_dump` (direct DB access — use Prisma or a controlled migration)
- `stripe live *`, `stripe payments *`, `stripe charges *` (live money movement)
- `vercel *` (we don't use Vercel)
- `coolify deploy *--production*` / `--prod`
- `rm -rf` on: `/*`, `*src/*`, `apps/*/src`, `packages/*/src`, `memory*`, `projects*`, `.claude*`
- `sudo`
- `curl * | sh` / `curl * | bash` / `wget * | sh` (remote execution pipelines)

### Rationale

A skill that constantly hands work back to the user for routine actions erodes the value of having skills at all. The previous all-or-nothing deny list treated every potentially-risky command as if it were catastrophic. The tiered model distinguishes between "reversible within minutes" and "data loss." Skills are trusted with the first; the operator owns the second.

## Disclosure + response

- Vulnerability reports: `SECURITY.md` at repo root documents the disclosure email and PGP key.
- Response SLA: acknowledge within 48 hours, triage within 5 business days, resolve per severity.
- Incident lifecycle: detect → mitigate → post-mortem in `incident-history.md` → follow-ups tracked through admin-ops.

## Hard bans

- No auth reimplementation.
- No secrets in code. No secrets in git history.
- No unsigned webhook processing.
- No plaintext Shopify access tokens.
- No `eval`, `Function(...)`, dynamic `require` of user input.
- No third-party script on payment pages or OAuth callbacks without a documented review.
- No analytics on the checkout page without explicit consent handling.
- No `any` on values that came from a network boundary.
