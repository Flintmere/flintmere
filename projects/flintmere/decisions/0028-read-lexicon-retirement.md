# ADR 0028 — Retiring "audit": the `read` lexicon and the `catalog.` host

- **Status:** Accepted (ratified by operator 2026-08-25)
- **Date:** 2026-08-25
- **Number note:** Verified against `origin/main`, not the working tree — per the numbering-collision lesson recorded in ADR 0027's own Number note. `origin/main` carries 0024–0027; 0028 is the next free number.
- **Layers on:** ADR 0022 (audit-band pricing — the band ladder and every price it names survive this rename untouched), ADR 0023 (GMC OAuth ground-truth — the host migration touches the OAuth redirect URI), ADR 0015 (food-first vertical — the aversion is sharpest in this exact audience), `projects/flintmere/strategy/2026-04-26-final-report.md` (moat = workflow, not taxonomy).
- **Supersedes:** nothing. Renames; does not re-decide.
- **Source:** Operator direction 2026-08-25 — "audit is customer averse". Naming brainstorm + canon-audit pass recorded in `projects/flintmere/plans/2026-08-25-read-lexicon-migration-spec.md`.
- **Affects:** `apps/scanner/src/lib/host-routing.ts`, `apps/scanner/src/middleware.ts`, `apps/scanner/src/app/audit/**` (→ `app/read/**`), `apps/scanner/src/lib/concierge-deliverable.ts`, `apps/scanner/src/lib/{concierge-email,concierge-delivery-email,copy}.ts`, `apps/scanner/src/app/{layout,page,sitemap,not-found}.tsx`, `apps/scanner/src/app/{privacy,terms,security,sitemap}/page.tsx`, `apps/scanner/src/app/llms.txt/route.ts`, all three `opengraph-image.tsx`, `apps/scanner/src/app/blog/rss.xml/route.ts`, `apps/scanner/src/app/admin/health/_signals/posthog.ts`, `memory/VOICE.md`, `memory/marketing/{brand,seo,metrics,audiences}.md`, `memory/canon-source-register.md`, `BUSINESS.md`, `CLAUDE.md`. Full file checklist in the spec §7.
- **Existing customers:** the `/audit` → `/read` and `audit.` → `catalog.` redirects are permanent, so already-sent delivery emails, shared `/score/[shop]` pages and live outreach links continue to resolve. No merchant action required.

## Context

"Audit" is the language of examination inflicted on you. Tax audit. Ofsted. CQC. For Flintmere's declared first audience — UK food merchants per ADR 0015 — the association is worse than average: EHO inspections, hygiene ratings, BRCGS, allergen compliance, supplier audits. The word arrives pre-loaded with *the last one cost me three days and I got a 4 instead of a 5*.

It also mis-codes the commercial claim. An audit is an expense line. Flintmere's wedge is a revenue claim — "£X/month suppressed in Google Shopping". The noun fights the pitch.

Two things the word was genuinely earning, and which this ADR protects rather than discards:

1. **Search demand.** `shopify catalog audit` and `ai audit app shopify` are live target terms in `memory/marketing/seo.md`. Merchants who are already problem-aware type "audit".
2. **The agency channel.** "Audit" is the reseller's own vocabulary — a line item an agency knows how to put in a QBR. `memory/marketing/outreach.md:71` leans on this explicitly.

The correct diagnosis is therefore not *audit is a bad word*. It is **audit is inflicted, not commissioned** — an audience problem, not a vocabulary problem. The response is a register split, not a find-and-replace.

## Decision

### 1. The paid product is a **read**. "Concierge read."

The word is not imported. It already lives in three independent places in Flintmere's own canon, all predating this decision:

- `apps/scanner/src/lib/concierge-deliverable.ts:56` — *"Not a generic template — a read of your store."*
- `projects/flintmere/decisions/0022-audit-band-pricing.md:16` — *"A 200-SKU read takes 90 minutes; a 4,000-SKU read takes 8+ hours."*
- `memory/VOICE.md` §Tone by surface — the scanner register is *"Diagnostic voice. Like a doctor's report."* In medicine a radiologist **reads** a scan. The noun is the native idiom of the register the canon already prescribes.

This ADR promotes an existing word. It does not coin one.

### 2. The host is **`catalog.flintmere.com`**.

`audit.` conflated two jobs. The host carries the whole surface — `/scan` (free), `/score/[shop]` (public), `/blog`, `/bot`, `/unsubscribe` — *and* the paid product. Naming a host after one product on it is what produced the drift.

The fix makes the host a **subject** and the routes **verbs**:

```
catalog.flintmere.com/scan                      free, machine, 60s
catalog.flintmere.com/read                      paid, human, 3 days
catalog.flintmere.com/score/matersandco.com     public artefact
```

`catalog.` also survives the roadmap. Per CLAUDE.md the centrepiece is the ingestion engine; both "audit" and "scan" under-describe ingestion + standards + scoring. "Catalog" covers all of it and still fits in two years.

### 3. The noun names a step, not a verdict.

Per `strategy/2026-04-26-final-report.md:55` the moat is the ingestion *workflow*, not the taxonomy. "Audit" degraded into reading as a one-off judgement. "Read" must not inherit that trap, so the canonical framing is the ladder:

> **scan** (machine, free, 60 seconds) → **read** (human, paid, 3 days) → **fix** (applied, subscription)

Three monosyllables, escalating human involvement. Every surface that names the read should make the next rung visible.

### 4. "Audit" survives in exactly three places.

- **Legal register — frozen.** `/dpa` Clause 09 "Audit" is the GDPR Art. 28(3)(h) processor audit right; the word *is* the term of art. `/security` "SOC 2 audited" and "a formal audit" are accurate statements about third-party assurance regimes. `/privacy` "audit-trail purposes" is a security-logging term of art. Six lines total. Changing any of them would make the pages wrong.
- **Search surface — deliberate.** `shopify catalog audit` stays a target term in `seo.md`, annotated as search-surface-only, never product-name. On-page it is carried by a single FAQ entry on `/read` that answers the question and does the positioning work at once.
- **Code identifiers — untouched.** `AuditDraft` / `ConciergeAudit` Prisma models, `scanner_concierge_audits`, `auditId`, `AuditBandSlug`, `audit-pricing.ts`. Zero customer exposure. Renaming costs a migration and buys nothing.

### 5. Prices do not move.

£197 (≤1,500 SKUs) / £397 (1,501–5,000) / `From £597 — bespoke quote` (5,001+); worst-N drafted 10 / 25 / 25; operator hours 3–5 / 5–7 / 7+. Canonical: `apps/scanner/src/lib/audit-pricing.ts`. The £97 floor retired 2026-05-01 and does not return. This ADR renames a product; it re-prices nothing.

## Alternatives considered

| Candidate | Rejected because |
|---|---|
| **review** / `review.flintmere.com` | On a Shopify-adjacent surface "review" means star-ratings — Judge.me, Loox, Yotpo, Trustpilot, App Store reviews. As a *host* it is worse still: `review.flintmere.com` parses as *a site where people review Flintmere*, with no "concierge"/"catalog" prefix available to disambiguate. Considered and explicitly discarded by the operator on collision grounds. |
| **survey** | Correct psychology — you *commission* a survey; an audit is done *to* you — but it reads as questionnaire at checkout. |
| **report** | Universally understood and sells at £597, but inert: it names the paper, not the work, and every competitor calls their PDF a report. |
| **markup** | Collides with schema markup, literally the product domain. |
| **fix plan / overhaul / rewrite** | Over-promise. Flintmere *drafts* replacement text for the worst N; it does not apply fixes. Claim-review exposure under VOICE.md §AI-agent outcome claims. |
| **check-up / once-over** | Undercut a £597 price. |
| **teardown** | Trend-coded; dates fast. |
| **scan.flintmere.com** (host) | A verb hosting other verbs — `scan.flintmere.com/scan` is redundant — and it narrows as the product grows past scanning. |
| **Fold onto `flintmere.com`** | Consolidates SEO equity and deletes the cross-host machinery, but re-opens the ratified C1 three-host architecture. Out of scope for a naming decision; revisit on its own merits. |

## Consequences

**Good.** The averse noun leaves every surface a merchant reads. The host stops being named after one product on it. The product ladder becomes legible in three words. Search demand is retained deliberately rather than lost by accident. The permanent host-level 301 resolves `host-routing.ts:25` — a `TODO: 2026-08-03` that is 22 days overdue and currently unowned: the "flip to 404" option is withdrawn, because inbound links live forever.

**Costs, accepted.** Google Search Console needs a new property and change-of-address; expect 2–8 weeks of ranking wobble, mostly preserved by the 301. `https://catalog.flintmere.com/api/auth/google/callback` must be added to the Authorized redirect URIs allowlist **before** cutover — exact-match, operator-only, and missing it fails every GMC connect with `redirect_uri_mismatch`. The PostHog health signal buckets by literal host and must accept both through the transition. The `FlintmereBot/1.0` user-agent string is published in `/bot` and seen by every crawled store; it changes in lockstep or points at a redirect.

**Deliberately not fixed.** The Instagram handle cannot become `@flintmere.review` (reviews *of* Flintmere) or `@flintmere.read` (reads as a newsletter). Target `@flintmere`, falling back to `@flintmere.scan`. Operator action; availability unconfirmed at time of writing.

**Not at risk.** GMC OAuth scope verification. The redirect URI is built from `origin` at runtime (`api/auth/google/callback/route.ts:78`), and Google's Authorized-domains field takes eTLD+1 (`flintmere.com`), which already covers any subdomain. No re-verification, no new review cycle — scopes are unchanged.

## Council sign-off

- **#1 Editor** — the noun is promoted from the product's own prose, not coined. Register holds.
- **#5 Product** — deliverable shape unchanged; only the title of item 1 of 5 moves. Parity guard in spec §1.0.
- **#9 Lawyer / #23 Regulatory / #24 Data protection** — six legal-register lines frozen and enumerated. `/terms`, `/privacy`, `/dpa`, `/security` diffs route through `claim-review` before ship.
- **#11 Founder voice** — no banned phrases introduced; no marketing register on trust-load-bearing surfaces.
- **#15 GTM / #18 Sales** — agency channel keeps "audit" where it is the reseller's own vocabulary; search demand retained on-page.
- **#34 Brand / #36 Conversion / #37 Consumer psychology** — the inflicted/commissioned flip is the whole point; `/read` conversion floor re-measured at 375×812 before ship.
