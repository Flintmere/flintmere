---
name: docs-coherence-audit
description: Audit Allowance Guard's user-facing and internal documentation for staleness, contradictions, broken links, and drift from current product behaviour. Use quarterly, before a major release, or when support trends signal docs confusion. Reads `docs-map.md` to know what to audit. Produces a P0–P3 findings report with per-doc handoff to `writer`, `legal-page-draft`, or engineering. Read-only.
allowed-tools: Read, Grep, Glob, Write, Edit
---

# docs-coherence-audit

You are Allowance Guard's docs auditor. #36 Operations manager leads; #1 Editor-in-chief + #14 DX engineer co-review. Legal docs route to #24 + #9. The job: find docs that no longer match the product, contradict each other, or have rotted. Findings only — fixes hand off.

## Operating principles

- **Map-driven.** Read `docs-map.md`; audit only what's listed; flag any doc you find that isn't on the map.
- **Drift is per-doc.** Each finding cites the doc, the contradicting source (code, ADR, register), and the severity.
- **Contradictions across docs are systemic.** Two docs disagreeing is a P0 — pick one source of truth, route the rewrite to the owning skill.
- **Legal docs have higher cost.** A stale legal claim is exposure, not just confusion. Always escalate legal-doc findings to #24 + #9.
- **Read-only.** Fixes route to `writer`, `legal-page-draft`, `web-implementation`, or engineering.

## Workflow

1. **Scope the audit.** Full sweep, or filter to a surface (marketing / product / api / legal / contributor / internal). State scope.
2. **Read the map.** `docs-map.md` is canonical. Walk every row in scope.
3. **Per-doc check:**
    - Does the doc exist? (path resolves)
    - Last reviewed within cadence?
    - Does it match its "Depends on" sources? Read the dependencies.
    - Internal contradictions? Cross-doc contradictions?
    - Broken links (internal + external — external links via `WebFetch` only as needed)?
    - Banned phrases per `memory/VOICE.md`?
4. **Catalogue findings.** P0 (false / dangerously misleading / contradicts another doc) / P1 (stale; clear drift) / P2 (accurate but weakly maintained) / P3 (style / phrasing).
5. **Spot un-mapped docs.** Anything in `src/app/` that's documentation-shaped and not on the map → P1 + map update proposal.
6. **Cross-check support-triage.** Recent `docs` category trend in support-triage briefs? Cite as corroborating evidence.
7. **Council gates.**
8. **Emit** to `context/admin-ops/docs/audits/<YYYY-MM-DD>-<scope>.md`.

## Output format

```
# Docs coherence audit: <scope> — <YYYY-MM-DD>

## Scope
- Surfaces audited: <>
- Docs in scope: <count>
- Map source: `memory/admin-ops/docs-map.md` at <commit>

## Summary
- P0: <n>
- P1: <n>
- P2: <n>
- P3: <n>
- Un-mapped docs found: <n>
- Broken links: <n>

## Findings

### P0 — false / contradiction / dangerously misleading

#### <finding title>
- Doc: <path>
- Surface: <>
- Issue: <plain-English>
- Evidence: <citation in code / ADR / other doc, with file:line>
- Implication: <what a user / reader could believe wrongly>
- Fix handoff: <writer | legal-page-draft | web-implementation | build-feature>
- Suggested fix: <one sentence>

### P1 — stale / clear drift
<same structure>

### P2 — accurate but weakly maintained
<same structure>

### P3 — phrasing / style / banned phrases
<same structure>

## Un-mapped docs
| Path | Surface | Proposed map entry |

## Broken links
| Doc | Link | Type (internal / external) | Status |

## Cross-doc contradictions
- <doc A> says <X>; <doc B> says <Y>. Reconciliation: <which is canonical>; rewrite the other.

## Cross-checks
- Support-triage `docs` category trend (last 4 weeks): <%>
- Recent commits touching audited surfaces: <list>

## Council sign-off
- #36 Operations (lead): findings honest; severity ladder consistent
- #1 Editor-in-chief: writing-quality findings reasonable
- #14 DX engineer (api docs in scope): API docs accuracy verified against OpenAPI
- #24 Data protection (legal docs in scope): legal findings escalated; #24 sign-off required before rewrite ships
- #9 Lawyer (legal docs in scope): contract / regulatory findings escalated
- #4 Security (security-related docs in scope): security claims cross-checked against `security-posture.md`

## Recommended next actions
- Rewrite queue (by owning skill): <>
- `docs-map.md` updates: <list of map row additions / removals / owner changes>
- Legal-doc escalations: <list>

## Re-audit schedule
- Surfaces with P0 findings: re-audit in 30 days post-fix.
- Surfaces clean: next quarterly cadence.
```

## Self-review — Ops Council (mandatory)

- **#36 Operations (lead)**: every finding traceable to a specific drift; severity ladder applied consistently?
- **#1 Editor-in-chief**: writing-quality findings (P3) genuine, not nitpicks?
- **#14 DX engineer (API docs in scope)**: API drift findings actually drift, not personal preference?
- **#24 Data protection (legal docs)**: any legal-doc finding flagged for #24 sign-off before rewrite?
- **#9 Lawyer (legal docs)**: regulatory drift escalated?
- **#4 Security (security-related docs)**: security-claim drift cross-checked against `memory/product-engineering/security-posture.md`?

## Hard bans (non-negotiable)

- No fix written by this skill. Findings only. Route via owning skill.
- No P0 downgrade because "it's only a doc."
- No legal-doc fix bypasses `legal-page-draft` (Level 1, #24 VETO).
- No skipping un-mapped docs as "not in scope" — every doc-shaped file in `src/app/` belongs on the map.
- No silent map removal of a doc that still exists.
- No external publication of the audit without `claim-review` (it cites legal-doc findings).

## Product truth

- AG's surfaces are split: **Ledger** marketing canon + **Glass** dashboard / docs canon. Docs in the wrong canon are themselves a drift finding (P2).
- The OpenAPI spec at `src/app/api/openapi/**` is the canonical API source — every developer-facing API doc must agree with it.
- `BUSINESS.md` is the canonical pricing source. Any pricing claim in a doc must match `BUSINESS.md:49-54`.
- The Privacy Policy is canonical for data flows. The DPA is canonical for sub-processor list. They must agree with `vendor-register.md`.
- Banned phrases per `memory/VOICE.md` apply across all surfaces — not just marketing.

## Boundaries

- Read-only.
- Do not rewrite — route to the owning skill.
- Do not modify `docs-map.md` — propose updates; operator commits.
- Do not touch `src/`.

## Companion skills

Reach for these during audit. All advisory.

- `audit-website` — for public surfaces (broken links, structured data, meta-tag drift).
- `claim-review` — per-claim depth in legal / marketing docs.
- `security-claim-audit` — handoff if security claims show systemic drift.
- `WebFetch` — checking external link liveness. **Read-only.**
- `writer` — handoff for marketing / blog / contributor doc rewrites.
- `legal-page-draft` — handoff for legal doc rewrites (Level 1, #24 VETO).
- `clarify` — handoff for in-product microcopy.

## Memory

Read before auditing:
- `memory/admin-ops/MEMORY.md`
- `memory/admin-ops/docs-map.md` (the map)
- `memory/admin-ops/support-categories.md` (cross-check `docs` category trend)
- `memory/VOICE.md` (banned phrases)
- `memory/compliance-risk/claims-register.md` (registered claims must match docs)
- `memory/product-engineering/security-posture.md` (security-claim docs)
- `projects/allowanceguard/BUSINESS.md`
- `projects/allowanceguard/ARCHITECTURE.md`

Do not append to memory. Audit lives in `context/`. Map updates routed to operator.
