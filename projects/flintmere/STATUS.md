# Flintmere — Status

Current phase, what's shipped, what's next. Update as state changes so Claude's advice stays grounded in the real timeline.

## Phase

**Pre-launch — kit scaffolding and pre-build documentation.** No code written yet. No customers. No public URL live. Validation week (SPEC §2) not yet started.

## Shipped

- 2026-04-19: Kit cloned from `claude-master-build-kit`, initialised as `flintmere` (slug) with domain `flintmere.com`.
- 2026-04-19: Repo renamed `Flintmere/Flint_Shop` → `Flintmere/flintmere` on GitHub.
- 2026-04-19: Wireframes installed at `wireframes/` (React-based viewer, three surfaces × two variants each).
- 2026-04-19: `SPEC.md` preserved into `projects/flintmere/` (v1.2 — Product & GTM plan).
- 2026-04-19: Design canon locked — neutral-bold hybrid + legibility bracket + Geist (`memory/design/tokens.md`, ADR 0003).
- 2026-04-19: Product-engineering memory rewritten for Flintmere — architecture rules, Shopify API rules, security posture, performance budget. `chain-support.md` removed (inherited Web3 residue).
- 2026-04-19: LLM strategy locked — Gemini 2.5 Flash primary, Gemini 2.5 Pro hard-case, GPT-4o-mini fallback (ADRs 0005 + 0006). DeepSeek + Qwen rejected by Legal Council.
- 2026-04-19: Foundational ADRs seeded — 0001 single-repo monorepo, 0002 Coolify on DO, 0003 canon, 0004 Prisma over Drizzle.
- 2026-04-19: Project anchor docs filled — PROJECT, ARCHITECTURE, DESIGN, BUSINESS.

## In progress

- Filling remaining design memory files (`accessibility.md`, `components.md`, `motion.md`) against the new canon. Performance budget already done.
- `.claude/settings.json` — deny-list refinement to tier-by-blast-radius (deferred, not blocking).

## Next (in order of leverage)

1. **Apps scaffold** — `apps/scanner/` Next.js app + `apps/shopify-app/` Remix app. Empty-but-building state with Dockerfiles Coolify can deploy. No features yet.
2. **`packages/llm/`** — LLM provider abstraction per ADRs 0005 + 0006. Interface + Vertex AI primary implementation.
3. **`packages/scoring/`** — pure scoring engine for the six pillars. Unit-tested first.
4. **Validation week (SPEC §2)** — scanner shipped to `audit.flintmere.com`, cold outreach, £97 concierge audits.
5. **Beta merchant onboarding** — private MVP for 10–20 merchants.

## Known issues

- `memory/design/accessibility.md`, `components.md`, `motion.md` still contain allowanceguard Ledger canon references. Will rewrite before any design skill invocation.
- `memory/product-engineering/test-strategy.md` references an allowanceguard user flow (`signup → scan → revoke`). Minor — update when test-first development starts.
- No `SECURITY.md` at repo root yet. Required for vulnerability disclosure before public scanner launches.
- No `CLAUDE.md` at apps/ level; root `CLAUDE.md` is the kit's default — may want app-specific overrides once code exists.
- Coolify not yet configured for this repo. Deploy path unverified end-to-end.
- Vertex AI service account not yet provisioned. Blocks any LLM integration test.

## Open decisions (blocking nothing yet, but to make before related work)

- Agency tier billing mechanics — Stripe direct vs alternative. Current: Stripe direct.
- Which specific UK/EU jurisdictions to prioritise for legal review (company reg is UK; GDPR-first is the posture).
- Whether `flintmere.com` (marketing site) is its own app or a static route inside `apps/scanner/`. Leaning toward the latter for launch, split if it grows.
- Whether to self-host PostHog on the droplet from day 1 or start with PostHog cloud free tier.
- SOC 2 posture — not needed pre-launch, but first Enterprise conversation will surface it. Budget a preparation window.
