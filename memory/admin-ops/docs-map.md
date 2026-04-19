# docs-map.md — Every user-facing doc

The map `docs-coherence-audit` reads. One row per doc. New docs appended on creation; obsolete docs removed via ADR (never silently).

## Schema

```
| Path | Surface | Owner | Depends on | Last reviewed | Notes |
```

- **Path**: file path or URL
- **Surface**: marketing | product | api | legal | contributor | internal
- **Owner**: council # accountable for accuracy
- **Depends on**: code paths or specs whose change requires re-reviewing this doc
- **Last reviewed**: YYYY-MM-DD when doc was last verified against current product behaviour
- **Notes**: known stale sections, special handling

---

## Marketing docs (flintmere.com)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `apps/scanner/src/app/page.tsx` (marketing home) | marketing | #5 + #20 | BUSINESS.md, scanner UX | TBD | Hero + pillars + pricing peek |
| `apps/scanner/src/app/pricing/page.tsx` | marketing | #5 + #22 | BUSINESS.md §Tiers | TBD | Tier + pricing canonical |
| `apps/scanner/src/app/audit/page.tsx` (£97 concierge landing) | marketing | #5 + #22 | BUSINESS.md, SPEC §2.4 | TBD | Stripe button + Calendly |
| `apps/scanner/src/app/research/**` (State-of-AI-Readiness reports) | marketing | #1 + #20 | per-report data | rolling | `memory/marketing/content-history.md` is canonical log |
| `apps/scanner/src/app/blog/**` (when exists) | marketing | #1 + #20 | per-post topic | rolling | |

## Product docs (in-app surfaces)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `apps/scanner/src/app/scan/**` (public scanner UI) | product | #13 + #7 | scoring packages + pillar defs | TBD | Scanner results layout |
| `apps/shopify-app/app/routes/_index.tsx` (dashboard) | product | #13 + #7 | score card + pillar grid | TBD | Polaris + Flintmere island |
| `apps/shopify-app/app/routes/issues.*` | product | #13 + #7 | issue-row primitive | TBD | Bracketed noun rule |
| `apps/shopify-app/app/routes/fix-history.*` | product | #13 + #7 | fix_batches schema | TBD | |
| In-product error messages (across both apps) | product | #13 + #4 | error code map | rolling | `writer` skill audits microcopy |

## API docs (developer-facing — Agency tier)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `apps/shopify-app/app/routes/api/**` (OpenAPI spec) | api | #6 + #14 | API route handlers | TBD | When Agency API ships |
| `apps/scanner/src/app/docs/api/**` (developer guide) | api | #14 | OpenAPI spec | TBD | Copy-pasteable quickstarts |
| API error code reference | api | #14 + #4 | error code map | rolling | |

## Legal docs (compliance-owned)

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `apps/scanner/src/app/privacy/page.tsx` | legal | #24 + #23 | data flows; vendor register | TBD | `legal-page-draft` owns updates |
| `apps/scanner/src/app/terms/page.tsx` | legal | #9 + #23 | tier definitions; jurisdictions | TBD | |
| `apps/scanner/src/app/cookies/page.tsx` | legal | #24 | analytics setup | TBD | |
| `apps/scanner/src/app/dpa/page.tsx` (DPA) | legal | #24 + #9 | sub-processor list | TBD | |
| `SECURITY.md` (disclosure policy) | legal | #4 + #24 | disclosure process | 2026-04-19 | Repo root |

## Contributor docs

| Path | Surface | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|---|
| `README.md` (repo root) | contributor | #1 + #2 | quickstart; install | TBD | First-impression doc |
| `CONTRIBUTING.md` (if/when exists) | contributor | #2 | branch / PR process | TBD | Open-source-program owns |
| `CODE_OF_CONDUCT.md` (if/when exists) | contributor | #2 | community policy | TBD | |
| `CHANGELOG.md` (when first release) | contributor | #1 + #14 | release pipeline | rolling | |

## Internal docs (kit + project)

| Path | Owner | Depends on | Last reviewed | Notes |
|---|---|---|---|---|
| `CLAUDE.md` (repo root) | #36 | load map | 2026-04-19 | Flintmere entry point |
| `memory/README.md` | #36 | dept system | TBD | Memory index |
| `memory/PROCESS.md` | #36 | council; workflow | 2026-04-14 | Council = 36 |
| `memory/VOICE.md` | #11 + #20 | banned phrases | 2026-04-19 | |
| `memory/OUTPUT.md` | #15 | code conventions | 2026-04-19 | |
| `memory/CONSTRAINTS.md` | #36 | hard "Do Not" rules | 2026-04-19 | |
| `memory/TOOLS.md` | #36 | tool policy | 2026-04-19 | |
| `memory/CORRECTIONS.md` | #36 | append-only lessons | rolling | |
| `memory/<dept>/*.md` | dept lead | dept skills | per-dept | Design + PE + marketing + admin-ops + data-intelligence + growth + compliance-risk |
| `projects/flintmere/PROJECT.md` | #15 | stack + commands | 2026-04-19 | |
| `projects/flintmere/ARCHITECTURE.md` | #15 + #4 | routes; schema; integrations | 2026-04-19 | |
| `projects/flintmere/DESIGN.md` | #7 + Design Council | canon definitions | 2026-04-19 | |
| `projects/flintmere/BUSINESS.md` | #5 + #11 | pricing; positioning | 2026-04-19 | Pricing canonical |
| `projects/flintmere/STATUS.md` | #36 | shipped / in progress | 2026-04-19 | Updated by operator |
| `projects/flintmere/SPEC.md` | operator | original intent | 2026-04-19 | Canonical GTM plan |
| `projects/flintmere/GLOSSARY.md` | #1 + operator | term definitions | 2026-04-19 | |
| `projects/flintmere/decisions/**` (ADRs) | various | per-ADR | rolling | 0001–0006 shipped |

## Drift signals (what to watch for)

- **Code change without doc review** — PR touches a path in "Depends on" but no doc in this map updated → flag.
- **Last-reviewed > 90 days for marketing / product / api docs** → flag.
- **Last-reviewed > 365 days for legal docs** → escalate to Legal Council.
- **Two docs that contradict** → P0; route to `writer` + affected dept lead.
- **SPEC.md contradicts shipped code** → reconcile via STATUS.md note; SPEC is intent, not truth.

## Audit cadence

- Quarterly full sweep by `docs-coherence-audit`.
- Ad-hoc on operator request (e.g., before a major release).
- Per-doc spot-check whenever the "Depends on" code path lands a non-trivial change.

## Maintenance

- New doc → append row on the same commit that creates it.
- Removed doc → ADR + remove row in same commit.
- Owner change → update row + note in commit message.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Paths updated from `src/app/**` (single-app) to `apps/*/src/` (monorepo). Removed allowanceguard-specific surfaces (Sentinel, sitemap). Added Flintmere surfaces (scanner, scanner/scan, Shopify app routes, research reports, audit concierge landing).
