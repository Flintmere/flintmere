# security-posture.md

Security invariants for `src/`. #4 Security owns this file and holds veto on anything that weakens the posture. Goes hand-in-hand with `memory/CONSTRAINTS.md`.

## Authentication

- Canonical auth logic in `src/lib/auth/`. Never reimplemented.
- Session cookies are HttpOnly, Secure, SameSite=Lax (or stricter), with appropriate `Domain` and `Path`.
- No client-accessible auth tokens. Never put a JWT in `localStorage`.
- Password / magic-link flows go through the canonical handler. Rate-limited.
- #4 Security VETO on any change under `src/lib/auth/` or `src/app/api/auth/**`.

## Secrets

- All secrets via environment variables. Never committed.
- `.env` gitignored. `.env.example` lists the keys with placeholder values.
- Production secrets in Vercel (or the canonical secret store). Rotated on a documented schedule.
- Never log secrets. Redact tokens in error logs.
- Never send secrets to telemetry (Sentry DSN etc. — yes; Stripe secret key — never).

## Content Security Policy

- CSP configured in `next.config.ts` and middleware. One canonical source; no per-route CSP.
- `default-src 'self'`, script allowlist explicit, no inline scripts without a nonce.
- Frame ancestors denied by default. Explicit allow for embeds that need it.
- CSP reports routed to a monitoring endpoint.

## CSRF

- `ag_csrf` cookie handled in middleware. State-changing same-origin routes check it.
- CORS configured; only trusted origins allowed for cross-origin mutations.
- Never `*` for CORS on a mutation route.

## Rate limiting

- `src/lib/ratelimit.ts` is canonical. Every new route declares its rate-limit bucket.
- Defaults: per-IP and per-user (if authenticated). Scanner route has its own bucket.
- Limits documented in `projects/allowanceguard/ARCHITECTURE.md` so operators can tune them.

## Webhook verification

- **Every** webhook handler verifies the signature before any side effect.
- Stripe: `stripe-signature` header + `STRIPE_WEBHOOK_SECRET`.
- Coinbase: signature header + their secret.
- Signature mismatch = 400 + log + no processing. Never partial-processing.
- Idempotency: webhooks are re-delivered. Handlers key on the event ID and short-circuit replays.

## Input validation

- Every user-controlled input parsed by a schema (Zod or equivalent) at the route boundary.
- No string concatenation into SQL. Drizzle parameterises. Ad-hoc SQL in migrations must use placeholders.
- URL parameters treated as user input, not trusted.
- Wallet addresses validated for format before use. Checksummed where they appear in responses.

## Output handling

- Never render raw user input into HTML without escaping. React escapes by default; `dangerouslySetInnerHTML` requires a justification comment and a schema.
- Error responses do not leak internals. No stack traces to users. No DB error details.

## Logging

- Log the what, not the secret. Redact tokens, API keys, session IDs.
- Structured logs (JSON) over free-text where feasible.
- Privacy rule: no wallet addresses alongside behaviour data (see `memory/marketing/analytics` rules — same principle).

## Deny list (enforced by `.claude/settings.json`)

The harness deny list enforces what the skills cannot do directly:
- `rm -rf` outside scratch paths.
- `pnpm run deploy`, `vercel deploy --prod`, `stripe ...` mutation commands.
- `git push --force` to `main` or release branches.
- `drizzle-kit push` without a confirm step.
- Network mutation commands without explicit approval.

If a skill needs something the deny list blocks, the user runs it themselves.

## Disclosure + response

- Vulnerability reports: `SECURITY.md` (create if missing) documents the disclosure address.
- PGP key or alternative secure channel documented.
- Response SLA: ack within 48 hours, triage within 5 business days.
- Incident response lives in `incident-history.md` + `admin-ops` dept when it ships.

## Hard bans

- No auth reimplementation.
- No secrets in code.
- No unsigned webhook processing.
- No `eval`, `Function(...)`, dynamic `require` of user input.
- No third-party script on payment pages without a documented review.
- No analytics on the checkout page without explicit consent handling.
