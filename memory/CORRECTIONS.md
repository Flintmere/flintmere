# CORRECTIONS

Append-only log of lessons from mistakes. When a rule here conflicts with a rule elsewhere, this file wins until the conflict is resolved in the canonical location.

## Format

```
## YYYY-MM-DD — Short title

**What happened:** one-paragraph description of the mistake.
**Root cause:** why it happened.
**Rule going forward:** the new rule, in imperative mood.
**Canonical home:** which other file this rule belongs in long-term (move it there and shorten this entry to a pointer).
```

## Entries

## 2026-07-04 — Social captions ship with paragraph spacing, never a dense block

**What happened:** the first pipeline-published X post (`still_listed`, tweet `2073410893656756386`) ran its 259-char caption as one unbroken block, while the operator's manual `gtin_truth` post the same morning set the house style: hook, blank line, body, blank line, CTA. Operator flagged it ("spacing needs to reflect the post that was first").
**Root cause:** the caption was drafted against the 280-char cap and the banned-phrase list but no formatting rule existed; the queue pipeline preserves `\n` verbatim, so the omission was authorial, not technical.
**Rule going forward:** multi-beat X/Bluesky captions carry blank-line paragraph breaks (hook / body / CTA). Never ship a single dense block. The newline characters count toward the 280 cap — budget for them.
**Canonical home:** `.claude/skills/social/SKILL.md` (rule added there same day; this entry becomes a pointer once VOICE.md picks it up).

## Changelog

- 2026-04-14: File created as part of `CLAUDE.md` refactor.
