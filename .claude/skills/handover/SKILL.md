---
name: handover
description: Produce a tight session hand-off artefact for Flintmere — shipped work, decisions made, open follow-ups, scheduled routines, memory candidates, honest risks. Use at session-close, before /clear, before handing the work to a colleague or future-self. Writes to context/summaries/<YYYY-MM-DD-HHMM>-<slug>.md by default for re-read after context clears. Surfaces memory candidates for operator approval; never auto-saves to memory. Trigger phrases include "/handover", "summarise", "recap", "wrap up", "before I clear", "what did we ship".
allowed-tools: Read, Write, Bash(git status:*), Bash(git log:*), Bash(git diff:*), Bash(git show:*), Bash(date:*), Bash(ls:*)
---

# handover

You produce the session-close artefact. The operator was there. They do not need a retelling. They need a thing they can paste into a PR, hand to a colleague, or read after `/clear` to pick up where they left off.

## What this skill is for

A hand-off artefact, not a what-we-talked-about essay. Verb-driven, evidence-grounded, pasteable. Tight enough to fit in a chat reply; the written file may carry the longer evidence (PR URLs, routine IDs, file lists).

## Workflow

Run in this order. Don't skip steps.

### 1. Ground the summary in evidence, not memory

```bash
git status --short
git log --oneline -10
git diff --stat origin/main...HEAD 2>/dev/null || git diff --stat HEAD~5...HEAD
date -u +%Y-%m-%dT%H:%M:%SZ
```

This is the floor. If the conversation says "we shipped X" but git doesn't, git wins.

### 2. Scan context/ for this session's writeups

```bash
ls -lt context/ context/design/ context/design/extravagant/ context/design/scroll-choreographies/ context/summaries/ 2>/dev/null | head -30
```

Anything written in the last few hours is in-scope. Reference these files by path — don't re-summarise their content into the chat (operator can read them).

### 3. Identify scheduled routines created this session

If a `/schedule` ran, capture the routine name + ID + fire time + URL. If unsure, ask the operator before guessing.

### 4. Draft the recap to the structure below

Required structure, in this order. Each section is a markdown header `##`. Skip a section only if it's genuinely empty (don't fill it with "n/a").

#### Shipped

- Files touched (count + line delta from `git diff --stat`).
- Commits made on this branch (one-line each, hash-prefixed).
- PRs opened (URL + state).
- Routines scheduled (URL + fire time UTC + local time London).

Format as bullets, terse. No prose paragraphs.

#### Decisions

What got chosen that wasn't obvious from the diff — canon shifts, mechanics picked, references chosen, things deliberately *not* done. One bullet each. Lead with the verb. Example:

- Folded /research's "headline finding" beat into the Saks Cover; dropped the "narrow band 47-50" sub-claim. Trade-off: cinema vs data specificity.
- Picked #4 + #8 paired for /bot Chapter 3 over solo #8; cinema upgrade.

#### Open follow-ups

Concrete next steps with owner + trigger. Format: `[owner: cadence/trigger] action`. Examples:

- `[scheduled: 21:00 UTC tonight]` cohort B routine fires; review per PR.
- `[operator: when ready]` authorise /pricing dispatch.
- `[Claude: next session]` verify routine output, restore "narrow band 47-50" beat on /research.

#### Memory candidates

Facts that should be saved as memory but **have not been auto-saved**. Each labelled with type (`feedback` / `project` / `reference` / `user`) + draft body + one-line rationale. The operator confirms which to save in a follow-up turn.

Format:

```
- type: feedback
  filename: feedback_<slug>.md
  body: |
    <one-paragraph rule>
    Why: <reason>
    How to apply: <when this kicks in>
  rationale: <why this is worth keeping vs ephemeral>
```

Skip this section if nothing genuinely transfers. Do not pad.

#### Risks / honest doubts

Tight. One line each. Things that might not have worked, things that might break, things you couldn't verify. No defensive hedging — only real concerns.

#### Pointers (file)

Paths to specs / plans / data files written this session. One line each. Operator re-reads from there, not from the recap.

### 5. Write the artefact to disk (default ON)

Default behaviour: write the recap to `context/summaries/<YYYY-MM-DD-HHMM>-<slug>.md` where:
- date is UTC.
- slug is a 2-3 word kebab-case description of the session's anchor work (e.g. `bot-redesign-and-cohort-b-schedule`).

Skip the write if the operator passes `--no-write` or says "just here, don't save."

The on-disk version may include longer evidence (full file lists, full PR bodies, full routine prompts) that would clutter the chat output. Use it as the authoritative record; chat output is the executive summary.

### 6. Output to chat

Output the recap in the chat too. Operator reads it there first, file second.

Target length: **200–400 words** in chat. The written file can run longer if evidence demands it.

End with one line: `Saved: context/summaries/<filename>.md` (or `Not saved (--no-write).`).

## Hard bans

- **No retelling of conversation flow.** "First we read X, then we discussed Y" — banned. Operator was there.
- **No re-quoting operator's instructions.** They said it; they remember.
- **No re-explaining canon, skills, references, or memories.** All repo-readable. Reference paths instead.
- **No auto-save to memory.** Memory candidates are *surfaced for approval*, never written silently. The operator decides what becomes a memory.
- **No commentary on Claude's reasoning.** Verb-driven, not narration.
- **No emojis** unless the operator has explicitly enabled them in this session.
- **No padding empty sections.** If "memory candidates" is empty, omit the header. Don't write "n/a" or "nothing to save."
- **No retelling routines that haven't fired.** State the schedule + URL; don't predict what the routine will produce.

## Memory rules (binding)

This skill **never auto-saves memories**. It **surfaces candidates** under the `## Memory candidates` section. The operator must explicitly say "save those" (or pick specific ones) for any write to `memory/` to happen — and that write happens via a separate turn, not inside this skill.

What qualifies as a memory candidate:
- A taste calibration the operator validated this session ("yes, that's the right move").
- A correction the operator gave that should not be re-learned next session.
- A pattern that emerged across multiple decisions in this session.
- A fact about external systems / external pages / non-obvious project state.

What does NOT qualify (don't even surface):
- This session's commit hashes / branch names / file paths (state).
- Project facts already in `CLAUDE.md` or `memory/`.
- Refresher of canon (tokens, references, mechanics).
- Anything Claude can re-derive by reading the repo next session.

## Length and tone

- Verb-driven. "Shipped X. Decided Y. Queued Z."
- Markdown headers + bullets. No prose blocks.
- Operator addressed in second person only when surfacing a question. Otherwise impersonal.
- Match the canon voice — neutral-bold, no banned phrases per `memory/VOICE.md`.

## Companion skills + patterns

- `/clear` — operator usually runs `/handover` then `/clear`. The artefact survives the clear.
- `/schedule` — if the recap surfaces a recurring follow-up, mention it as a `/schedule` candidate; do not auto-schedule.
- `design-critique` — if the session shipped a cinematic surface and the next step is operator review, mention design-critique as the next-session entry point.

## Example shape (illustrative, not a template to copy verbatim)

```
## Shipped
- 11 files modified (cohort A bg-paper batch). +14 −0 lines.
- /bot rebuilt: 1 orchestrator + 7 chapter components, 750 lines added, 150 removed. Type-check passes.
- 3 specs written to context/design/ (master plan + extravagant + scroll-choreography).
- Routine scheduled: trig_01ABCDEF (cohort B), fires 2026-04-30T21:00:00Z (22:00 London).

## Decisions
- Folded /research's headline-finding beat into the Saks Cover; dropped "narrow band 47-50" sub-claim.
- Picked #4+#8 paired for /bot Chapter 3 (live cascade); mirrors ManifestoChord pattern.
- Cohort B fires as specced (option 3): cinema risk acknowledged, review per-PR.

## Open follow-ups
- [scheduled: 21:00 UTC] cohort B routine fires; review each PR before merge.
- [Claude: next session] restore "narrow band 47-50" beat on /research.
- [operator: when ready] authorise /pricing dispatch.

## Memory candidates
- type: feedback
  filename: feedback_cinema_does_not_strip_data.md
  body: |
    Extravagant cinema applies to covers + chord moments; data tables stay dense.
    Why: /research's narrow-band-47-50 beat got cut under cinema; operator caught it.
    How to apply: when redesigning a data-rich surface, preserve every existing data point and add cinema only at cover + close.
  rationale: This taste calibration recurred across this session and would otherwise be re-learned.

## Risks
- Cohort B agent may compress 8-mistake lists into a scroll-walker; operator review is the gate.
- /bot Chapter 3 mock JSON line-wrap not yet verified at 1280/768/375; live test before claiming done.

## Pointers
- context/design/2026-04-30-flintmere-main-cinema-batch-plan.md
- context/design/extravagant/2026-04-30-bot-page-spec.md
- context/design/scroll-choreographies/2026-04-30-bot-page.md

Saved: context/summaries/2026-04-30-2030-bot-and-cohort-b.md
```

## Cross-references

- `CLAUDE.md` §auto memory — the rules this skill respects when surfacing candidates.
- `memory/VOICE.md` — banned phrases.
- `memory/PROCESS.md` — the four workflow rules + Standing Council.
