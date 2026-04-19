# CLAUDE.md — Entry Point

Behaviour rules and pointers for Claude. Full project knowledge lives in `projects/<project-name>/`. Global behaviour rules live in `memory/`. `projects/allowanceguard/` is retained as a reference example of a fully filled-in project layer.

## Startup routine

At the start of every session or task:

1. **Read this file first.** It's the load map.
2. **Read anything in `context/`** (gitignored). Current-task notes. If empty, skip.
3. **Load on demand.** Pull the `memory/` or `projects/` files relevant to the task — not all of them.

Together: `context/` explains the present. `memory/` holds how Claude behaves. `projects/` holds what we're building. Use all three to produce consistent, accurate work.

## Triage (which file does this belong in?)

- **How I work** → `memory/`
- **What I'm building** → `projects/`
- **Right now** → `context/` (gitignored)
- **How Claude behaves** → this file

## Precedence (highest → lowest)

1. User instruction in the current turn.
2. `context/` — active task notes.
3. `projects/<name>/` — project-specific rules.
4. `memory/` — global behaviour rules.
5. This file — defaults and load map.

Project-specific always beats global. Current turn always wins.

## Load map (read on demand)

Do not read all of these on every session. Read the one(s) relevant to the task at hand.

### Global behaviour — `memory/`

| When working on... | Read |
|--------------------|------|
| Anything non-trivial | `memory/PROCESS.md` (Workflow rules + Standing Council) |
| User-facing copy | `memory/VOICE.md` (banned phrases, tone) |
| Writing/editing code | `memory/OUTPUT.md` (conventions, file naming, scope discipline) |
| Choosing a tool | `memory/TOOLS.md` (tool policy, git safety) |
| Before shipping anything | `memory/CONSTRAINTS.md` (hard "Do Not" rules) |
| Hit a lesson worth keeping | `memory/CORRECTIONS.md` (append-only) |

Index: `memory/README.md`. Maintenance rules (replace-over-accumulate) also live there.

### Project — `projects/<project-name>/`

| When working on... | Read |
|--------------------|------|
| Repo layout, tech stack, env vars, commands | `PROJECT.md` |
| API routes, DB rules, chain list, feature gates | `ARCHITECTURE.md` |
| Homepage or app UI | `DESIGN.md` |
| Pricing, tiers, messaging, positioning | `BUSINESS.md` |
| "Why is it this way?" | `decisions/` (ADRs) |
| Phase status / what's shipped | `STATUS.md` |

Reference example: `projects/allowanceguard/`

### Marketing managed-agent system — `memory/marketing/` + `.claude/skills/`

| When working on... | Read |
|--------------------|------|
| Marketing, content, growth, outreach, imagery | `memory/marketing/MEMORY.md` + `docs/marketing-agents.md` |

Skills live under `.claude/skills/` (market-research, positioning, content-strategy, writer, seo, social, outreach, conversion, analytics, campaign-manager, image-direction, web-implementation). Autonomy level 2 — user approves every publish, send, and `src/` edit.

### Product & Engineering managed-agent system — `memory/product-engineering/` + `.claude/skills/`

| When working on... | Read |
|--------------------|------|
| Features, bugs, migrations, onboarding, refactors, payments, webhooks, incidents | `memory/product-engineering/MEMORY.md` + `docs/product-engineering-agents.md` |

Skills live under `.claude/skills/` (build-feature, fix-bug, write-migration, debug-prod-incident, refactor-component, add-integration, implement-checkout-flow, webhook-review). Autonomy level 2 for most, **level 1 (fresh confirm per write)** for migrations and payment-critical changes. Plan → diff → tests; user commits and deploys.

### Design managed-agent system — `memory/design/` + `.claude/skills/`

| When working on... | Read |
|--------------------|------|
| Marketing surfaces, app surfaces, components, tokens, motion, drift audits, critiques | `memory/design/MEMORY.md` + `docs/design-agents.md` |

Skills live under `.claude/skills/` (design-surface, design-component, design-token, design-motion, design-system-audit, design-critique). Autonomy level 2 across the board — design skills produce specs, proposals, audits, critiques; they do not directly edit production code.

### Compliance & Risk managed-agent system — `memory/compliance-risk/` + `.claude/skills/`

| When working on... | Read |
|--------------------|------|
| Claim review, legal pages, platform-policy alignment, security-claim audits, regulatory change, user disclosure | `memory/compliance-risk/MEMORY.md` + `docs/compliance-risk-agents.md` |

Skills live under `.claude/skills/` (claim-review, legal-page-draft, policy-alignment, security-claim-audit, regulatory-change-response). Autonomy level 2 for review skills; **level 1** for legal drafting or sensitive policy edits.

### Growth & Distribution managed-agent system — `memory/growth/` + `.claude/skills/`

| When working on... | Read |
|--------------------|------|
| Grants, integrations, listings, partnerships, sponsorships, open-source community | `memory/growth/MEMORY.md` + `docs/growth-agents.md` |

Skills live under `.claude/skills/` (grant-application, integration-proposal, listing-submission, partnership-brief, sponsorship-brief, open-source-program-run). Autonomy level 2 — drafts and proposals only. User submits, sends, funds, or merges.

### Data & Intelligence managed-agent system — `memory/data-intelligence/` + `.claude/skills/`

| When working on... | Read |
|--------------------|------|
| KPI definitions, weekly metrics briefs, experiments, funnel analyses, cohort retention | `memory/data-intelligence/MEMORY.md` + `docs/data-intelligence-agents.md` |

Skills live under `.claude/skills/` (define-metric, weekly-metrics-brief, experiment-design, experiment-readout, funnel-analysis, cohort-retention). Autonomy level 2 — read-only against exports; briefs, specs, and analysis only.

### Admin / Operations managed-agent system — `memory/admin-ops/` + `.claude/skills/`

| When working on... | Read |
|--------------------|------|
| Support triage, docs coherence, finance snapshots, vendor review, internal coordination, incident post-mortems | `memory/admin-ops/MEMORY.md` + `docs/admin-ops-agents.md` |

Skills live under `.claude/skills/` (support-triage, docs-coherence-audit, finance-snapshot, vendor-review, incident-postmortem, internal-coordination-brief). Autonomy level 2 — briefs, audits, snapshots, reviews, post-mortems.

## The four workflow rules (full text in `memory/PROCESS.md`)

1. **Plan first.** Outline files, approach, steps before writing code.
2. **600-line limit.** No file over 600 lines. Split if needed.
3. **Conserve tokens.** Terse. No re-reads. Batch independent tool calls. Prefer `Edit` over `Write`.
4. **Convene the Standing Council.** Reason through every non-trivial change through the relevant lenses.

## Vetos (active on every change)

- Accessibility standards — WCAG AA, contrast, motion safety.
- Data protection and privacy language.
- Unsupported claims or exaggerated certainty.
- Unsafe production actions without approval.

## Changelog

- 2026-04-14: Rewritten as slim entry point. Project knowledge moved to `projects/<project-name>/`. Behaviour rules moved to `memory/`. Startup routine preserved at the top.
- 2026-04-16: Added Product & Engineering managed-agent system.
- 2026-04-16: Added Design managed-agent system.
- 2026-04-17: Added Compliance & Risk managed-agent system.
- 2026-04-17: Added Growth & Distribution managed-agent system.
- 2026-04-17: Added Data & Intelligence managed-agent system.
- 2026-04-17: Added Admin / Operations managed-agent system.
