# AllowanceGuard — Architecture

## TL;DR

Next.js 15 App Router. pnpm workspace. PostgreSQL (Neon serverless) via Drizzle. Upstash Serverless Redis for caching and rate limits (with a Postgres `cache` table as fallback). 27 EVM chains. B2B API under `/api/v1`, consumer routes under `/api`.

## Directory Structure

The repo is a pnpm workspace. Top-level packages:

```
/                             # Next.js app (allowance-guard)
├── src/                      # App source (see below)
├── extension/                # Browser extension (workspace)
├── sdk/                      # Legacy Node.js SDK (workspace, pending migration → packages/sdk)
├── packages/                 # NEW — client libraries distributed via npm
│   ├── client/               # @allowance-guard/client — framework-agnostic TS transport
│   └── react/                # @allowance-guard/react  — React hooks (peer-deps on TanStack Query)
├── migrations/               # SQL migrations (pnpm run migrate)
├── scripts/                  # Tooling (e.g. generate-openapi.ts)
├── docs/
│   └── architecture/         # Long-form architecture plans (e.g. react-hooks)
└── .changeset/               # Changesets for packages/* versioning
```

### App source (`src/`)

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # 35+ API route handlers
│   │   ├── billing/        # Stripe subscription management
│   │   ├── v1/             # Public B2B API endpoints
│   │   ├── scan/           # Wallet scanning
│   │   ├── allowances/     # Allowance queries
│   │   ├── bulk-revoke/    # Batch revocation
│   │   ├── alerts/         # Email alert subscriptions
│   │   ├── teams/          # Team management
│   │   ├── stripe/         # Stripe webhooks
│   │   ├── coinbase/       # Coinbase Commerce
│   │   └── ...
│   ├── pricing/            # Pricing page
│   ├── account/            # Account & billing dashboard
│   ├── features/           # Features showcase
│   ├── settings/           # User settings
│   ├── docs/               # Documentation pages
│   └── ...
├── components/
│   ├── ui/                 # Base design system (Button, Card, Input, Badge, Modal, etc.)
│   ├── tokens/             # Token search components
│   ├── charts/             # Data visualization
│   ├── docs/               # Documentation components
│   ├── Header.tsx          # Site header/navigation
│   ├── Footer.tsx          # Site footer
│   ├── Hero.tsx            # Homepage hero section
│   ├── AppArea.tsx         # Main security dashboard
│   ├── AllowanceTable.tsx  # Token approvals table
│   ├── WalletSecurity.tsx  # Security scoring dashboard
│   └── ...
├── db/
│   ├── index.ts            # Neon + Drizzle client
│   └── schema/             # Database table definitions
├── design/
│   ├── tokens.ts           # Design system tokens (colors, typography, spacing, motion)
│   └── README.md           # Design system documentation
├── hooks/                  # Custom React hooks
├── lib/                    # Shared utilities
│   ├── plans.ts            # Plan definitions & feature limits
│   ├── feature-gate.ts     # Tier-based feature gating
│   ├── api-keys.ts         # API key management
│   ├── billing.ts          # Stripe billing helpers
│   ├── auth.ts             # Session management
│   ├── cache.ts            # Upstash primary, Postgres `cache` table fallback
│   ├── upstash.ts          # Shared Upstash Redis client
│   ├── ratelimit.ts        # Rate limiting on Upstash
│   ├── metrics.ts          # Operational counters on Upstash
│   ├── audit.ts            # Audit logging
│   └── utils.ts            # General utilities (cn helper)
├── context/                # React context providers
├── middleware/             # Request middleware
├── styles/                 # Additional style files
└── types/                  # TypeScript type definitions
```

## API Routes

- Always validate input with Zod schemas via `src/middleware/validation.ts`.
- Always rate limit public endpoints.
- Use `src/lib/api-response.ts` for consistent JSON responses.
- Log significant actions via `src/lib/audit.ts`.
- B2B API routes live under `/api/v1/` and use API key auth.
- **Two API key tiers:** `ag_live_*` (secret, server-side, full access) and `ag_pub_*` (public, browser-safe, GET-only, `api_public` plan at 500/day). Public keys are enforced in `src/middleware/api-auth.ts` and issued via `POST /api/keys/public`. See migration `027_api_public_keys.sql`.
- **`/api/v1` OpenAPI spec** lives at `src/app/api/v1/openapi.json` and is the single source of truth for the `@allowance-guard/client` generated types. Any new v1 endpoint MUST update the spec in the same PR. Run `tsx scripts/generate-openapi.ts` to regenerate client types.
- Consumer routes use session auth.
- Cron routes are scheduled via **Vercel Cron** in `vercel.json`. No external scheduler (cron-job.org retired). No `CRON_SECRET` auth — Vercel calls the routes internally. Schedules:
  - `/api/jobs/process` (every 5 min)
  - `/api/monitor/cron` (every 15 min)
  - `/api/rules/evaluate` (every 15 min)
  - `/api/webhooks/process` (every 5 min)
  - `/api/email/cron` (daily 10:00 UTC)
  - `/api/jobs/cleanup` (daily 03:00 UTC)

See `decisions/0003-vercel-cron.md` for rationale.

## Database

- Use Drizzle ORM for all queries. No raw SQL.
- Schema definitions in `src/db/schema/`.
- All tables need `created_at` timestamps.
- Use UUIDs for primary keys on new tables.
- Monetary values stored in minor units (pence/cents as integers).

### Neon serverless `.query()` rules

The `pool` in `src/lib/db.ts` uses `@neondatabase/serverless`:

- Object parameters MUST be `JSON.stringify()`d before passing — `.query()` does NOT auto-serialize objects (e.g. `$1::jsonb` with `JSON.stringify(payload)`).
- PostgreSQL enum columns (e.g. `job_status`) MUST have explicit `::enum_type` casts on string literals — `.query()` does NOT auto-cast text to enums (e.g. `'pending'::job_status`, not `'pending'`).
- Array parameters for `ANY($1::type[])` may need explicit casting.
- When in doubt, cast explicitly. The old `neon()` direct-call API was permissive; `.query()` is strict.

See `decisions/0004-neon-serverless-rules.md` for background.

## Feature Gating

- Use `checkFeature(userId, feature)` from `src/lib/feature-gate.ts` before serving gated content.
- Never expose premium data in free-tier API responses.
- Show blurred previews with upgrade prompts for locked features in the UI.
- Free tier limits: 3 wallets, no batch revoke, no export, no alerts, no teams.
- **Batch revoke transport.** `src/hooks/useBulkRevokeEnhanced.ts` detects EIP-5792 capability per chain via wagmi's `useCapabilities`. When the connected wallet advertises `atomic.status === 'supported'` (or the legacy `atomicBatch.supported === true`) AND the chain group has ≥2 rows, revokes are bundled into a single `wallet_sendCalls` batch; receipts are resolved via `waitForCallsStatus`. On a failure (user rejects the batch, wallet downgrades mid-flight) the hook falls back to the sequential per-row path. Any user-facing copy about "batch revoke" must reflect this split — see `memory/VOICE.md` honest-claims rule.

See `BUSINESS.md` for the full tier definitions.

## Payments & Billing

- All Stripe operations go through `src/lib/billing.ts`.
- Webhook handlers must be idempotent (use `src/lib/webhook_guard.ts`).
- Never store raw card details. Stripe handles PCI compliance.
- Test with Stripe test mode keys. Use `E2E_FAKE_PAYMENTS=true` for E2E tests.

## Security

- Never commit secrets or API keys. Use environment variables.
- Validate all user input at API boundaries.
- Hash API keys before storing (store prefix for identification).
- Rate limit all public endpoints.
- Use parameterized queries (Drizzle handles this).
- CSP headers configured in `next.config.ts`.

## Testing

- E2E tests with Playwright in `/tests/`.
- Run `pnpm test:e2e` before submitting PRs.
- Payment flows testable with `E2E_FAKE_PAYMENTS=true`.
- Email flows testable with `E2E_FAKE_EMAIL=true`.

## Supported Chains (27 EVM networks)

Single source of truth for the chain list.

1. Ethereum (mainnet)
2. Arbitrum
3. Base
4. Optimism
5. Polygon
6. Avalanche
7. BNB Smart Chain (BSC)
8. Fantom
9. zkSync Era
10. Polygon zkEVM
11. Mantle
12. Gnosis
13. Linea
14. Scroll
15. Celo
16. Blast
17. Cronos
18. Moonbeam
19. Aurora
20. opBNB
21. Manta Pacific
22. Mode
23. Taiko
24. Metis
25. Kava
26. ZetaChain
27. Worldchain

## Changelog

- 2026-04-14: Split from `CLAUDE.md`. Cron schedules reformatted as a list. Cross-refs to `decisions/`.
