# AllowanceGuard — Project

## Identity

AllowanceGuard is a **Web3 wallet security platform** that helps users monitor, assess, and revoke token approvals across multiple blockchain networks. It is transitioning from a free donation-funded tool to a **revenue-generating open-core product** with freemium consumer tiers, a B2B API, and institutional compliance features.

- **Live site**: https://www.allowanceguard.com
- **Repo**: https://github.com/EazyAccessEA/Allowance-guard
- **License**: AGPL-3.0 + Commercial dual license (open-source core)
- **Version**: 1.14.9+

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router, Turbopack) |
| Language | TypeScript 5.0, React 19 |
| Styling | Tailwind CSS 3.4 + CSS custom properties |
| Database | PostgreSQL (Neon serverless) via Drizzle ORM |
| Cache | Upstash Serverless Redis (primary) + PostgreSQL `cache` table (fallback) |
| Payments | Stripe (checkout + billing) + Coinbase Commerce |
| Auth | SIWE (EIP-4361) → Cookie-based sessions (30-day, `ag_sess`). Magic-link deprecated. |
| Email | Postmark / SMTP (Nodemailer) |
| Web3 | Wagmi 2 + Viem 2 + Reown AppKit |
| Monitoring | Rollbar, Slack webhooks |
| Deployment | Vercel |
| Testing | Playwright (E2E) |
| Icons | Lucide React |
| Components | CVA (class-variance-authority) for variants |

See `ARCHITECTURE.md` for directory structure, API rules, DB rules, and supported chains.

## Environment Variables

> **NAMES ONLY. NEVER VALUES.** If a value appears in this file, it's a leak. Delete immediately and rotate.

Required for development:

```
# Core
DATABASE_URL                          # Neon PostgreSQL connection string
UPSTASH_REDIS_REST_URL                # Upstash Serverless Redis (REST)
UPSTASH_REDIS_REST_TOKEN              # Upstash REST token
NEXT_PUBLIC_APP_URL                   # App URL (https://www.allowanceguard.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID  # WalletConnect

# Stripe — keys
STRIPE_SECRET_KEY                     # Server-side API key (sk_live_* / sk_test_*)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    # Browser key (pk_live_* / pk_test_*)
STRIPE_BILLING_WEBHOOK_SECRET         # Signs /api/billing/webhook (subscriptions)
STRIPE_WEBHOOK_SECRET                 # Signs /api/stripe/webhook (legacy contributions); also read as fallback by billing webhook

# Stripe — price IDs (8 total; all read by src/lib/plans.ts)
STRIPE_PRICE_PRO_MONTHLY              # Pro, $9.99/mo
STRIPE_PRICE_PRO_YEARLY               # Pro, $79/yr
STRIPE_PRICE_SENTINEL_MONTHLY         # Sentinel, $49.99/mo
STRIPE_PRICE_SENTINEL_YEARLY          # Sentinel, $499/yr
STRIPE_PRICE_API_DEVELOPER            # API Developer, $39/mo
STRIPE_PRICE_API_DEVELOPER_YEARLY     # API Developer, $374/yr
STRIPE_PRICE_API_GROWTH               # API Growth, $149/mo
STRIPE_PRICE_API_GROWTH_YEARLY        # API Growth, $1,490/yr

# Email / ops
POSTMARK_SERVER_TOKEN                 # Email (or SMTP_HOST/PORT/USER/PASS)
SLACK_WEBHOOK_URL                     # Slack notifications
ROLLBAR_ACCESS_TOKEN                  # Error monitoring
```

> **Missing any Stripe price ID → 500 at upgrade time** for that tier. All 8 must be set. See `decisions/0001-open-core-model.md` for the tier rationale and `BUSINESS.md` for the amount-to-tier mapping.

Test mode flags:

```
E2E_FAKE_PAYMENTS=true    # Skip Stripe in tests
E2E_FAKE_EMAIL=true       # Skip email sending in tests
```

## Common Commands

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Start production server
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:ui      # Run tests with Playwright UI
pnpm run migrate      # Run database migrations
```

## Changelog

- 2026-04-14: Split from `CLAUDE.md`. Env vars got a "NAMES ONLY" header.
- 2026-04-14: Added all 8 Stripe price env vars + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_BILLING_WEBHOOK_SECRET`. Removed `COINBASE_COMMERCE_API_KEY` (dead since main commit `e875c93`). Grouped vars by concern.
