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

## Deny list (enforced by `.claude/settings.json`)

Harness enforces what skills cannot do directly:

- `rm -rf` outside scratch paths.
- `prisma migrate deploy` without explicit confirm.
- Shopify API write mutations without a dry-run review.
- `git push --force` to `main` or release branches.
- Coolify deploy triggers without a confirm step.
- `gh release create` without an ADR-linked description.

If a skill needs something the deny list blocks, the user runs it themselves.

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
