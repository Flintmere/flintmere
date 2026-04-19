# 0007 — Unified Ledger canon; retire Glass

**Status:** Accepted
**Date:** 2026-04-17
**Supersedes:** ADR 0005 (which explicitly preserved Glass on app surfaces)
**Council:** Design Council (Maren, Idris, Sable, Kael, Noor with veto, Thane), #7 Visual designer, operator

## Context

ADR 0005 (2026-04-14) adopted the Ledger aesthetic on marketing surfaces and deliberately left dashboard, docs, and account on the "Midnight Amber / Glass" canon. The reasoning at the time was "the app design works; don't fix what isn't broken" and "doubles the work to redesign everything."

In the three weeks since, that boundary has cost us more than it's saved:

1. **Drift at the boundary.** Ledger tokens leaked onto app surfaces because they're the more beautiful, more-recent-in-mind canon. The audit at `context/design/audits/2026-04-17-account-surface.md` found 150+ canon-crossing hits across `/account/**` — every page in scope used Ledger paper tokens on what DESIGN.md said should be Glass. Enforcing "never mix" across a split canon proved impossible in practice.

2. **Orphan scales accumulated.** Because neither canon owned app-surface chrome cleanly, legacy `primary-*` / `secondary-*` / `neutral-*` scales (from the old PuredgeOS system) filled the gaps. That's three scales competing for the same role — audit P0-2.

3. **Glass was already labelled "deprecated-but-active"** in `memory/design/tokens.md:81–83`, with "major overhauls deferred pending the app redesign." The app redesign kept getting deferred because ADR 0005 anchored it. Meanwhile Ledger shipped, stabilised, and proved strong enough to carry an entire product — not just a marketing site.

4. **The aesthetic holds up under app workloads.** `/account` rewrites done in the drifted-Ledger direction (before the audit re-canonicalised them to Glass) actually rendered well — the paper surface + ink text + amber-deep accent works for dashboards, tables, forms. The editorial restraint that makes Ledger good for marketing also makes it good for the focused, task-oriented app surfaces.

5. **Simpler system, lower maintenance.** One canon, one token ladder, one set of utilities, one contrast floor. Every new surface has a single home. Kael (Systems): the two-canon split was a standing source of drift; unifying removes an entire class of audit finding.

## Decision

**Ledger is the one canon for AllowanceGuard.** It applies to every surface: homepage, marketing pages, blog, docs, dashboard, account, auth flows, all authenticated pages, modals, toasts, and any surface we ship going forward.

**Glass / Midnight Amber is formally deprecated and removed:**

- `.glass-card`, `.glass-pill`, `.glass-button`, `.glass-drift` utilities in `src/app/globals.css` are deleted.
- `src/design/tokens.ts` (the Midnight Amber token source) is deleted.
- `tailwind.config.js` legacy scales authored for Midnight Amber (`primary`, `secondary`, `neutral`, `background`, `text` keys, `border` keys, `surface`) are retired after downstream consumers are migrated.
- `@tailwindcss/typography` custom theme `ink` (introduced for blog prose) remains — it is Ledger-aligned already.
- Semantic state ramps (`semantic-success-*`, `semantic-warning-*`, `semantic-error-*`, `semantic-info-*`), `crimson-*`, `amber-*`, `sky-*` remain as utility palettes — they're canon-agnostic state signalling, not competing surface systems.

## Changes to earlier canon rules

The following rules from ADR 0005 / DESIGN.md §Ledger Aesthetic change under this ADR:

- **"Never mix canons"** becomes **"One canon — Ledger — everywhere."** The split was the source of drift; unifying resolves it.
- **"The single inverse moment on the homepage is the CTABand"** becomes **"Inverse moments are purpose-scoped, not brand-scoped."** Homepage has the oxblood CTABand. Authenticated surfaces may have their own inverse moments where the function demands it — destructive-action confirms, critical error modals, single-revoke warnings. Each of these is itself "the one inverse moment for that purpose." No surface gets more than one; across the brand the rule is about restraint, not a literal count.
- **"Dashboard/docs/account remain on glass"** is reversed. All authenticated surfaces migrate to Ledger.

Rules from ADR 0005 that are preserved:

- No WebGL / Vanta on any surface. Thane's −180KB savings are permanent.
- Noor's accessibility floors on paper (ink-whisper = 5.18:1 on paper-deep, metadata only).
- Fraunces italic reserved for display/signature. IBM Plex Sans for body. JetBrains Mono for metadata.
- Protected crimson word moments (the homepage "approved." accent or equivalent).
- `prefers-reduced-motion` honoured on every animation.

## Consequences

**What we accept.**

- A multi-week migration across every authenticated surface (dashboard, `/account/**`, `/docs/**`, `/revoke`, `/team`, modals, toasts). Phase B of this ADR's rollout.
- Shared `ui/*` primitives (`Card`, `Modal`, `Alert`, `Badge`, `Input`, `Button`) need their `dark:` branches and Glass variants stripped. Not a refactor so much as a simplification.
- The `Card` primitive's `variant="glass"` and `variant="glass-accent"` options are deleted; consumers are migrated to `default` (Ledger).
- Apps running `@reown/appkit` modals / WalletConnect overlays will need their modal chrome checked — those render in iframes / portals that may have inherited Glass styles.
- The audit at `context/design/audits/2026-04-17-account-surface.md` is partially superseded: its P0-1 "canon crossing" finding is resolved by this ADR (the crossing isn't a violation anymore — it's correct). P0-2 (orphan `primary-*` scale) and P0-3 (raw greys) still stand and get fixed as part of Phase B. P1/P2 findings (raw `<button>` migrations, dark-variant stripping, non-functional hovers) still apply.
- The 10 files rewritten to Glass during the audit's immediate remediation (2026-04-17) revert to Ledger — losing the Glass output but keeping the structural fixes (raw-button migrations, stripped `dark:` variants, fixed non-functional hovers, removed `rounded-full` avatars).
- The `/blog/[slug]` prose fix (removing off-canon `.prose h2` / `.prose a` / `.prose blockquote` rules, adding Ledger-aligned `.prose blockquote` / `.prose pre` / `.prose ul li::marker`) is unaffected — it was already Ledger-aligned.

**What we gain.**

- One canon, one token ladder, one mental model. Every drift audit gets simpler: there's only one right answer.
- Deprecated-but-active code path closes — no more "glass is legacy but we still ship it" in `memory/design/tokens.md`.
- `src/app/globals.css` drops the Glass utility block (~50 lines of CSS).
- `src/design/tokens.ts` (243 lines) deletes entirely.
- `tailwind.config.js` can drop the Midnight Amber scales after consumer migration — shrinking the config and the generated CSS.
- Design system audits stop finding "canon-crossing" as their most common class of finding.
- Primitives simplify. Every `ui/*` component gets half its variant matrix back.

## Alternatives considered

- **Keep the two-canon split but enforce it harder.** Rejected: the audit proved enforcement fails at scale. Developers working on a single surface can't hold two canon models in their head; drift is a physics problem, not a discipline problem.
- **Migrate app surfaces to a new dark canon (e.g. refined Midnight Amber rather than deprecated Glass).** Rejected: doubles the work (design a new canon + implement it), and the signal from ADR 0005 + three weeks of drift is that *one canon is the right answer*, not *a better second canon*.
- **Keep Glass only for modals / overlays (hybrid).** Rejected by Kael: "one canon means one canon." A modal on a Ledger surface should itself be Ledger. The "inverse moment for purpose" rule gives us the dark/destructive treatment we need without a whole canon.
- **Make Ledger the unified canon but preserve Glass for an explicit "power user" theme toggle.** Rejected: AllowanceGuard doesn't need theme switching. No user has asked. Adds a permanent maintenance tax on every primitive.

## Rollout phases

- **Phase A (this ADR + DESIGN.md + memory rewrites).** The canon-law change. Read-only doc work.
- **Phase B.** Revert the 10 `/account/**` + embedded-component files from Glass to clean Ledger. Keeps all audit-driven P1/P2 structural fixes (raw-button migrations, stripped `dark:`, fixed hovers, `rounded-full` removal).
- **Phase C.** Strip `.glass-*` utilities from `src/app/globals.css`. Delete `src/design/tokens.ts`. Audit and prune `dark:` branches in `ui/*` primitives.
- **Phase D.** Sweep remaining authenticated surfaces (dashboard, docs app-side, `/revoke`, `/team`, auth flows) with `design-system-audit` and remediate to Ledger. Unbounded in scope; runs at operator pace.
- **Phase E.** Retire `primary-*`, `secondary-*`, `neutral-*`, `background-*`, `text-*`, `surface-*` legacy scales in `tailwind.config.js` once Phase D confirms no live consumers remain. Final simplification.

Phase B / C land in engineering via direct rewrites (the structural work is mechanical). Phase D lands via `design-system-audit` → `design-ledger-surface` (for surfaces that need a spec) → `build-feature`. Phase E is a find-and-replace with a migration commit per scale retired.
