# open-source-program.md

Allowance Guard's open-source program — contribution process, CLA, PR triage, community governance. Owned by #2 Open source maintainer.

AG is **open-core**. The scanner + revocation UI + the core product is open source; the Pro / Sentinel / API tier infrastructure may run on closed layers. This file governs the **open-source part** of the product.

## Principles

- **Core tool: free and open source. Always.** The phrase in our voice memo is a commitment, not marketing.
- **Contributions welcome, not exploited.** Every contributor gets credit. No contribution is commercially appropriated in ways contributors didn't consent to.
- **License clarity.** Every package states its license. The license is enforceable in our jurisdictions.
- **CLA is not a weapon.** The Contributor License Agreement exists so we can (a) ship contributions in our commercial tier and (b) defend the project if needed. It is not a capture tool.
- **Responsive maintenance.** PRs get a first response within defined SLAs. Issues are triaged. A project that ignores contributions dies.
- **Security disclosure first.** Public vulnerability reports go dark until patched; see `SECURITY.md` + `memory/compliance-risk/incident-disclosure.md`.

## Licensing

- **Core packages:** <specify canonical license — verify in `LICENSE` file at repo root before committing to a public statement>.
- **API client / React package:** same unless otherwise stated in the package's own LICENSE.
- **Content under `memory/marketing/`:** not open source by default — internal strategy.
- **Documentation under `docs/`:** Creative Commons or equivalent — to be confirmed.

Every package has a `LICENSE` file. Before shipping any new package, #2 + #9 sign off on the license choice.

## Contributor License Agreement (CLA)

- **Purpose:** permit AG to use, sublicense, and distribute contributions; preserve the contributor's copyright.
- **Mechanism:** CLA-assistant style GitHub bot; DCO (Developer Certificate of Origin) as an alternative where preferred.
- **Threshold:** non-trivial contributions (typically >30 LOC or any architectural change) require CLA. Typo fixes do not.
- **CLA text:** lives at <path to CLA file — verify / create>.
- **Record-keeping:** CLA signatures archived; queryable.

#9 Lawyer reviews CLA text every 12 months or when law changes. #24 Data protection reviews personal-data handling in CLA records.

## Contribution process

### For new contributors

1. Read `CONTRIBUTING.md` (verify path — create if missing).
2. Open an issue describing the change (for non-trivial work).
3. Wait for label / triage (see SLA below).
4. Fork, branch, code.
5. Sign CLA if prompted.
6. Open PR. Link to issue.
7. Respond to review within 14 days, or PR may be closed (with re-open option).

### For issue reporters

1. Use the issue template.
2. For bug reports: reproduction steps are mandatory. See `memory/product-engineering/test-strategy.md`.
3. For security reports: do NOT open a public issue. Follow `SECURITY.md`.
4. For feature requests: explain the user problem, not just the proposed feature.

### Labels (GitHub)

- `bug`, `feature`, `docs`, `security`, `performance`, `a11y` — topic.
- `good-first-issue`, `help-wanted`, `needs-repro`, `needs-review`, `blocked` — workflow.
- `tier:core`, `tier:api-client`, `tier:react`, `tier:docs` — area.
- `priority:p0`, `p1`, `p2`, `p3` — severity.

## PR triage SLAs

These are commitments. Measured openly; missed SLAs discussed in retrospectives.

| Event | SLA |
|-------|-----|
| First response on a new PR | 5 business days |
| First response on a new issue | 5 business days |
| Review round on a responded PR | 5 business days |
| Security report acknowledgement | 2 business days |
| Security report triage | 5 business days |
| Merge or final decline on a ready-to-merge PR | 10 business days |

A "first response" is a human labelling + initial review / question, not a bot auto-comment.

## Governance

- **Maintainers:** list in `MAINTAINERS.md` (verify / create).
- **Decision-making:** maintainers by consensus; AG founders hold final veto on strategic direction. Consensus failures escalate to a documented tie-breaker.
- **Adding maintainers:** nomination from an existing maintainer after sustained contribution (typically 6+ months, 20+ merged PRs, trusted review history).
- **Removing maintainers:** documented cause; rare.
- **Code of conduct:** `CODE_OF_CONDUCT.md` (verify / create) — based on Contributor Covenant. Enforcement process documented.

## Roadmap transparency

- Public issues + labelled milestones tell contributors what's planned.
- Private roadmap items (Pro / Sentinel / API tier features) are not disclosed in the open repo.
- Major architectural decisions land as ADRs under `projects/allowanceguard/decisions/` when they affect the open-source part.

## Recognition

- Every merged PR gets the contributor's GitHub handle on the release notes.
- Significant contributors get a named entry in `CONTRIBUTORS.md`.
- "Significant" is judged qualitatively by maintainers; not a formula.

## Community spaces

- GitHub Issues + Discussions.
- Optional: Discord / Farcaster channel for live conversation (not a decision venue; decisions still happen in GitHub).
- AG team members identify themselves as such when participating.

## Code of Conduct enforcement

- Reports to a documented private email (`conduct@` or similar — verify).
- Escalation path: maintainer → founder → #9 Lawyer if legal involvement required.
- Sanctions: warning → ban from repo → ban from community spaces. Proportionate.
- Every enforcement action recorded privately with date + reason. Retained for 3 years.

## Security disclosure (cross-reference)

See `SECURITY.md` and `memory/compliance-risk/incident-disclosure.md`. Short version:

- Reports to the documented disclosure address.
- Acknowledgement within 48 hours.
- Triage within 5 business days.
- Public disclosure coordinated after patch + user notification.

## What this program deliberately does not do

- No "open source as marketing" — we don't open source work we can't actually maintain.
- No soliciting contributions only to ignore them.
- No rug-pulling license changes to proprietary without contributor notice + transition plan (BSL-style transitions are controversial and require #9 + Legal Council review).
- No "core team only" guarded areas with no explanation.

## Commercial boundaries

- Contributions to the open-source core may be used in Pro / Sentinel / API tiers under the CLA license grant.
- AG does not sell contributor identities or attributions.
- AG does not take credit for contributors' work in marketing without naming them (with consent).

## Metrics we track

- PR first-response latency (p50 + p95).
- Issue triage latency.
- Release cadence.
- CLA signatures.
- Recognition count.
- Community health signals (active contributors, retention of contributors, civil discourse level).

These roll into `grants-history.md` narratives (ecosystem grants often ask) and into `partnerships-history.md` where community health is a partnership value.

## How this file is maintained

- Update when the license changes, a maintainer is added / removed, the CoC is enforced, or SLAs are adjusted.
- Every material change reviewed by #2 + #9.
- Never update to walk back a commitment quietly. Document the reason for any relaxed standard.
