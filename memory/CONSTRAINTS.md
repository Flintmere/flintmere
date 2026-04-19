# CONSTRAINTS

## TL;DR

Hard rules. Violating any of these is a bug.

## Product

- Do not remove or break existing free-tier functionality.
- Do not expose premium features without auth/payment verification.
- Do not make the free tier feel punishing — it should feel generous, with clear value in upgrading.
- Do not gate the free scanner behind authentication. The free tier IS the homepage scanner (`/#scan`). SIWE auth gates Pro/Sentinel/API features only.
- Do not add chain support without full testing on that chain.

## Security

- Do not store plaintext API keys or payment credentials.
- Do not commit `.env` files or secrets.
- Do not use `any` types or skip input validation.

## Auth

- Do not re-introduce magic-link login. SIWE (EIP-4361) is the primary auth method. Magic link is `@deprecated` and retained only for team invites.

## Privacy & Consent

- Do not bypass the analytics consent gate. `trackClientEvent()` in `src/lib/analytics.ts` checks `localStorage('allowance-guard-cookie-consent').analytics === true` before firing. If the user clicked "Essential only", no client-side behavioral events reach the database. Server-side `trackEvent()` (scan_started, etc.) runs under legitimate interest and is NOT gated — it's operational.
- Do not set non-essential cookies. The app sets only `ag_sess` (session) and a CSRF token — both essential. The "Analytics" toggle in the cookie banner controls server-side DB tracking, not cookies. Be honest in all consent copy.

## Workflow

- Do not take destructive actions (deletes, force-push, hard reset) without explicit user authorisation.
- Do not create pull requests unless the user explicitly asks.
- Do not push to branches other than the designated feature branch without permission.

## Changelog

- 2026-04-14: Split from `CLAUDE.md` "Do Not" section. Grouped by domain.
