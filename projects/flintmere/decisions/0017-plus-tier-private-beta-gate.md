# 0017 — Plus tier private-beta gate + price-on-enquiry

- **Status:** Accepted
- **Date:** 2026-04-26
- **Source:** `projects/flintmere/strategy/2026-04-26-final-report.md` §5, ratified per `projects/flintmere/strategy/2026-04-26-final-report-council-review.md` Q5 (operator-confirmed) + council ratification.
- **Affects:** `apps/scanner/src/app/for/plus/page.tsx`, `apps/scanner/src/lib/pricing.ts`, `BUSINESS.md` Plus row, homepage tier strip.

## Context

The current `/for/plus` page lists the Plus tier at £1,500+/mo. The public scanner — the dominant conversion path on the homepage — **cannot reach Shopify Plus stores**, which sit behind enterprise bot management. Flintmere's own `/research` page already says so:

> A meaningful share of the Shopify market — mostly the larger catalogs sitting behind enterprise bot-management — returns a block before any product page loads.

The same brands the Plus tier is priced for are the brands the conversion path cannot read. Inbound from Plus prospects is therefore near-zero, despite SEO and design cost on the page.

The embedded Shopify app exists in `apps/shopify-app/` but is not yet first-installable with food-vertical scoring active. Once it ships, embedded scanning becomes the conversion path for Plus and the public crawl becomes a marketing demo for Free / vertical self-serve.

## Decision

**Plus is in private beta** until the embedded app's first installable food-vertical build ships.

- Public price display on `/for/plus`: removed. Replaced with anchor *"from £1,200/mo on enquiry"* (Q5 operator decision, council ratified).
- `/for/plus` page is reframed as: "Plus is in private beta — talk to the Flintmere team before signing with a £2k/mo discovery platform." Direct-enquiry conversion via the team inbox; no self-serve checkout. Public-facing copy avoids single-named-individual framing per the council's framing rule (see `BUSINESS.md` §Decision-making framework).
- `pricing.ts`: Plus tier marked `betaGated: true`. Hidden from homepage tier strip.
- Homepage tier strip shows 4 tiers (per ADR 0016 vertical ladder), not 5.

The £1,200 anchor (lower than the prior £1,500 floor) is deliberate: it preserves a credible enterprise anchor without committing to a number we cannot yet fulfil through the conversion path. Operator critique 2026-04-26 (recorded in `BUSINESS.md` Plus row): "anchor pricing matters even at zero conversion; keep visible-but-gated. First 2–3 deals teach what belongs above the floor."

## Consequences

- `/for/plus` page rewritten (Phase 3). Removed: `£1,500+/month floor` claim, self-serve CTA copy. Added: private-beta framing, "from £1,200/mo on enquiry" anchor, "talk to John" CTA.
- `apps/scanner/src/lib/pricing.ts`: `plus` tier gains `betaGated: true`; price field changes to `null` (not displayed); enquiry-only flag added. Tier-strip filter excludes `betaGated: true`.
- `BUSINESS.md` Plus row updated: price changed from "£1,500/month floor" to "from £1,200/month on enquiry, private beta until embedded app ships first installable food-vertical build."
- **`claim-review` pass required before Phase 3 ships:** every existing surface that quotes £1,500+/mo must be updated or removed. Targets: outbound emails, signed PDFs, ad creatives, partner co-marketing assets, `BUSINESS.md` cross-references.
- Existing inbound (~2–3 enquiries/quarter on `/for/plus`) routes to the Flintmere team enquiry inbox. Sales call replaces self-serve checkout.
- Lead-capture form on `/for/plus`: enquiry routes to the team inbox + scanner-admin notification, not Stripe.

## Rollout

- **Phase 1 (this commit):** ADR landed; `BUSINESS.md` Plus row updated; `claim-review` task created for Phase 3 pre-flight.
- **Phase 2:** `grill-requirement` on `/for/plus` reframe — edge cases (existing inbound mid-deal, partner co-marketing dependencies, Shopify Plus directory listing copy).
- **Phase 3 (Month 1):** `/for/plus` reframed in code; `pricing.ts` `betaGated` flag landed; homepage tier strip filter applied.
- **Phase 4–5:** embedded app's first installable food-vertical build ships → ADR 0017 superseded by re-list ADR with verified pricing per actual sold deals.

## Re-open conditions

- Embedded app first installable food-vertical build ships → re-list with verified pricing.
- Inbound on the reframed `/for/plus` drops to zero post-launch (signalling the anchor isn't earning its keep) → reconsider whether visible anchor is helping at all; possibly drop the number entirely.
- An existing Plus tier customer signs at the previous £1,500 anchor before reframe ships → grandfathered; this ADR governs only new public-facing posture.
- A direct competitor publishes a verified price below £1,200 with comparable vertical depth → re-evaluate anchor.
