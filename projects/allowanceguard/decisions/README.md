# Architecture Decision Records

One decision per file. Append-only. If a decision is reversed, write a new ADR that supersedes the old one — do not edit history.

## Format

```
# <NNNN> — <Short title>

**Status:** Accepted | Superseded by NNNN | Deprecated
**Date:** YYYY-MM-DD
**Council:** (which Standing Council members informed this)

## Context
What's the situation? What's the problem?

## Decision
What did we decide?

## Consequences
What are we accepting by choosing this? What's the trade-off?

## Alternatives considered
Briefly — what else was on the table and why we rejected it.
```

## Index

| # | Title | Status |
|---|-------|--------|
| 0001 | Open-core business model | Accepted |
| 0002 | SIWE over magic-link auth | Accepted (magic-link deprecated) |
| 0003 | Vercel Cron over external scheduler | Accepted |
| 0004 | Neon serverless strict casting rules | Accepted |
| 0005 | Ledger aesthetic on homepage | Superseded by 0007 |
| 0006 | One Stripe account serves AllowanceGuard and PagePerfect Studio | Accepted |
| 0007 | Unified Ledger canon; retire Glass | Accepted |
