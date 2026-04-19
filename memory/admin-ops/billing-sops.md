# billing-sops.md — Operator playbooks for billing

Standard operating procedures for billing actions that aren't (and shouldn't be) automated. Each SOP describes the trigger, the action, and the verification step. The operator runs these; no skill executes them.

Flintmere has two billing surfaces: **Shopify Managed Pricing** (Growth + Scale, Shopify owns billing) and **Stripe direct** (Agency + Enterprise + £97 concierge).

## SOP-01 — Process a refund within 30 days of first payment

**Pricing claim**: "30-day no-questions refund." (`/pricing` + Terms of Service).

**When**: merchant requests refund within 30 days of first payment on any tier.

### Shopify-managed tiers (Growth + Scale)

**Action (operator, in Shopify Partner Dashboard)**:

1. Partner Dashboard → Apps → Flintmere → Installations → search merchant domain.
2. Open installation → Billing → Refund.
3. Refund the **full amount** of the first charge.
4. If merchant wants to cancel too: they uninstall from their Shopify admin. Our `app/uninstalled` webhook scrubs tokens within 60s.

**Verification**:

- Shopify sends refund confirmation to merchant automatically.
- Our app-side record (`shops.plan_tier`) updates on uninstall webhook; scoring data enters 30-day purge window.

### Stripe-direct tiers (Agency + Enterprise)

**Action (operator, in Stripe Dashboard)**:

1. Stripe → Customers → search by email → open customer.
2. Open most recent invoice → Refund payment.
3. Refund the **full amount** of the first charge (or first month of annual, if they want to downgrade mid-year).
4. If cancelling: subscription → Cancel → choose "at period end" (default). Merchant keeps access through paid period.

**Verification**:

- Stripe webhook `charge.refunded` fires → logged in `webhook_events` table.
- If also cancelling: `customer.subscription.deleted` fires at period end → triggers seat-release (Agency) or Enterprise-specific cleanup.
- Send acknowledgement email from `support@flintmere.com`. One-line personal reply, no template.

### £97 concierge audit

**Action**:

1. Stripe → Payments → find the one-off charge by email.
2. Refund full £97.
3. If the audit hasn't been delivered: move the Calendly booking to cancelled, archive the draft.
4. If the audit has been delivered but merchant unhappy: operator discretion — usually refund anyway per the guarantee posture.

### After day 30

- Refunds not standard. Direct merchant to cancel at period end; they keep access through paid period.
- Partial refunds at operator discretion. Document rationale in the customer's Stripe note (or Partner Dashboard notes).

**Council**:

- #9 Lawyer: 30-day refund matches Terms + BUSINESS.md; processing within window honours the contract.
- #11 Investor voice: refund generosity is brand trust; over-deliver when borderline.

---

## SOP-02 — Verify Shopify Managed Pricing plan switching

**Pricing claim**: "Switch tiers any time from your Shopify admin."

**Setup (one-time, in Shopify Partner Dashboard)**:

1. Partner Dashboard → App → Distribution → Managed Pricing.
2. Configure Growth (£49), Scale (£149) as available plans.
3. Verify plan-switching UX in Shopify test store.
4. Confirm our app handles `app/uninstalled` + plan-change webhooks.

**Verification (quarterly)**:

- Install app on a test store with Growth plan.
- Switch to Scale via the app settings.
- Verify Shopify sends the subscription update; our app reads it and updates `shops.plan_tier`.
- Feature-gating immediately reflects the new tier (LLM enrichment limits, drift alert cadence, etc.).

**Council**:

- #30 Payment systems: Managed Pricing is the canonical Shopify pattern; bypassing = building duplicate UI.
- #15 Staff engineer: config is operator-side, not code; one-time setup; document but don't automate.

---

## SOP-03 — Operator-initiated cancellation (rare)

**When**: support request to cancel a subscription that merchant can't cancel themselves (lost access to Shopify admin, locked out).

### Shopify-managed

1. Verify identity (email match against the install record).
2. Partner Dashboard → Installations → merchant → "Uninstall on behalf of merchant" (if Shopify permits; otherwise guide them to Shopify support).
3. Our `app/uninstalled` webhook fires → tokens scrubbed in 60s.

### Stripe-direct (Agency / Enterprise)

1. Verify identity (email match + Shopify store domain).
2. Stripe → Customers → open → Subscriptions → Cancel → **"At end of billing period"** (default).
3. Merchant keeps access through `current_period_end`. Our app's tier check respects this.

**Avoid**: "Cancel immediately" unless merchant has been refunded in full and consents to immediate access loss.

**Council**:

- #11 Investor voice: never cut access on a paid period without refund — creates chargebacks.
- #9 Lawyer: merchant paid for the period; immediate-cancel without refund could be challenged.

---

## SOP-04 — Plan-change cleanup verification (post-incident)

**When**: after any incident touching billing webhooks, verify that tier-change cleanup ran for affected merchants.

**Action**:

1. Find affected `APP_SUBSCRIPTIONS_UPDATE` / `APP_UNINSTALLED` events in Shopify Partner Dashboard → Webhook attempts.
2. Find affected `customer.subscription.updated` / `.deleted` events in Stripe Dashboard.
3. Check Coolify logs for `billing.plan_change.cleanup` entries with matching shop domain → confirms cleanup ran.
4. If missing: manually run a SQL audit against `shops` table:

```sql
-- Find merchants whose plan_tier may be out of sync with Shopify state
SELECT s.shop_domain, s.plan_tier, s.updated_at,
       (SELECT COUNT(*) FROM fix_batches WHERE shop_domain = s.shop_domain AND tier = 2) AS tier2_fixes,
       (SELECT COUNT(*) FROM webhooks_registered WHERE shop_domain = s.shop_domain) AS webhook_count
FROM shops s
WHERE s.uninstalled_at IS NOT NULL AND s.updated_at < NOW() - INTERVAL '30 days';
```

5. If orphans found, run cleanup manually per affected shop:

```ts
// From an internal ops script
import { cleanupAfterPlanChange } from '@flintmere/app/lib/billing';
await cleanupAfterPlanChange(shopDomain, 'free');
```

---

## SOP-05 — Apply concierge £97 audit

**When**: paid £97 concierge audit booking comes in via Stripe + Calendly.

**Action**:

1. Confirm Stripe payment intent `succeeded` before starting work.
2. Calendly meeting on the day — 15-minute kickoff call.
3. Run the scanner on merchant's store; deep-dive the top pillars.
4. Produce the audit report (use `writer` skill with the concierge-report template, when that exists).
5. Deliver within 48h of the kickoff call.
6. Follow-up email at day 7: "How did this land? Would Growth or Scale tier help?"

**Council**:

- #22 Conversion: concierge is a conversion funnel into Growth/Scale. Follow-up matters.
- #1 Editor-in-chief: report quality sets brand perception for enterprise prospects.

---

## Maintenance

- Quarterly review by #36 + #30 + #11.
- New SOP added when a recurring billing-side action proves to be a manual workflow worth documenting (3+ occurrences).
- Each SOP rewritten when the underlying code path or vendor config changes.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard SOPs (Stripe-only flow for Pro/Sentinel/API) with Flintmere SOPs covering Shopify Managed Pricing (Growth + Scale), Stripe direct (Agency + Enterprise), and the £97 concierge one-off.
