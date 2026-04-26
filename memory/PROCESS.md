# PROCESS

## TL;DR

1. **Plan first.** Outline files, approach, steps before writing code.
2. **600-line limit.** No single code or HTML file over 600 lines. Split if needed.
3. **Conserve tokens.** Terse. No re-reads. No restating. Batch independent tool calls. Prefer `Edit` over `Write`.
4. **Convene the Standing Council.** Reason through every non-trivial change through the relevant members' lenses.

## Workflow Rules (expanded)

### 1. Plan first
Before making any code changes, outline a plan: identify affected files, describe the approach, list the steps. Only start implementation after the plan is clear. For large tasks use `TodoWrite` to track progress.

### 2. 600-line limit
Do not exceed 600 lines in any single code or HTML file. If a file would exceed this limit, split it into multiple files or modular parts. This limit also applies to files in `memory/` and `projects/`.

### 3. Conserve tokens
- Don't re-read files you've already read in the session.
- Don't restate what the user said.
- Don't pad responses with explanations the user didn't ask for.
- Batch independent tool calls in a single message.
- Prefer surgical `Edit`s over full-file `Write`s.
- Skip exploratory searches when the path is already known.

### 4. Convene the Standing Council
Any non-trivial change — code, copy, documentation, architecture, naming, APIs, schemas, infrastructure — must be informed by the relevant Standing Council members. You do not need to literally roleplay each member, but you must reason through the change as if each relevant member has reviewed it.

If a domain isn't represented (e.g. regulatory area not covered, or shipping in a language with no expert), **add a new council member** rather than skip the perspective. The minimum council size is 17; new specialists can be added when needed but never removed.

## Standing Council

| # | Role | Domain of authority |
|---|------|---------------------|
| 1 | Editor-in-chief / technical writer | Structure, tone, density, narrative flow |
| 2 | Open source maintainer | Contribution pathways, licensing, community health, CLA |
| 3 | Web3 / DeFi domain expert | Token approvals, ERC-20/721/1155, Permit2, EIP-712, chain accuracy |
| 4 | Security engineer | Threat model, disclosure policy, key handling, CSP, secrets, auth |
| 5 | Product marketing | Positioning, tier story, value proposition, segment messaging |
| 6 | B2B / API economy expert | Developer onboarding, OpenAPI, SDK ergonomics, key tiers |
| 7 | Visual designer | Hierarchy, badges, screenshots, Ledger aesthetic canon (homepage), glass canon (dashboard/docs), Five Laws |
| 8 | Accessibility specialist (**veto power**) | WCAG AA compliance, semantic structure, contrast, motion safety |
| 9 | Lawyer / compliance counsel | License accuracy, no false promises, securities exposure, GDPR |
| 10 | DevOps / SRE | Deployment, observability, env vars, rollout safety, incident response |
| 11 | Investor / founder voice | Fundability signal, banned-phrases purge, commercial intent |
| 12 | Ecosystem strategist | Competitive positioning, partnerships, distribution channels |
| 13 | UX writer | Microcopy, copy-pasteable quickstarts, error messages |
| 14 | DX engineer | Working code samples, install ergonomics, package taxonomy |
| 15 | Staff engineer / architect | Code design, scalability, tech-debt management, abstractions |
| 16 | QA / test engineer | Coverage, regressions, edge cases, test pyramid |
| 17 | Performance engineer | Bundle size, Core Web Vitals, runtime cost, Lighthouse |
| 18 | Database engineer / DBA | Migration safety, query plans, locks, index strategy |
| 19 | Privacy / GDPR specialist | Data handling, retention, user rights, cross-border transfer |
| 20 | Brand copywriter | Voice, tone, narrative arc, headline craft, emotional resonance |
| 21 | Technical copywriter | Accuracy of claims, precision in feature descriptions, no hand-waving |
| 22 | Conversion copywriter | CTA copy, landing page persuasion, objection handling, urgency without hype |
| 23 | Regulatory / compliance counsel | Securities law, AML/KYC exposure, advertising standards, jurisdictional risk |
| 24 | Data protection / privacy lawyer | GDPR Article-level accuracy, cookie consent language, DPA enforceability, cross-border transfer mechanisms |
| 25 | AI image director | Prompt engineering for image generation — model selection, style consistency, negative prompts, composition, aspect ratios, output quality |
| 26 | Visual brand photographer | Image-text coherence, editorial photography direction, colour grading to match design system, crop/composition for card layouts |
| 27 | Senior prompt engineer (photorealism) | Concrete subject matter, composition rules, lighting direction, camera angle, depth of field. Anti-pattern: abstract concept soup |
| 28 | Senior prompt engineer (brand systems) | Prompt-to-brand consistency, colour palette enforcement through prompt language, series cohesion across multiple generations |
| 29 | Art Director | Series cohesion across generated image sets. Enforces consistent background temperature, object materiality, lighting direction, and colour grade. Rejects any image that breaks the set. |
| 30 | Payment systems engineer | Stripe, Coinbase, crypto payment gateways, PCI compliance, webhook reliability, subscription lifecycle |
| 31 | Crypto payments specialist | On-chain payments, stablecoin checkout, Coinbase Commerce/Business APIs, Base L2 payments, USDC flows |
| 32 | Blockchain engineer (EVM) | Viem/ethers.js, RPC providers, multicall, ERC-20 approve/transferFrom, token approval indexing, chain-specific quirks |
| 33 | Backend engineer (Node.js/Next.js) | API routes, job queues, database queries, caching, error handling, Neon serverless, Drizzle ORM |
| 34 | Full-stack debugging engineer | End-to-end request tracing, RPC failure modes, timeout handling, error propagation, logging, production debugging |
| 35 | Product analyst | Evidence-first metrics, experiment rigor, funnel analysis, hypothesis/result discipline, aggregated-only data handling |
| 36 | Operations manager | Support triage, docs coherence, finance snapshots, vendor review, internal coordination, incident post-mortems |
| 37 | Consumer psychologist / decision scientist (**veto power on customer-facing language**) | Reading comprehension under skim, cognitive load, objection anatomy, loss-aversion framing, identity activation, status-signal vocabulary, plain-language testing (target Flesch-Kincaid ≤ grade 8 for marketing prose, ≤ grade 10 for technical copy), jargon detection from the buyer's perspective (not ours). Reviews every merchant-facing sentence: "would a non-technical Shopify founder reading this on a phone between meetings get it on one pass?" If no, rewrite. |
| 38 | Data intake engineer (**veto power on data-acquisition endpoints**) | Seed-list strategy when primary scan paths fail; data-source ethics + kindness contract (respectful crawling cadence, robots.txt honour, opt-out pathways); bot-blocked TAM mitigation; alternative ingestion routes (CSV, embedded app, partner feed); seed-list quality vs scale tradeoffs |
| 39 | Regulatory affairs (vertical taxonomy maintenance) (**veto power on standards publication accuracy**) | FSA Big-14 + EU FIC 1169/2011 + EU Cosmetic Regulation 1223/2009 + textile/apparel labelling rules + PDO/PGI registry tracking; ISO 3166-1 amendments; certifications taxonomy (Soil Association, Red Tractor, Fairtrade, Leaping Bunny, etc.); quarterly standard diff authoring with regulatory citations; merchant-facing regulatory question support; stale-data exposure prevention on `standards.flintmere.com` |

## Sub-councils

Specialist groups convened **in addition to** the Standing Council for their domain.

- **Design Council (6)** — Maren (Visual), Idris (Motion), Sable (UX), Kael (Systems), Noor (Accessibility, **veto power**), Thane (Performance). Convened for visual / motion / system design work as documented in the redesign specs in `docs/`.
- **Copy Council (4)** — #20 Brand, #21 Technical, #22 Conversion, #37 Consumer psychologist. Convened for any user-facing copy: marketing pages, legal pages, emails, microcopy, blog posts. Every sentence must survive all four lenses: does it sound right (#20), is it accurate (#21), does it move the reader (#22), will the reader **understand it on first skim** (#37)? #37 holds veto on language that fails plain-language + jargon tests.
- **Legal Council (3)** — #9 Lawyer/compliance, #23 Regulatory, #24 Data protection. Convened for legal pages, privacy policy, terms, DPA, consent copy, and any claim that could create liability. #24 has **veto power** on privacy/consent language.

## Rules of operation

1. The council is consulted in spirit, not in literal roleplay. You reason through the change as the relevant members would.
2. The Accessibility specialist (#8) and the Design Council's Noor both hold a **veto** on anything that would degrade WCAG AA compliance, semantic structure, contrast, or motion safety.
3. The Investor / founder voice (#11) is the gatekeeper for the banned-phrases list (see `memory/VOICE.md`). Any copy that fails their review must be revised before shipping.
4. The Data protection lawyer (#24) holds a **veto** on privacy policy, consent copy, and data handling language. No privacy-related copy ships without their sign-off.
5. Adding a new council member is allowed and encouraged when a domain isn't represented. Removing a member is not.
6. The minimum council size is 17. The current size is 39.
7. Sub-councils do not replace the Standing Council. The Design, Copy, and Legal Councils operate *in addition to* it for their domains.

## Logging discipline

Infrastructure changes (Coolify, DNS, Stripe, Vertex, Resend, BetterStack, OpenAI, Shopify Partner, etc.) live outside the repo by default — third-party dashboards. Without discipline, the next session's Claude has no way to know what's provisioned. Four rules:

1. **Same-session Changelog entry** in `projects/flintmere/STATUS.md` — one line per infra event, prefixed with surface (`Coolify:` / `DNS:` / `Stripe:` …), with timestamp, action, object, result. Cross-reference commit SHA when applicable; `(no SHA, dashboard-only)` when not.
2. **Update `## Infra state`** at the top of `STATUS.md` whenever a status flips (✅ live / ⏸ pending / ⚠️ degraded). It is the at-a-glance "is this provisioned?" answer for every external dependency.
3. **Never log secret values.** State entries reference env-var names ("captured in Coolify dashboard"), never values. Applies to Postgres URLs (contain passwords), API keys, service-account JSON, encryption keys, signing secrets.
4. **Session-start ritual** for any infra-touching task: read `STATUS.md` `## Infra state` first, before reasoning about next steps.

The four-file separation (do not collapse): state (`STATUS.md`) ≠ runbook (`projects/flintmere/OPERATOR-TASKS.md`) ≠ decision log (`projects/flintmere/decisions/`) ≠ code events (`git log`). Each file answers one question. Mixing roles produces a mega-document no one maintains.

## Architectural escalation

Structural changes accumulate silently when no one is looking. Three rules to keep the codebase coherent without inviting an audit-skill backlog:

1. **Every package extraction or cross-app primitive movement triggers a `code-reviewer` agent pass before commit.** Phase A (`@flintmere/ui` extraction) is the canonical pattern. Don't ship the extraction on the same commit unreviewed.
2. **Every architectural decision with a 1-day-or-greater blast radius lands as an ADR.** Examples that count: choosing standalone-vs-colocated app (ADR 0018 standards subdomain), package factoring (next: any split of `packages/scoring` into rules vs core), choosing a state container, retiring a primitive. Examples that don't: renaming a function, moving a file within an existing package, fixing a bug.
3. **The "second consumer = extract" trigger is binding** (per `memory/design/components.md`). When a primitive is needed by a second app/route, extract first, then implement the second consumer. Never copy-paste between apps; the copy will diverge and the divergence will become a bug.

These three rules replace a recurring `improve-codebase-architecture` audit skill. Reactive structural discipline at the moment a change is made beats a proactive periodic audit that produces a backlog faster than the operator can act on it. Re-evaluate the recurring-audit posture at: post-strategic-gate (2026-10-26), first dedicated engineer hire, or LOC > 50k — whichever first.

## Changelog

- 2026-04-14: Split from `CLAUDE.md`. No content change.
- 2026-04-14: Added council members #32 Blockchain engineer (EVM), #33 Backend engineer (Node.js/Next.js), #34 Full-stack debugging engineer. Current size: 34. (Merged from main commit `31e6556`.)
- 2026-04-16: Added #35 Product analyst and #36 Operations manager. Current size: 36. Added for pilot of data-intelligence and admin-ops departments; council members ship before the departments they own.
- 2026-04-25: Added `## Logging discipline` section. Council convened (#10, #15, #11, #4, #34, #35, #36, #1) after operator question "why has none of our progress being logged" — gap was that third-party infra state (Coolify, DNS, Stripe, Vertex, Resend, BetterStack) lives outside the repo and had no canonical home. Codifies four rules (same-session Changelog entry, Infra-state checklist update, never-log-secrets, session-start read-state-first) + the four-file separation (STATUS / OPERATOR-TASKS / decisions / git log) as a "do not collapse" invariant. STATUS.md gained `## Infra state` section; OPERATOR-TASKS.md `Current state` block deduped to a pointer. No automation built — volume (1–3 events/week) doesn't justify hooks; revisit if discipline slips.
- 2026-04-26: Added council members #38 Data intake engineer (veto on data-acquisition endpoints — sync from MEMORY.md, seat already operator-confirmed but absent from this file) and #39 Regulatory affairs (veto on standards publication accuracy — operator-confirmed during ratification of `projects/flintmere/strategy/2026-04-26-final-report.md`, owns FSA + EU + PDO + certifications taxonomy maintenance for `standards.flintmere.com`). Current size: 39. Council convened (#1, #5, #11, #12, #15, #22, #23, #27-proposed-finance, #35, #36, #37, #39, plus Copy/Legal sub-councils) on the strategy report itself; Q2 (subdomain), Q5 (price-on-enquiry), Q6 (seat #39) operator-confirmed; Q1 (pricing magnitudes) and Q3 (cadence + FTE) council-decided per `projects/flintmere/strategy/2026-04-26-final-report-council-review.md` decisions log.
