# Audit-assist build brief — v0

Date: 2026-05-06
Status: draft, awaiting build-feature dispatch
Owner: pending — engineering claims at kick-off
Strategic framing: **deliberately the ingestion-engine verification-UX prototype** per council convene 2026-05-06 evening. Every schema decision, prompt shape, and confidence-score field is dual-purpose — it ships audit-drafting today AND seeds the data shape the ingestion engine will inherit.

## What ships in v0

A feature-flagged, operator-only route inside `apps/scanner/` at `/admin/audit-draft` that:

1. Accepts a merchant shop URL + audit band (B1 / B2 / B3) + optional vertical override.
2. Pulls the deterministic seven-pillar scan results (re-runs `/api/scan` if no recent result, otherwise uses the cached result by shop).
3. Fetches a sample of public catalog data (≤50 products via the existing `lib/shopify-public.ts` path).
4. Calls **Gemini 2.5 Pro** on Vertex / Gemini Enterprise Agent Platform with a structured-output prompt to draft per-pillar findings + executive summary + top-5 priorities, each with a confidence score per item.
5. Persists the draft to a new `scanner_audit_drafts` table.
6. Renders the draft in a barebones admin view: editable rich-text per section, copy-as-markdown export, finalise-and-mark-sent action.
7. Emits a Plausible custom event `audit_draft_generated` (no PII, just `shop` + `band` + `model` + `latency_ms`).

The merchant deliverable still goes out of operator hands — this v0 doesn't auto-send anything anywhere. The merchant-facing artefact stays whatever you currently produce (PDF / shared doc); this slice replaces "blank page" with "edited LLM draft."

## Why this is the right next slice

Per the council convene 2026-05-06 evening (full reading in the conversation transcript). The strategic seats (#15 + #11 + #15) read: Gate 1 (30-day cohort retention ≥ 70% on the ingestion engine, due 2026-10-26 per ADR 0019 amendment) is the binding metric. Public-scanner AI commentary is funnel polish; it points at the wrong gate. **Audit-drafting assist on real merchant catalogs is the closest small-scale prototype of the ingestion engine's verification-UX flow** (operator pastes catalog → LLM drafts structured output with per-field confidence → operator reviews and edits → final output). The prompt + structured-output schema + confidence-score discipline that earns its keep in v0 transfers wholesale to the ingestion engine when that lands.

What audit-assist v0 IS NOT:
- A merchant-facing surface (operator-only, admin-gated).
- An automation (operator edits before send; no auto-dispatch).
- The ingestion engine itself (no PDF/photo extraction, no Shopify metafield writeback, no merchant verification flow). Phase boundaries protect the moat-build clock.
- Coverage of the public scanner's `/scan` route (Phase 2 — separate dispatch, separate ADR if it matures).

## Architecture

### Authority + access

- Route lives at `apps/scanner/src/app/admin/audit-draft/page.tsx` (+ `loading.tsx`, `error.tsx`).
- Auth: behind a new `requireAdmin()` server-side check that gates on `ADMIN_EMAIL` env var matching the session-bound email. v0 doesn't ship a multi-admin model; the env var is a single allowlisted address (`info@eazyaccess.org`). NextAuth or Lucia not introduced for this slice — a session-cookie HMAC against `ADMIN_EMAIL` + `ADMIN_SECRET` is sufficient for one admin and one route. The admin auth scaffold extracts to `lib/admin-auth.ts` ready to be replaced when a real auth provider lands.
- Feature flag: `FEATURE_AUDIT_ASSIST=false` default; route returns 404 (not 403 — don't reveal existence) when off. Same pattern as the existing GMC OAuth gate.

### File layout

```
apps/scanner/
  src/
    app/
      admin/
        audit-draft/
          page.tsx                    # form + draft viewer
          _server/
            actions.ts                # generate-draft + save-edits server actions
            require-admin.ts          # session-cookie HMAC gate
          _components/
            DraftForm.tsx             # shop URL + band + vertical inputs
            DraftViewer.tsx           # editable per-section panes
            ConfidenceBadge.tsx       # the verification-UX prototype tell
      api/
        admin/
          audit-draft/
            generate/
              route.ts                # POST — calls @flintmere/llm + persists
            [id]/
              route.ts                # GET / PATCH for edits
    lib/
      audit-draft/
        prompt.ts                     # the prompt template + few-shot examples
        schema.ts                     # zod schema (the ingestion-engine seed)
        types.ts                      # exported types
        catalog-sample.ts             # pulls ≤50 products from /products.json
    prisma/
      schema.prisma                   # +model AuditDraft
      migrations/
        20260507000000_audit_drafts/
          migration.sql

packages/llm/
  src/
    customer/
      audit-draft.ts                  # routes to hard-case (gemini-2.5-pro on Vertex)
```

### The prompt shape

Single prompt to Gemini 2.5 Pro, structured-output mode (Vertex AI's `responseSchema` parameter — same SDK feature OpenAI uses). System prompt carries the editorial voice (Flintmere house voice — terse, evidence-first, no hand-waving, British) + the structured-output contract. User message carries the merchant's deterministic scan results + catalog sample + vertical + band.

System prompt outline (full text lives in `lib/audit-draft/prompt.ts` — keep under 100 lines, drift triggers a prompt-eval):

> You are Flintmere's senior audit drafter. You receive a merchant's deterministic catalog scan and a sample of their public catalog. You produce a structured findings document the operator will review, edit, and send to the merchant.
>
> Voice: terse, evidence-first, British. No marketing language. No hedging adverbs ("very," "really," "quite"). Cite specific product titles or pillar metrics by quoting them inline. Confidence scores reflect how strongly the data supports the claim — score 0.95+ for findings backed by clear catalog evidence, 0.6–0.85 for inference, below 0.6 for hypothesis. **Never invent metrics.** If the data doesn't support a claim, mark the field as a TBD operator-todo string instead of fabricating.
>
> Output strictly conforms to the supplied JSON schema. No prose outside the schema.

User message includes:
- Shop URL + vertical + band
- Deterministic scan results: pillar scores, score band, subpillar breakdown, specific issues from `packages/scoring/`
- Catalog sample: 30–50 products (titles, descriptions, vendor, product_type, tags, variants count, price range, has-images, GTIN presence, alt-text presence)
- (Future) GMC connection data when slice 2c lands — disapproval reasons, demand chart per top-disapproved product

### Structured-output schema (zod, the ingestion-engine seed)

```typescript
// lib/audit-draft/schema.ts
import { z } from 'zod';

export const PILLARS = [
  'identifiers',
  'titles',
  'consistency',
  'crawlability',
  'attributes',
  'mapping',
  'checkout-eligibility',
] as const;

export const AuditDraftSchema = z.object({
  meta: z.object({
    shop: z.string().regex(/^[a-z0-9.-]+$/),
    vertical: z.enum(['food', 'beauty', 'apparel', 'home', 'electronics', 'other']),
    band: z.enum(['B1', 'B2', 'B3']),
    generatedAt: z.string().datetime(),
    model: z.literal('gemini-2.5-pro'),
    latencyMs: z.number().int().nonnegative(),
  }),

  executiveSummary: z.object({
    headline: z.string().max(180),                  // single sentence
    body: z.string().max(900),                       // 1–2 paragraphs
    confidence: z.number().min(0).max(1),
  }),

  pillarFindings: z.array(z.object({
    pillar: z.enum(PILLARS),
    score: z.number().min(0).max(100),
    rating: z.enum(['A', 'B', 'C', 'D', 'F']),
    observations: z.string().max(1500),              // 1–3 paragraphs
    actionableFixes: z.array(z.object({
      title: z.string().max(120),
      detail: z.string().max(600),
      effort: z.enum(['low', 'medium', 'high']),
      impact: z.enum(['low', 'medium', 'high']),
      confidence: z.number().min(0).max(1),
    })).min(0).max(5),
    confidence: z.number().min(0).max(1),
  })).length(7),                                     // exactly the seven pillars

  topPriorities: z.array(z.object({
    rank: z.number().int().min(1).max(5),
    title: z.string().max(120),
    rationale: z.string().max(400),
    pillarRef: z.enum(PILLARS),
    confidence: z.number().min(0).max(1),
  })).length(5),                                     // exactly 5

  estimatedRevenueImpact: z.object({
    available: z.boolean(),
    summary: z.string().max(600),
    confidence: z.number().min(0).max(1).optional(),
  }),

  operatorTodos: z.array(z.string().max(280)),       // explicit TBD slots LLM marks
});

export type AuditDraft = z.infer<typeof AuditDraftSchema>;
```

The `confidence` fields and `operatorTodos` are the ingestion-engine prototype tells. When the ingestion engine ships, the merchant verification UX shows this same confidence per extracted field; operators today are the manual-verification proxy. The prompt-tuning loop on confidence calibration (high confidence on real evidence; low on inference; TBD on absence) transfers directly.

## Database

### New table: `scanner_audit_drafts`

```prisma
model AuditDraft {
  id              String   @id @default(cuid())
  shop            String                      // normalised hostname
  vertical        String
  band            String                      // B1 | B2 | B3
  scanId          String?                     // FK to scanner_scans if available
  status          String   @default("draft")  // draft | edited | sent
  modelUsed       String
  latencyMs       Int
  rawDraft        Json                        // the LLM's structured output verbatim
  editedDraft     Json?                       // operator's edits, same schema
  generatedAt     DateTime
  editedAt        DateTime?
  sentAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([shop])
  @@index([status])
  @@map("scanner_audit_drafts")
}
```

Migration: `20260507000000_audit_drafts/migration.sql` — additive only (new table, indexes), zero existing-data impact, deploys cleanly via `prisma migrate deploy` on next Coolify deploy.

Retention: drafts persist indefinitely v0 (low volume). When volume exceeds ~500 drafts, add a 12-month soft-delete cron — separate ADR if needed.

## API + UI

### Server actions / routes

- `POST /api/admin/audit-draft/generate` — body: `{ shop, band, vertical? }`. Runs `requireAdmin()`, fetches scan + catalog sample, calls Gemini, validates against `AuditDraftSchema`, persists row, returns `{ draftId }`. ~10–25 sec response time (Gemini 2.5 Pro on a 30-product context). UI shows a `<Suspense>` skeleton.
- `GET /api/admin/audit-draft/[id]` — returns the row (raw + edited).
- `PATCH /api/admin/audit-draft/[id]` — body: `{ editedDraft, status? }`. Validates against schema, writes editedDraft + bumps `editedAt`.

### UI panes

- **DraftForm** — shop URL input, band radio, optional vertical override (auto-detected if blank), Generate button.
- **DraftViewer** — collapsed-by-default panes per section: Exec Summary, 7× Pillar Findings, Top 5 Priorities, Revenue Impact, Operator TODOs. Each pane shows a `ConfidenceBadge` (high/medium/low colour-coded). Each editable field is a contenteditable div (no rich-text editor library in v0 — v1 if needed). "Copy as markdown" button per pane and one for the full doc.
- No PDF export v0 — operator pastes markdown into whatever final-deliverable surface they currently use.

## Provider config

- `LLM_HARDCASE_PROVIDER=vertex` (already set per OPERATOR-TASKS.md).
- `LLM_HARDCASE_MODEL=gemini-2.5-pro` (already set).
- `LLM_HARDCASE_REGION=europe-west1` (already set).
- Audit-assist route imports from `packages/llm/src/customer/audit-draft.ts`, which dispatches via `LLMRouter.completeHardCase()` — same path as eventual title-rewrite + category-classification work.
- Vision: not used v0 (image alt-text inference is Phase 2 / Shopify-app territory).
- Fallback: if Vertex circuit-breaks, the route returns a 503 with operator-readable error, NOT silent fallback to OpenAI. Audit-drafting is a quality surface; the OpenAI fallback's privacy posture (catalog text in abuse-monitoring retention up to 30 days, no formal EU residency) is acceptable for fallback bulk volume but not for one-shot premium drafts where we'd rather fail loudly. Operator can re-trigger.

## Telemetry

- Plausible custom event `audit_draft_generated` with props: `shop` (normalised), `band`, `model`, `latency_ms`, `pillar_count` (always 7, sanity-check), `confidence_avg` (mean of all confidence fields, rounded to 0.05).
- Server log line per generation: `audit-draft.generated shop={} band={} model={} latency_ms={} confidence_avg={}` — Sentry captures errors with provider + status. No catalog content in logs; that's a sanitiser violation.
- **Gate 1 telemetry hook (the strategic-clock connection):** the `confidence_avg` distribution over the first 20 drafts is the signal we use to calibrate the eventual ingestion-engine threshold (below which the merchant must verify, above which auto-accept). Capture the operator's edits as `editedDraft` so the diff between `rawDraft` and `editedDraft` is the supervised-correction corpus for prompt-tuning. After 20 drafts, run a one-off analysis script (`packages/llm/scripts/audit-draft-edit-analysis.mjs`) that surfaces the highest-edit-rate fields — those are the prompt-improvement targets and the ingestion-engine UX-priority targets.

## Council gates

This brief was constructed inside the council convene 2026-05-06 evening. Pre-flight on the eventual build dispatch is binding:

- **#15 Architect + #14 DX:** package shape conforms to `packages/llm/src/customer/` boundary. New `lib/audit-draft/` is scoped under `apps/scanner/`, not factored into a package — premature extraction risk per `feedback_post_processor_over_pillar_edits.md`.
- **#4 Security + #24 Data protection (veto):** route is admin-gated; merchant data flows to Vertex EU under existing DPA; no PII in logs/telemetry; `editedDraft` contents stored in our own Postgres (already in DPA Annex). No new sub-processor disclosure needed.
- **#37 Consumer psychologist (veto on customer-facing language):** **does not apply directly** — operator edits before any merchant-facing copy ships. Voice/jargon checks happen at the operator-edit step, not at the LLM step. But: the editorial-voice instruction in the system prompt should match the public Flintmere voice (`memory/VOICE.md` banned phrases respected). Add a follow-up checklist item to validate the first 5 generated drafts pass `claim-review` before send.
- **#34 Debugging + #18 Database:** discriminated-union response shape (success / circuit-broken / validation-error) on the API route; structured logging; Postgres index on `shop` + `status` for the admin list view (Phase 2).
- **#35 Product analyst:** Gate 1 telemetry hook documented above. The first 20 drafts feed the ingestion-engine UX calibration; that's the "this work bends toward Gate 1" tell.
- **Copy Council (#20 + #21 + #22 + #37):** every draft passes through `claim-review` skill before send to merchant. v0 enforces this as a checklist item in the operator workflow; v1 wires it as a soft-block UI gate.
- **Legal Council (#9 + #23 + #24):** GCP DPA covers the upstream; merchant catalogue text is not personal data under GDPR Art 4(1) for typical Shopify products; operator-side editing means no autonomous claim-creation; the merchant who paid for the audit has consented to data processing by the act of booking. Clean.

## Build sequence

Dispatched as a single `build-feature` task, in this order:

1. **Schema + migration** — `prisma/schema.prisma` + `migrations/20260507000000_audit_drafts/migration.sql` + zod `AuditDraftSchema` in `lib/audit-draft/schema.ts`. Test that `prisma migrate deploy` runs clean against a fresh DB.
2. **LLM call + structured-output validation** — `packages/llm/src/customer/audit-draft.ts` + `lib/audit-draft/prompt.ts`. Smoke test against a known shop (`bluetokyo.co.uk` is a good food-vertical fixture) with deterministic inputs; assert the LLM output validates against the schema; commit a fixtures file at `packages/llm/test/fixtures/audit-draft-bluetokyo.json` for regression. Vertex/Gemini Enterprise smoke is the first wired call to the new SA — if the Coolify env vars or file-mount have a typo, it surfaces here.
3. **Admin auth gate** — `lib/admin-auth.ts` + session-cookie HMAC. Unit test in `lib/admin-auth.test.ts` covering valid + tampered + expired cookie paths. (Node-only test env per memory `feedback_node_test_env_means_no_component_tests.md`; no component tests in v0.)
4. **API routes** — `app/api/admin/audit-draft/generate/route.ts` + `[id]/route.ts`. Integration test via the existing scanner test harness that runs `POST` end-to-end against a mocked LLM provider.
5. **UI** — `app/admin/audit-draft/page.tsx` + `_components/`. Operator-only, no public Polish floor; ship the simplest workable view + iterate.
6. **Telemetry** — Plausible event + Sentry breadcrumbs + the `audit-draft-edit-analysis.mjs` analysis stub.
7. **OPERATOR-TASKS.md update** — add a "Generate first audit draft" checklist item under the audit-deliverable workflow, with the council-gate reminder (`claim-review` before send for the first 5).
8. **First live smoke** — operator generates a draft for one of the in-flight concierge audits (or a synthetic test against `bluetokyo.co.uk`); confirms the JSON-key auth works against Vertex; confirms the structured-output validates; confirms the editor view renders. **This is the moment the Gemini Enterprise primary flips from "live but un-smoked" to "verified live."** Append a STATUS.md Changelog entry on success.

## Acceptance criteria for v0

- [ ] Operator can navigate to `/admin/audit-draft` (with `FEATURE_AUDIT_ASSIST=true` + admin cookie), enter a shop URL + band, click Generate, and receive a structured draft within 30 seconds.
- [ ] The draft validates against `AuditDraftSchema` 100% of the time (zod parse never throws on Vertex output — if it does, the prompt is wrong, not the code).
- [ ] Operator can edit any section, save, and the `editedDraft` field persists.
- [ ] "Copy as markdown" produces a paste-ready document for the existing audit-deliverable workflow.
- [ ] Plausible captures `audit_draft_generated` events with the documented props.
- [ ] No catalog content appears in any log surface (Sentry, Plausible, server console).
- [ ] First 5 drafts pass `claim-review` before send (operator workflow item).
- [ ] All `apps/scanner/` files stay under 600 lines (PROCESS.md §2).
- [ ] No regression on existing `/scan` or `/audit` flows.

## What's NOT in v0 (and what triggers each)

- **Public-scanner per-pillar AI commentary** — Phase 2; trigger is validation-week traffic showing the email-gate conversion is below 30% AND audit-assist is operator-validated.
- **Auto-fill from existing scan results without re-running** — Phase 1.5; trivial extension once the route exists.
- **PDF export of finalised drafts** — Phase 2; needs a typeset template, not just markdown-to-PDF.
- **Multi-admin auth** — when the operator is no longer solo. Probably with NextAuth / Lucia at that point.
- **Image alt-text inference (vision call)** — Phase 3, Shopify-app territory; lives in the embedded-app build, not the scanner.
- **Ingestion engine itself** (PDF + photo + spreadsheet → metafield writeback) — separate plan, separate ADR, 9–12 months solo per the v2 strategic report ratification block. Audit-assist v0 is the *prototype* of its verification UX; not the engine itself.

## Risks + honest doubts

- **Vertex first-call may surface a config gap** that the file mount + env vars didn't catch. Mitigation: build sequence step 2 is the smoke test; if it fails, we diagnose before any UI ships.
- **Structured-output mode on Gemini 2.5 Pro can produce schema-violating output** in long generations (~2% rate based on prompt-eval lit). Mitigation: zod parse guards; if it fails, retry once with a "your previous output didn't match the schema" repair prompt; if that also fails, return error.
- **The 30-product catalog sample may be insufficient** for very large catalogs (>2,000 SKUs). The deterministic scan summary carries the headline metrics; the sample is for the LLM to ground specific product references in. Worst case the LLM cites products from the sample only; that's acceptable for v0. Phase 2 widens the sample with stratified selection.
- **Operator-edit-rate may be very high on the first 20 drafts** — that's not a bug, that's the prompt-tuning corpus. The risk is interpreting it as a quality crisis instead of expected-shape data. Discipline: don't re-prompt-tune until we have at least 20 drafts of edit-rate signal.
- **No formal EU-residency on the OpenAI fallback** — fallback is intentionally disabled for this route per `Provider config` above. If a Plus prospect later asks where audit drafting happens, the answer is "Google Cloud, europe-west1." Clean.

## Pointers (file)

- ADR 0005 amendment 2026-05-06 (Vertex AI rebrand)
- ADR 0006 (hard-case Gemini 2.5 Pro lock)
- ADR 0019 amendment (Gate 1 retention; the strategic clock this brief points at)
- `projects/flintmere/strategy/2026-04-26-final-report.md` §1 (moat reframe — workflow > taxonomy)
- `memory/admin-ops/ops-calendar.md` §Google Cloud — service-account key rotation
- `packages/llm/` (existing provider abstraction; `customer/audit-draft.ts` slots in)
- `packages/scoring/` (the deterministic seven-pillar input the LLM consumes)
- Prior session: `context/summaries/2026-05-06-1037-pre-ai-hookup-hardening.md`
