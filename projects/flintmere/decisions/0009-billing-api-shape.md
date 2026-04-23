# 0009 — Billing API shape

- **Status:** Accepted
- **Date:** 2026-04-22
- **Supersedes:** Nothing (first ADR on billing surface)
- **Depends on:** ADR 0008 — shop is the primary entity; Agency/Enterprise direct-invoice and do not go through the App Store install flow.
- **Unblocks:** Per-tier CTA wiring on `/pricing` + `/#pricing` (task #52 is parked on this; lib/pricing.ts already carries the `TierCTA` metadata).

## Context

`apps/scanner/src/lib/pricing.ts` is the single source of truth for prices and tier metadata across `/pricing` and the homepage strip. The `cta` field on each tier is present but PARKED because we had not yet decided **how a merchant actually buys**. This ADR decides that.

### Inputs

- `BUSINESS.md` §Payment stack — "Shopify Managed Pricing for Growth + Scale; Stripe direct for Agency + Enterprise + the £97 concierge audit. No crypto, no alternative gateways."
- `BUSINESS.md` §Tiers — flat pricing, no discounts at launch. (Enterprise annual pre-pay remains as a single-tier contract term, not a promotion.)
- `ARCHITECTURE.md` §External integrations — Shopify Managed Pricing / `AppSubscription` is listed as the billing path for Growth + Scale. Stripe is listed for Agency + Enterprise + concierge.
- **Shopify App Store policy (load-bearing):** any paid functionality subscribed to via the App Store install flow MUST use the Shopify Billing API (`appSubscriptionCreate` GraphQL mutation). Bypassing is an instant rejection.
- **User-level billing memory (`feedback_payments_payment_element_only.md`):** "Never hosted Stripe Checkout; always PaymentIntent + Payment Element inside the Flintmere shell." This applies to **Flintmere-owned** Stripe surfaces (Agency, Enterprise, concierge £97). It does NOT apply to Shopify Billing — Shopify's confirmation page is not Stripe Checkout and is platform-mandated.
- ADR 0008 — Agency / Enterprise identity ships as `plan_tier` flipped manually by operator at launch (no self-serve UI). Billing shape must not require Agency self-serve on day one.

### The question four ways

1. **Flat subscription vs usage metering?** BUSINESS.md §Tiers says "Unlimited audits", "500 enrichments/mo on Growth", "Unlimited enrichments on Scale". That is a cap-enforced flat subscription, not per-unit billing.
2. **Shopify Billing vs Stripe for Growth/Scale?** Platform policy answers this: Shopify Billing, mandatory.
3. **Shopify Billing vs Stripe for Agency/Enterprise?** These do not come through App Store install; no platform mandate. Stripe direct. Payment Element (per memory), not hosted Checkout.
4. **Any launch discounts?** No. The canonical answer at launch is flat prices straight from `lib/pricing.ts`. Scoped out below.

## Decision

### Growth + Scale → Shopify Billing API (`appSubscriptionCreate`)

- GraphQL mutation `appSubscriptionCreate` invoked from the embedded app when merchant clicks Upgrade.
- Plan IDs resolved from env: `SHOPIFY_PLAN_GROWTH`, `SHOPIFY_PLAN_SCALE`.
- `returnUrl` → `app.flintmere.com/billing/return?plan=growth` (server handles success, records `plan_tier`, enqueues welcome flow).
- `test: true` in non-prod; `test: false` only in production.
- Trial: **14 days** on both Growth and Scale. Uniform — no "paid first, trial second" experiments at launch.
- Billing cycle: monthly only at launch. Annual as a follow-up ADR if the Enterprise annual discount proves agencies want it on Scale too.
- Plan swaps (Growth → Scale, or downgrade) use the same `appSubscriptionCreate` mutation with `replacementBehavior: STANDARD` (pro-rata).

### Agency + Enterprise → Stripe direct, Payment Element

- Billing is initiated by the operator after a sales conversation, not by a self-serve CTA on `/pricing`.
- Mechanism: Stripe `Customer` + `Subscription` + `PaymentIntent` with **Payment Element** embedded in a Flintmere-owned page (`app.flintmere.com/billing/activate?token=...`). **No Stripe hosted Checkout, no Billing Portal iframe.** This is the user's standing rule (`feedback_payments_payment_element_only.md`).
- Activation flow: operator issues a signed invite link → merchant opens link in Flintmere shell → Payment Element collects card → `PaymentIntent` confirms → webhook updates `app_shops.plan_tier = agency | enterprise`.
- Subscription lifecycle (upgrades, downgrades, cancellations, dunning): handled via Stripe webhook → `app_shops.plan_tier` sync. No branded Portal; billing changes route through support for the first ~20 deals and we productise only when volume demands.
- Annual pre-pay (Enterprise 15% discount): Stripe `Price` with `interval: year`, issued at contract signature. Not exposed on `/pricing`.

### Concierge £97 one-off → migration debt, noted here

The existing scanner concierge flow (`apps/scanner/src/app/api/concierge/checkout/route.ts`) uses **hosted Stripe Checkout with a 303 redirect**. That contradicts `feedback_payments_payment_element_only.md`. This ADR **does not fix** that — the concierge flow is shipped and revenue-generating — but it records the debt explicitly.

Migration plan (tracked separately, not scoped to this ADR):

1. Replace the 303 redirect with a Flintmere-shell page that mounts Payment Element.
2. Create the `PaymentIntent` server-side on that page's load.
3. Confirm client-side; webhook handler (`apps/scanner/src/app/api/webhooks/stripe/route.ts`) keeps its existing `checkout.session.completed` branch for migration safety, add a new `payment_intent.succeeded` branch.
4. Ship behind a feature flag; old route deletable after two weeks of zero traffic.

Do not do this before Shopify App Store submission. It is cosmetic relative to the app-build critical path.

### No launch discounts

The £29 first-month promo previously proposed in BUSINESS.md §Promotions is **out** at launch. We ship flat prices straight from `apps/scanner/src/lib/pricing.ts` and revisit promotions only after we have month-3 conversion data from real flat-price sales.

Rationale:
- Every promo shape (`AppSubscriptionDiscount` one-month, price-override-then-swap, trial-extension-as-discount) adds a second billing path we have to test, monitor, and refund against. For the first 100 merchants that is cost we cannot justify.
- A 50% first-month discount signals "the real price is negotiable" to the Agency buyers we actually want, and anchors the wrong number in their head before the call.
- The 14-day trial (below) already solves the merchant's "can I try before I pay" objection without muddying the price.

Trial remains. See next section.

If the first 100 conversions come in slow and the data says price sensitivity is the cause, re-open this ADR and add a discount path in a follow-up. Not before.

Downstream cleanup:

- `apps/scanner/src/lib/pricing.ts` — remove "First month £29 for scanner users" from Growth blurb + features.
- `apps/scanner/src/app/pricing/page.tsx` metadata — remove the same string from the description.
- `BUSINESS.md` §Promotions — strike the "First-month £29 for scanner users" line; leave the agency trial and annual pre-pay lines.
- (Tracked below under Rollout.)

### Usage metering — REJECTED

- Growth enrichment cap (500/mo) is enforced in application code by counting rows in `app_fix_batches WHERE tier = 2 AND created_at >= first_of_month`. No Shopify `usageRecordCreate`, no Stripe usage reporting.
- Scale is "Unlimited" with a soft fair-use backstop (hardcoded 10,000/mo in code, alerts operator if hit).
- Rationale: usage-metered billing triples the surface area we have to test for App Store review, doubles the number of webhook paths, and adds drift risk for a product where the cap is already enforceable locally. If a merchant wants per-enrichment billing in future, revisit in a follow-up ADR.

### Pricing IDs (canonical env vars)

Both apps consume these via `packages/env/`:

| Env var | Purpose |
|---|---|
| `SHOPIFY_PLAN_GROWTH` | Growth monthly plan ID in Shopify Partner dashboard |
| `SHOPIFY_PLAN_SCALE` | Scale monthly plan ID |
| `STRIPE_PRICE_AGENCY_MONTHLY` | Agency monthly (direct invoice) |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Enterprise monthly floor |
| `STRIPE_PRICE_ENTERPRISE_ANNUAL` | Enterprise annual pre-pay (15% discount) |
| `STRIPE_PRICE_CONCIERGE_AUDIT` | Existing — £97 one-off |

Missing env at boot = app refuses to start. Non-negotiable; prevents silent fall-through to a wrong price.

## Council review

- **#4 Security / #24 Data protection (veto)**: approved — Shopify Billing keeps card data out of our perimeter entirely for Growth/Scale. Stripe Payment Element for Agency/Enterprise keeps card data tokenised in Stripe. We never touch PAN. Webhook signatures (Shopify HMAC, Stripe signing secret) enforced on every state mutation.
- **#9 Legal / #23 Regulatory**: approved — Shopify Billing contract covers consumer rights handling for UK/EU merchants. Stripe direct for Agency/Enterprise is B2B, covered by Master Services Agreement.
- **#11 Investor**: approved — flat-rate maximises MRR predictability, which is the metric a seed / angel will score us on.
- **#12 Ecosystem**: approved — compliance with the Shopify Billing mandate is a gating condition for Built-for-Shopify. This ADR hardcodes it.
- **#17 Performance**: approved — `appSubscriptionCreate` is a synchronous GraphQL call; we render a loader and the merchant goes to Shopify's confirmation page. No long-running billing path. Stripe Payment Element loads once per activation; no perf concern.
- **#30 Payment systems**: approved — no dual rails for the same tier. No silent fallbacks. Pricing IDs are env-gated at boot.
- **#33 Backend / #34 Debugging**: approved — two webhooks (Shopify + Stripe) that each converge on the same side-effect (`app_shops.plan_tier = ...`). One code path per provider; easy to log, easy to replay from the webhooks table.
- **#8 Accessibility (Noor)**: note — the Shopify confirmation page is out of our control. On our side (Stripe Payment Element) Noor's WCAG AA floor applies: focus rings, aria labels on the `card`, keyboard-operable, 200% zoom, reduced-motion safe. Tested before ship.

Sub-council convened:

- **Legal Council (#9 + #23 + #24)** — unanimous: Shopify Billing for Growth/Scale is mandatory; Payment Element for Agency/Enterprise is preferred posture (never hosted checkout). Consumer rights (UK Consumer Rights Act / EU Directive 2011/83) flow through Shopify for App Store installs. The 30-day refund promise in BUSINESS.md §Refunds is enforceable by us on both rails (we issue the refund via Stripe or via `appCreditCreate`).

## Consequences

- **Growth/Scale path is the simplest to build.** One GraphQL mutation, one webhook handler (`app/subscription_update`), one `plan_tier` column. ~1 day of work once `app_*` schema lands.
- **Agency/Enterprise path has a manual seam.** The operator hand-issues activation links until we productise the flow. Acceptable for the first ~20 deals; painful after that.
- **Concierge Payment Element migration is debt.** Noted, not fixed. Does not block submission.
- **No billing page on day one.** `/pricing` `/#pricing` CTAs wire as: Free → `/scan`, Growth/Scale → `"Install from Shopify App Store"` (deep link to `https://apps.shopify.com/flintmere` once listed), Agency/Enterprise → `mailto:john@flintmere.com`. Task #52 CTA wiring can now move from parked to buildable.
- **The £29 promo counter is a shared-state gotcha.** Single row, `SELECT ... FOR UPDATE` around the increment. First-100 race is real; enforced at the DB level, not the app level.

## Rollout

**Phase 1 — before App Store submission**

- `packages/env/` gains the five new env vars; boot refuses on missing.
- `app_shops.plan_tier` enum wired to tier gates (already in ARCHITECTURE.md §Feature gates).
- `appSubscriptionCreate` wrapper in `apps/shopify-app/src/lib/billing/shopify.ts` with a single function per tier: `createGrowthSubscription(session)` / `createScaleSubscription(session)`.
- Shopify webhook `app/subscription_update` → `app_shops.plan_tier` sync.
- `/pricing` CTA wiring per the CTA metadata in `apps/scanner/src/lib/pricing.ts` — Growth/Scale become deep links to `apps.shopify.com/flintmere`, Agency/Enterprise remain mailto. Task #52 unparks.

**Phase 2 — first Agency deal**

- `apps/shopify-app/src/lib/billing/stripe.ts` implements the activation flow (signed invite → Payment Element page → PaymentIntent confirm → webhook).
- Operator admin tool: issue activation link, revoke subscription, adjust tier. Manual until ~20 deals.

**Phase 3 — concierge Payment Element migration**

- Separate from submission. Tracked, not scheduled.

## Related memory

- `MEMORY.md` → `feedback_payments_payment_element_only.md` — enforced on all Flintmere-owned Stripe surfaces (Agency, Enterprise, concierge after migration). Not enforceable on Shopify Billing (platform-owned UI).
- `memory/product-engineering/security-posture.md` — HMAC verification on Shopify webhooks, signing-secret verification on Stripe webhooks. Both already shipped for the scanner surface; re-applied here.
- `BUSINESS.md` §Payment stack — formalised and extended by this ADR.
- `ARCHITECTURE.md` §External integrations — Shopify Managed Pricing line now resolves to `appSubscriptionCreate`, Stripe line now resolves to Payment Element.
- ADR 0008 — Agency/Enterprise identity decision (manual `plan_tier` flip at launch) is what lets Phase 2 be deferred without blocking submission.

## Re-open conditions

Revisit this ADR if any of these change:

- Shopify releases native annual billing or non-trial promo pricing that changes how we implement the £29 first-month.
- We decide to launch per-enrichment billing as a product differentiator.
- An Enterprise prospect refuses Stripe and requires invoice-only ACH/BACS. (Possible; solve as special-case, not general.)
- Stripe deprecates Payment Element for subscription creation. (Unlikely short-term.)
- The Agency tier graduates to self-serve (ADR 0010 territory) and needs its own billing CTA on `/pricing`.
