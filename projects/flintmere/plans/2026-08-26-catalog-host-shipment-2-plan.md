# Catalog-host migration — Shipment 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Move the scanner surface from `audit.flintmere.com` to `catalog.flintmere.com`, permanently, without breaking GMC OAuth, search equity, or any inbound link ever issued.

**Architecture:** Three phases in strict order. **A — collapse the drift:** 42 live host references exist but only some go through `SCANNER_HOST`; the rest are shadow constants and env fallbacks that each hold their own copy. Route them all through the constant, changing no behaviour. **B — flip one line:** with the drift gone, the host change is `host-routing.ts:34`, plus the redirect, CSP and tests. **C — infrastructure:** DNS, Traefik, Search Console. Phase A is what makes Phase B safe to review.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest, Playwright, Traefik/Coolify on a DigitalOcean droplet.

## Global Constraints

- **Operator gate, blocks Phase C only.** `https://catalog.flintmere.com/api/auth/google/callback` must be in the Google Cloud Console **Authorized redirect URIs** allowlist *before* cutover. Exact-match. Miss it and every GMC connect fails `redirect_uri_mismatch`. No review cycle is triggered — scopes are unchanged, and Google's *Authorized domains* field takes eTLD+1 (`flintmere.com`), which already covers any subdomain.
- **The `audit.` host must answer forever.** Not a 90-day window. Delivery emails already sent build links against it (`concierge-delivery-email.ts`), merchants have shared `/score/[shop]` pages, cold outreach is in inboxes, and the `FlintmereBot` UA is published in `/bot`. Retiring the redirect breaks all of it permanently.
- **Frozen — nothing in this shipment touches the product lexicon.** ADR 0028 Shipment 1 settled it: the product is The Catalog Letter at `/catalog-letter`, "read" is a verb only. Do not re-open any of it.
- **Frozen — `concierge-audit`** as a Stripe metadata value (ADR 0028 Amendment 2), and all `audit*` code identifiers.
- **Frozen — the six legal-register "audit" instances** in `/dpa`, `/security`, `/privacy:167`.
- **Prices unchanged:** £197 / £397 / `From £597 — bespoke quote`. Never £97.
- **Tests keep literal hosts.** A test asserting `expect(url).toBe('https://catalog.flintmere.com/scan')` is a real assertion; rewriting it to use the constant makes it assert `constant === constant`, which is a tautology and worthless. Update the literals, do not abstract them.
- British English. No exclamation marks. No emoji.

---

## Phase A — Collapse the drift (no behaviour change)

Every task here leaves the site serving `audit.flintmere.com` exactly as it does today. The diff is reviewable precisely because nothing observable changes.

### Task A1: Shadow constants → `SCANNER_HOST`

Six modules declare their own copy of the host. Each is a place the next host change would be missed.

**Files:**
- `apps/scanner/src/app/blog/rss.xml/route.ts:13` — `const HOST = 'audit.flintmere.com'`
- `apps/scanner/src/lib/blog/jsonld.ts:16,19,24,100` — `ORG_LOGO` plus the host as a **default parameter** in three exported functions
- `apps/scanner/src/lib/daily-brief/state.ts:26` — `DEFAULT_BASE_URL`
- `apps/scanner/src/lib/og/og-content.ts:23` — `footerUrl`
- `apps/scanner/src/app/bot/components/Passport.tsx:12` — `USER_AGENT`
- `packages/ui/src/SiteFooter.tsx:7` — `SCANNER_HOST_URL`

**Interfaces:**
- Consumes: `SCANNER_HOST` from `apps/scanner/src/lib/host-routing.ts`.
- Produces: no signature changes. `jsonld.ts`'s three functions keep their `host` parameter — only the **default value** changes from a literal to `SCANNER_HOST`, so existing callers that pass a host explicitly are unaffected.

**`packages/ui` cannot import from `apps/scanner`.** It is a separate package and the dependency would be backwards. Two options — pick the one matching how the package already receives environment-specific values, which you must check first by reading `packages/ui/src/` for an existing config or prop pattern:
  (a) accept the host as a prop from the consuming app, or
  (b) keep a literal in `packages/ui` and add a test in `apps/scanner` asserting the two agree.
Do NOT invent a third mechanism. If neither fits, stop and report.

- [ ] **Step 1: Write the failing test**

`apps/scanner/src/lib/blog/jsonld.test.ts` — assert the default resolves from the constant, not a literal:

```typescript
import { describe, expect, it } from 'vitest';
import { SCANNER_HOST } from '../host-routing';
import { postUrl } from './jsonld';

describe('jsonld host default (ADR 0028 Shipment 2)', () => {
  it('defaults to SCANNER_HOST, not a hardcoded literal', () => {
    expect(postUrl('example-slug')).toBe(`https://${SCANNER_HOST}/blog/example-slug`);
  });
});
```

This passes today by coincidence — both are `audit.flintmere.com`. It becomes load-bearing in Phase B, where it fails if `jsonld.ts` kept its own literal. That is the point: it is the regression guard for the whole phase.

- [ ] **Step 2: Run it**

Run: `pnpm --filter scanner test jsonld`
Expected: PASS (coincidentally). Record that it passed.

- [ ] **Step 3: Replace each shadow constant**

Import `SCANNER_HOST` and use it. Example, `blog/rss.xml/route.ts`:

```typescript
import { SCANNER_HOST } from '@/lib/host-routing';
const HOST = SCANNER_HOST;
```

Keep the local name where it reads better than the import; the point is one source, not one identifier.

- [ ] **Step 4: Prove the coincidence is gone**

Temporarily edit `host-routing.ts:34` to `'TEMP-PROOF.example.com'`, run `pnpm --filter scanner test`, and confirm failures appear in every module you touched. **Then revert that line.** This is the only way to prove the wiring is real rather than coincidentally equal — a passing suite proves nothing when both values are the same string.

- [ ] **Step 5: Full suite + commit**

```bash
pnpm --filter scanner test && pnpm --filter scanner typecheck
git add apps/scanner/src packages/ui/src
git commit -m "refactor(scanner): route shadow host constants through SCANNER_HOST"
```

### Task A2: Env fallbacks → `SCANNER_HOST`

Five `process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com'` fallbacks.

**Files:** `app/api/agent/stage-outreach/route.ts:62`, `app/api/lead/route.ts:139`, `lib/concierge-delivery-email.ts:77`, `lib/rescan-30-day.ts:59`, plus `apps/scanner/scripts/stage-outreach-batch.ts:35`.

- [ ] **Step 1: Add one helper, not five edits**

`apps/scanner/src/lib/host-url.ts` already owns host construction and already imports `SCANNER_HOST`. Add:

```typescript
/**
 * Public base URL for the scanner. Prefers the deploy-time env var,
 * falls back to the canonical host. Five call sites previously carried
 * their own copy of this fallback — each was a place a host change
 * would be silently missed.
 */
export function scannerBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? `https://${SCANNER_HOST}`;
}
```

- [ ] **Step 2: Replace all five call sites with `scannerBaseUrl()`**

The script under `apps/scanner/scripts/` may not be able to import from `src/` — check its existing imports before assuming. If it cannot, leave it as a literal and note it in the report; scripts are operator-run, not shipped.

- [ ] **Step 3: Test, typecheck, commit**

### Task A3: Rendered copy + metadata → `SCANNER_HOST`

The host appears as visible text to users and in machine-readable metadata.

**Files:** `app/security/page.tsx:41,50`; `app/privacy/page.tsx:29,321`; `app/terms/page.tsx:37`; `app/cookies/page.tsx:19,32`; `app/sitemap/page.tsx:34,89,90,239`; `app/unsubscribe/page.tsx:36`; `app/layout.tsx:122,136` (JSON-LD); `app/blog/page.tsx:26,31` (canonical + OG); `app/opengraph-image.tsx:137`; `app/scan/opengraph-image.tsx:144`; `app/blog/[slug]/opengraph-image.tsx:109`; `app/research/components/BodyBottom.tsx:428`.

- [ ] **Step 1: Substitute the constant**

In JSX, `<code>audit.flintmere.com</code>` becomes `<code>{SCANNER_HOST}</code>`.

**`/terms`, `/privacy` and `/cookies` are legal-class.** Changing how a host is *rendered* does not change the agreement, but confirm the sentence still reads correctly — some of these name the host mid-sentence and a substitution can break the grammar around it.

- [ ] **Step 2: Do NOT touch the six frozen legal "audit" instances**

`/dpa` Clause 09, `/security:174,176`, `/privacy:167`. Those are the word "audit", not the hostname. Verify after editing:

```bash
sed -n '167p' apps/scanner/src/app/privacy/page.tsx   # must still say "audit-trail"
grep -c "SOC 2 audited" apps/scanner/src/app/security/page.tsx  # must be 1
```

- [ ] **Step 3: Test, typecheck, commit**

---

## Phase B — Flip the host

Only now does anything observable change. After Phase A this should be a small diff.

### Task B1: The constant, the redirect, the CSP

- [ ] **Step 1: Write the failing tests**

```typescript
// host-routing.test.ts
describe('catalog host (ADR 0028 Shipment 2)', () => {
  it('names catalog.flintmere.com as the scanner host', () => {
    expect(SCANNER_HOST).toBe('catalog.flintmere.com');
  });
  it('still recognises the legacy host', () => {
    expect(KNOWN_HOSTS).toContain('audit.flintmere.com');
  });
  it('redirects the legacy host to the canonical one', () => {
    expect(targetHostForRedirect('/scan', 'audit.flintmere.com')).toBe('catalog.flintmere.com');
  });
});
```

Read `targetHostForRedirect`'s actual signature before writing this — adapt the call to match rather than assuming the argument order.

- [ ] **Step 2: Flip the constant**

`apps/scanner/src/lib/host-routing.ts:34`:

```typescript
export const SCANNER_HOST = 'catalog.flintmere.com';
export const LEGACY_SCANNER_HOST = 'audit.flintmere.com';
```

Add `LEGACY_SCANNER_HOST` to `KNOWN_HOSTS` and make the redirect logic map it to `SCANNER_HOST`. **This redirect is permanent and must never be removed** — say so in the comment, with the reason (already-sent emails, shared score pages, the published bot UA).

- [ ] **Step 3: CSP**

`apps/scanner/src/middleware.ts:286` — `connect-src` must list **both** hosts through the transition and keep the legacy one indefinitely, since redirected requests still originate from it.

- [ ] **Step 4: Delete the stale TODO**

`host-routing.ts:25-26` carries `TODO: 2026-08-03` on the cross-host 301 window — 23 days overdue at time of writing. This shipment resolves it: the redirects are permanent, so the "flip to 404" option is withdrawn. Remove the TODO and record the decision in the comment.

- [ ] **Step 5: Update every test literal**

51 host literals live in tests. They are assertions and stay literal — update the expected values. `grep -rln "audit\.flintmere\.com" apps packages --include="*.test.ts" --include="*.test.tsx"` finds them.

Any test asserting the **legacy** host redirects correctly should keep `audit.flintmere.com` — read each one before changing it.

- [ ] **Step 6: Full suite + commit**

### Task B2: PostHog dual-host bucketing

`app/admin/health/_signals/posthog.ts:53` buckets pageviews by the literal host string. On cutover, traffic splits across two hosts and this signal will false-alarm.

- [ ] **Step 1:** Sum both hosts for the transition, reading from `SCANNER_HOST` and `LEGACY_SCANNER_HOST` rather than new literals. Add a comment stating when the legacy bucket can be dropped (when legacy traffic reaches zero — not a fixed date).
- [ ] **Step 2:** Test, commit.

### Task B3: The published bot user-agent

`FlintmereBot/1.0 (+https://audit.flintmere.com/bot)` appears in `app/bot/components/Passport.tsx:12,73`, `app/research/components/BodyBottom.tsx:428`, and the scripts `compile-store-list.ts` and `batch-scan.ts`.

Every store Flintmere crawls sees this string in its logs, and `/bot` is the published policy page it points at.

- [ ] **Step 1:** Change all five in lockstep so the UA and the policy page agree. The `/bot` URL must resolve without a redirect — a UA pointing at a 301 looks like a stale or spoofed crawler to anyone auditing their logs.
- [ ] **Step 2:** Test, commit.

---

## Phase C — Infrastructure (operator)

Not repo work. Sequenced, and step 1 gates the rest.

- [ ] **1. Google Cloud Console** — add `https://catalog.flintmere.com/api/auth/google/callback` to Authorized redirect URIs. **Do this first.** Verify by reading the list back.
- [ ] **2. DNS** — `catalog.flintmere.com` → the DigitalOcean droplet.
- [ ] **3. Coolify/Traefik** — router + Let's Encrypt cert for the new host. Keep the `audit.` router alive permanently.
- [ ] **4. Deploy** and confirm: `curl -sI https://audit.flintmere.com/scan` returns 301 to `catalog.flintmere.com/scan`; `curl -sI https://catalog.flintmere.com/scan` returns 200.
- [ ] **5. GMC connect smoke test** — run one real OAuth connect end to end. This is the step that catches a missed redirect URI.
- [ ] **6. Google Search Console** — add the new property, verify, submit a change of address. Expect 2–8 weeks of ranking movement; the 301 carries most equity but not instantly.
- [ ] **7. Stripe** — check the checkout success/cancel URLs resolve on the new host.
- [ ] **8. Monitor** — PostHog host split (B2), Sentry for `redirect_uri_mismatch`, and Search Console coverage for crawl errors.

---

## Docs

- [ ] ADR 0028 gains an Amendment 3 recording the host cutover date and the permanent-redirect commitment.
- [ ] `CLAUDE.md`, `PROJECT.md`, `ARCHITECTURE.md`, `SPEC.md`, `DESIGN.md`, `GLOSSARY.md`, `STATUS.md`, `OPERATOR-TASKS.md`, `README.md`, `SECURITY.md` and the `memory/` files carrying the host — 25+ files. Dated historical entries stay as records.

## Gates

- [ ] `canon-audit` on the full diff — legal pages and metadata change here.
- [ ] `claim-review` on the `/privacy`, `/terms`, `/cookies`, `/security` diffs.
- [ ] Playwright reflow: all 18 still pass.
- [ ] Final whole-branch review.
- [ ] **Scope check, learned from Shipment 1:** the blast-radius survey must cover `packages/`, `apps/scanner/content/`, `apps/scanner/scripts/`, `README.md`, `SECURITY.md`, `memory/` and `projects/` — not just `apps/scanner/src`. Shipment 1 missed four such directories and each held a real defect.
