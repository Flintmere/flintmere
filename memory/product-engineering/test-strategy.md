# test-strategy.md

Test pyramid + coverage expectations for the Flintmere monorepo. **#16 QA** owns this file.

## Layers

| Layer | Location | What lives here | Expected speed |
|---|---|---|---|
| Unit | `packages/*/src/**/*.test.ts` | Pure functions — scoring engine (`packages/scoring`), LLM adapter unit tests (`packages/llm`), utility functions | <1s per file |
| Integration | `apps/*/src/**/*.test.ts`, `apps/*/tests/**` | Route handlers, loaders, actions with a real-ish DB (Prisma against a scratch schema) and mocked external services (Shopify, Vertex AI, Stripe, Resend) | <10s per file |
| E2E | `apps/*/e2e/**` | Minimal, intentional | <60s per run |

E2E is expensive to maintain. Keep the count deliberately low. If it can be tested at integration level, prefer that.

### Flintmere's canonical E2E flows

1. **Scanner public flow** — URL submit → scan job → partial score returned → email capture → report email sent (mocked).
2. **Shopify app install flow** — OAuth init → callback → token encrypted + stored → initial bulk sync job enqueued → first scorecard renders.
3. **Fix apply + revert** — merchant selects a Tier 1 fix → preview → apply → revert within 7-day window → state rolled back.

These are the three E2E paths. More E2Es mean more maintenance cost; justify before adding a fourth.

## What must have a test

- Every new API route handler (scanner `route.ts` / Remix actions + loaders). At minimum: one happy-path integration test per HTTP verb.
- Every new `packages/scoring/src/**/*.ts` pillar function. Unit tests for the scoring math and edge cases.
- Every new `packages/llm/src/**` adapter. Mocked provider response handling.
- Every bug fix. Regression test written before or with the fix, not after.
- Every rate-limit rule. Behaviour tested against a mocked limiter + verified once against the real limiter (integration).
- Every webhook handler (`apps/shopify-app/src/routes/api.webhooks.*`): HMAC verification test + idempotency test + at least one malformed-payload rejection test.
- Every Prisma migration that transforms existing rows. Migration applies cleanly in a scratch DB and leaves the schema in the expected state.

## What does not need a test

- React / Remix components with no logic (pure layout / presentational).
- One-line prop-forwarding utilities.
- Files that only re-export.
- Prisma-generated types.
- Next.js / Remix route-level loaders that only return a static fetch.

When in doubt: write the test. Tests are cheap compared to a production bug.

## Coverage expectations

- `packages/scoring/src/`: ≥ 90% line coverage (the scoring math is pure and high-leverage — no excuse for gaps).
- `packages/llm/src/`: ≥ 80% line coverage.
- `apps/*/src/routes/api/**`: every route handler hit at least once.
- `apps/*/src/components/`: no coverage minimum, but any component with state or effects needs at least a render + interaction test.

Coverage is a floor, not a goal. 100% coverage with bad tests is worse than 70% with tight tests.

## Test philosophy

- **Arrange → Act → Assert.** No more than three assertions per test unless they're all about one behaviour.
- **No snapshot tests for components** — they drift silently. Assert behaviour, text, ARIA roles instead.
- **Mock at the edge.** External APIs mocked (Shopify, Vertex AI, Stripe, Resend); internal modules called real. A test that mocks `packages/scoring/foo` to test `packages/scoring/foo` is testing nothing.
- **Flaky tests get fixed or deleted.** A flaky test is worse than no test.
- **Tests document intent.** Test names read as requirements: `returns 429 when rate-limit exceeded`, `verifies HMAC before enqueueing work`, not `test 1` or `it works`.
- **Real Prisma on integration tests.** Use a scratch schema (`scanner_test_*`) that's reset between runs — don't mock Prisma. Mock Prisma only for pure-unit speed tests where DB access would slow the suite.

## Flintmere-specific test fixtures

- **Scoring fixtures** — `packages/scoring/fixtures/*.json` — representative product payloads (beauty, supplements, apparel) with expected scores. Pillar changes must not change expected scores on these fixtures without explicit updates.
- **Shopify webhook fixtures** — canonical `products/create`, `products/update`, `app/uninstalled`, `customers/data_request`, `customers/redact`, `shop/redact` payloads (with valid HMAC) for HMAC-verification tests.
- **Bulk operation JSONL samples** — small + large synthetic JSONL files for streaming-parser tests.

## Running tests

Canonical commands live in `projects/flintmere/PROJECT.md`. Typical:

```
pnpm -r test              # full suite across all workspaces
pnpm -F scoring test      # one package
pnpm -F scanner test      # one app
pnpm -F scoring test:watch # TDD loop
pnpm -F scanner test path/to/file.test.ts
```

Test runner: Vitest across packages + apps. If a workspace adopts a different runner, update `PROJECT.md` first, then this file.

## Hard bans

- No tests that hit live production systems.
- No tests that hit live Shopify shops (use the Shopify CLI's dev store).
- No tests that require a human to manually seed data.
- No committed `.skip` or `.only`. Fix or delete.
- No `console.log` left in test files.
- No test longer than its layer's budget.
- No real Vertex AI / Azure OpenAI calls in the test suite — mock at the `packages/llm` adapter boundary.
- No real Stripe calls — use Stripe's test mode + mocked webhook fixtures.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard user flow (signup → scan → revoke) with Flintmere E2E flows (scanner public flow, Shopify install, fix apply + revert). Updated paths from `src/lib/**` → `packages/*/src/**` + `apps/*/src/**`. Added Vitest, Flintmere-specific fixtures, and Shopify-dev-store testing norms.
