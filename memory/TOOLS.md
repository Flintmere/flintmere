# TOOLS

How to use tooling on Flintmere work. Pairs with `.claude/settings.json` (the actual permission enforcement).

## TL;DR

Use dedicated tools, not `Bash`, for file operations. Batch independent tool calls. Respect the permission tiers — Tier 1 is auto-allowed, Tier 2 prompts, Tier 3 is denied.

## Dedicated tools first

| Task | Tool (not Bash) |
|---|---|
| Read a file | `Read` (not `cat`/`head`/`tail`/`sed`) |
| Edit a file | `Edit` (not `sed`/`awk`) |
| Create a file | `Write` (not heredoc / `echo >`) |
| Find files by name | `Glob` (not `find`/`ls`) |
| Search file contents | `Grep` (not `grep`/`rg`) |

Reserve `Bash` for shell-only operations (pnpm, git, prisma, curl, etc.).

## Parallelism

If multiple tool calls have no dependency on each other, batch them in one message. Sequential calls only when one call's output feeds the next.

Good pattern: on a survey task, batch 5 Reads + 2 Greps + 1 Glob in a single message. The user sees one round-trip, not eight.

Bad pattern: reading file A, then file B, then file C — one per message — when none depends on the others.

## Agents (subagents)

- `Agent` (general-purpose) — open-ended multi-step research or implementation.
- `Explore` — fast codebase search across multiple locations when direct `Glob` / `Grep` would take >3 tries.
- `Plan` — architecture planning before large implementations.
- `claude-code-guide` — questions about Claude Code, Agent SDK, Claude API.

When to spawn vs. direct tools:

- Simple, directed search (specific file, class, function) → `Glob` or `Grep` directly.
- Broader exploration / research → `Agent` with `Explore`.
- Parallel independent investigations → multiple agents in one message.
- Don't duplicate work: if you delegate to an agent, don't also run the same searches yourself.

Check for an existing or recent agent before spawning a new one. Continue via `SendMessage` where possible.

## Context7 MCP — for library / framework docs

The `plugin:context7:context7` MCP server is configured. Use it whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like Remix, Next.js, Prisma, Shopify, Tailwind, Vertex AI, BullMQ. Training data may not reflect recent versions.

Prefer `context7` over web search for library docs.

Don't use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Permission tiers (enforced by `.claude/settings.json`)

Commands are classified by **blast radius**, not by command name. Full spec in `memory/product-engineering/security-posture.md` §Permission tiers.

### Tier 1 — auto-allowed (reversible, local, recoverable)

- `pnpm install / dev / build / test / lint / typecheck` (any workspace)
- `prisma generate / migrate dev / migrate reset / studio` (dev-scoped)
- `git status / diff / log / show / add / commit / branch / checkout / switch / fetch / pull / push` (non-force)
- `gh pr / issue / repo / run` reads and creates
- `rm -rf` on build artifacts (`node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `.turbo/`, `.cache/`)
- Read-only `curl`, `ls`, `tree`, `wc`, `mkdir -p`, `cp -R`, `mv`

### Tier 2 — prompts

Any Bash command not on allow or deny list. User is asked to approve.

### Tier 3 — denied

- `git push --force` / `-f` / `--force-with-lease`
- `git reset --hard origin/*`, `git rebase -i`
- `prisma migrate deploy`, `prisma db push`, `prisma db execute`, `prisma migrate resolve` (prod-facing)
- `psql`, `pg_dump` (direct DB access)
- `stripe live *`, `stripe payments *`, `stripe charges *`
- `vercel *`
- `coolify deploy *--production*` / `--prod*`
- `rm -rf` on: `/*`, `*src/*`, `apps/*/src`, `packages/*/src`, `memory*`, `projects*`, `.claude*`
- `sudo`
- `curl * | sh` / `curl * | bash` / `wget * | sh`

## Git safety

- Never update git config.
- Never run destructive git commands (`push --force`, `reset --hard`, `checkout .`, `branch -D`) unless explicitly requested — and even then, pause and confirm.
- Never skip hooks (`--no-verify`) or signing (`--no-gpg-sign`) unless explicitly requested.
- Never force-push to `main`. Warn the user if asked.
- Prefer new commits over `--amend` unless the user explicitly asks.
- Stage specific files where possible. `git add -A` and `git add .` are fine when scope is understood.
- Never commit unless the operator explicitly asks.
- Commit messages: imperative present tense, ≤72 chars on first line, body explains *why*. Reference ADRs by number when relevant.

## Shopify CLI (shopify-app only)

- `pnpm -F shopify-app shopify app dev` — start dev server with Shopify tunnel
- `pnpm -F shopify-app shopify app config link` — link to a Shopify Partner app
- `pnpm -F shopify-app shopify app deploy` — deploy app version (Tier 2; operator confirms)

Never run `shopify app deploy` against a production app without an ADR or explicit operator instruction.

## Coolify

- `coolify logs` — read logs (auto-allowed)
- `coolify status` — check deploy state (auto-allowed)
- `coolify deploy` to staging — Tier 2, prompts
- `coolify deploy --production` — Tier 3, denied

## Managing the permission list

The allow/deny list in `.claude/settings.json` is living config. When a Tier 2 prompt fires repeatedly on a clearly-reversible command, add it to the allow list via the `fewer-permission-prompts` skill (or directly edit `.claude/settings.json` + the mirrored spec in `security-posture.md`).

Do not silently add destructive commands to the allow list to avoid prompts. The prompt is a feature, not a bug.

## Changelog

- 2026-04-19: Updated for Flintmere. Added Shopify CLI section, Coolify command policy, Context7 MCP pointer, tier-by-blast-radius permission spec. Cross-references `security-posture.md` for the authoritative command list.
