# Flintmere — Status

Current phase, what's shipped, what's next. Update as state changes so Claude's advice stays grounded in the real timeline.

## Phase

**Pre-launch — foundations complete, ready to scaffold `apps/`.** No code written yet. No customers. No public URL live. Validation week (SPEC §2) not yet started.

The meta-layer is done. Kit-level work is complete across all seven departments, all foundational ADRs, all project docs, all Flintmere-specific skills. Every skill invoked from here on reads Flintmere-shaped memory.

## Shipped (2026-04-19)

### Kit + repo

- Kit cloned from `claude-master-build-kit`, initialised as `flintmere` with domain `flintmere.com`.
- Repo renamed `Flintmere/Flint_Shop` → `Flintmere/flintmere` on GitHub.
- Wireframes installed at `wireframes/` (React-based viewer, three surfaces × two variants).
- `SPEC.md` preserved into `projects/flintmere/` (v1.2 — Product & GTM plan).
- Repo baseline: `pnpm-workspace.yaml`, root `package.json`, `.gitignore`, `.nvmrc`, `apps/scanner/Dockerfile`, `apps/shopify-app/Dockerfile`, `.dockerignore`, `docker-compose.yml`, `SECURITY.md`.
- `.claude/settings.json` refactored to tier-by-blast-radius permissions.
- `.claude/hooks/session-start.sh` updated to Flintmere orientation.
- Root `CLAUDE.md` rewritten as Flintmere load map.

### Foundational ADRs

- **0001** — single-repo monorepo with `apps/` + `packages/`.
- **0002** — Coolify on existing DO droplet (sunk cost + EU data residency).
- **0003** — visual canon: neutral-bold hybrid + legibility bracket + Geist.
- **0004** — Prisma over Drizzle.
- **0005** — LLM provider strategy (Gemini 2.5 Flash primary + GPT-4o-mini fallback; DeepSeek + Qwen rejected by Legal Council).
- **0006** — Gemini 2.5 Pro locked as hard-case model (benchmark deferred, not skipped).

### Project anchor docs (`projects/flintmere/`)

- `PROJECT.md`, `ARCHITECTURE.md`, `DESIGN.md`, `BUSINESS.md`, `STATUS.md` (this file), `GLOSSARY.md`, `decisions/0001–0006`.

### Memory (all seven departments)

- `memory/VOICE.md`, `memory/OUTPUT.md`, `memory/CONSTRAINTS.md`, `memory/TOOLS.md` — kit behaviour layer for Flintmere.
- `memory/design/` (5 files) — tokens, components, motion, accessibility, performance budget.
- `memory/product-engineering/` (6 files) — architecture rules, Shopify API rules, security posture, performance budget, test strategy, incident history template.
- `memory/marketing/` (9 files) — brand, audiences, SEO, imagery, outreach, metrics, experiments, content history, positioning history.
- `memory/compliance-risk/` (5 files) — claims register, incident disclosure, jurisdictions, platform rules, regulatory matrix.
- `memory/growth/` (6 files) — ecosystems, integrations, targets, partnerships history, grants history, open-source program.
- `memory/data-intelligence/` (5 files) — metric catalog, KPI tree, data sources, data handling rules, experiment log.
- `memory/admin-ops/` (6 files) — vendor register, support categories, ops calendar, docs map, finance baseline, billing SOPs.

### Skills (`.claude/skills/`, 54 total)

- Deleted: `add-chain`, `design-ledger-surface`, `design-glass-surface` (retired).
- Created: `shopify-app-store-submission`, `bulk-catalog-sync`, `gtin-guidance`, `agentic-readiness-audit`, `coolify-deploy`, `design-marketing-surface`, `design-app-surface`.
- Bulk sed-pass across all 47 remaining skills to strip "Allowance Guard" references. Per-skill deeper edits (Web3 example content in body text) deferred to lazy-update path.

## In progress

None. Foundations are complete.

## Next (in order of leverage)

1. **Apps scaffold** — `apps/scanner/` Next.js app + `apps/shopify-app/` Remix app. Empty-but-building state with the Dockerfiles + Coolify config ready. No features yet.
2. **`packages/llm/`** — LLM provider abstraction per ADRs 0005 + 0006. Interface + Vertex AI primary implementation.
3. **`packages/scoring/`** — pure scoring engine for the six pillars. Unit-tested first.
4. **Validation week (SPEC §2)** — scanner shipped to `audit.flintmere.com`, cold outreach (founder LinkedIn + r/shopify + Shopify Partner Slack), £97 concierge audits.
5. **Beta merchant onboarding** — private MVP for 10–20 merchants.

## Known issues (non-blocking)

- **SPEC.md is 640 lines** — over the 600-line limit (`PROCESS.md` §2). Inherited document, not new code. Decision to split or accept as exception deferred.
- **Skill body content**: ~10 remaining skills have "wallet / approval / Permit2 / Sentinel / SIWE" in example prose. The top-level descriptions are now "Flintmere"; content gets updated lazily when each skill is first invoked against a Flintmere task.
- **No `apps/*/src/` content yet** — Dockerfiles and workspace config are ready, but no actual Next.js / Remix code.
- **Coolify not yet configured for this repo.** Deploy path unverified end-to-end. Operator setup task.
- **Vertex AI service account not yet provisioned.** Blocks LLM integration test.
- **BetterStack + Sentry + Resend accounts not yet connected** — operator setup once apps scaffold.

## Open decisions (blocking nothing yet, to settle before related work)

- Whether `flintmere.com` (marketing site) is its own app or a static route inside `apps/scanner/`. Leaning: static route inside scanner app at launch; split if traffic patterns diverge.
- Agency tier billing: Stripe direct. Confirmed in BUSINESS.md.
- UK/EU jurisdictional priority for legal review. GDPR-first confirmed; Company Rules for UK Ltd registration pending (operator action).
- Self-hosted PostHog vs cloud free tier: leaning self-hosted on the droplet from day 1 (matches our data-residency story).
- SOC 2 posture: not needed pre-launch. Budget a preparation window when first Enterprise deal surfaces.

## The dry-run trace (stop-condition check for foundation completeness)

Test: pretend the operator invokes `build-feature` for "implement `POST /api/scan` that accepts a store URL, enqueues scan work, returns job ID."

The skill reads these files in order. Every file produces Flintmere-specific guidance with zero contradictions:

1. `CLAUDE.md` (repo root) — Flintmere load map ✓
2. `memory/PROCESS.md` — workflow rules + Standing Council (generic; correct as-is) ✓
3. `memory/OUTPUT.md` — TS strict, Prisma, bracket rules ✓
4. `memory/CONSTRAINTS.md` — Shopify OAuth, GTIN honesty, AI-outcome limits ✓
5. `memory/TOOLS.md` — permission tiers ✓
6. `memory/VOICE.md` — for any user-facing copy (bracket rule) ✓
7. `projects/flintmere/PROJECT.md` — monorepo stack, commands, env vars ✓
8. `projects/flintmere/ARCHITECTURE.md` — scanner + app API routes, Prisma schema, data flow ✓
9. `memory/product-engineering/architecture-rules.md` — dual-app invariants, Prisma, pnpm workspace ✓
10. `memory/product-engineering/shopify-api-rules.md` — (not needed for scanner, but available) ✓
11. `memory/product-engineering/security-posture.md` — CSRF, rate limits, input validation (Zod), tier-by-blast-radius ✓
12. `memory/product-engineering/performance-budget.md` — scanner p95 ≤ 500ms, 60s scan promise ✓
13. `memory/product-engineering/test-strategy.md` — Vitest, packages/*, Flintmere fixtures ✓
14. Cross-references ADRs 0001 (monorepo) + 0004 (Prisma) + 0005/6 (LLM — not needed for scanner pillars 1/3/5 which are deterministic) ✓

**Result**: trace passes. Every file surfaces Flintmere-shaped guidance; no allowanceguard residue guides behaviour. Foundation is foundation-grade.

## Changelog

- 2026-04-19: Status updated to reflect foundations complete. Phases 1–3 shipped in 12 commits. Next step: apps scaffolding.
