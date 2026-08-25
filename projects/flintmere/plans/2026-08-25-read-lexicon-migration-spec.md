---
canon_sources:
  - memory/VOICE.md#tone-by-surface
  - memory/VOICE.md#preferred-positioning-language
  - memory/marketing/brand.md#register
  - apps/scanner/src/lib/concierge-deliverable.ts
  - apps/scanner/src/lib/audit-pricing.ts#AUDIT_BANDS
  - apps/scanner/src/lib/host-routing.ts
  - projects/flintmere/decisions/0022-audit-band-pricing.md
  - projects/flintmere/decisions/0023-gmc-oauth-ground-truth.md
canon_audit_run: 2026-08-25
binding: CLAUDE.md §Binding 2026-05-09 (canon protection)
status: draft — awaiting operator approval
---

# Retiring "audit" — the `read` lexicon + `catalog.` host migration

> 2026-08-25. Operator direction: "audit" is customer-averse and must
> leave the copy. `audit.flintmere.com` named as the most important
> single change. "Review" was considered and rejected on collision
> grounds (see §0.3).

## §0 Council pre-flight (2026-05-09 binding)

Three canonical sources, annotated:

1. **`memory/VOICE.md` §Tone by surface** — sets the scanner register as
   *"Diagnostic voice. Like a doctor's report."* A radiologist **reads**
   a scan; `read` is the native verb of the register canon already
   prescribes, so the new noun aligns rather than fights. This file also
   physically contains `audit.flintmere.com` (§Scanner results heading)
   and the phrase *"source: our concierge audits"* (§AI-agent outcome
   claims) — both in scope.
2. **`apps/scanner/src/lib/concierge-deliverable.ts`** — deliverable SSOT
   under the deliverable-parity rule. Its own `letterBody` already reads
   *"Not a generic template — a read of your store."* The word is being
   promoted from inside the product, not imported from outside it.
3. **`projects/flintmere/decisions/0022-audit-band-pricing.md` +
   `apps/scanner/src/lib/audit-pricing.ts`** — the band ladder. Prices
   are frozen through this migration: £197 (≤1,500 SKUs) / £397
   (1,501–5,000) / from £597 bespoke (5,001+). The £97 floor was retired
   2026-05-01 and must never re-appear. Renaming the noun must not drift
   a single figure.

### §0.1 The decision

| Layer | From | To |
|---|---|---|
| Host | `audit.flintmere.com` | **`catalog.flintmere.com`** |
| Paid product | Concierge audit | **Concierge read** |
| Route | `/audit` | **`/read`** |
| Social handle | `@flintmere.audit` | `@flintmere` if free, else `@flintmere.scan` |

### §0.2 Why the host and the product get different words

`audit.` conflated two jobs. The host carries the *whole* surface —
`/scan` (free), `/score/[shop]` (public), `/blog`, `/bot`,
`/unsubscribe`, and the paid product. The product names only the
£197–£597 human pass.

Naming the host after the paid product is what caused the drift. The fix
makes the host a **subject** and the routes **verbs**:

```
catalog.flintmere.com/scan                      free, machine, 60s
catalog.flintmere.com/read                      paid, human, 3 days
catalog.flintmere.com/score/matersandco.com     public artefact
```

`catalog.` also survives the roadmap: per CLAUDE.md the centrepiece is
the **ingestion engine**. Both "audit" and "scan" under-describe
ingestion + standards + scoring; "catalog" covers all of it.

### §0.3 Rejected, with reasons

- **review / `review.flintmere.com`** — parses as *a site where people
  review Flintmere*. On a Shopify-adjacent surface, "review" is the word
  for star-ratings (Judge.me, Loox, Yotpo, Trustpilot, App Store
  reviews). Fatal for a conversion page and worse for a host, where no
  "concierge"/"catalog" prefix is available to disambiguate.
- **markup** — collides with schema markup, literally the product domain.
- **survey** — good psychology (you *commission* a survey; an audit is
  done *to* you) but reads as questionnaire at checkout.
- **report** — safe and universally understood, but inert: it names the
  paper, not the work, and every competitor calls their PDF a report.
- **fix plan / overhaul / rewrite** — over-promise. Flintmere *drafts*
  replacement text for the worst N; it does not apply fixes. Claim-review
  risk under VOICE.md §AI-agent outcome claims.
- **check-up / once-over** — undercut a £597 price.
- **teardown** — trend-coded, dates fast.

## §1 The lexicon

| Now | Becomes |
|---|---|
| Concierge audit | Concierge read |
| the audit / an audit (product) | the read |
| catalog data audit | catalog read |
| A written audit letter | **A written catalog letter** |
| Audit booked *(page title)* | **Your read is booked** |
| Book the audit · £197 *(sticky CTA)* | Book the read · £197 |
| the audit team | the read team |
| your audit dashboard | your read dashboard |
| the audit ID | **your read reference** |
| audit band purchased | read band purchased |

### §1.0 Deliverable parity (required by the parity rule)

All five canonical items from `concierge-deliverable.ts:62–80`, with
post-rename form. **Only item 1 changes.** Item *bodies* were checked
and carry no instance of the word — the noun lives in the title alone.

| # | Canonical title | After |
|---|---|---|
| 1 | A written audit letter | **A written catalog letter** |
| 2 | A per-product fix CSV | unchanged |
| 3 | A 30-day fix sequence | unchanged |
| 4 | A GS1 UK barcode path | unchanged |
| 5 | A 30-day re-scan | unchanged |

**Implementer warning:** items 3 and 5 contain "30-day" and "re-scan",
item 2 contains "fix" — a broad find-replace on `audit` must not touch
them. Items 2–5 are frozen strings. This table is the guard; the
2026-05-09 deliverable-canon-alignment failure is what it prevents.

Per-band figures are unchanged by this migration and must not drift:
worst-N drafted **10 / 25 / 25**, operator hours **3–5 / 5–7 / 7+**,
prices **£197 / £397 / `From £597 — bespoke quote`** (the last is the
exact `priceDisplay` string in `audit-pricing.ts:91` — do not paraphrase
it in customer-facing copy).

**Verb list** — `memory/marketing/brand.md` §Register:
`scan, audit, fix, revert, enrich` → `scan, **read**, fix, revert, enrich`.

### §1.1 Two entries are bug fixes, not renames

- `app/layout.tsx:140` — *"Free 60-second catalog data **audit**"*
  describes the **free scan**, not the paid product. → "scan". It is
  mislabelled today and the JSON-LD carries the error.
- `app/page.tsx:119,134,149` — *"Run a weekly catalog audit"*, *"Audit
  your robots.txt"*, *"Audit your checkout"* is generic merchant advice,
  not product naming. → "**Check**". Verb, no product weight.

### §1.2 Copy polish

`writer` runs a pass over every CTA string after the mechanical swap.
"Book the read · £197" is spec'd as a placeholder, not as final copy.

## §2 Frozen — explicitly out of scope

**Legal register (5 lines). Must not change.**

| File | Line | Why |
|---|---|---|
| `app/dpa/page.tsx` | 190, 194, 197 | Clause 09 "Audit" is the GDPR Art. 28(3)(h) processor audit right. The word is the term of art. |
| `app/security/page.tsx` | 174, 176 | "SOC 2 audited", "a formal audit" — accurate statements about third-party assurance regimes. |
| `app/privacy/page.tsx` | 167 | "for audit-trail purposes" — security-logging term of art. |

**Code identifiers.** `AuditDraft` / `ConciergeAudit` Prisma models,
`scanner_concierge_audits` table, `auditId`, `AuditBandSlug`,
`audit-pricing.ts`, `audit-draft/`, `audit-handoff.ts`, Stripe metadata
keys. Zero customer exposure; renaming costs a migration and buys
nothing. Revisit only if a schema change is already in flight.

**Historical records.** Dated entries in `memory/marketing/*-history.md`,
`context/summaries/*`, and shipped ADRs 0022/0023 stay as written —
consistent with the existing convention (`metrics.md:70` leaves a
superseded price "intact as a dated record"). ADR 0022's *title* stays;
a superseding note is added.

## §3 Route migration

`/audit` → `/read`, plus:

| From | To |
|---|---|
| `/audit` | `/read` |
| `/audit/connect` | `/read/connect` |
| `/audit/connect/results` | `/read/connect/results` |
| `/audit/success` | `/read/success` |

- Permanent 301s on all four, owned by `host-routing.ts` (32 existing
  tests to extend).
- 106 in-repo `/audit…` path references follow mechanically.
- `app/audit/audit-motion.tsx` → `app/read/read-motion.tsx`.
- The delivery email builds `/audit/connect?audit=<id>` at
  `concierge-delivery-email.ts:77` — already-sent emails rely on the 301
  permanently. **This redirect can never be retired.**

### §3.1 SEO retention

The 301 carries the equity. **No separate `/shopify-catalog-audit`
landing page** — instead one FAQ entry on `/read` that contains the head
term and does positioning work simultaneously:

> **"Is this a catalog audit?"** — Yes, in substance. We stopped calling
> it that because an audit is something done *to* you. This is something
> you commission: we read your catalog product by product and hand you
> the replacement text.

One block, both jobs. Keeps `shopify catalog audit` on-page without
re-introducing the word into the product's own name.

## §4 Host migration — `audit.` → `catalog.`

### §4.1 Good news, verified

- **GMC OAuth is not at risk.** The redirect URI is constructed from
  `origin` at runtime (`callback/route.ts:78`), not hardcoded. Google's
  *Authorized domains* field takes eTLD+1 (`flintmere.com`), which
  already covers any subdomain. **No re-verification, no new Google
  review cycle** — the in-flight scope verification is untouched,
  because scopes are not changing.
- **`host-url.ts` already centralises** host construction behind
  `SCANNER_HOST`, so most call sites are parameterised.

### §4.2 The one blocking action

Add `https://catalog.flintmere.com/api/auth/google/callback` to the
**Authorized redirect URIs** allowlist in Google Cloud Console *before*
cutover. Exact-match. Miss it and every GMC connect fails
`redirect_uri_mismatch`. Operator-only — cannot be done from the repo.

### §4.3 Hardcoded literals to edit (~25)

`middleware.ts` (CSP `connect-src` + 2 comments) · `layout.tsx:119,133`
(JSON-LD `potentialAction` + `sameAs`) · `opengraph-image.tsx:137` ·
`scan/opengraph-image.tsx:144` · `blog/[slug]/opengraph-image.tsx:109` ·
`blog/rss.xml/route.ts:13` · `llms.txt/route.ts:36` · `sitemap.ts:13` ·
`sitemap/page.tsx:89,90,239` · `admin/health/_signals/posthog.ts:53` ·
`research/components/BodyBottom.tsx:428` (bot UA string) ·
`security/page.tsx:41,50` · `privacy/page.tsx:29,321` ·
`terms/page.tsx:37` · `package.json:5` · `scripts/dump-audit-markdown.ts`
· `scripts/stage-outreach-batch.ts` · `scripts/compile-store-list.ts` ·
`scripts/batch-scan.ts`.

**The bot UA string** (`FlintmereBot/1.0 (+audit.flintmere.com/bot)`)
appears in 3 places and is published in `/bot` policy and seen by every
crawled store. Change it in lockstep or the UA points at a 301.

**PostHog health signal** (`posthog.ts:53`) buckets by literal host
string and will false-alarm on cutover. Must accept both hosts through
the transition window.

### §4.4 Infrastructure

1. DNS: `catalog.flintmere.com` → DO droplet.
2. Coolify/Traefik: new router + Let's Encrypt cert.
3. Keep the `audit.` router alive **permanently** for host-level 301s —
   inbound links live forever (blog backlinks, RSS subscribers, IG bio,
   already-sent cold outreach, merchant-shared `/score/[shop]` pages).
4. Google Search Console: new property + change-of-address. Expect
   2–8 weeks of ranking wobble; the 301 preserves most equity, not
   instantly.
5. Stripe: checkout success/cancel URLs.
6. `apps/shopify-app` — verified clean, no host references.

### §4.5 Resolves existing debt

`host-routing.ts:25-26` carries `TODO: 2026-08-03` on the cross-host
90-day 301 window — **22 days overdue and unowned**. This migration
resolves it: host-level 301s become permanent (§4.4.3), so the
"flip to 404" option is withdrawn and the TODO is deleted.

## §5 Social handle

`@flintmere.audit` → `@flintmere` if available, else `@flintmere.scan`.

**Not `@flintmere.review`** — parses as *reviews of Flintmere*.
**Not `@flintmere.read`** — reads as a reading/newsletter account.

The account posts top-of-funnel scan content, so `.scan` matches what it
actually promotes. Operator-only action; the repo change is
`layout.tsx:103` (JSON-LD `sameAs`) plus `memory/marketing/` pointers.

## §6 Canon files to update

| File | Change |
|---|---|
| `memory/VOICE.md` | §Tone by surface heading `audit.flintmere.com` → `catalog.flintmere.com`; §AI-agent outcome claims *"source: our concierge audits"* → *"our concierge reads"*; §Active voice example *"We audit your catalog"* → *"We read your catalog"* |
| `memory/marketing/brand.md` | §Register verb list; §Pricing code-canon pointer |
| `memory/marketing/seo.md` | Keyword table — keep `shopify catalog audit` as a **target term** (demand is real); annotate that the word is search-surface-only, never product-name |
| `memory/marketing/metrics.md` | "Paid concierge audits per week" → "Paid concierge reads per week" |
| `memory/marketing/audiences.md` | Scanner host reference |
| `memory/canon-source-register.md` | §A1/§A2 file paths + URLs. **Note pre-existing drift**: register cites `https://flintmere.com/audit`, but the page lives on the scanner host. Fix while here. |
| `projects/flintmere/BUSINESS.md` | §audits → §reads; keep the competitor line *"one-time consulting audits"* (that describes competitors, correctly) |
| `CLAUDE.md` | Product snapshot host + Canon hygiene entry |
| ADR 0022 | Superseding note, title unchanged |
| **New ADR 0028** | Records the lexicon retirement + host migration |

## §7 Sequencing — two shipments, not one

**Shipment 1 — lexicon + route.** Days. Zero infra risk, zero Google
exposure, fully reversible. Ships the customer-facing value immediately.
§1, §3, §5 (JSON-LD half), §6.

**Shipment 1 file checklist — reuse ADR 0022's `Affects:` list**
(`decisions/0022-audit-band-pricing.md:8`). It already enumerates every
surface carrying band/audit copy: `audit-pricing.ts`,
`api/concierge/checkout`, `api/webhooks/stripe`,
`audit/{page,CheckoutCard,success}`, `lib/{concierge-email,report-email,
copy}.ts`, `pricing/page.tsx`, `for/{food-and-drink,beauty,apparel,
plus}`, `research/components/CTA.tsx`,
`components/{EmailGate,sections/FounderStrip}`, `terms/page.tsx`,
`schema.prisma`, `BUSINESS.md`, `STATUS.md`, `CLAUDE.md`. Every entry is
in scope for the rename except the schema (frozen, §2).

**Shipment 2 — host migration.** Own PR, gated on §4.2 being done first.
§4 in full.

Splitting them means a DNS/TLS/GSC problem cannot hold the copy change
hostage, and each PR stays reviewable. Per anti-waste rule 7, both cut
fresh from `origin/main`.

## §8 Gates

- `canon-audit` on the full diff — customer-facing copy, pricing claims,
  metadata, error strings.
- `claim-review` on `/terms`, `/privacy`, `/dpa`, `/security` diffs —
  Legal Council veto (#9 + #23 + #24). The frozen-list in §2 is the
  thing being checked.
- `host-routing.test.ts` — extend the 32 existing tests: new host in
  `KNOWN_HOSTS`, `/read*` classification, `/audit*` → `/read*` 301,
  `audit.` → `catalog.` host 301.
- E2E: the only suite is `e2e/mobile-reflow.spec.ts`, covering `/`,
  `/bot`, `/methodology`, `/pricing`, `/scan` — it does **not** touch
  `/audit`, so nothing breaks, but `/read` has no E2E coverage either.
  Add `/read` to the reflow route list (it is the conversion page and
  the conversion floor in §8 is measured there).
- Deliverable-parity: `/read`, `/read/success`, `concierge-email.ts`, and
  `concierge-deliverable.ts` must still agree after the rename. Mismatch
  is an automatic P0.
- **Trust-load-bearing surfaces**: `/read/connect` (OAuth handoff) and
  `/read/success` (post-purchase) ship **type-only**. The rename must not
  introduce marketing register, decorative imagery, or a photoreal moment
  on either. Bracket signature carries the brand work.
- **Conversion floor** (global instruction): re-measure `/read` at
  375×812 — price, primary action, and first price-changing control
  positions; every tap target ≥24×24. Report the numbers, don't assert.

## §9 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| GMC redirect URI not allowlisted before cutover | **High** | §4.2 is a hard gate on Shipment 2 |
| Search ranking dip on host change | Medium | Permanent 301s + GSC change-of-address; accept 2–8 weeks |
| PostHog health signal false-alarms | Medium | Dual-host bucketing through transition |
| Bot UA points at a 301 | Low | Change UA + `/bot` policy in lockstep |
| "read" reads as read/write data access | Low | Never bare on cold surfaces — "Concierge read", "we read your catalog" |
| Product/host words diverge and confuse | Low | Intended: host = subject, route = verb (§0.2) |

## §10 Open items

1. Is `@flintmere` available on Instagram? Determines §5.
2. ADR 0028 — write before Shipment 1, so the PR references it. Two
   things canon-audit requires it to carry:
   - **The workflow framing.** Per `strategy/2026-04-26-final-report.md:55`
     the moat is the ingestion *workflow*, not the taxonomy. "Audit" fell
     into reading as a one-off verdict; `scan → read → fix` must be stated
     as the rationale so "read" does not inherit the same trap. The noun
     names a step, not a judgement.
   - **The word is native, not imported.** Three independent places it
     already lives in Flintmere's own canon, predating this decision:
     `concierge-deliverable.ts:56` (*"a read of your store"*),
     `decisions/0022:16` (*"a 200-SKU read takes 90 minutes"*), and
     `VOICE.md` §Tone by surface (the doctor's-report register, where a
     radiologist reads a scan).
3. `data/` and `.claude/worktrees/` copies of affected files — confirm
   worktrees are stale before editing (they mirror pre-migration state).
