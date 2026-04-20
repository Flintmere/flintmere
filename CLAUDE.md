# CLAUDE.md — Flintmere Entry Point

Behaviour rules and pointers for Claude working on Flintmere. This file is the load map. Project knowledge lives in `projects/flintmere/`. Global behaviour rules live in `memory/`.

## Startup routine

At the start of every session or task:

1. **Read this file first.** It's the load map.
2. **Read anything in `context/`** (gitignored). Current-task notes. If empty, skip.
3. **Load on demand.** Pull the `memory/` or `projects/flintmere/` files relevant to the task — not all of them. The tables below tell you what to read when.

Together: `context/` explains the present. `memory/` holds how Claude behaves. `projects/flintmere/` holds what we're building. Use all three to produce consistent, accurate work.

## Triage (which file does this belong in?)

- **How I work** → `memory/`
- **What I'm building** → `projects/flintmere/`
- **Right now** → `context/` (gitignored)
- **How Claude behaves on Flintmere specifically** → this file

## Precedence (highest → lowest)

1. User instruction in the current turn.
2. `context/` — active task notes.
3. `projects/flintmere/` — project-specific rules + ADRs.
4. `memory/` — global behaviour rules.
5. This file — defaults and load map.

Project-specific always beats global. Current turn always wins.

## Product snapshot (for every task)

Flintmere scores Shopify product catalogs for AI-agent readiness and fixes what's broken. Three surfaces:

- `flintmere.com` — marketing site
- `audit.flintmere.com` — public scanner (Next.js)
- `app.flintmere.com` — Shopify embedded app (Remix)

Target users: Shopify merchants (100–5,000 SKUs, £500K–£20M revenue) and agencies (5–50 client stores). Pricing: Free / Growth £49 / Scale £149 / Agency £399 / Enterprise £499+.

## The canon in one line

**Neutral-bold hybrid + the legibility bracket + Geist Sans + Geist Mono.** Warm near-white + near-black. Glowing Amber `#F8BF24` as portfolio signature (sole accent, all surfaces). Apple-bold structure. See `memory/design/tokens.md` for the authoritative statement, `decisions/0003` for the structural rationale, and `decisions/0007` for the amber + asymmetric-wordmark canon.

## The signature

Every Flintmere surface carries at least one `[ word ]` moment — key noun set in Geist Mono inside 1px ink hairline brackets. Product truth made typographic: agents extract tokens; the bracket shows the extraction. See `memory/design/tokens.md` §Signature.

## Load map (read on demand)

Do not read all of these on every session. Read the ones relevant to the task at hand.

### Global behaviour — `memory/`

| When working on... | Read |
|---|---|
| Anything non-trivial | `memory/PROCESS.md` (workflow rules + Standing Council) |
| User-facing copy | `memory/VOICE.md` (banned phrases, tone, bracket copy rule) |
| Writing / editing code | `memory/OUTPUT.md` (conventions, file naming, scope discipline) |
| Choosing a tool | `memory/TOOLS.md` (tool policy, permission tiers) |
| Before shipping anything | `memory/CONSTRAINTS.md` (hard "do not" rules) |
| Hit a lesson worth keeping | `memory/CORRECTIONS.md` (append-only) |

Index: `memory/README.md`.

### Project knowledge — `projects/flintmere/`

| When working on... | Read |
|---|---|
| Repo layout, tech stack, env vars, commands | `PROJECT.md` |
| API routes, DB schema, feature gates, integrations, data flow | `ARCHITECTURE.md` |
| Any UI surface (marketing, scanner, Shopify app) | `DESIGN.md` |
| Pricing, tiers, positioning, voice rules | `BUSINESS.md` |
| Current phase, shipped, next | `STATUS.md` |
| Original product + GTM intent | `SPEC.md` |
| "Why is it this way?" | `decisions/` (ADRs 0001–0006) |

### Design department — `memory/design/`

| When working on... | Read |
|---|---|
| Design tokens, canon, signature | `tokens.md` |
| Components, primitives, Shopify-app island rules | `components.md` |
| Accessibility floors, Noor's veto rules | `accessibility.md` |
| Motion, reduced-motion contract | `motion.md` |

Skills: `design-surface`, `design-component`, `design-token`, `design-motion`, `design-system-audit`, `design-critique`.

### Product & Engineering department — `memory/product-engineering/`

| When working on... | Read |
|---|---|
| File-level invariants (routes, data, auth, deps, naming) | `architecture-rules.md` |
| Shopify API work (bulk ops, webhooks, OAuth, rate limits) | `shopify-api-rules.md` |
| Security, secrets, HMAC, tokens, permission tiers | `security-posture.md` |
| Performance budgets, Core Web Vitals, Coolify variability | `performance-budget.md` |
| Tests (layers, coverage, philosophy) | `test-strategy.md` |
| Past incidents | `incident-history.md` (append-only) |

Skills: `build-feature`, `fix-bug`, `write-migration`, `debug-prod-incident`, `refactor-component`, `add-integration`, `implement-checkout-flow`, `webhook-review`.

### Marketing department — `memory/marketing/`

Content, SEO, social, outreach, imagery, conversion. See `memory/marketing/MEMORY.md` (index) and the individual files.

Skills: `market-research`, `positioning`, `content-strategy`, `writer`, `seo`, `social`, `outreach`, `conversion`, `analytics`, `campaign-manager`, `image-direction`, `web-implementation`.

### Compliance & Risk department — `memory/compliance-risk/`

Claim review, legal pages, platform policy, security claims, regulatory change, disclosure.

Skills: `claim-review`, `legal-page-draft`, `policy-alignment`, `security-claim-audit`, `regulatory-change-response`.

### Growth department — `memory/growth/`

Shopify ecosystem integrations, listings, partnerships, sponsorships, open-source program, agency program.

Skills: `grant-application`, `integration-proposal`, `listing-submission`, `partnership-brief`, `sponsorship-brief`, `open-source-program-run`.

### Data & Intelligence department — `memory/data-intelligence/`

KPIs, metric definitions, weekly briefs, experiments, funnels, cohorts.

Skills: `define-metric`, `weekly-metrics-brief`, `experiment-design`, `experiment-readout`, `funnel-analysis`, `cohort-retention`.

### Admin / Operations department — `memory/admin-ops/`

Support triage, docs audits, finance snapshots, vendor review, internal coordination, incident post-mortems.

Skills: `support-triage`, `docs-coherence-audit`, `finance-snapshot`, `vendor-review`, `incident-postmortem`, `internal-coordination-brief`.

## The four workflow rules (full text in `memory/PROCESS.md`)

1. **Plan first.** Outline files, approach, steps before writing code.
2. **600-line limit.** No file over 600 lines. Split by responsibility.
3. **Conserve tokens.** Terse. No re-reads. Batch independent tool calls. Prefer `Edit` over `Write` on existing files.
4. **Convene the Standing Council.** Reason through every non-trivial change through the relevant 36-member lenses.

## Active vetos

- **Noor (#8) — Accessibility.** WCAG AA, contrast, motion safety, semantic structure. See `memory/design/accessibility.md`.
- **#24 Data protection.** Privacy, consent, GDPR language. See `memory/CONSTRAINTS.md` and `memory/product-engineering/security-posture.md`.
- **#11 Investor / founder voice.** Banned phrases. See `memory/VOICE.md`.
- **Legal Council (#9 + #23 + #24).** Legal pages, claim review, platform policy. See `memory/compliance-risk/`.

## Surface-specific reminders

- **Marketing site**: zero stock photos, one bracket per section, Geist display. Amber as display-scale accent + under-tick + amber-fill CTA; never body text on paper.
- **Scanner**: amber is the live-diagnostic colour (score-ring, severity-high, warn rows). Score ring is the signature motion.
- **Shopify app**: Polaris chrome + Flintmere island. Never restyle Polaris primitives.

## Canon hygiene

If you encounter any of these in code or copy, they are retired — migrate or delete:

- Fraunces, IBM Plex Sans, Space Grotesk, Caveat (retired faces)
- Oxblood, amber-deep, crimson-paper, sulphur `#D9E05A` (retired colours; sulphur replaced by Glowing Amber `#F8BF24` in ADR 0007)
- `.paper-card`, `.ledger-rule`, `.deckle-*`, `.grain`, `.glass-*` (retired utilities)
- `bg-white`, `bg-slate-*`, `bg-gray-*`, `bg-neutral-*`, `dark:*` (banned)
- The word "approved." as a protected moment (allowanceguard heritage)

## Deployment

Single DigitalOcean droplet with Coolify. Three subdomains routed via Traefik. See `projects/flintmere/decisions/0002-coolify-on-do.md` and `projects/flintmere/PROJECT.md` §Deployment.

## LLM stack

- Primary bulk: Gemini 2.5 Flash (Vertex AI EU)
- Hard cases: Gemini 2.5 Pro (Vertex AI EU)
- Fallback: GPT-4o-mini (Azure OpenAI EU)
- Abstraction: `packages/llm/`

See `projects/flintmere/decisions/0005-llm-provider-strategy.md` + `0006-hardcase-llm-lock-gemini-pro.md`.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced kit-template CLAUDE.md with a Flintmere-specific load map, canon summary, signature reminder, active vetos, and surface-specific reminders. References all 7 departments and ADRs 0001–0006.
