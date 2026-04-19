# test-strategy.md

Test pyramid and coverage expectations for `src/`. #16 QA owns this file.

## Layers

| Layer | Location | What lives here | Expected speed |
|-------|----------|-----------------|----------------|
| Unit | `__tests__/lib/**` | Pure functions in `src/lib/**` — parsers, formatters, risk scoring, rate-limit math | <1s per file |
| Integration | `__tests__/api/**`, `__tests__/security/**` | Route handlers with a real-ish DB and mocked external services | <10s per file |
| E2E | (minimal, intentional) | Signup → scan → revoke happy path | <60s per run |

E2E is expensive to maintain. Keep the count deliberately low. If the thing being tested can be tested at integration level, prefer that.

## What must have a test

- Every new API route handler. At minimum: one happy-path integration test per HTTP verb.
- Every new `src/lib/<domain>/` function that contains branching logic.
- Every bug fix. The regression test is written before or with the fix, not after.
- Every rate-limit rule. Rate-limit behaviour is tested against a mocked limiter + a real limiter.
- Every webhook handler. Signature verification, idempotency, and at least one bad-payload rejection test.
- Every migration that transforms existing rows. Up and down must round-trip cleanly in a scratch DB.

## What does not need a test

- Server Components with no logic (pure layout).
- One-line prop-forwarding utilities.
- Files that only re-export.
- Generated types.

When in doubt: write the test. Tests are cheap compared to a production bug.

## Coverage expectations

- `src/lib/` business logic: ≥ 80% line coverage.
- `src/app/api/`: every route handler hit at least once.
- `src/components/`: no coverage minimum, but any component with state/effects needs at least a render test.

Coverage is a floor, not a goal. 100% coverage with bad tests is worse than 70% with tight tests.

## Test philosophy

- **Arrange → Act → Assert.** No more than three assertions per test unless they're all about one behaviour.
- **No snapshot tests for components** — they drift silently. Assert behaviour instead.
- **Mock at the edge.** External APIs mocked; internal modules called real. A test that mocks `src/lib/foo` to test `src/lib/foo` is testing nothing.
- **Flaky tests get fixed or deleted.** A flaky test is worse than no test.
- **Tests document intent.** Test names read as requirements: `returns 429 when rate-limit exceeded`, not `test 1`.

## Running tests

Canonical commands live in `projects/allowanceguard/PROJECT.md`. Typical:

```
pnpm test           # full suite
pnpm test:watch     # TDD loop
pnpm test <file>    # single file
```

If the project adds a new test runner, update `PROJECT.md` first, then this file.

## Hard bans

- No tests that hit live production systems.
- No tests that require a human to manually seed data.
- No committed `.skip` or `.only` calls. Fix the test or delete it.
- No `console.log` left in test files.
- No test that takes longer than its layer's budget.
