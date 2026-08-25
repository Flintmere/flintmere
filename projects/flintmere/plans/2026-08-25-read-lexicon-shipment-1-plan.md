# Read-lexicon Shipment 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.


> **AMENDED 2026-08-25 (ADR 0028 Amendment 1).** The product noun is
> **The Catalog Letter**, route `/catalog-letter`. "Read" survives as the
> VERB only ("we read your catalog product by product") and must never
> appear as a bare noun — Wave 0 produced six noun/verb collisions, all of
> them noun uses. Deliverable item 1 is `A 1,500-word letter`, differentiated
> from the product name. Tasks 1, 3, 6, 9 were implemented against the
> superseded noun and are re-swept by Task 0.5.

**Goal:** Remove "audit" as Flintmere's product noun from every customer-facing surface, replacing it with "read", and move `/audit` to `/catalog-letter` behind permanent redirects — without touching the host, the legal register, or any code identifier.

**Architecture:** Three mechanical layers applied in dependency order. (1) Routing: register `/catalog-letter` in `host-routing.ts` and add `next.config.ts` redirects, so the new path resolves before any file moves. (2) Filesystem: move `app/audit/**` → `app/catalog-letter/**`. (3) Copy: sweep the product noun across components, emails, metadata and canon docs, gated by an explicit frozen-string list.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest (`pnpm --filter scanner test`), Playwright (`e2e/`), Prisma (untouched — schema is frozen).

## Global Constraints

Copied verbatim from `projects/flintmere/plans/2026-08-25-read-lexicon-migration-spec.md`. Every task's requirements implicitly include this section.

- **Scope is Shipment 1 only.** Do NOT touch `audit.flintmere.com` — the host string stays exactly as-is in all 39 places it appears. That is Shipment 2.
- **FROZEN — six legal lines. Changing any of them makes the page factually wrong:**
  - `apps/scanner/src/app/dpa/page.tsx:190,194,197` — GDPR Art. 28(3)(h) processor audit right
  - `apps/scanner/src/app/security/page.tsx:174,176` — "SOC 2 audited", "a formal audit"
  - `apps/scanner/src/app/privacy/page.tsx:167` — "for audit-trail purposes"
- **FROZEN — all code identifiers.** `AuditDraft`, `ConciergeAudit`, `scanner_concierge_audits`, `auditId`, `AuditBandSlug`, `auditScope`, `audit-pricing.ts`, `audit-draft/`, `audit-handoff.ts`, Stripe metadata keys. Zero customer exposure; renaming costs a migration and buys nothing.
- **FROZEN — deliverable items 2–5.** `A per-product fix CSV`, `A 30-day fix sequence`, `A GS1 UK barcode path`, `A 30-day re-scan`. Only item 1's title changes. Items 3 and 5 contain "30-day"/"re-scan" and item 2 contains "fix" — a broad find-replace must not reach them.
- **FROZEN — prices.** £197 / £397 / `From £597 — bespoke quote`; worst-N 10/25/25; hours 3–5/5–7/7+. Canonical: `apps/scanner/src/lib/audit-pricing.ts`. Never cite £97.
- **Never run a bare `find | xargs sed s/audit/read/`.** Every task names its exact strings.
- **Redirects are 308, not 301.** Next.js `permanent: true` emits 308. Verified against Next.js docs 2026-08-25. Both are permanent; assert 308 in tests.
- **British English.** No banned adjectives (leverage, optimise, seamless, robust, scalable, premium, world-class…). No exclamation marks. No emoji.
- **Trust-load-bearing surfaces** — `/catalog-letter/connect` (OAuth) and `/catalog-letter/success` (post-purchase) ship type-only. No marketing register, no decorative imagery.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `apps/scanner/src/lib/host-routing.ts` | Route→host classification. Add `/catalog-letter`, `/catalog-letter/success`; retain `/audit` entries so in-flight requests classify before the redirect fires. | 1 |
| `apps/scanner/src/lib/host-routing.test.ts` | Classification matrix. | 1 |
| `apps/scanner/next.config.ts` | Same-host permanent redirects `/audit/*` → `/read/*`. New `redirects()` block — none exists today. | 1 |
| `apps/scanner/src/app/catalog-letter/**` | Moved from `app/audit/**`. `audit-motion.tsx` → `letter-motion.tsx`. | 2 |
| `apps/scanner/src/lib/concierge-deliverable.ts` | Deliverable SSOT. Item 1 title only. | 3 |
| `apps/scanner/src/lib/copy.ts` | Re-exports + CTA strings. | 3 |
| Email modules (`concierge-email`, `concierge-delivery-email`, `concierge-refund-email`, `report-email`, `rescan-email`, `rescan-30-day`) | Transactional bodies. | 5 |
| `privacy/page.tsx`, `terms/page.tsx` | Legal-class copy — separate task, `claim-review` gated. | 6 |
| `llms.txt`, `sitemap.ts`, `sitemap/page.tsx`, `layout.tsx` | Machine-readable metadata + JSON-LD. | 7 |
| `memory/**`, `BUSINESS.md`, `CLAUDE.md` | Canon docs. | 9 |

---

### Task 1: Register `/catalog-letter` and add permanent redirects

Routing first, so `/catalog-letter` resolves before any file moves and the redirect is testable in isolation.

**Files:**
- Modify: `apps/scanner/src/lib/host-routing.ts:82-90` (`SCANNER_ROUTES`)
- Modify: `apps/scanner/next.config.ts` (add `redirects()`)
- Test: `apps/scanner/src/lib/host-routing.test.ts`

**Interfaces:**
- Consumes: `classifyRoute(pathname: string): HostAssignment` — existing, unchanged signature.
- Produces: `/catalog-letter` and `/catalog-letter/success` classify as `'scanner'`. `/audit*` continues to classify as `'scanner'` (do not delete those entries — a request arriving mid-flight must classify correctly).

- [ ] **Step 1: Write the failing test**

Append to the scanner block in `apps/scanner/src/lib/host-routing.test.ts`:

```typescript
describe('read routes (ADR 0028)', () => {
  it.each([
    ['/catalog-letter', 'scanner'],
    ['/catalog-letter/success', 'scanner'],
    ['/catalog-letter/connect', 'scanner'],
    ['/catalog-letter/connect/results', 'scanner'],
  ])('classifies %s as scanner', (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });

  it.each([
    ['/audit', 'scanner'],
    ['/audit/success', 'scanner'],
  ])('still classifies legacy %s as scanner', (path, expected) => {
    expect(classifyRoute(path)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter scanner test host-routing`
Expected: FAIL — `/catalog-letter` returns `'marketing'` (it falls through to the unknown-marketing default).

- [ ] **Step 3: Register the routes**

In `apps/scanner/src/lib/host-routing.ts`, `SCANNER_ROUTES`. Order matters — the list is matched longest-first, so `/catalog-letter/success` precedes `/catalog-letter`:

```typescript
export const SCANNER_ROUTES: readonly string[] = [
  '/catalog-letter/success',
  '/audit/success',
  '/admin',
  '/score',
  '/scan',
  '/catalog-letter',
  '/audit',
  '/blog',
  '/bot',
  '/unsubscribe',
];
```

Update the doc comment above it to name `/catalog-letter` as canonical and `/audit` as the retained legacy prefix.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter scanner test host-routing`
Expected: PASS, and all 76 pre-existing tests still pass.

- [ ] **Step 5: Add the redirects**

`apps/scanner/next.config.ts` has `rewrites()` and `headers()` but no `redirects()`. Add one. Route order in Next.js is headers → redirects → middleware, so this fires before the cross-host logic.

```typescript
  async redirects() {
    return [
      // ADR 0028 — /audit retired in favour of /read. Permanent, and
      // never to be removed: delivery emails already sent build
      // /audit/connect?audit=<id> links (concierge-delivery-email.ts),
      // and inbound links from outreach and shared score pages persist.
      { source: '/audit', destination: '/catalog-letter', permanent: true },
      { source: '/audit/:path*', destination: '/read/:path*', permanent: true },
    ];
  },
```

`:path*` (not `:slug`) is required — `:slug` does not match nested paths, and `/audit/connect/results` is two levels deep.

- [ ] **Step 6: Verify the redirect end-to-end**

Run: `pnpm --filter scanner build && pnpm --filter scanner start`
Then: `curl -sI localhost:3000/audit/connect/results | head -3`
Expected: `HTTP/1.1 308 Permanent Redirect` and `location: /catalog-letter/connect/results`.

Note 308, not 301 — `permanent: true` emits 308. Both are permanent redirects and Google treats them equivalently.

- [ ] **Step 7: Commit**

```bash
git add apps/scanner/src/lib/host-routing.ts apps/scanner/src/lib/host-routing.test.ts apps/scanner/next.config.ts
git commit -m "feat(scanner): register /read routes + permanent /audit redirects (ADR 0028)"
```

---

### Task 2: Move the route tree

**Files:**
- Move: `apps/scanner/src/app/audit/` → `apps/scanner/src/app/catalog-letter/`
- Rename: `apps/scanner/src/app/catalog-letter/audit-motion.tsx` → `letter-motion.tsx`

**Interfaces:**
- Consumes: `/catalog-letter` classification from Task 1.
- Produces: `app/catalog-letter/page.tsx`, `app/catalog-letter/success/page.tsx`, `app/catalog-letter/connect/page.tsx`, `app/catalog-letter/connect/results/page.tsx`, `app/catalog-letter/opengraph-image.tsx`. Component export names (`BandTriptych`, `CheckoutCard`, `DeliverableLift`) are unchanged.

- [ ] **Step 1: Move the tree with git**

```bash
cd /Users/abuaa/Projects/Flintmere
git mv apps/scanner/src/app/audit apps/scanner/src/app/catalog-letter
git mv apps/scanner/src/app/catalog-letter/audit-motion.tsx apps/scanner/src/app/catalog-letter/letter-motion.tsx
```

`git mv` preserves history — do not delete-and-recreate.

- [ ] **Step 2: Fix the motion-module import**

`apps/scanner/src/app/catalog-letter/page.tsx` imports `DeliverableLift`:

```typescript
import { DeliverableLift } from './letter-motion';
```

- [ ] **Step 3: Find every remaining internal link to the old path**

```bash
grep -rn "'/audit\|\"/audit\|href=\"/audit\|/audit/connect\|/audit/success" apps/scanner/src --include="*.ts" --include="*.tsx" | grep -v "/api/audit" | grep -v "audit-draft"
```

Two exclusions are deliberate: `/api/audit/gmc-access-request` is an API route (frozen identifier), and `audit-draft` is the operator console (frozen).

Rewrite each hit to `/read…`. The redirect from Task 1 would catch them, but an internal link that costs a 308 round-trip is a defect.

- [ ] **Step 4: Typecheck and test**

Run: `pnpm --filter scanner typecheck && pnpm --filter scanner test`
Expected: PASS. A failure here is almost certainly a stale relative import inside the moved tree.

- [ ] **Step 5: Commit**

```bash
git add -A apps/scanner/src
git commit -m "refactor(scanner): move app/audit tree to app/catalog-letter (ADR 0028)"
```

---

### Task 3: Deliverable SSOT + copy module

The P0 from canon-audit lives here. Item 1's title is the only deliverable string that moves.

**Files:**
- Modify: `apps/scanner/src/lib/concierge-deliverable.ts:62`
- Modify: `apps/scanner/src/lib/copy.ts:45-50,71`
- Test: `apps/scanner/src/lib/concierge-deliverable.test.ts` (create if absent)

**Interfaces:**
- Consumes: `bandBySlug`, `AuditBandSlug` from `audit-pricing.ts` — frozen, unchanged.
- Produces: `conciergeDeliverableItems(slug)` still returns exactly 5 items in the same order; only `[0].title` changes.

- [ ] **Step 1: Write the failing parity test**

```typescript
import { describe, expect, it } from 'vitest';
import { conciergeDeliverableItems } from './concierge-deliverable';

describe('deliverable parity (ADR 0028)', () => {
  it.each(['band-1', 'band-2', 'band-3'] as const)(
    'keeps five items in canonical order for %s',
    (slug) => {
      expect(conciergeDeliverableItems(slug).map((i) => i.title)).toEqual([
        'A 1,500-word letter',
        'A per-product fix CSV',
        'A 30-day fix sequence',
        'A GS1 UK barcode path',
        'A 30-day re-scan',
      ]);
    },
  );

  it('never says "audit" in any deliverable string', () => {
    for (const slug of ['band-1', 'band-2', 'band-3'] as const) {
      for (const item of conciergeDeliverableItems(slug)) {
        expect(`${item.title} ${item.body}`.toLowerCase()).not.toContain('audit');
      }
    }
  });
});
```

The second test is the standing guard against regression — it fails loudly if anyone reintroduces the noun.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter scanner test concierge-deliverable`
Expected: FAIL — received `'A written audit letter'`.

- [ ] **Step 3: Change the one title**

`apps/scanner/src/lib/concierge-deliverable.ts:62`:

```typescript
      title: 'A 1,500-word letter',
```

Do not touch lines 66, 70, 75, 80. Update the module doc-comment's references to "the concierge audit deliverable" → "the concierge read deliverable", and the `/audit` path references → `/catalog-letter`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter scanner test concierge-deliverable`
Expected: PASS, both tests.

- [ ] **Step 5: Update `copy.ts`**

In `apps/scanner/src/lib/copy.ts`, lines 45–50 and 71 are comments describing the deliverable and the `/audit` redesign. Rewrite "audit" → "read" in the prose, and `/audit` → `/catalog-letter` in the path reference. Line 2–3 imports from `./audit-pricing` are frozen — leave them.

- [ ] **Step 6: Commit**

```bash
git add apps/scanner/src/lib/concierge-deliverable.ts apps/scanner/src/lib/concierge-deliverable.test.ts apps/scanner/src/lib/copy.ts
git commit -m "feat(scanner): deliverable item 1 becomes 'A written catalog letter' (ADR 0028)"
```

---

### Task 4: Product-noun sweep across conversion + marketing surfaces

**Files (ADR 0022's `Affects:` list, minus frozen entries):**
- `apps/scanner/src/app/catalog-letter/{page,BandTriptych,CheckoutCard}.tsx`
- `apps/scanner/src/app/catalog-letter/success/page.tsx`
- `apps/scanner/src/app/catalog-letter/connect/**`
- `apps/scanner/src/app/pricing/{page.tsx,ConciergeBands.tsx,PricingTiersGrid.tsx}`
- `apps/scanner/src/app/for/{food-and-drink,beauty,apparel,plus}/page.tsx`
- `apps/scanner/src/app/research/components/CTA.tsx`
- `apps/scanner/src/components/{EmailGate.tsx,sections/FounderStrip.tsx,sections/MerchantCenterSection.tsx,sections/ScanCallout.tsx,methodology/BottomChapters.tsx,scan/*.tsx}`
- `apps/scanner/src/app/{not-found,contact,scan,score/[shop],support,secret,cookies}/page.tsx`
- `apps/scanner/src/lib/{concierge-sla,contact-routing,stripe-invoice,methodology-data,gmc-copy}.ts`

**Interfaces:**
- Consumes: the lexicon table from spec §1.
- Produces: no exported-symbol changes. Copy strings only.

- [ ] **Step 1: Generate the worklist**

```bash
cd /Users/abuaa/Projects/Flintmere/apps/scanner/src
grep -rn "[Aa]udit" app components lib --include="*.ts" --include="*.tsx" \
  | grep -v "\.test\." \
  | grep -vE "AuditBandSlug|auditId|auditScope|AuditDraft|auditDraft|ConciergeAudit|scanner_concierge_audits|audit-pricing|audit-draft|audit-handoff" \
  | grep -v "audit\.flintmere\.com" \
  | grep -v "app/dpa/page.tsx" \
  | grep -vE "security/page.tsx:(174|176)" \
  | grep -vE "privacy/page.tsx:167" \
  | grep -v "app/privacy" | grep -v "app/terms"
```

Privacy and terms are excluded here — they are Task 6, because they need `claim-review`.

- [ ] **Step 2: Apply the lexicon**

Per spec §1, in every line the worklist returns:

| From | To |
|---|---|
| Concierge audit | **The Catalog Letter** (ADR 0028 Amendment 1) |
| the audit / an audit / your audit | the letter / your catalog letter — NEVER "the read" as a noun |
| catalog data audit | catalog letter |
| Book the audit · £197 | Book your catalog letter · £197 |
| the audit team | the Flintmere team |
| Audit booked | Your catalog letter is booked |
| audits (plural, product) | catalog letters |

Do NOT change: any line containing `audit.flintmere.com`; the frozen legal lines; identifier tokens.

- [ ] **Step 3: Rename the cross-file DOM id — both files, one commit**

`id="audit-hero"` lives on the `<h1>` in `BandTriptych.tsx:104` and is
referenced by `aria-labelledby="audit-hero"` in `page.tsx:83`. They must
change together. Sweeping one without the other leaves the hero section
with no accessible name — a WCAG 4.1.2 failure that no test in this repo
catches, because the id still *parses*, it just points at nothing.

`app/catalog-letter/BandTriptych.tsx:104`:

```tsx
        id="letter-hero"
```

`app/catalog-letter/page.tsx:83`:

```tsx
          aria-labelledby="letter-hero"
```

Verify the pair resolves:

```bash
cd /Users/abuaa/Projects/Flintmere/apps/scanner/src/app/catalog-letter
grep -rn "letter-hero" . | wc -l   # expect 2
grep -rn "audit-hero" . | wc -l  # expect 0
```

- [ ] **Step 4: Metadata titles**

`app/catalog-letter/page.tsx` metadata:

```typescript
export const metadata: Metadata = {
  title: 'Concierge read — from £197',
  description:
    'We read your Shopify store product by product and send a written catalog letter plus a per-product fix CSV within three working days. Three SKU bands — £197 / £397 / from £597. 30-day re-scan included.',
  alternates: { canonical: '/catalog-letter' },
};
```

`app/catalog-letter/success/page.tsx` metadata `title: 'Your read is booked'`.

- [ ] **Step 5: Verify no product-noun survives**

```bash
cd /Users/abuaa/Projects/Flintmere/apps/scanner/src
grep -rn "[Cc]oncierge audit\|the audit\|an audit\|your audit\|Book the audit" app components lib --include="*.tsx" --include="*.ts" | grep -v "\.test\." | grep -v "app/privacy" | grep -v "app/terms"
```

Expected: no output.

- [ ] **Step 6: Typecheck, test, commit**

```bash
pnpm --filter scanner typecheck && pnpm --filter scanner test
git add -A apps/scanner/src
git commit -m "feat(scanner): 'concierge audit' becomes 'concierge read' across conversion surfaces (ADR 0028)"
```

---

### Task 5: Transactional emails

Separate task: these are already-sent artefacts' successors and a reviewer may want to gate them independently.

**Files:**
- `apps/scanner/src/lib/concierge-email.ts:40,45,120,173,213,243`
- `apps/scanner/src/lib/concierge-delivery-email.ts:2,43-45,107,109,147,171`
- `apps/scanner/src/lib/concierge-refund-email.ts:2,9,47,73,75,81,109,173` (operator-facing — still rename for internal consistency)
- `apps/scanner/src/lib/{report-email,rescan-email,rescan-30-day}.ts`
- Tests: `concierge-delivery-email.test.ts`, `rescan-30-day.test.ts`

**Interfaces:**
- Consumes: `conciergeDeliverableItems` from Task 3 (item 1 already renamed).
- Produces: no signature changes. `auditId` parameter name is frozen; only the URL it builds changes.

- [ ] **Step 1: Update the connect URL**

`concierge-delivery-email.ts:77` — the path moves, the query-param name does not (`audit=` is tied to the frozen `auditId`):

```typescript
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com'}/catalog-letter/connect?audit=${encodeURIComponent(auditId)}`
```

The `audit.flintmere.com` fallback host stays — that is Shipment 2.

- [ ] **Step 2: Apply the lexicon to email bodies**

Subject lines and headers:
- `concierge-email.ts:213` → `` subject: `You're in — Flintmere concierge read (${bandLabel}) for ${shopUrl}` ``
- `concierge-email.ts:173` → `` `Flintmere concierge read — you're in. Payment confirmed.` ``
- `concierge-email.ts:120` → `Concierge read · ${esc(bandLabel)} · ${esc(shopUrl)}`
- `concierge-delivery-email.ts:171` → `` subject: `Your Flintmere read — ${shopUrl}` ``
- `concierge-delivery-email.ts:109` → `Your read&rsquo;s <span …>[&nbsp;in&nbsp;]</span>.`
- `concierge-email.ts:243` → `${scopeLabel} read + 1,500-word letter + per-product CSV (worst ${worstN} fully drafted) + 30-day plan + GS1 UK path. 30-day re-scan included.`

- [ ] **Step 3: Update the affected tests**

`concierge-delivery-email.test.ts` and `rescan-30-day.test.ts` assert on body substrings. Update expected strings to match.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter scanner test concierge && pnpm --filter scanner test rescan`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/scanner/src/lib
git commit -m "feat(scanner): transactional emails say 'read' (ADR 0028)"
```

---

### Task 6: Legal-class copy — `claim-review` gated

**STOP: this task requires a `claim-review` pass before commit.** Legal Council veto (#9 + #23 + #24). Privacy and terms describe data categories and contractual obligations; renaming a data category in a privacy notice is a legal-class edit.

**Files:**
- `apps/scanner/src/app/privacy/page.tsx:88,183,225,227,334,385,411,440,454` — **NOT line 167**
- `apps/scanner/src/app/terms/page.tsx:10,52,62,97,154,195`

**Interfaces:** none — prose only.

- [ ] **Step 1: Apply the lexicon, honouring the frozen line**

- `privacy:88` and `privacy:385` — "the audit ID that brought you to the page" → "the read reference that brought you to the page"
- `privacy:183` — "Stripe concierge audit records" → "Stripe concierge read records"
- `privacy:225,227` — "concierge audits, Agency, and Plus tiers" → "concierge reads, …"; "audit band purchased" → "read band purchased"
- `privacy:334` — "tokens to the audit team" → "to the read team"
- `privacy:411,440,454` — "your audit" → "your read"; "the audit" → "the read"; "your Flintmere audit dashboard" → "read dashboard"
- `privacy:167` — **DO NOT TOUCH.** "for audit-trail purposes."
- `terms:10,52,62,97,154,195` — "concierge audits" → "concierge reads"; "a one-off written audit" → "a one-off written read"; "the audit reads ground-truth" → "the read uses ground-truth" (avoids "the read reads")
- `terms` — leave `audit.flintmere.com` at line 37 untouched (Shipment 2).

- [ ] **Step 2: Verify the frozen lines survived**

```bash
cd /Users/abuaa/Projects/Flintmere/apps/scanner/src
sed -n '167p' app/privacy/page.tsx
sed -n '190p;194p;197p' app/dpa/page.tsx
sed -n '174p;176p' app/security/page.tsx
```

Expected: all six still contain "audit". If any lost it, revert that line.

- [ ] **Step 3: Run `claim-review`**

Invoke the `claim-review` skill on the `privacy/page.tsx` and `terms/page.tsx` diffs. Do not proceed on a FAIL.

- [ ] **Step 4: Commit**

```bash
git add apps/scanner/src/app/privacy/page.tsx apps/scanner/src/app/terms/page.tsx
git commit -m "feat(scanner): legal-page copy says 'read'; GDPR/SOC-2 audit terms preserved (ADR 0028)"
```

---

### Task 7: Machine-readable metadata + JSON-LD

**Files:**
- `apps/scanner/src/app/llms.txt/route.ts:36,38,42,66,72`
- `apps/scanner/src/app/sitemap.ts:50`
- `apps/scanner/src/app/sitemap/page.tsx:61,265`
- `apps/scanner/src/app/layout.tsx:103,140`
- `apps/scanner/src/app/catalog-letter/opengraph-image.tsx`, `apps/scanner/src/lib/og/og-content.ts`

**Interfaces:**
- Produces: `/catalog-letter` appears in `sitemap.xml`; `/audit` is removed from it (a sitemap must list canonical URLs, never redirects).

- [ ] **Step 1: Sitemap**

`app/sitemap.ts:50` — replace the path, keep priority:

```typescript
  { path: '/catalog-letter', changeFrequency: 'monthly', priority: 0.9 },
```

- [ ] **Step 2: llms.txt**

`app/llms.txt/route.ts:42`:

```typescript
- [Concierge read](https://${SCANNER_HOST}/read): one-off expert catalog read (band-priced).
```

Line 38 — "one-off concierge audits" → "one-off concierge reads". Line 66 — "one-off audit bands" → "one-off read bands". Line 72 — "Audit scanner" → "Catalog scanner". Line 36's `# Flintmere — Audit (audit.flintmere.com)` heading: change the word "Audit" → "Catalog" but leave the parenthesised host (Shipment 2).

- [ ] **Step 3: JSON-LD in `layout.tsx`**

Line 140 is the mislabel bug — this describes the **free scan**, not the paid product:

```typescript
                    'Free 60-second catalog data scan for any public Shopify store.',
```

Line 103 — the Instagram `sameAs`. **Leave unchanged for now.** The handle move is an operator action outside the repo, and pointing `sameAs` at a handle that does not yet exist is worse than pointing at one that does. Add a comment:

```typescript
                  // ADR 0028 §5 — handle move to @flintmere (or
                  // @flintmere.scan) is an operator action. Update this
                  // sameAs in the same change, not before.
                  'https://instagram.com/flintmere.audit',
```

- [ ] **Step 4: Sitemap page + OG**

`sitemap/page.tsx:61` — label `'Concierge audit'` → `'Concierge read'`, href `/audit` → `/catalog-letter`. Line 265 — "The public catalog-readiness audit." → "The public catalog-readiness scan." (it describes the scanner host, not the paid product). Leave lines 89, 90, 239 — those are host strings.

`lib/og/og-content.ts` — rename the `auditCard()` export's *copy strings* only; the function name is internal, rename it to `readCard()` and update `app/catalog-letter/opengraph-image.tsx:6`.

- [ ] **Step 5: Verify sitemap output**

Run: `pnpm --filter scanner build && pnpm --filter scanner start`
Then: `curl -s localhost:3000/sitemap.xml | grep -c "/audit"`
Expected: `0`.

- [ ] **Step 6: Commit**

```bash
git add apps/scanner/src/app apps/scanner/src/lib/og
git commit -m "feat(scanner): metadata, sitemap + llms.txt point at /read (ADR 0028)"
```

---

### Task 8: The SEO-retention FAQ

Spec §3.1. One block that holds the head term and does the positioning work at once.

**Files:**
- Modify: `apps/scanner/src/app/catalog-letter/page.tsx` (FAQ section)

**There is no FAQ section on this page.** The page has four sections —
checkout, deliverables, how-it-works, legal (`aria-labelledby` ids at
lines 83, 115, 255, 356). The file's own header comment claims
"Chapters 2-5 (deliverables, how-it-works, trust, FAQ)" but the FAQ was
never built; the comment is stale. This task creates the section.

- [ ] **Step 1: Insert a new section immediately before the legal section**

Modelled on the legal section's structure (same `max-w-[1280px]`
wrapper, same `clamp()` padding, same `data-reveal` motion grammar).
Bracket budget: this section takes one anchor bracket, `[ commission ]`,
which keeps it inside the per-section budget of 1.

```tsx
        <section
          aria-labelledby="faq-heading"
          className="relative bg-[color:var(--color-paper)]"
        >
          <div
            className="mx-auto w-full max-w-[1280px]"
            style={{
              paddingLeft: 'clamp(24px, 5vw, 64px)',
              paddingRight: 'clamp(24px, 5vw, 64px)',
              paddingTop: 'clamp(72px, 10vh, 128px)',
              paddingBottom: 'clamp(56px, 8vh, 96px)',
            }}
          >
            <p
              data-reveal
              className="eyebrow-hero"
              style={{
                marginBottom: 'clamp(28px, 3vw, 48px)',
                ['--reveal-delay' as string]: `${D_EYEBROW}ms`,
              }}
            >
              <span aria-hidden="true">// </span>the question we get asked
            </p>

            <h2
              id="faq-heading"
              data-reveal
              className="font-sans"
              style={{
                fontSize: 'clamp(28px, 3.4vw, 44px)',
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                color: 'var(--color-ink)',
                maxWidth: '20ch',
                ['--reveal-delay' as string]: `${D_HEADLINE}ms`,
              }}
            >
              Is this a catalog audit?
            </h2>

            <p
              data-reveal
              className="font-sans"
              style={{
                marginTop: 'clamp(20px, 2.4vw, 32px)',
                fontSize: 'clamp(15px, 1.2vw, 18px)',
                lineHeight: 1.65,
                color: 'var(--color-mute)',
                maxWidth: '62ch',
                ['--reveal-delay' as string]: `${D_SUPPORT}ms`,
              }}
            >
              Yes, in substance. We stopped calling it that because an audit
              is something done <em>to</em> you. This is something you{' '}
              <Bracket>commission</Bracket> — we read your catalog product by
              product and hand you the replacement text, ready to paste into
              Shopify.
            </p>
          </div>
        </section>
```

`Bracket` and the `D_EYEBROW` / `D_HEADLINE` / `D_SUPPORT` motion
constants are already imported and defined at the top of the file
(lines 4 and 54-58). No new imports needed.

- [ ] **Step 2: Verify the head term is present exactly once**

```bash
grep -c "catalog audit" apps/scanner/src/app/catalog-letter/page.tsx
```

Expected: `1`.

- [ ] **Step 3: Commit**

```bash
git add apps/scanner/src/app/catalog-letter/page.tsx
git commit -m "feat(scanner): FAQ entry retains 'catalog audit' search term on /read (ADR 0028)"
```

---

### Task 9: The advice-copy bug fix

`app/page.tsx` uses "audit" as a generic verb in merchant advice. Not product naming — the fix is a plainer verb.

**Files:**
- Modify: `apps/scanner/src/app/page.tsx:74,119,134,149`

- [ ] **Step 1: Replace the verb**

- `:119` — "Run a weekly catalog audit:" → "Run a weekly catalog check:"
- `:134` — "Audit your robots.txt for" → "Check your robots.txt for"
- `:149` — "Audit your checkout for" → "Check your checkout for"
- `:74` — "Then audit your description for fields" → "Then check your description for fields"

- [ ] **Step 2: Verify**

```bash
grep -in "audit" apps/scanner/src/app/page.tsx
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/scanner/src/app/page.tsx
git commit -m "fix(scanner): homepage advice copy uses 'check', not 'audit' (ADR 0028)"
```

---

### Task 10: Canon documents

**Files:**
- `memory/VOICE.md` — §Active voice example; §AI-agent outcome claims "(source: our concierge audits)" → "our concierge reads". **Leave the §Scanner results heading's `audit.flintmere.com`** — Shipment 2.
- `memory/marketing/brand.md:58` — verb table `scan, audit, fix, revert, enrich` → `scan, read, fix, revert, enrich`
- `memory/marketing/seo.md` — keep `shopify catalog audit` as a target term; add a one-line annotation that it is search-surface-only, never product-name
- `memory/marketing/metrics.md:11` — "Paid concierge audits per week" → "Paid concierge reads per week"
- `memory/marketing/audiences.md:42` — "post-audit upsell" → "post-read upsell"
- `memory/canon-source-register.md` §A1/§A2 — `/audit` paths → `/catalog-letter`
- `projects/flintmere/BUSINESS.md` — §audits heading. **Keep** "one-time consulting audits" at line 8 — that describes competitors, correctly.
- `CLAUDE.md` — Product snapshot; add a Canon-hygiene entry

- [ ] **Step 1: Apply, honouring the two keeps**

The two lines that must NOT change are `BUSINESS.md:8` (competitor description) and `seo.md`'s keyword rows (search demand).

- [ ] **Step 2: Add the Canon hygiene entry to `CLAUDE.md`**

Under `## Canon hygiene`, add:

```markdown
- "Concierge audit" / "the audit" as the paid product's name (retired 2026-08-25, ADR 0028 — the product is the **Concierge read**; `/audit` → `/catalog-letter`). "Audit" survives only in the GDPR/SOC-2 legal register, as an SEO target term, and in code identifiers.
```

- [ ] **Step 3: Commit**

```bash
git add memory projects/flintmere/BUSINESS.md CLAUDE.md
git commit -m "docs(canon): lexicon files adopt 'read' (ADR 0028)"
```

---

### Task 11: E2E coverage + conversion floor

`/catalog-letter` is the paid conversion page and currently has zero E2E coverage — `e2e/mobile-reflow.spec.ts` covers only `/`, `/bot`, `/methodology`, `/pricing`, `/scan`.

**Files:**
- Modify: `apps/scanner/e2e/mobile-reflow.spec.ts`

- [ ] **Step 1: Add `/catalog-letter` to the route list**

`apps/scanner/e2e/mobile-reflow.spec.ts:25`:

```typescript
const ROUTES = ['/', '/bot', '/pricing', '/methodology', '/scan', '/catalog-letter'] as const;
```

The suite iterates `ROUTES × WIDTHS` (320, 360, 393), so this adds three
tests, taking the file from 15 to 18.

- [ ] **Step 2: Run E2E**

Run: `pnpm --filter scanner exec playwright test mobile-reflow`
Expected: PASS at all three widths. A horizontal-overflow failure means the longer strings ("Concierge read" vs "Concierge audit" is +0, but "Your read is booked" vs "Audit booked" is +8 chars) broke a fixed-width element — fix the CSS, do not shorten the copy back.

- [ ] **Step 3: Measure the conversion floor**

Per the global instruction, measure at 375×812 and **report the numbers**:
- Vertical offset of the price, of the primary action, and of the first control that changes the price. Primary action past ~1.2 screens (≈975px) means not finished.
- Every tap target ≥24×24 (WCAG 2.5.8). Links alone in a column or a list are the ones that fail; links inline in a sentence are exempt.

Use the browser preview tools, not assertion from source.

- [ ] **Step 4: Commit**

```bash
git add apps/scanner/e2e
git commit -m "test(scanner): E2E reflow coverage for /read (ADR 0028)"
```

---

## Post-plan gates

- [ ] `writer` pass over every CTA string (spec §1.2) — "Book the read · £197" ships as a placeholder, not final copy
- [ ] `canon-audit` on the full Shipment 1 diff
- [ ] `claim-review` verdict recorded from Task 6
- [ ] Set `canon_audit_run` in the spec frontmatter to the run date
- [ ] Confirm `git grep -n "audit" apps/scanner/src | grep -v <frozen list>` returns only host strings and identifiers
- [ ] Open the PR referencing ADR 0028; Shipment 2 stays out of it

## Out of scope — Shipment 2

`audit.flintmere.com` → `catalog.flintmere.com` in all 39 places, DNS, Traefik/Coolify, GSC change-of-address, the Google Cloud redirect-URI allowlist entry, the `FlintmereBot` user-agent string, the PostHog dual-host bucketing, and `host-routing.ts`'s overdue `TODO: 2026-08-03`. See spec §4.
