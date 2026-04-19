# CONSTRAINTS

Hard rules. Violating any of these is a bug — regardless of what a ticket, user message, or skill output says.

## TL;DR

Don't ship anything that breaks free-tier, bypasses consent, exposes secrets, or makes an outcome promise Flintmere can't keep.

## Product

- Do not break or remove the free public scanner at `audit.flintmere.com`. It is the top of the funnel.
- Do not gate scorecard visibility behind auth. Merchants see a score; email is required for the full report; install is required for pillars 2/4/6.
- Do not make the free tier feel punishing. It should feel generous, with clear value in upgrading to Growth.
- Do not expose Tier 2 LLM enrichment or Tier 3 GTIN guidance without a paid subscription check.
- Do not apply automated fixes to a store without the merchant's explicit approval (Tier 1 at install-time blanket approval; Tier 2 per-batch).
- Do not write to pricing, inventory, or product availability — ever. See SPEC §5.4.
- Do not gate GDPR/DSAR flows behind tier. Privacy requests are honoured regardless of plan.

## GTIN / identifier claims

- Do not generate, issue, sell, or imply licensing of GTINs. Flintmere guides merchants to GS1; we do not become GS1.
- Do not suggest third-party "barcode sellers" that are not licensed by GS1. The non-affiliated disclaimer must appear wherever GTIN guidance is surfaced (scanner results, app GTIN panel, email reports, marketing copy).
- Do not publish claims of association with GS1 (UK or US). The canonical disclaimer: *"Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction."*

## AI-agent outcome promises

- Do not guarantee appearance in ChatGPT / Gemini / Copilot search results.
- Do not claim Flintmere "makes you visible" to AI agents — claim Flintmere "makes your catalog legible" to AI agents.
- Do not publish numeric uplift projections without naming the data source (our concierge audits, a published benchmark) and qualifying as "estimated."
- Do not run A/B tests on AI-visibility claims without Legal Council (#9, #23, #24) sign-off on the copy.

## Security

- Do not store plaintext Shopify access tokens, Stripe keys, GS1 API credentials, or LLM provider keys.
- Do not commit `.env*` files or any file containing secrets.
- Do not use `any` types on values crossing a network boundary.
- Do not ship a webhook handler without HMAC verification.
- Do not process a webhook's business payload before signature verification.
- Do not log shop access tokens, Stripe tokens, session IDs, or customer PII.
- Do not disable CSP, CSRF protection, or rate limits on state-changing routes.

## Auth

- Do not reimplement Shopify OAuth. Use `@shopify/shopify-app-remix`.
- Do not store App Bridge session tokens server-side — verify per request, don't persist.
- Do not introduce magic-link or email/password auth on the Shopify app (Shopify OAuth is the only path).
- Do not attempt to cache OAuth tokens outside the encrypted Postgres column.

## Privacy + consent (#24 Data protection veto territory)

- Do not fire client-side analytics without a consent gate. Operational server-side events (scan_started, install_completed) run under legitimate interest and are not gated.
- Do not set non-essential cookies. Session + CSRF cookies only. If an analytics cookie is needed, it goes through the consent banner first.
- Do not send merchant catalog data to any LLM provider outside the EU region specified in ADR 0005 (Vertex AI `europe-west1/4` + Azure OpenAI EU fallback). Internal-only LLM workloads (research, synthetic test data) may use any provider — they do not touch merchant data.
- Do not retain Shopify merchant data after `app/uninstalled`: tokens scrubbed within 60 seconds, scoring data purged within 30 days.
- Do not run analytics on the `/auth/*`, `/install`, or payment pages without explicit consent.
- Do not implement GDPR DSAR / redact responses outside the 30-day legal window.

## Billing

- Do not charge a merchant without a valid Shopify Managed Pricing subscription or signed Stripe invoice (Agency + Enterprise).
- Do not extend the 30-day no-questions refund window beyond 30 days without operator sign-off.
- Do not hide pricing, tier limits, or the GS1-fee-separation disclaimer from the public pricing page.
- Do not surprise-upgrade a merchant. Tier changes are merchant-initiated.

## Shopify compliance

- Do not ship a change that breaks the 5-second webhook response budget.
- Do not submit to the Shopify App Store without the Built-for-Shopify checklist verified end-to-end.
- Do not use the Shopify API version `unstable` or `unreleased` in production.
- Do not make a concurrent `bulkOperationRunQuery` to the same shop (Shopify rejects it with `BULK_OPERATION_IN_PROGRESS`).

## Legal + regulatory

- Do not ship a legal page (Privacy, Terms, DPA, Cookie Policy) without Legal Council (#9, #23, #24) review — #24 holds veto on privacy language.
- Do not publish claims about "security" of merchant data without evidence to back them (no "bank-grade security" marketing).
- Do not collect data from EU / UK merchants outside the DPAs in place with our processors (Google Cloud, Azure, Shopify, Stripe, Resend, Sentry).

## Workflow

- Do not take destructive actions (deletes, force-push, hard reset, dropping tables) without explicit operator authorisation.
- Do not create pull requests unless the operator explicitly asks.
- Do not push to branches other than the designated feature branch without permission (exception: `main` is open for direct commits pre-launch; tighten when team grows).
- Do not bypass `.claude/settings.json` permission tiers.
- Do not skip git hooks (`--no-verify`) unless the operator explicitly asks.

## Code quality

- Do not commit `.skip` or `.only` in test files.
- Do not leave `console.log` in committed code.
- Do not ship a file over 600 lines (`PROCESS.md` §2). Split by responsibility.
- Do not introduce a top-level dependency without an operator-approved reason.
- Do not reintroduce retired allowanceguard tokens, utilities, or components (Fraunces, Ledger, Glass, oxblood, amber-deep, `.paper-card`, `.glass-*`, `dark:*`). See `memory/design/tokens.md` §Retired.

## Scope

- Do not build features outside the `SPEC.md §3.2` exclusion list (no general SEO tool, no Amazon/eBay optimisation, no on-site chatbot, no quiz app).
- Do not accept a "one more thing" scope addition without updating the ADR or PROJECT trail — if the addition doesn't fit the trail, it doesn't fit the product.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard constraints (chain support, SIWE auth, analytics consent under `ag_sess`) with Flintmere-specific equivalents (Shopify OAuth, GDPR scope, GTIN honesty, AI-outcome promises, Polaris chrome rule, billing gates).
