# AllowanceGuard — Status

## TL;DR

All 6 phases complete. Ledger aesthetic shipped on homepage. Dashboard/docs still on glass canon.

## Implementation Status

See `IMPLEMENTATION_PLAN.md` at repo root for full details.

### Phase 1 — Subscription Infrastructure ✅

- Database schemas (subscriptions, api_keys, usage, plan_limits)
- Plan definitions and feature gating
- Stripe billing integration
- API key system

### Phase 2 — Messaging & UI ✅

- Removed "Free Forever" messaging
- Pricing page
- Upgrade prompts and feature locks
- Account/billing dashboard

### Phase 3 — B2B API ✅

- Public REST API v1 endpoints
- API key authentication
- Per-key rate limiting
- API documentation

### Phase 4 — Pro Features ✅

- Continuous monitoring service
- Historical timeline
- Gas savings calculator
- Automated revocation rules

### Phase 5 — Institutional ✅

- Team dashboard expansion
- Compliance audit export
- Webhook system for integrations

### Phase 6 — Design Upgrade ✅ → LEDGER AESTHETIC SHIPPED

- Dark mode system with theme provider ✅ (dashboard/docs)
- Glassmorphism card system ✅ (retained for dashboard/docs)
- Navigation redesign (Apple-discipline minimalism for paper theme) ✅
- Radial gauge for wallet security score ✅
- **Homepage Ledger aesthetic** ✅ — light-first editorial redesign. Fraunces + IBM Plex Sans, paper/ink/oxblood palette, `.paper-card` utilities, oversized italic numerals as signature move. See `docs/design-tokens-handbook.md` §11 and `DESIGN.md`.

## Changelog

- 2026-04-14: Split from `CLAUDE.md`.
