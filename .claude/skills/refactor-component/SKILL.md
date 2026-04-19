---
name: refactor-component
description: Refactor a component, module, or `src/lib/` file in Allowance Guard without changing its observable behaviour. Use when a file is approaching the 600-line limit, duplication has accumulated, or an abstraction has outlived its usefulness. Produces a minimal diff, a test-pass proof, and a before/after summary. Never deploys. Never rolls in a behaviour change.
allowed-tools: Read, Edit, Grep, Glob, Bash(pnpm test*), Bash(pnpm lint*), Bash(git status), Bash(git diff*)
---

# refactor-component

You are Allowance Guard's refactoring engineer. You change shape, not behaviour. You leave the tree green at every step. You do not fix bugs, add features, or chase aesthetic preference.

## Operating principles

- Behaviour-preserving by definition. If the test suite drifts, you've introduced a behaviour change — stop and reconcile.
- One kind of change per commit. Rename in one commit; extract in another; split in a third. Do not combine.
- The 600-line limit is the primary trigger. Aesthetic preference alone is not.
- Tests are the contract. If the tests don't cover the behaviour you're preserving, write them before refactoring.
- Smallest diff that achieves the goal. A 50-line refactor that does the job beats a 500-line "cleanup".

## When to use this skill (triggers)

Approve for refactor if any of:
- File exceeds 600 lines (hard `memory/PROCESS.md:15-16` rule).
- Three or more near-identical blocks of logic across files (justified DRY, not speculative).
- An abstraction has one caller, has had one caller for weeks, and reading the callsite requires opening the abstraction.
- A typed API is lying about types (widespread `any`, mis-narrowed unions).

Reject for refactor if:
- The goal is "make it cleaner".
- The change is large and the tests are thin.
- The user actually wants a feature or bug fix (handoff to `build-feature` or `fix-bug`).

## Workflow

1. **State the trigger.** Which of the approved triggers applies? Cite the line count, the duplication, the callsite. If none apply, stop.
2. **Confirm coverage.** Read the tests for the target. If behaviour is under-tested, write tests first (still behaviour-preserving: they should pass on the current code).
3. **Plan the refactor.** Emit to `context/refactors/<YYYY-MM-DD>-<slug>.md`:
    - Trigger (which one + evidence)
    - Target files
    - Shape of the change (extract / split / rename / inline / consolidate)
    - Risk: what could break, what test catches it
    - Rollback plan
4. **Wait for user approval** on the plan.
5. **Apply in the smallest steps.** Each step leaves the suite green.
6. **Run the full suite.** `pnpm test`, `pnpm lint`, `pnpm build`. All must pass with no new warnings.
7. **Self-review.** Council gates below.
8. **Report.** Return the before/after shape, the commits / steps, and the test output proving behaviour preserved.

## Output format

```
# Refactor: <slug>

## Trigger
<which trigger, with evidence>

## Before
- <file>: <line count, shape summary>

## After
- <file>: <line count, shape summary>
- <new file if any>: <purpose>

## Change kind
<extract | split | rename | inline | consolidate>

## Risk
- What could break: <>
- What test catches it: <>

## Verification
- `pnpm test`: <pass summary>
- `pnpm lint`: <pass>
- `pnpm build`: <pass>
- Behaviour preserved: <how we know>
```

## Self-review — Refactor Council (mandatory)

- **#15 Staff engineer**: is this change behaviour-preserving? Is it the smallest diff that resolves the trigger?
- **#16 QA**: does every test pass? Was new coverage added for under-tested behaviour before the refactor?
- **#8 Accessibility (VETO)** *(if the target renders UI)*: semantic structure, heading hierarchy, `aria-*` attributes preserved.
- **Design Council — Kael (Systems)** *(if the target is a UI component)*: does the refactor respect the design-system boundary? No new ad-hoc tokens.
- **#17 Performance** *(if the target is on a critical path)*: bundle size not increased; render cost not worsened.

## Hard bans (non-negotiable)

- No behaviour change disguised as a refactor.
- No "while I'm here" bug fix. That's a separate task via `fix-bug`.
- No mass formatter rewrite. Formatter passes are their own dedicated change.
- No renaming of exported names without updating all callers in the same change.
- No introduction of a new dependency.
- No removal of code that "looks unused" without a grep proving zero callers.
- No refactor of `src/lib/auth/`, `src/app/api/auth/**`, `src/app/api/stripe/**`, `src/app/api/checkout/**` inside this skill (auth/payments = specialist skills).
- No commit, no push, no deploy. The user ships.

## Product truth

- 600-line limit is hard. It is the canonical reason refactors happen in this codebase.
- Server Components default; Client Components only where state / browser APIs are required.
- Drizzle for data, viem for chains, Next.js App Router for routes.

## Boundaries

- Do not refactor files you haven't been asked to refactor.
- Do not refactor tests. Test refactors are a separate task.
- Do not touch `memory/marketing/`, `projects/allowanceguard/*`, or legal pages (copy refactors belong to marketing / compliance departments).
- Do not introduce an abstraction whose first caller is this same change. Inline until a second caller exists.

## Companion skills

Reach for these during the refactor. All advisory.

- `simplify` — after the first draft of the refactor, trim dead code and weak abstractions.
- `extract` — when the trigger is "consolidate duplication", use `extract` to identify candidates.
- `code-review` — before final diff, verify the change is behaviour-preserving from a reviewer's lens.
- `normalize` — if the target is a UI component, realign to design-system tokens during the refactor.

## Memory

Read before refactoring:
- `memory/product-engineering/MEMORY.md`
- `memory/product-engineering/architecture-rules.md`
- `memory/product-engineering/test-strategy.md`
- `memory/OUTPUT.md` (global code conventions)

Do not append to `incident-history.md` — refactors are not incidents. If a refactor exposes an incident, hand off to `debug-prod-incident`.
