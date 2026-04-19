# TOOLS

## TL;DR

Use dedicated tools, not Bash, for file operations.

| Task | Tool |
|------|------|
| Read a file | `Read` (not `cat`/`head`/`tail`/`sed`) |
| Edit a file | `Edit` (not `sed`/`awk`) |
| Create a file | `Write` (not heredoc / `echo >`) |
| Find files by name | `Glob` (not `find`/`ls`) |
| Search file contents | `Grep` (not `grep`/`rg`) |

Reserve `Bash` for system commands and terminal operations that require shell execution.

## Parallelism

If multiple tool calls have no dependency on each other, batch them in one message. Sequential calls only when one call's output feeds the next.

## Agents

- `Agent` (general-purpose) — open-ended multi-step tasks.
- `Explore` — fast codebase search across multiple locations. Use when direct `Grep`/`Glob` would take >3 tries.
- `Plan` — architecture planning agent. Use before large implementations.
- `claude-code-guide` — questions about Claude Code, Agent SDK, Claude API.

Check for existing/recent agent before spawning a new one. Continue via `SendMessage` where possible.

## When to use agents vs. direct tools

- Simple, directed search (specific file/class/function) → `Glob` or `Grep` directly.
- Broader exploration or research → `Agent` with `Explore`.
- Parallel independent queries → multiple agents in one message.
- Don't duplicate work: if you delegate to an agent, don't also run the same searches yourself.

## Git safety

- Never update git config.
- Never run destructive git commands (`push --force`, `reset --hard`, `checkout .`, `branch -D`) without explicit user request.
- Never skip hooks (`--no-verify`) or signing (`--no-gpg-sign`) unless explicitly requested.
- Never force-push to main/master. Warn the user if requested.
- Prefer new commits over `--amend` unless the user explicitly asks to amend.
- Stage specific files. Avoid `git add -A` / `git add .`.
- Never commit unless explicitly asked.

## Changelog

- 2026-04-14: Split from `CLAUDE.md`.
