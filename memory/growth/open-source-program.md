# open-source-program.md

Flintmere is **closed-source commercial software at launch.** This file governs the posture toward open source + the criteria under which we might selectively open-source specific packages.

Owned by **#2 Open source maintainer** + operator. Reviewed jointly by #9 Lawyer when license questions arise.

## Current posture

- **Closed source by default.** All code in `apps/`, `packages/`, and supporting infrastructure is proprietary.
- **Licensing**: `UNLICENSED` in root `package.json` until we commit to an explicit license.
- **Contributions**: no public contributor pathway at launch. No open GitHub issues for contributions. No CLA required because nothing is taken.
- **Public artefacts**: the scanner UI, marketing pages, documentation, and research reports are public-facing products but **not** open source.

This stance is deliberate. Shopify app businesses where the scoring engine is the durable asset (per SPEC §11.1 moat) benefit from keeping that asset proprietary. Open-sourcing `packages/scoring/` would enable immediate commodification.

## What might open source in the future

Specific packages where open-sourcing would be strategically beneficial (revisit month 12+):

### `packages/scoring` (scoring engine)

- **Case for open-sourcing**: builds ecosystem goodwill; invites research community contributions; signals confidence in product beyond the scoring math.
- **Case against**: the scoring algorithm IS the moat. Competitors could fork, tune against our benchmarks, and commodify us.
- **Likely posture**: keep closed. Consider publishing a **specification document** (non-code) at month 12+ if we want to invite ecosystem alignment.

### `packages/llm` (LLM provider abstraction)

- **Case for open-sourcing**: generic utility; no Flintmere-specific IP; could be a modest community-building artefact.
- **Case against**: none material.
- **Likely posture**: viable candidate for MIT-licensing at month 6+ once stable. Not a priority.

### Shopify app boilerplate / Dockerfile templates

- **Case for open-sourcing**: helps the broader Shopify app community; credits us as authors.
- **Case against**: none.
- **Likely posture**: viable for MIT-licensing. Extract as `@flintmere/shopify-coolify-starter` if we do.

### Scanner UI components (non-core)

- **Case for**: demos our design system; developer-evangelism.
- **Case against**: gives competitors the legibility-bracket signature components.
- **Likely posture**: **never open-source anything carrying the bracket signature.** The signature is brand, not boilerplate.

## If / when we open-source

Whenever a package moves from closed to open:

1. **ADR** — `projects/flintmere/decisions/NNNN-open-source-<package>.md`. Context, rationale, competitive analysis, license choice.
2. **License**: MIT preferred for utility packages, Apache-2.0 if patent protection matters, AGPL **never** (alienates commercial adopters), proprietary with source-visibility if we want a "source-available" model (not open source).
3. **CLA**: CLA-assistant bot + DCO alternative. Threshold: non-trivial contributions (>30 LOC or any architectural change). Typo fixes don't need CLA.
4. **CLA text** reviewed by #9 Lawyer; approved CLA lives at `CLA.md` at repo root.
5. **Contribution process** — `CONTRIBUTING.md` documents the flow.
6. **Code of conduct** — `CODE_OF_CONDUCT.md`, based on Contributor Covenant.
7. **Security disclosure** — cross-reference `SECURITY.md`.

## Community spaces (if we open up)

- **GitHub Issues + Discussions** — primary.
- **Discord / Slack** — optional secondary. Not a decision venue; decisions happen in GitHub.
- Flintmere team members identify themselves as such when participating.

## PR triage SLAs (if contributions are accepted)

These would be commitments. Measured openly.

| Event | SLA |
|---|---|
| First response on a new PR | 5 business days |
| First response on a new issue | 5 business days |
| Review round on a responded PR | 5 business days |
| Security report acknowledgement | 2 business days |
| Security report triage | 5 business days |
| Merge or final decline on a ready-to-merge PR | 10 business days |

A "first response" is a human labelling + initial review or question, not a bot auto-comment.

## Licensing principles (if we ever go open)

- **License clarity.** Every package states its license at the file tree root.
- **CLA is not a weapon.** Exists to let us ship contributions in our commercial tiers and defend the project. Not a capture tool.
- **No rug-pulling.** License changes from permissive → proprietary require contributor notice + transition plan + Legal Council review. Avoid BSL-style transitions; they are controversial.
- **No "open source as marketing."** Don't open-source what we can't maintain.

## Governance (if we ever go open)

- **Maintainers**: list in `MAINTAINERS.md`. Add via nomination from existing maintainer after sustained contribution.
- **Decision-making**: maintainers by consensus; founders hold final veto on strategic direction.
- **Removing maintainers**: documented cause; rare.

## Security disclosure

See `SECURITY.md` at repo root. Applies whether or not code is open-source:

- Reports to `security@flintmere.com`.
- Acknowledgement within 48 hours.
- Triage within 5 business days.
- Public disclosure coordinated after patch + user notification.

## What this program deliberately does not do (current posture)

- **Does not ship unlabelled open source.** Every open file states a license.
- **Does not open-source the legibility-bracket signature** (brand, not boilerplate).
- **Does not solicit contributions to closed code.** If a community member writes code against our proprietary packages without our agreement, we do not accept it (potential licensing contamination).

## Open questions for the operator

- Do we publish a public CHANGELOG for the Shopify app? (Recommended: yes. Does not require open-source.)
- Do we publish an aggregated "State of AI Readiness" dataset? (Potential: aggregated CSVs under CC-BY license. Separate from code.)
- When do we commit to open-sourcing `packages/llm` and `@flintmere/shopify-coolify-starter`? Target: month 6+ if bandwidth allows.
- Do we ever publish the scoring specification (not code) as a community standard? Target: month 18+ once positioning established.

Answer when the moment calls for it; until then, closed by default.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Flipped posture from open-core (allowanceguard) to closed-source-by-default. Listed specific packages where open-sourcing might be strategic (with analysis of each). Removed CLA / CoC / contributor-process assumptions that only apply when code goes open.
