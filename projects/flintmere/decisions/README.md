# Architecture Decision Records

One file per significant decision. Name them `NNNN-slug.md` (4-digit zero-padded).

## Index

| ADR | Title | Status | Summary |
|---|---|---|---|
| [0001](0001-single-repo-monorepo.md) | Single-repo monorepo (`apps/` + `packages/`) | Accepted | Two apps, two shared packages, pnpm workspace |
| [0002](0002-coolify-on-do.md) | Coolify on DigitalOcean | Accepted | Existing droplet + Traefik; UK/EU data residency |
| [0003](0003-canon-neutral-bold-bracket.md) | Canon — neutral-bold hybrid + legibility bracket | Accepted | Apple-bold structure + Geist + `[ word ]` signature |
| [0004](0004-prisma-over-drizzle.md) | Prisma over Drizzle | Accepted | Migrations tooling + team familiarity won |
| [0005](0005-llm-provider-strategy.md) | LLM provider strategy | Accepted | Gemini 2.5 Flash primary + GPT-4o-mini fallback; DeepSeek + Qwen rejected by Legal Council |
| [0006](0006-hardcase-llm-lock-gemini-pro.md) | Hard-case LLM locked to Gemini 2.5 Pro | Accepted | Benchmark deferred to month 3 / 50 concierge audits |

## Template

```
# NNNN — <Decision title>

- **Status:** Proposed / Accepted / Superseded by NNNN
- **Date:** YYYY-MM-DD
- **Context:**
  What problem are we solving. What constraints are in play.
- **Decision:**
  What we chose.
- **Consequences:**
  What changes as a result. What trade-offs we're accepting.
- **Rollout:**
  Phased? Immediate? What needs to happen to land this.
```

Write ADRs for anything you'd want to explain to a future collaborator in three months. "Why did we pick X?" answers live here, not in commit messages.

## When to write one

- A decision with multi-month consequences (stack, framework, pricing model, legal posture).
- A decision that reverses or supersedes a prior ADR — supersede explicitly in both.
- A choice between two reasonable options where the rationale isn't obvious from the code.

## When to supersede

When a later decision makes an earlier one wrong, mark the earlier ADR's **Status:** `Superseded by NNNN` and add a new ADR explaining the change. Do not edit superseded ADRs beyond the status line — they are the historical record.
