# memory/ — Index

Global rules about how Claude operates, independent of any specific project.

| File | Purpose |
|------|---------|
| `VOICE.md` | Tone, banned phrases, how we write |
| `PROCESS.md` | Workflow rules, Standing Council, sub-councils |
| `OUTPUT.md` | Code conventions, file naming, commit style |
| `TOOLS.md` | Which tool to use for which task |
| `CONSTRAINTS.md` | Hard "Do Not" rules |
| `CORRECTIONS.md` | Lessons from past mistakes. Append-only. |

Maintenance rules live at the bottom of this file — read them before editing any memory file.

## Scoped memory

- `memory/marketing/` — marketing managed-agent system memory. Loaded only when a marketing skill is active. See `memory/marketing/MEMORY.md` for the index. Sits under the global rules in this directory; does not replace them.

## Load order

`CLAUDE.md` is loaded on every session. Files here are loaded **on demand** when the task enters their domain. Do not read all of them upfront.

## Precedence

See `CLAUDE.md` for the global precedence rule. Memory files are global defaults. Project files in `projects/<name>/` override memory files. Current-turn user instructions override everything.

## Maintenance rules

When the user corrects you, clarifies a preference, or you learn something worth keeping, update the relevant file here.

### Replace over accumulate

When a rule, preference, or fact changes: **update the existing entry in place**. Do not append new information underneath outdated information. These files should always reflect the latest accurate state, not a historical pile of contradictions.

If a rule is superseded:
- Replace the rule in its canonical home (e.g. `VOICE.md`, `OUTPUT.md`).
- Add a one-line note to that file's `## Changelog` (with the date).
- If the lesson came from a mistake, log it first in `CORRECTIONS.md`, then fold it into the canonical home when the rule stabilises.

### Write for reuse

Entries should be: clear, concise, specific, easy to apply in a future task. Avoid vague notes that will be useless later.

### Keep CLAUDE.md thin

`CLAUDE.md` is the entry point. Rules and content belong in `memory/` or `projects/`. If you're tempted to add a rule to `CLAUDE.md`, the right move is almost always to add it to the correct memory file and update the load map in `CLAUDE.md` if needed.
