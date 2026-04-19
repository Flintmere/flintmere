# 0001 — Open-core business model

**Status:** Accepted
**Date:** 2026-04-14 (decision made earlier; ADR written during refactor)
**Council:** #5 Product marketing, #11 Investor / founder voice, #12 Ecosystem strategist, #2 Open source maintainer

## Context

AllowanceGuard originated as a free, donation-funded wallet security tool. This model produced real user love but no sustainable revenue, and actively harmed commercial prospects:

- Defensive disclaimers ("No VC", "Community-funded") positioned the company as a charity, blocking grant + SEIS/EIS + VC funding paths.
- "Free Forever" messaging created an expectation that any monetisation was a betrayal.
- The product had no way to pay for the ongoing infrastructure (27 chains, cron jobs, monitoring, email).

## Decision

Adopt an **open-core** model:

- Core scanner remains free and open source. Forever.
- Premium *services* (continuous monitoring, alerts, batch revoke, exports, teams, compliance, API) are paid.
- B2B API with its own tier ladder (Free / Developer / Growth / Enterprise).
- License: AGPL-3.0 + commercial dual license.

## Consequences

- We can fund the project sustainably and pursue grants/investment.
- The banned-phrase list (see `memory/VOICE.md`) becomes load-bearing: defensive financial self-disclaimers must never re-appear in copy.
- Free tier must feel generous, not punishing. Pricing page and homepage messaging must clearly articulate the "core free, services paid" split.
- Every gated feature must have a blurred/locked preview, not a hard block — users see the value before paying.

## Alternatives considered

- **Pure donations** — rejected: demonstrated non-viability; blocks funding.
- **Pure SaaS (no free tier)** — rejected: destroys community trust and SEO from the free scanner.
- **Foundation / grant-only** — rejected: unstable, slow, and doesn't scale to the team size needed for 27-chain coverage.
