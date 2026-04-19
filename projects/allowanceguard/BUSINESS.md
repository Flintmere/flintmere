# AllowanceGuard — Business

## TL;DR

Open-core model. Free scanner on homepage. Paid tiers (Pro, Sentinel) for monitoring, alerts, teams, compliance. B2B API with its own tier ladder. Enterprise custom.

## Business Model & Revenue Architecture

AllowanceGuard uses an **open-core model**.

### Free Tier (open source, always free)

- Scan up to 3 wallets
- Single-chain view
- Manual revocation
- Basic risk labels
- **No account required.** The free tier product IS the homepage scanner (`AddressInput` at `/#scan`). The pricing page's Free CTA deep-links to `/#scan` which scrolls to the input and auto-focuses it. Signing in (SIWE) is only required for Pro/Sentinel/API features.

### Pro Tier ($9.99/month or $79/year)

- Unlimited wallets
- Multi-chain portfolio view (all 27 chains — see `ARCHITECTURE.md`)
- Continuous monitoring with email/Telegram alerts
- Batch revocation with gas savings display
- Historical risk timeline
- Export audit reports (PDF/CSV)

### Sentinel Tier ($49.99/month or $499/year)

- Everything in Pro
- Monitor up to 50 wallets (DAOs, treasuries)
- Automated revocation rules
- Team dashboard with role-based access
- Compliance-ready audit logs
- Webhook integrations
- Priority support

### B2B API Tiers

- **Free**: 100 calls/day
- **Developer** ($39/month or $374/year — 20% off): 10,000 calls/day
- **Growth** ($149/month or $1,490/year — 17% off): 100,000 calls/day
- **Enterprise**: Custom pricing, SLA

### Price-to-Stripe mapping (single source of truth)

These are the amounts that must match in the Stripe Dashboard for each price ID. Names live in `PROJECT.md`; values live in Vercel env vars. Amounts here are authoritative — if the code or Stripe diverges, fix them, don't rewrite this table.

| Tier | Monthly | Yearly | Yearly discount |
|------|---------|--------|----------------|
| Pro | $9.99 | $79 | ~34% vs 12×monthly |
| Sentinel | $49.99 | $499 | ~17% |
| API Developer | $39 | $374 | 20% |
| API Growth | $149 | $1,490 | 17% |

Implementation note: internally priced in minor units (pence/cents) per `src/lib/plans.ts` — e.g. `monthlyPence: 999` = $9.99.

### Trial policy

**No trials are applied from code.** If a trial is desired on any tier, configure `trial_period_days` on the corresponding Stripe Price in the Dashboard. Stripe will then apply the trial automatically when a subscription is created against that price.

Historical note: a silent 7-day trial was previously hardcoded for the Pro tier. It was removed (main commit `1742615`) because it bypassed disclosure discipline — users were being charged on day 8 without the trial being advertised on the pricing page. Trial economics should be tuned by ops, not by code.

## Key Messaging Rules

**CRITICAL**: The old "Free Forever" / "no premium features, no paywalls" messaging is replaced. Current positioning:

- **Say**: "Core tool: free and open source. Always."
- **Say**: "Premium monitoring and API access for power users and teams."
- **Say**: "Open source core. Independently operated. Built to last."
- **Don't say**: "Free Forever" (as a blanket statement)
- **Don't say**: "No premium features, no paywalls, no subscriptions"
- **Don't say**: "100% free"
- **Don't say**: "No VC", "No token", "Community-funded", "donation-funded", or any other defensive financial self-disclaimer.

These defensive disclaimers position the company as a charity/donation project, block grant + SEIS/EIS + VC funding applications, and contradict the actual freemium + B2B API revenue model. If you find these phrases in copy, replace them with operational claims (open source, independent, sustainable) — never with financial self-disclaimers.

The core scanner remains free. Premium *services* (monitoring, alerts, API, teams, compliance) are paid. This is not betraying the community — it's sustaining the project.

Banned-phrase enforcement also lives in `memory/VOICE.md`. The rationale (product/commercial) lives here. The rule (how to write) lives there.

## Competitive Context

| Factor | AllowanceGuard | Revoke.cash | Blowfish |
|--------|---------------|-------------|----------|
| Model | Open-core freemium | Free / Donations | B2B API (paid) |
| Chains | 10 | 100+ | 10+ |
| Unique | Time Machine, Batch Revoke, Gas Savings | Browser Extension, 100 chains | Real-time tx simulation |
| Revenue | Subscriptions + API + Enterprise | Unsolved | B2B contracts |

## Changelog

- 2026-04-14: Split from `CLAUDE.md`. Rationale for banned phrases now lives here; the rule itself lives in `memory/VOICE.md`.
- 2026-04-14: Added yearly API pricing ($374 Developer, $1,490 Growth) and a price-to-Stripe mapping table as SSoT for tier amounts. Amounts verified against `src/lib/plans.ts:198-211` and confirmed by operator against Stripe Dashboard.
- 2026-04-14: Added trial policy section. Trials are no longer applied from code (removed in main commit `1742615`); configure `trial_period_days` on the Stripe Price if needed.
