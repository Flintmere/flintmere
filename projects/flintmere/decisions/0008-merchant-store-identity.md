# 0008 — Merchant / store identity model

- **Status:** Accepted
- **Date:** 2026-04-22
- **Supersedes:** Nothing (first ADR on identity modelling)
- **Blocks:** `app_*` Prisma schema (P1, task #56). Nothing writes to `app_shops` until this lands.

## Context

Before any line of `apps/shopify-app/prisma/schema.prisma` is written we have to answer one question: **what is a merchant?** The Shopify embedded-app model, the Agency tier, and the billing surface each pull the answer in a different direction, and if we pick wrong we either ship a schema that can't carry the Agency tier or we over-engineer and delay submission.

### Inputs

- `BUSINESS.md` §Tiers — five tiers; only Growth (£59) and Scale (£159) install via the Shopify App Store. Agency (£499) and Enterprise (£599+) are direct-invoice and do not go through the App Store installation flow.
- `ARCHITECTURE.md` §Feature gates — `apps/shopify-app/src/lib/tier.ts` reads tier data from Shopify Managed Pricing for Growth/Scale and from Postgres `shops.plan_tier` for Agency/Enterprise.
- `SPEC.md` §8.2 — "Agency tier is the economic engine. One sale = 25 stores on the platform." Agency is strategic, not cosmetic.
- `memory/product-engineering/shopify-api-rules.md` — every write path keys on `shop_domain`. OAuth issues one offline access token per shop. That is not a choice, it is the platform contract.
- `memory/product-engineering/security-posture.md` §Permission tiers — tokens are encrypted at rest per-shop. There is no cross-shop token.
- Shopify App Store policy — the Billing API must be used for any paid functionality subscribed to via the App Store install flow. This is a hard rejection trigger.

### The tension

An embedded Shopify app is **shop-centric by platform fiat**. The session token identifies `(shop, shopify_user_id)`. There is no native cross-shop identity. If we introduce one, it is ours to build and secure.

An agency, however, is **person-centric** — one human manages 25 client stores. An agency user does not want to re-embed into each client's admin to check a score. They want a single web login with a cross-client dashboard.

Ignore this tension now and we ship a schema that cannot hold Agency without a rewrite. Over-build it now and we delay App Store submission behind identity work that no Growth or Scale buyer needs.

## Decision

### Shop is the primary entity. Always.

`app_shops.shop_domain` (the `*.myshopify.com` canonical domain) is the primary key for every `app_*` table. Every token, every product row, every score, every fix batch keys off `shop_domain`. This matches the Shopify OAuth contract and cannot be changed without replatforming.

No `app_*` table gains a `user_id` column in Phase 1. Merchant-level audit fields (e.g. "who applied this fix") store `shopify_user_id` as a raw Shopify identifier with no foreign key. We can join against a user table later; we do not need it for the score / fix / sync loops.

### Phase 1 (submission-ready): shop-only identity

For App Store submission we ship **shop-only identity**. That is:

- One OAuth install per shop, one encrypted access token per shop, one `app_shops` row per shop.
- No separate account/login system.
- No cross-shop view.
- Billing via Shopify Managed Pricing, tied to `shop_domain` (see ADR 0009).
- Agency tier surfaced in UI as **"Contact sales"** mailto → direct invoice → `app_shops.plan_tier` set manually.

This is deliberately minimal. It is what the App Store reviewer will install, exercise, and sign off.

### Phase 2 (agency rollout): additive overlay, never a rewrite

When Agency tier graduates from "contact sales" into a self-serve product (no deadline — demand-driven), we add three tables **additively**:

| Table | Purpose |
|---|---|
| `app_accounts` | Standalone login (email + argon2 password + 2FA). One row per human. Not tied to any shop. |
| `app_agency_memberships` | `(account_id, agency_id, role)` — which humans belong to which agency, as `owner` / `admin` / `viewer`. |
| `app_agency_shops` | `(agency_id, shop_domain, status)` — which shops an agency is authorised to see, with `status ∈ pending_invite | active | revoked`. |

The invitation flow is shop-initiated: the shop owner enters the agency's domain/email in their embedded Flintmere app → Flintmere emails the agency → agency accepts from a link → `app_agency_shops.status = active`. The shop can revoke at any time; no token leaves the shop.

Agency users log in at `app.flintmere.com/agency/*` — a non-embedded web app with its own chrome. They see a cross-client dashboard. They never hold a shop's OAuth token; every read goes through `app_shops.encrypted_access_token` server-side, scoped by `app_agency_shops`.

Enterprise tier behaves as Agency-with-one-shop in Phase 2 — same tables, same `plan_tier` field, just a different billing rail. No separate identity system.

### What this rules out

- **One user, many shops via Shopify OAuth alone.** Shopify does not issue cross-shop identity; pretending it does is a vulnerability. Rejected.
- **Agency gets a shared access token across client shops.** Violates least-privilege; revocation would cascade. Rejected.
- **User-as-primary with shops attached.** Inverts the OAuth contract. Every query becomes a join. Rejected.
- **Single-login that federates Shopify and standalone.** Out of scope; revisit post-2k merchants.

## Council review

- **#4 Security**: approved — shop-only Phase 1 keeps the blast radius of a token compromise to one shop. Phase 2 agency overlay never holds a merchant token; reads are server-side proxied and auditable.
- **#9 Legal / #23 Regulatory / #24 Data protection (veto)**: approved — shop-initiated agency invitation flow satisfies "data controller consents to processor access"; no tokens leak across the boundary; revocation is explicit and logged.
- **#11 Investor**: approved — Phase 1 unblocks submission in days not weeks; Phase 2 is additive and can be sold to the first agency deal without schema migration drama.
- **#12 Ecosystem**: approved — matches what Shopify's reviewer will expect to see (one install = one shop row). An agency-first identity model would read as "this app doesn't understand our platform."
- **#18 DBA**: approved — additive Phase 2 means no column rewrites, no null-backfill migrations on `app_shops`. Every migration stays a concurrent-safe DDL.
- **#33 Backend / #34 Debugging**: approved — `shop_domain` as PK means every error log, every Sentry breadcrumb, every support ticket starts with one unambiguous key.

## Consequences

- **Schema clean.** `app_*` tables get a stable PK on day one. Phase 2 adds three new tables and zero foreign keys into existing ones.
- **UI compromise.** Agency tier at launch has no self-serve UI. It is a mailto CTA and a manual `plan_tier` flip in a Postgres admin tool. This is a deliberate trade for submission speed.
- **Admin tooling debt.** We will need an operator-only page ("elevate shop X to Agency, attach to agency Y") before the first Agency deal closes. Track as OPERATOR-TASKS item when the first deal is imminent.
- **No cross-shop migrations ever.** Because `shop_domain` is the stable PK, `shops` never merges or splits. If a merchant moves domains, it is a new row and we run a one-off migration in a script.

## Rollout

**Immediate (gates task #56 — `app_*` schema + migration)**

- `app_shops` PK: `shop_domain String @id`.
- All `app_*` tables carry `shop_domain String` with FK to `app_shops` where cascading delete is safe (tokens) and restrict where it is not (audit logs).
- `plan_tier` enum on `app_shops`: `{ free | growth | scale | agency | enterprise }`.
- No `users` / `accounts` tables yet.

**Phase 2 trigger (not scheduled)**

- First signed Agency deal that needs self-serve onboarding (not the first "contact sales" conversion — the first one where the agency asks for the dashboard).
- Lands as ADR 0010 with the three overlay tables, the invitation flow, and the standalone-auth rail.

## Related memory

- `memory/product-engineering/architecture-rules.md` — every `app_*` table must carry `shop_domain`. Reaffirmed by this ADR.
- `memory/product-engineering/security-posture.md` §Permission tiers — token scope stays per-shop; agency proxy reads go through server-side `app_shops.encrypted_access_token` only.
- `ARCHITECTURE.md` §Feature gates — `plan_tier` column confirmed as the source of truth for Agency/Enterprise gates.
- `BUSINESS.md` §Tiers — Agency and Enterprise direct-invoice model matches this ADR's "no self-serve UI at launch" position.

## Re-open conditions

Revisit this ADR if any of these change:

- Shopify releases a cross-shop session / organisation primitive. (Platform-level change — this ADR would be obsoleted, not amended.)
- An agency prospect signals they will not buy without self-serve multi-shop onboarding at signup. (Phase 2 accelerates.)
- We discover an unrecoverable schema limitation in shop-only identity during the first 100-merchant build. (Unlikely — every `app_*` table in ARCHITECTURE.md already keys on `shop_domain`.)
