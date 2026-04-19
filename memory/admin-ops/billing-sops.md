# billing-sops.md — Operator playbooks for billing surface

Standard operating procedures for billing actions that aren't (and shouldn't be) automated. Each SOP describes the trigger, the action, and the verification step. The operator runs these; no skill executes them.

## SOP-01 — Process a refund (within 14 days of first payment)

**Pricing claim**: "Full refund within 14 days of your first payment." (`/pricing` FAQ).

**When**: a customer requests a refund and their first payment was within the last 14 days.

**Action (operator, in Stripe Dashboard)**:
1. Stripe → Customers → search by email → open the customer
2. Open the most recent invoice → Refund payment
3. Refund the **full amount** of the first payment
4. If the customer wants to stay subscribed (rare for refund requests): nothing else to do — Stripe will retry billing on next cycle.
5. If the customer wants to cancel as well: subscription → Cancel → choose "at period end" (default) so they retain access through the period they paid for.

**Verification**:
- Stripe webhook `charge.refunded` fires → `auditWebhook` row + `upsertInvoice` updates the local invoice status.
- If the customer also cancelled: `customer.subscription.deleted` webhook fires later (at period end) → `cleanupAfterPlanChange` soft-disables their monitors / webhooks / rules / alerts.
- Send a brief acknowledgement email from `support@allowanceguard.com` confirming the refund and any cancellation. No template; one-line personal reply.

**After day 14**:
- Refunds are not standard. Direct the customer to cancel at period end (they keep access through the period they paid for).
- Partial refunds are at operator discretion; document the rationale in the customer's Stripe note.

**Council**:
- #9 Lawyer: 14-day refund matches the FAQ claim; processing within window honours the contract
- #11 Investor voice: refund process generosity is part of brand trust; over-deliver on the refund window when borderline

---

## SOP-02 — Verify Stripe Customer Portal allows plan change

**Pricing claim**: "Switch between monthly and yearly... from your account settings at any time." (`/pricing` FAQ).

**Setup (one-time, in Stripe Dashboard)**:
1. Stripe → Settings → Billing → **Customer portal**
2. Subscriptions → enable **"Customers can switch plans"**
3. Add the products: Pro (monthly), Pro (yearly), Sentinel (monthly), Sentinel (yearly), API Developer (monthly), API Developer (yearly), API Growth (monthly), API Growth (yearly)
4. **Cancellation** → "At end of billing period" (default) so the FAQ claim about access continuation is honoured automatically
5. Save

**Verification (one-time)**:
- Open `/account/billing` while signed in to a Pro test account
- Click "Manage subscription" — should redirect to Stripe portal
- Should see a "Switch plan" option
- Should see "Cancel subscription" with messaging about access through period end

**On change**: if the operator changes a Stripe Price (different priceId) for an existing tier, also update the corresponding `STRIPE_PRICE_*` env var in Vercel. Otherwise `/api/billing/create-subscription` returns the new 503 with `envVarHint` (commit `b1387bc`).

**Council**:
- #30 Payment systems: Customer Portal is the canonical Stripe pattern for self-serve plan management; bypassing it = building duplicate UI
- #15 Staff engineer: portal config is operator-side, not code; one-time setup; document but don't automate

---

## SOP-03 — Operator-initiated cancellation (rare)

**When**: support request to cancel a subscription that the customer can't cancel themselves (lost access, locked out).

**Action**:
1. Verify identity (email match against the active subscription).
2. Stripe → Customers → open → Subscriptions → Cancel → **"At end of billing period"** (default).
3. The customer keeps access through `current_period_end`. The `cleanupAfterPlanChange` runs automatically when the deletion fires at period-end.

**Avoid**: "Cancel immediately" unless the customer has been refunded in full and consents to immediate access loss. If used, our defence-in-depth (commit `7057efe`) still preserves access until `current_period_end` because `getUserSubscription` includes canceled subs whose period hasn't ended.

**Council**:
- #11 Investor voice: never cut access on a paid period without a refund; that creates Stripe disputes
- #9 Lawyer: customer paid for the period; immediate-cancel without refund could be challenged

---

## SOP-04 — Plan-change cleanup verification (post-incident)

**When**: after any incident touching billing webhooks, verify that `cleanupAfterPlanChange` ran for affected users.

**Action**:
1. Find the affected `customer.subscription.deleted` or `.updated` events in Stripe Dashboard → Webhook attempts
2. Check Vercel logs for `billing.plan_change.cleanup` entries with the matching userId — confirms the cleanup ran
3. If missing: manually run a SQL audit:
   ```sql
   -- Find Free users with enabled feature rows that should be off
   SELECT s.user_id, s.plan, s.status,
          (SELECT count(*) FROM wallet_monitors WHERE user_id = s.user_id AND enabled = TRUE) AS monitors,
          (SELECT count(*) FROM webhooks WHERE user_id = s.user_id AND enabled = TRUE) AS webhooks,
          (SELECT count(*) FROM revocation_rules WHERE user_id = s.user_id AND enabled = TRUE) AS rules
   FROM subscriptions s
   WHERE s.status = 'canceled' AND s.current_period_end < NOW();
   ```
4. If orphans found, run cleanup manually per affected userId:
   ```ts
   // From a one-off scripts run
   import { cleanupAfterPlanChange } from '@/lib/billing'
   await cleanupAfterPlanChange(userId, 'free')
   ```

---

## Maintenance

- Quarterly review by #36 + #30 + #11.
- New SOP added when a recurring billing-side action proves to be a manual workflow worth documenting (3+ occurrences).
- Each SOP rewritten when the underlying code path changes.
