# 0006 — One Stripe account serves AllowanceGuard and PagePerfect Studio

**Status:** Accepted
**Date:** 2026-04-14
**Council:** #30 Payment systems engineer, #4 Security engineer, #10 DevOps / SRE, #24 Data protection lawyer

## Context

The Stripe account (`acct_1Ror7IQlioXS72xY`) under Eazy Access Ltd receives webhook traffic for **two products** operated by the same entity:

- **AllowanceGuard** — `www.allowanceguard.com`
- **PagePerfect Studio** — `api.pageperfect.studio`

As of 2026-04-14, the Stripe Dashboard shows three active webhook destinations:

| Name | URL | Purpose |
|------|-----|---------|
| `inspiring-spark` | `https://www.allowanceguard.com/api/billing/webhook` | AllowanceGuard subscriptions |
| `memorable-radiance` | `https://www.allowanceguard.com/api/stripe/webhook` | AllowanceGuard legacy contributions |
| `adventurous-voyage` | `https://api.pageperfect.studio/api/stripe/webhook` | **PagePerfect Studio** — separate product, same operator |

This arrangement is **intentional**. One legal entity (Eazy Access Ltd), one Stripe account, two products. It was flagged during the Apr 14 billing review to confirm that the third webhook was not a third-party subscriber reading AllowanceGuard events.

## Decision

Continue to operate both products under the single Stripe account for the foreseeable future.

## Consequences

Accepted trade-offs:

- **Shared webhook surface.** Each product's webhook endpoint must filter events by `customer.metadata` or `account_id` to avoid processing events meant for the other product. If an AllowanceGuard webhook ever acts on a PagePerfect Studio subscription event (or vice-versa), the bug will be silent and data-corrupting.
- **Shared rate limits.** Stripe API rate limits are per-account. A spike on PagePerfect Studio can starve AllowanceGuard and vice-versa.
- **Shared signing secrets discipline.** Each webhook endpoint has its own signing secret (`STRIPE_BILLING_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, plus whatever PagePerfect uses). If secrets are ever mixed up, incoming events will fail verification.
- **Refund / chargeback liability is shared** at the account level. A dispute on one product affects the account's risk score for the other.
- **No cross-product GDPR DPA needed** — same controller (Eazy Access Ltd). No cross-controller transfer. The Data Protection lawyer (#24) is satisfied.

Mitigations in place:

- AllowanceGuard's billing webhook validates the `customer.metadata.product` or similar identifier before processing (**verify this is actually done — if not, it's a follow-up**).
- Each webhook uses its own signing secret.

## Alternatives considered

- **Separate Stripe accounts per product.** Rejected for now — adds operational burden (two dashboards, two sets of tax/VAT config, two KYC flows). Revisit if either product reaches material revenue or if the products are ever sold/spun off separately.
- **One account, stricter event filtering.** Already the status quo, codified here.

## Follow-up

1. Verify AllowanceGuard's billing webhook actually filters by product identifier — if not, add it. Silent cross-product processing is the worst failure mode.
2. Revisit this decision if either product hits >£100K ARR or if an incident traces to cross-product leakage.
