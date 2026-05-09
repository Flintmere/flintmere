# canon-source-register.md — Canonical sources for Flintmere artifacts

> **Standing Council ratification 2026-05-09.** This file is the canonical
> source register every dispatch that produces a customer-facing artifact
> (audit-engine prompt, deliverable spec, copy, email, pricing claim,
> ADR, customer-facing route) reads first. Mirrors the design-skill
> reference-register pattern from 2026-04-28, scoped to deliverable /
> copy / engine canon.
>
> **Why this exists.** The 2026-04-28 design-skill binding catches visual
> drift but does not reach the deliverable layer. The 2026-05-09 binding
> closes that gap: every dispatch in the trigger list (CLAUDE.md §canon
> protection) opens with a council pre-flight naming 3 sources from this
> file by URL or path with a one-sentence annotation on what to align to.
> If the council can't name 3 sources, the artifact isn't ready —
> return to `grill-requirement` or run `canon-audit` to surface the gaps.
>
> **The single highest-leverage source on this register is
> `flintmere.com/methodology`.** It is the canonical voice register, the
> canonical pillar names + weights + public/install-gated split, the
> canonical regulatory positioning, and the canonical "what we measure
> vs what we don't" framing. Most artifacts in the trigger list need to
> read it first. When in doubt, read methodology.

---

## How to use this file

- **Skills + dispatches read this first** when the binding fires (see
  CLAUDE.md §canon protection for the trigger list).
- **Per-dispatch source set** is a SUBSET of the relevant artifact-type
  block, picked by the council seat most relevant to the surface.
- **Operator strikes / adds / annotates** — the register is calibrated
  to operator's taste and Flintmere's published positioning, not to
  generic LLM-deliverable best practices.
- **Cite by URL or file path on every reference.** "It says it on the
  methodology page" is not a citation; `flintmere.com/methodology
  §Pillars` is.
- **The published page beats the internal doc when they disagree** —
  flintmere.com is what the merchant sees. If `BUSINESS.md` and
  `flintmere.com/pricing` diverge, the published page is canon and
  `BUSINESS.md` needs updating.

---

## Section A — By artifact type

### A1. Audit-engine prompts
Files in scope: `apps/scanner/src/lib/audit-draft/prompt.ts`,
`apps/scanner/src/lib/audit-draft/generate.ts`,
`apps/scanner/src/lib/audit-draft/schema.ts`,
`apps/scanner/src/lib/audit-draft/json-schema.ts`,
`apps/scanner/src/lib/audit-draft/markdown-export.ts`.

Read first:
- **`https://flintmere.com/methodology`** — pillar names + weights +
  public/install-gated split + voice register + regulatory positioning.
  Single source of truth for what the audit's STRUCTURE must reflect.
- **`https://flintmere.com/audit`** — what's promised to the £197 buyer.
  Defines the deliverable shape from the demand side.
- `projects/flintmere/decisions/0019-strategic-gate-window-six-month.md`
  — Gate 1 framing (workflow > taxonomy moat reframe).
- `projects/flintmere/decisions/0022-audit-band-pricing.md` — Band 1/2/3
  ladder and what each price implies.
- `BUSINESS.md` §audits + §retainer — pricing context for the
  retainer-pitch CTA at the end.
- `apps/scanner/src/lib/scoring/` — actual scoring engine output (the
  pillar names that flow into the prompt input).
- `apps/scanner/src/components/scan/SuppressionLede.tsx` — the wedge
  framing canon (deterministic anchor + range, two-beat shape).
- `memory/VOICE.md` — banned phrases, tone, bracket signature.
- `feedback_probability_range_in_headline_reads_as_guess.md` — two-beat
  lede shape on every wedge claim.

### A2. Deliverable specs (audit, report, email body)
Files in scope: `projects/flintmere/plans/*deliverable*`,
`projects/flintmere/plans/*spec*`, `projects/flintmere/plans/*audit*`,
audit-edit-pass schemas.

**Three in-code truth surfaces** — every deliverable spec MUST
reconcile against these (added 2026-05-09 after the deliverable-canon-
alignment review):

- **`apps/scanner/src/app/audit/page.tsx`** — the live `/audit`
  conversion page; renders `CONCIERGE_DELIVERABLE_LIST` (5 items the
  merchant is promised before they pay).
- **`apps/scanner/src/app/audit/success/page.tsx`** — post-purchase
  confirmation; promises "audit letter, per-product CSV, and 30-day fix
  sequence within three working days."
- **`apps/scanner/src/lib/concierge-email.ts`** — Resend body fired
  on `payment_intent.succeeded`; renders
  `conciergeEmailDeliverableLine` (the 5-item promise repeated to the
  merchant via email).
- **`apps/scanner/src/lib/concierge-deliverable.ts`** — single source
  of truth for the deliverable copy (the three surfaces above all
  render from this module).

Read also:

- **`https://flintmere.com/audit`** — the rendered live page.
- **`https://flintmere.com/methodology`** — voice register + structural
  reference.
- `projects/flintmere/plans/2026-05-09-concierge-audit-deliverable-spec.md`
  — current frozen spec (covers all 3 bands; replaces the
  Band-1-only `revenue-sprint-197-deliverable-spec.md`).
- `projects/flintmere/plans/2026-05-09-audit-edit-pass-schema.md` —
  operator-edit schema (with v2.1 corrections folded).
- `projects/flintmere/plans/2026-05-09-day2-calibration-checklist.md`
  — operator's per-audit send-check.
- `BUSINESS.md` §audits + §retainer.
- `feedback_trust_load_bearing_surfaces_type_only.md` — audit
  deliverables are trust-load-bearing.
- `feedback_disclosure_tier_vs_signal_tier_copy.md` — what may go in
  the deliverable vs what stays out.

**Deliverable-parity rule**: every item promised in the spec MUST appear
in all three in-code truth surfaces, and vice versa. Mismatch is an
automatic P0 in canon-audit. Specs in `projects/flintmere/plans/*-spec.md`
carry frontmatter listing `canon_sources` + `canon_audit_run` date.

### A3. Marketing copy / landing pages / blog
Files in scope: `apps/scanner/src/app/page.tsx`,
`apps/scanner/src/app/for/[vertical]/`,
`apps/scanner/src/app/research/`, blog post drafts.

Read first:
- **The page being edited** (live URL on flintmere.com — fetch + diff
  against the draft).
- **Sister pages on flintmere.com** the page links to.
- `memory/VOICE.md` — banned phrases + tone.
- `memory/design/tokens.md` §Voice — the typographic / signature canon.
- `BUSINESS.md` positioning section.
- The relevant ADR(s) from `projects/flintmere/decisions/` for any
  positioning claim.

### A4. Outreach / cold email
Files in scope: `data/recruitment/cold-email-template-*.md`, any
outreach script in `data/recruitment/`.

Read first:
- **`data/recruitment/cold-email-template-2026-05-09.md`** — the
  canonical template; new outreach must trace its DNA.
- `memory/VOICE.md`.
- `memory/marketing/MEMORY.md` — outreach guides.
- `memory/CONSTRAINTS.md` — PECR / GDPR / opt-out posture.
- `feedback_no_mailto_links_anywhere.md` — every public route to a
  Flintmere inbox goes through the contact form.
- `feedback_companies_house_13205428.md` + `feedback_ico_registration_position.md`
  — the legal footer entries.

### A5. Email templates (Resend HTML + text bodies)
Files in scope: `apps/scanner/src/lib/resend.ts`,
inline email bodies in route files (`apps/scanner/src/app/api/admin/email-code/request/route.ts`,
admin / lifecycle / transactional emails).

Read first:
- **The existing email templates** in the file being edited (existing
  voice canon).
- `memory/VOICE.md`.
- `memory/design/tokens.md` §Email (if exists; otherwise tokens.md
  §Signature for the bracketed `[ … ]` heading pattern).
- `feedback_trust_load_bearing_surfaces_type_only.md` — auth /
  credential-handoff / post-purchase emails are trust-load-bearing;
  type-only register, no marketing decoration.
- `feedback_one_time_secret_over_magic_link.md` — for credential
  handoff, default to merchant-creates-secret-URL pattern.

### A6. Pricing / billing copy
Files in scope: `apps/scanner/src/app/pricing/`,
`apps/scanner/src/app/audit/`,
`apps/scanner/src/lib/pricing.ts`,
`apps/scanner/src/lib/audit-pricing.ts`, billing flows.

Read first:
- **`https://flintmere.com/pricing`** — canonical tier ladder + prices.
- **`https://flintmere.com/audit`** — canonical band ladder + prices.
- `apps/scanner/src/lib/pricing.ts` — code-canonical pricing values.
- `apps/scanner/src/lib/audit-pricing.ts` — code-canonical band ladder.
- `projects/flintmere/decisions/0016-pricing-axis-vertical-distribution.md`.
- `projects/flintmere/decisions/0017-plus-tier-private-beta-gate.md`.
- `projects/flintmere/decisions/0022-audit-band-pricing.md`.
- `BUSINESS.md` §pricing.
- `project_stripe_descriptor_card_deprecation_2026_05_05.md` — Stripe
  descriptor canon for charge-line copy.

### A7. Positioning / `/about` / `/methodology` updates
Files in scope: `apps/scanner/src/app/about/`,
`apps/scanner/src/app/methodology/`, strategy docs in
`projects/flintmere/strategy/`.

Read first:
- **The page being edited** (live URL).
- `projects/flintmere/strategy/2026-04-26-final-report.md` — v2
  strategic report (workflow > taxonomy moat reframe).
- `projects/flintmere/decisions/0015-food-first-vertical-strategy.md`.
- `projects/flintmere/decisions/0019-strategic-gate-window-six-month.md`.
- `projects/flintmere/decisions/0020-per-channel-pricing-axis.md`.
- `BUSINESS.md` positioning section.
- `memory/VOICE.md`.
- `feedback_always_team_voice.md` — never single-named-individual on
  customer-facing surfaces.

### A8. Voice / register guidance + critique
Files in scope: anywhere voice is discussed or set.

Read first:
- **`https://flintmere.com/methodology`** — the reference voice
  (declarative + load-bearing-claim-per-paragraph + occasionally
  aphoristic).
- `memory/VOICE.md`.
- `feedback_voice_and_collaboration.md` — operator preferences (plain
  English, prose over bullets, British, honest pushback).
- `feedback_no_option_menus_on_design.md` — pick the strongest move.
- `feedback_pillars_economy_not_amplification.md` — scannable evidence
  not cinematic content.
- `feedback_extravagant_means_nonlinear.md` — when "extravagant"
  permitted, propose non-linear before bigger.

### A9. Pillar / scoring claims
Files in scope: anything that names a pillar, cites a score, or
explains the scoring engine.

Read first:
- **`https://flintmere.com/methodology`** — canonical pillar names +
  weights + public/install-gated split.
- `packages/scoring/src/` — the actual scoring engine code.
- `apps/scanner/src/lib/scoring/` — scanner-mode pillars.
- `apps/scanner/src/components/scan/SuppressionLede.tsx`.
- `apps/scanner/src/components/scan/Results.tsx`.

Pillar canon (must use exactly):
01. **Identifiers** — 20% — public
02. **Attributes** — 20% — install-gated
03. **Titles** — 15% — public
04. **Mapping** — 15% — install-gated
05. **Consistency** — 15% — public
06. **Checkout eligibility** — 10% — install-gated
07. **Crawlability** — 5% — public

Public pillars: 55%. Install-gated: 45%. NEVER paraphrase ("the GTIN
pillar", "the category-mapping pillar"). Names match the scanner UI
and the methodology page.

### A10. Regulatory citations (food vertical)
Files in scope: any audit deliverable, methodology copy, or scoring
explainer that touches food regulation.

Read first:
- **The (TBD) `regulatory_citations` playbook** per audit-engine v2.1
  delta — until built, treat all regulatory citations as
  `[OPERATOR_VERIFY: ...]` and route through #39 Regulatory Affairs
  council seat for sign-off.
- The regulator's own page for any cited rule (EUR-Lex for EU
  regulations, FSA / DEFRA / GS1 for UK).
- `projects/flintmere/decisions/0019-strategic-gate-window-six-month.md`
  §Sources.
- `projects/flintmere/decisions/0018-standards-subdomain-and-cadence.md`.

Verified citations to date (food vertical, source-linked):
- **EU Regulation 1169/2011 (FIC)** — Food Information to Consumers —
  https://eur-lex.europa.eu/eli/reg/2011/1169/oj
- **FSA Big-14 allergen list** — https://www.food.gov.uk/safety-hygiene/food-allergy-and-intolerance
- **DEFRA UK GI register** — https://www.gov.uk/protected-food-drink-names
- **GS1 General Specifications** — https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications
- **GMC Help — Product data spec** — https://support.google.com/merchants/answer/7052112

Add to this list only via `canon-audit` review + #39 Regulatory Affairs
sign-off.

### A11. API responses / error messages / metadata
Files in scope: `apps/scanner/src/app/api/**/route.ts` (response strings),
`apps/scanner/src/app/**/page.tsx` (`metadata`),
`apps/scanner/src/app/**/error.tsx`, `not-found.tsx`.

Read first:
- The component / route already in place using these strings (existing
  canon).
- `memory/VOICE.md`.
- The brand voice on `flintmere.com`.
- `feedback_trust_load_bearing_surfaces_type_only.md` for auth +
  payment + post-purchase paths.

### A12. Operator console copy (`/admin/audit-draft`)
Files in scope: `apps/scanner/src/app/admin/audit-draft/`,
`apps/scanner/src/app/admin/login/`, smoke scripts.

Read first:
- **The existing operator console** (`apps/scanner/src/app/admin/audit-draft/page.tsx`
  + `_components/`) — current canon.
- `memory/VOICE.md`.
- `https://flintmere.com/methodology` — operator console copy is
  audit-flavoured, not marketing-flavoured.
- `feedback_login_broken_dont_route_through_admin_ui.md` — admin
  bypass-paths context.

### A13. ADR drafts
Files in scope: `projects/flintmere/decisions/00XX-*.md` new ADRs.

Read first:
- `projects/flintmere/decisions/README.md` — ADR conventions.
- The 2–3 most-related ADRs to the topic.
- `BUSINESS.md` if pricing / positioning is touched.
- `projects/flintmere/strategy/2026-04-26-final-report.md` — the
  ratified strategic frame.
- `memory/VOICE.md` — ADRs are read by future-Claude + future-operator;
  voice matters.

### A14. PR descriptions (customer-facing changes)
Files in scope: any PR body for changes that touch
`apps/scanner/src/app/`, `apps/shopify-app/app/`, customer-facing
copy, pricing, deliverables, or public posture.

Read first:
- The PR's own diff (what it actually changes).
- Recent merged PR descriptions on `main` (existing voice canon).
- `memory/VOICE.md`.
- `attribution.commit` / `attribution.pr` settings (Co-Authored-By
  trailer).

### A15. Standards artifacts (`standards.flintmere.com` content)
Files in scope: anything that publishes as the food catalog standard.

Read first:
- `projects/flintmere/decisions/0018-standards-subdomain-and-cadence.md`.
- `https://flintmere.com/methodology`.
- `https://flintmere.com/standards` (when live).
- The regulatory-citations playbook (per A10).
- #39 Regulatory Affairs council seat for any regulatory claim.

Status note: standards subdomain DNS resolves but no service is bound
yet (per STATUS.md as of 2026-05-09). Phase 4 publication is gated.
Don't cite `standards.flintmere.com/food/v1` as live before Q3 2026 —
write `[OPERATOR_VERIFY: standard clause once v1 publishes]` instead.

---

## Section B — Cross-cutting canon (read on every dispatch)

These three sources are read on EVERY canon-protected dispatch
regardless of artifact type:

1. **`memory/VOICE.md`** — banned phrases, tone, bracket signature
2. **`https://flintmere.com/methodology`** — the most-cited canonical
   source; if a dispatch can't justify why it didn't read methodology,
   it didn't pre-flight properly
3. **`CLAUDE.md` §Canon hygiene + §Six anti-waste rules** — current
   bindings + retired-list

---

## Section C — Maintenance

This register is a living document. The Standing Council seat #1 Editor
+ #11 Founder voice + #4 Engineering own its accuracy.

Update triggers:
- New canonical source published on flintmere.com → add to relevant
  artifact-type block
- ADR ratified → add to relevant blocks
- New `feedback_*.md` memory that touches a canon artifact type →
  cross-reference
- Brand-voice shift ratified → update Section A8 + cross-cutting B
- Pillar / weight change → update A9 (rare; flag to council)

Audit cadence: monthly read-through to catch drift between this register
and the actual canonical sources. The `docs-coherence-audit` skill can
run this check.

---

## Section D — What this register does NOT cover

Out of scope (handled elsewhere):
- **Visual / design canon** — see `memory/design/reference-register.md`
  + `memory/design/tokens.md`. The 2026-04-28 design-skill binding
  catches design-class artifacts.
- **Code patterns / conventions** — see `memory/OUTPUT.md` + the six
  anti-waste rules in `CLAUDE.md`.
- **Test / fixture data** — pure internal, no canon protection needed.
- **Infrastructure / config / migrations** — pure plumbing, no canon
  protection needed.
- **Hard "do not" rules** — see `memory/CONSTRAINTS.md`.

If a dispatch falls in both this register and the design register
(e.g. a marketing surface with copy + visual choices), run BOTH
pre-flights — one per binding.
