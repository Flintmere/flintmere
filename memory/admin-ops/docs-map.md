# docs-map.md — Every user-facing doc

The map `docs-coherence-audit` reads. One row per doc. New docs appended on creation; obsolete docs removed via ADR (never silently).

## Schema

```
| Path | Surface | Owner | Depends on | Last reviewed | Notes |
```

- **Path**: file path or URL.
- **Surface**: marketing / product / api / legal / contributor / internal.
- **Owner**: council # (the role accountable for accuracy).
- **Depends on**: code paths or specs whose change requires re-reviewing this doc.
- **Last reviewed**: YYYY-MM-DD when the doc was last verified against current product behaviour.
- **Notes**: known stale sections, planned rewrites, special handling.

---

## Marketing docs (Ledger surfaces)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `src/app/page.tsx` (homepage hero + sections) | marketing | #5 + #20 | `BUSINESS.md`, scanner UX | 2026-04-09 | Quiet-bold Ledger redesign; see `docs/redesign/` |
| `src/app/pricing/**` | marketing | #5 + #22 | `BUSINESS.md:49-54` | 2026-04-15 | Tier + pricing canonical |
| `src/app/sentinel/**` | marketing | #5 + #22 | `BUSINESS.md`, Sentinel feature | 2026-03 | Demo CTA conversion-tested |
| `src/app/blog/**` | marketing | #1 + #20 | per-post topic | rolling | `memory/marketing/content-history.md` is canonical log |
| `src/app/sitemap/**` (human-readable) | marketing | #1 | sitemap.ts | 2026-03 | |

## Product docs (in-app surfaces)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `src/app/dashboard/**` (microcopy + empty states) | product | #13 + #7 | dashboard component tree | rolling | Glass canon |
| `src/app/onboarding/**` (if present) | product | #13 + #7 | onboarding flow | TBD | |
| In-product error messages (across `src/`) | product | #13 + #4 | error code map | rolling | `clarify` skill audits |

## API docs (developer-facing)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `src/app/api/openapi/**` (OpenAPI spec) | api | #6 + #14 | API route handlers | 2026-04-12 | Cleaned up in P2 cleanup (commit b234fa9) |
| `src/app/docs/api/**` (developer guide) | api | #14 | OpenAPI spec | 2026-04 | Quickstart must be copy-pasteable |
| API error code reference | api | #14 + #4 | error code map | rolling | Drift risk on every release |

## Legal docs (compliance-owned)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `src/app/privacy/**` | legal | #24 + #19 | data flows; vendor register | 2026-04 | `legal-page-draft` (Level 1) owns updates |
| `src/app/terms/**` | legal | #9 + #23 | tier definitions; jurisdictions | 2026-04 | |
| `src/app/cookies/**` | legal | #24 | analytics setup | 2026-04 | Rewritten in commit 3135e50 |
| `src/app/dpa/**` (DPA) | legal | #24 + #9 | sub-processor list (vendor register) | 2026-04 | |
| `SECURITY.md` (disclosure policy) | legal | #4 + #24 | disclosure process | TBD | Tracked under compliance |

## Contributor docs (open-source)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `README.md` | contributor | #1 + #2 | quickstart; install | rolling | First-impression doc; high drift cost |
| `CONTRIBUTING.md` | contributor | #2 | branch / PR / CLA process | TBD | Owned by `open-source-program-run` |
| `CODE_OF_CONDUCT.md` | contributor | #2 | community policy | TBD | |
| `CHANGELOG.md` (or release notes) | contributor | #1 + #14 | release pipeline | rolling | |

## Internal docs (this repo, not public)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `CLAUDE.md` | internal | #36 | dept system | 2026-04-17 | Pilots 1–6 changelogged here |
| `memory/PROCESS.md` | internal | #36 | council; workflow | 2026-04-16 | Council size = 36 |
| `memory/VOICE.md` | internal | #11 + #20 | banned phrases | rolling | |
| `memory/CONSTRAINTS.md` | internal | #36 | hard "Do Not" rules | TBD | |
| `memory/CORRECTIONS.md` | internal | #36 | append-only lessons | rolling | |
| `memory/OUTPUT.md` | internal | #15 | code conventions | TBD | |
| `memory/TOOLS.md` | internal | #36 | tool policy; git safety | TBD | |
| `memory/<dept>/MEMORY.md` (×6) | internal | dept lead | dept skills | per-dept | One per pilot |
| `docs/<dept>-agents.md` (×6) | internal | dept lead | dept skills | per-dept | Operator runbooks |
| `projects/allowanceguard/PROJECT.md` | internal | #15 | repo layout | TBD | |
| `projects/allowanceguard/ARCHITECTURE.md` | internal | #15 + #4 | API routes; chains; gates | rolling | |
| `projects/allowanceguard/DESIGN.md` | internal | #7 + design council | canon definitions | rolling | |
| `projects/allowanceguard/BUSINESS.md` | internal | #5 + #11 | pricing; positioning | 2026-04 | Pricing canonical |
| `projects/allowanceguard/STATUS.md` | internal | #36 | what's shipped | rolling | Updated by operator |
| `projects/allowanceguard/decisions/**` (ADRs) | internal | various | per-ADR | rolling | |

## Drift signals (what to watch for)

- **Code change without doc review**: PR touches a path in "Depends on" but no doc in this map updated → flag.
- **Last-reviewed > 90 days for marketing / product / api docs** → flag.
- **Last-reviewed > 365 days for legal docs** → escalate to legal council.
- **Internal docs unrelated to current pilots** → mark for archival.
- **Two docs that contradict** → P0; route to `writer` + the affected dept lead.

## Audit cadence

- Quarterly full sweep by `docs-coherence-audit`.
- Ad-hoc on operator request (e.g., before a major release).
- Per-doc spot-check whenever the "Depends on" code path lands a non-trivial change.

## Maintenance

- New doc: append a row on the same commit that creates the doc.
- Removed doc: ADR + remove row in the same commit.
- Owner change: update the row + note in commit message.
