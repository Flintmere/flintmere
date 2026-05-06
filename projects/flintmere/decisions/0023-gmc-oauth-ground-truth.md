# 0023 — GMC OAuth as the audit's ground-truth track

- **Status:** Accepted
- **Date:** 2026-05-06
- **Layers on:** `projects/flintmere/plans/2026-05-06-jet-fighter-engine.md` (the source plan; this ADR ratifies Track A and defers Track B), ADR 0016 (vertical-ladder pricing — pricing implication lands on this axis), ADR 0022 (audit-band — anchor the lift will eventually leave), ADR 0010 (envelope-encryption pattern reused for refresh-token storage), v2 strategic report `projects/flintmere/strategy/2026-04-26-final-report.md` (which this ADR explicitly subordinates the embedded-engine cadence to for ~5 weeks).
- **Independent of:** ADR 0020 (recurring-tier magnitudes — unchanged), ADR 0017 (Plus tier private beta — unchanged).
- **Source:** Standing Council convene 2026-05-06 (this session). Operator strategic ratification: *"we need track a or everything else we do is half a job. our scanner needs to be the best scanner not a guessing scanner."*
- **Affects:** `apps/scanner/prisma/schema.prisma` (new `MerchantGmcConnection` model), `apps/scanner/prisma/migrations/20260506100000_add_merchant_gmc_connection/` (new), `apps/scanner/src/lib/run-scan.ts` (slice 2 splice — not slice 0), `apps/scanner/src/lib/gmc/*` (new — OAuth + Content API client + token storage, slice 2), `apps/scanner/src/app/api/auth/google/*` (new OAuth start/callback, slice 2), `apps/scanner/src/app/score/[shop]/*` (new GMC panel, slice 2), `apps/scanner/src/lib/report-email.ts` (new "Currently disapproved" section, slice 2), `apps/scanner/src/app/privacy/page.tsx` (GMC clause, slice 2), `apps/scanner/src/app/dpa/page.tsx` (processor clause, slice 2), `BUSINESS.md`, `STATUS.md`, `CLAUDE.md`. New env vars: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GMC_TOKEN_KEY` (32-byte hex, AES-256-GCM key for refresh-token storage at rest).
- **Existing customers:** zero connected GMC accounts (greenfield). Zero in-flight Track-B work to displace. Atomic ship is safe.

## Context

The audit today is a model-based diagnostic. Suppression count, revenue suppressed, channel-health pillars are estimated from public-catalog signals + crawlability + AOV inference. Every customer-facing claim ends up qualified ("we estimate," "modelled range," "deterministic anchor + probabilistic subline" per the 2026-05-06 lede canon). The qualification is honest, but it caps how far the deliverable can extend before sophisticated merchants ask the question we can't answer well: *"is the suppression you modelled actually suppressed in my real GMC?"*

The credibility crater compounds. Three downstream surfaces inherit it:

1. **The audit deliverable** — every band ladder claim (£197 / £397 / £597+) is delivered against modelled outputs. The merchant pays for an estimate.
2. **Adjacent positioning** — the v2 strategic report's "we ARE the agent" frame, the standards-publication authority play, future agent-eval credibility — all rest on the existing audit's word. If that word is "we estimated," the adjacencies inherit the qualifier.
3. **Pricing leverage** — ADR 0022's £197 floor is held aloft by the audit's perceived depth. Lifting the floor without lifting the credibility creates anchor-thrash.

The fix is structural: read the merchant's actual GMC at their OAuth-granted direction and replace modelled outputs with ground-truth where ground-truth exists. *Suppression* becomes *currently disapproved*. *Revenue suppressed* becomes *demand we measured Google delivered to nearby competitors over the last 30 days*. *Modelled pillar score* becomes *Google's stated reasons*.

The 2026-05-06 jet-fighter plan specced two tracks: Track A (GMC OAuth, credibility) and Track B (agent-eval, category-creation moat). Operator strategic call rules **Track A is the prerequisite** without which Track B's positioning, the embedded ingestion engine's sale, and every adjacent claim are half-formed. Track B is deferred at this ADR; it is not retired.

## Decision

**Build Track A — GMC OAuth as the audit's ground-truth track. Defer Track B (agent-eval) to a future ADR.**

**Scope (what ships across slices 1–5):**

- **OAuth 2.0 flow** scoped to `https://www.googleapis.com/auth/content` (Google Content API for Shopping). Read-only. Per-merchant grant; merchant-initiated start (audit dashboard CTA + post-audit email link).
- **Token storage:** new `MerchantGmcConnection` table. Refresh token encrypted at rest using AES-256-GCM with `GMC_TOKEN_KEY` (envelope pattern mirroring `OneTimeSecret`). Access tokens never persisted — rotated on demand from refresh token, held in memory + short-TTL cache only.
- **Content API client:** read-only wrapper around `accounts.list`, `accountstatuses.get`, `productstatuses.list`, `accounts.reports.search`. Quota-aware retry. Single-call timeout 10s, total-call budget 30s per scan.
- **Splice into `runScanForShop`:** new optional pipeline step `fetchGmcGroundTruth(normalisedDomain)`. Returns null when no active connection. When present, returns disapproval count + per-product disapproval reasons + 30-day demand window. Result joins `scoreJson` under reserved key `gmcGroundTruth`. Pattern matches existing `suppressionEstimate` / `scaledRevenueEstimate` extension.
- **Audit deliverable extension:** the audit-letter PDF + report email gain a "Currently disapproved (read directly from your GMC)" section ahead of the modelled suppression range. Modelled outputs remain — they cover catalog issues GMC doesn't surface and merchants who haven't connected.
- **Disconnect flow:** merchant-initiated revoke; webhook handling for Google-initiated revoke; row's `revokedAt` set, `refreshTokenCipher` zeroed, audit-trail logged.
- **Daily refresh + spike alert:** subscription-tier merchants only — daily Content API refresh; alert email when disapproval count spikes >20% week-over-week. Out of scope for one-off audit purchasers.

**Deliverable surface (slice 2):** the `/score/[shop]` dashboard gains a "Google Merchant Center" panel above the existing pillar grid; the audit email gains a "Currently disapproved" section ahead of the modelled range; the `/audit` checkout copy adds *"We read your real Google Merchant Center, not just public signals"* as a Band-1+ claim once OAuth is shipped.

**Track B explicitly deferred.** Agent-eval rubric, harness, cross-model dispatch, white-paper publication — re-open in a new ADR when (a) Track A has shipped and produced ≥2 weeks of live merchant feedback, (b) WTP data on the £197 floor + GMC-extended deliverable is in hand, (c) embedded-engine cadence is cleared or explicitly subordinated again. Track B's plan content in `2026-05-06-jet-fighter-engine.md` remains canonical specification reference; this ADR does not retire it.

## Consequences

- **The audit's word changes from "we estimate" to "we read."** Every customer-facing surface that quoted modelled outputs gets a Copy Council pass post-Track-A. Modelled outputs remain (they cover unconnected merchants) but the dual framing is binding: ground-truth-when-connected, modelled-when-not, never silently mixed.
- **Schema migration is canonical.** `MerchantGmcConnection` is the only new model; no other table touched. Refresh tokens encrypted at rest matches `OneTimeSecret`'s pattern + key separation. Migration SQL hand-written at slice 0; operator runs `prisma migrate deploy` at slice 1.
- **`runScanForShop` splice is additive + nullable.** No change to the HTTP `/api/scan` response shape on the unconnected path. Existing 245 scanner tests stay green pre-slice-2; slice 2 adds new tests for the GMC path, doesn't modify existing.
- **Pricing held at £197 floor through validation.** ADR 0022's £197 was ratified 2026-05-01 with a 14-day predeclared 5%-conversion trigger. Track A ships *into* that validation window and creates the deliverable upgrade; the £497 lift is a separate ADR after WTP data lands. **No price change rides this ADR.** The plan's pricing-implication table (£497, £797) is provisional, not ratified here.
- **Legal Council pass is a slice-2 ship gate.** Privacy-policy diff: new "Google Merchant Center integration" subsection (data we receive, retention, merchant deletion path). DPA diff: GMC-data processor clause. Google API Services User Data Policy: scope-justification doc, "Limited Use" attestation, brand verification (logo + support page + privacy URL), in-app branding requirements. ToS: optional reference to GMC connection in service description. **No user-facing OAuth surface ships before #9 + #23 + #24 sign off.**
- **OAuth verification timeline is the schedule blocker.** `auth/content` is a sensitive scope. Two timeline scenarios (operator-blocked discovery — see slice 1):
  - **A.** Eazy Access Ltd's existing Google Cloud project is verified for sensitive scopes → slices 2–5 ship in 5–7 days as plan estimates.
  - **B.** Fresh verification needed → 4–6 weeks of Google review with us shipping the OAuth flow behind a "request access" gate or holding for verification. Validation-week conversion data on £197 matures during the wait, which makes the eventual £497 lift data-informed rather than anchor-anxious. The wait has a silver lining.
- **Embedded ingestion engine slips ~5 weeks.** Operator-ratified opportunity cost. The v2 strategic report's named centrepiece is paused for the credibility floor without which it would inherit the same crater on launch.
- **No new env-var abstraction reflexes.** `GOOGLE_OAUTH_CLIENT_ID` is environment-specific (different across dev/staging/prod) so it earns its env-var per `feedback_dont_abstract_public_values`. `GOOGLE_OAUTH_CLIENT_SECRET` and `GMC_TOKEN_KEY` are operator-rotated secrets.
- **Plausible event additions (slice 2):** `gmc_connect_started`, `gmc_connect_completed`, `gmc_connect_failed`, `gmc_disconnected`. Funnel attribution from audit-CTA → connect → ground-truth-rendered.

## Rollout

| Slice | Date | Deliverable | Atomic-commit boundary |
|---|---|---|---|
| **0 — Canonical decision + schema** | 2026-05-06 | This ADR; `MerchantGmcConnection` added to schema.prisma; hand-written migration SQL at `20260506100000_add_merchant_gmc_connection/`; operator handoff doc at `context/runbooks/2026-05-06-gmc-oauth-verification-check.md`. **Migration NOT applied** — schema file edits + ADR + runbook only. | One commit. |
| **1 — Operator: GCP verification check + migration apply** | operator-gated | Operator confirms which timeline scenario (A or B) per the runbook. Operator runs `prisma migrate deploy` to apply the slice-0 migration. Operator captures GCP project ID, OAuth consent screen state, sensitive-scope verification status into `STATUS.md` §Infra state. | No code. Operator-side. |
| **2 — OAuth + Content API + splice** | T+5d (scenario A) / T+30d (scenario B, behind gate) | OAuth start/callback routes; token storage helpers; Content API client; `fetchGmcGroundTruth` with real implementation; splice into `runScanForShop`; Plausible events. New tests for the GMC path. **Legal Council pass before user-facing OAuth surface goes live.** | Two commits — backend (no UI) then UI (the connect button + dashboard panel). |
| **3 — Audit-deliverable surfaces** | T+7d (scenario A) | Audit-email "Currently disapproved" section; `/score/[shop]` GMC panel; audit-letter PDF generator extension; `/audit` page copy update with the new ground-truth claim. | One commit. |
| **4 — Subscription extension** | T+10d (scenario A) | Daily-refresh cron; spike-alert email (>20% WoW disapproval delta); subscription-tier gate. | One commit. |
| **5 — Validation + WTP measurement** | T+14d (scenario A) | First merchant connects; ground-truth disapproval reason in a real audit email. £197 floor still holds. WTP study designed against a future £497 lift — separate ADR. Plausible funnel reads: connect-rate ≥ 40% on audit purchasers as the predeclared success threshold. | No code. Measurement. |

## Re-open conditions

- **GCP verification timeline pushes Track A past 6 weeks total.** If Google review extends past the 4–6 week canonical window or rejects on first submission, re-open: ship a "request access" gate that captures merchant interest, ship the audit deliverable extension behind a manual-fetch path for design partners, or pivot to a Shopify-app-side OAuth flow on the embedded engine when it ships.
- **Merchant connect-rate <30% on paid audit purchasers in the first 30 days post-Track-A.** Threshold predeclared. Investigate friction (Google account ownership, GMC-account-list flow, scope-consent copy) before re-opening pricing.
- **Disapproval-count signal is structurally weak.** If >50% of connected merchants show <5 disapprovals in their GMC, the ground-truth narrative fails to dominate the modelled framing. Re-open: pivot the GMC value to demand metrics (impressions/clicks per product) over disapproval-count.
- **Track B becomes urgent.** If a competitor publishes an agent-eval methodology that we can't credibly answer within ~30 days, re-open Track B as a new ADR. The deferral is not permanent; it is sequenced.
- **Embedded ingestion engine becomes urgent.** If the v2 strategic report's "embedded engine first" framing reasserts (e.g. a partnership opportunity, a Shopify app submission deadline, a customer-counter-offer of "we'll subscribe when the embedded engine ships"), re-open the sequencing call. The 5-week opportunity cost ratified here is reversible.
- **OAuth scope creep.** If `auth/content` read-only proves insufficient (e.g. needing `accounts.products.update` to fix disapprovals on the merchant's behalf), the privacy/DPA posture changes materially. Re-open as a new ADR; Legal Council leads.

## Council sign-off

Standing Council convened 2026-05-06 (this session, post-operator-pause "did we get council input ultrathink"). Seats: #4 Security · #5 Product marketing · #9 Lawyer/compliance · #10 DevOps/SRE · #11 Investor · #12 Ecosystem strategist · #15 Staff engineer · #18 Database engineer · #19 Privacy/GDPR · #22 Sales · #23 Regulatory · #24 Data protection · #33 Backend engineer · #35 Product analyst · #37 Consumer psychologist · #38 Data intake engineer.

- **#4 Security + #10 DevOps.** Refresh-token storage at rest reuses the `OneTimeSecret` AES-256-GCM pattern with an isolated key (`GMC_TOKEN_KEY`). Access tokens never persisted. Disconnect flow zeros ciphertext. **Approve.** Hard prerequisite: GCP verification status check (slice 1) before any OAuth code goes live.
- **#15 Staff engineer + #33 Backend engineer.** `runScanForShop` splice is additive + nullable + matches the existing envelope-extension pattern. **Approve** with one architectural note carried forward to Track B's eventual re-open: the agent-eval splice cannot run inline (5+ minute call budget); when re-opened, it must be async / queued. Captured in plan §Track B; do not re-litigate at slice 0.
- **#18 Database engineer.** Schema is one new table, one unique index on `normalised_domain`, two operational indexes. No FK to `Scan` (connections outlive scans, scans don't depend on connections). Migration is reversible. **Approve.**
- **#9 + #23 + #24 Legal Council.** GMC integration creates a processor relationship with merchant-controlled Google-sourced commercial data. Privacy policy, DPA, ToS diffs are **non-trivial** and **must land before any user-facing OAuth surface goes live**. Google API Services User Data Policy + Limited Use + brand verification are independent prerequisites. **Approve in principle, gate slice 2.**
- **#19 Privacy/GDPR.** Scope is read-only `auth/content`; data is merchant commercial (not end-user PII). Retention: refresh token until revoked + 30-day post-revoke audit retention (then purged); GMC report data joins the existing `Scan.scoreJson` and inherits its retention. Cross-border: Google Content API serves from US; transfer mechanism is Google's SCCs (existing). **Approve.**
- **#11 Investor + #22 Sales.** Pricing held at £197 floor through validation per ADR 0022's predeclared trigger. The deliverable upgrade earns the eventual £497 lift; lifting before validation data is anchor-thrash. **Approve** the deliverable change; **veto** the plan's provisional £497/£797 table being treated as ratified by this ADR.
- **#5 Product marketing + #12 Ecosystem strategist + #35 Product analyst.** "We read your real Google Merchant Center" is a sharper, more defensible positioning than "we estimate suppression." The ground-truth narrative dominates competitor framing (Lengow, Channable, DataFeedWatch all read modelled outputs from feeds; we'd be reading account-state). **Approve** with operator-ratified opportunity cost on the embedded engine.
- **#37 Consumer psychologist.** "We read your actual Google Merchant Center disapprovals" passes plain-language test. "GMC ground-truth" / "agent-eval" do not — keep customer-facing language concrete. Copy Council pass on slice 2 surfaces. **Approve copy posture.**
- **#38 Data intake engineer.** OAuth-direct read at merchant direction is the cleanest possible ingestion path. Robots.txt-compliant, opt-in by definition, opt-out via disconnect, kindness-contract-respecting. **Approve.**

**Vote: 16-0 ratify Track A. Track B deferred per scope above.**

No vetoes. Operator strategic ratification 2026-05-06 (*"we need track a or everything else we do is half a job"*). Slice 0 (this ADR + schema + runbook) ships under same-session commit boundary.

## Notes for future amendment

- When slice 5 closes, capture connect-rate, disapproval-density distribution, and merchant-side qualitative reception in `STATUS.md` §Validation. The £497 ADR depends on those numbers; do not pre-empt.
- When Track B re-opens, the "additive + nullable splice" pattern this ADR ratifies is reusable — but the agent-eval invocation must NOT use the same `runScanForShop` inline splice point. Async / queued / gated by tier per §Council sign-off note.
- If the embedded ingestion engine re-asserts as urgent before slice 2 ships, the unwind cost is bounded: ADR 0023 + schema + runbook are reversible; OAuth code does not yet exist. Re-sequencing is cheap until slice 2.
