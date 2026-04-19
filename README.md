# claude-master-build-kit

A personal Claude Code starter kit. Ships with:

- `memory/` — behaviour rules for Claude (PROCESS, VOICE, OUTPUT, TOOLS, CONSTRAINTS, CORRECTIONS) + seven department memory kits (marketing, product-engineering, design, compliance-risk, growth, data-intelligence, admin-ops).
- `.claude/skills/` — 60+ skills wired to those departments.
- `CLAUDE.md` — load-map entry point.
- `projects/TEMPLATE/` — stub docs for a new product (PROJECT, ARCHITECTURE, DESIGN, BUSINESS, STATUS + ADRs).
- `projects/allowanceguard/` — kept as a reference example of what a fully filled-in project layer looks like. Delete it when you're comfortable.

## What this is, honestly

This kit is Allowance Guard-shaped scaffolding. The universal tier (PROCESS, VOICE, OUTPUT, TOOLS, CONSTRAINTS) applies anywhere, but the department kits and skills reference product concepts that made sense for a Web3 wallet-security product. **Fork-and-edit, not plug-and-play.** Over multiple projects the truly-universal parts will emerge naturally and can be factored out.

## Quick start

```bash
# From a fresh clone of this repo, in your new project root:
./init.sh --name mynewapp --display "My New App" --domain mynewapp.com
```

This:
- Renames `projects/TEMPLATE/` → `projects/mynewapp/`
- Replaces `{{PROJECT_NAME}}` / `{{PROJECT_DISPLAY_NAME}}` / `{{PROJECT_DOMAIN}}` in every memory + skill + CLAUDE.md file
- Leaves `projects/allowanceguard/` as a reference (feel free to `rm -rf` it)

Then:

1. Fill in `projects/mynewapp/{PROJECT,ARCHITECTURE,DESIGN,BUSINESS,STATUS}.md`.
2. Audit `.claude/skills/` and `memory/` for any leftover `allowanceguard` references. Sweep with `grep -rn allowanceguard memory/ .claude/skills/` and adapt or delete.
3. Open Claude Code in the directory. It reads `CLAUDE.md` first, which points at everything else.

## Structure

```
.
├── CLAUDE.md                 entry point, load-map
├── init.sh                   rename + sed bootstrap script
├── memory/
│   ├── PROCESS.md            workflow rules + Standing Council
│   ├── VOICE.md              tone, banned phrases
│   ├── OUTPUT.md             code conventions, scope discipline
│   ├── TOOLS.md              tool policy, git safety
│   ├── CONSTRAINTS.md        hard "do not" rules
│   ├── CORRECTIONS.md        append-only lessons
│   └── <department>/         marketing / design / product-engineering / …
├── .claude/
│   └── skills/
│       └── <skill>/SKILL.md  each skill, per-department or shared
└── projects/
    ├── TEMPLATE/             stub docs; renamed by init.sh
    └── allowanceguard/       reference example; safe to delete
```

## Departments

Each department has:
- A `memory/<dept>/MEMORY.md` index with standing rules
- A small set of scoped memory files (inventories, playbooks, registers)
- A set of skills under `.claude/skills/` that read from that memory when invoked

Departments included:
- **marketing** — content, SEO, social, outreach, analytics, imagery, conversion
- **product-engineering** — build-feature, fix-bug, migrations, chains, refactors, webhooks
- **design** — Ledger surfaces, components, tokens, motion, audits, critiques
- **compliance-risk** — claim review, legal pages, policy alignment, security audits
- **growth** — grants, integrations, listings, partnerships, sponsorships, OSS programs
- **data-intelligence** — KPIs, weekly briefs, experiments, funnels, cohort retention
- **admin-ops** — support triage, docs audits, finance snapshots, vendor review, incidents

If you don't need a department, delete its `memory/<dept>/` + matching skills. Nothing else depends on them.

## The Standing Council

`memory/PROCESS.md` lists a 36-member advisory council Claude reasons through on non-trivial changes. The members are product-neutral (editor-in-chief, staff engineer, DB engineer, security lead, investor voice, etc.). Keep, edit, or trim to your roster.

## Updating later

This is a fork-and-own kit, not a dependency. When the upstream (your main project's kit) evolves, you decide what to port back. Small and honest beats a brittle update mechanism.

## Companion skills (external)

Some skills reference external skill repositories (Impeccable's verb-family skills — `adapt`, `animate`, `arrange`, `audit`, `critique`, etc. — and Taste Skill's aesthetic skills). The versions those refer to are locked in `skills-lock.json`. They are NOT bundled (licensing + size). To install them alongside this kit, use your usual Claude Code skills-install workflow against that lock file.

The 50 skills that ARE bundled under `.claude/skills/` are the owned ones (project-specific departments: build-feature, fix-bug, design-system-audit, claim-review, grant-application, weekly-metrics-brief, support-triage, etc.). The kit is useful without the external companions; they just add reach.

## Not included

- `src/` — this kit is about *how Claude works*, not about your app code.
- `package.json`, build tooling, deployment config — bring your own.
- External companion skills — see above; install separately via `skills-lock.json`.
- Vendor credentials or secrets — never.

## License

Choose one when you publish. MIT is fine for most personal kits.
