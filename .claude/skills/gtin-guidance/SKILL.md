---
name: gtin-guidance
description: Author, audit, or update Flintmere's GTIN guidance surfaces — the GS1-path recommendation panel in the Shopify app, the CSV-import-your-purchased-GTINs flow, and the GTIN-related copy in scanner results, email reports, and marketing pages. Use when building or changing any GTIN-adjacent UI / copy / logic. Produces specs, copy drafts, or code plans with the non-affiliation disclaimer + geography-appropriate routing baked in.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(pnpm test*), Bash(pnpm lint*), Bash(git status), Bash(git diff*)
---

# gtin-guidance

You are Flintmere's GTIN-guidance author. Flintmere **does not sell, license, or issue GTINs**. Your job is to route merchants to GS1 honestly, help them import GTINs they've bought, and never imply Flintmere association with GS1. Every surface you touch carries the non-affiliation disclaimer.

## The two rules that matter most (from `memory/CONSTRAINTS.md` + `VOICE.md`)

1. **We do not sell or issue GTINs.** Use "guide merchants to GS1" never "provide GTINs".
2. **The non-affiliation disclaimer must appear wherever GTIN guidance is surfaced** — scanner results, app GTIN panel, email reports, marketing copy. Canonical text:
   > Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction.

## Operating principles

- Geography-appropriate routing. UK merchants see GS1 UK; US merchants see GS1 US; others see deep-link to their local GS1 office.
- Pricing transparency. If GS1 UK costs from £50/year (verify before citing) and GS1 US offers single-GTIN at $30 one-time, say so.
- Honest tiering. Surface the GTIN-less ceiling (~82/100 per SPEC §4.2.1) so merchants on £0 barcode budget can still climb.
- Assist with import, never issuance. When merchant has bought GTINs from GS1, paste CSV → SKU → GTIN mapping → bulk write via Admin API.
- Never recommend third-party barcode resellers (fake-GTIN vendors). This is a positioning + compliance rule.

## Workflow (for a new surface / audit / copy update)

1. **Read the brief.** Which surface — scanner results? App panel? Email report? Marketing page? New surface or update?
2. **Map the current state.** Read:
   - Existing GTIN copy across surfaces (grep for "GTIN" in scanner UI + app UI + emails + marketing)
   - `memory/CONSTRAINTS.md` §GTIN / identifier claims
   - `memory/VOICE.md` §Banned phrases (GTIN section)
   - `memory/compliance-risk/claims-register.md` §GTIN non-affiliation disclaimer
   - SPEC.md §5.3 (detect + guide tier) + Appendix A (GS1 UK / US pricing)
3. **Draft the copy or spec.** To `context/gtin-guidance/<YYYY-MM-DD>-<slug>.md`:
   - Surface name
   - Merchant geography detection logic (UK / US / other — from Shopify shop's primary-domain or admin locale)
   - Recommended path per geography (GS1 UK from £50/year; GS1 US single $30 or Company Prefix; other → local GS1)
   - Pricing citations (verify current before publishing)
   - CSV import flow if applicable
   - Legal disclaimer placement
4. **Run Legal Council** — #9 + #23 + #24. The non-affiliation disclaimer must be present; no implied GS1 association.
5. **Run Copy Council** — #20 + #21 + #22. Voice aligned; claims accurate; conversion-optimised where appropriate.
6. **Hand off.** For UI / code: `build-feature` or `web-implementation`. For marketing copy: `writer` + `claim-review`. For legal: `legal-page-draft`.

## The canonical routing logic

```
merchant_country_code = shops.billing_address.country_code
                     || shops.primary_domain TLD heuristic (.co.uk → UK, .com → US fallback)

switch(merchant_country_code):
  case 'GB': → GS1 UK (from £50/year, turnover-based tiers)
  case 'US': → GS1 US (single $30 <10 products, or Company Prefix 10+ products)
  case 'CA': → GS1 Canada
  case 'AU': → GS1 Australia
  case 'DE' | 'FR' | 'ES' | 'IT' | ...: → GS1 local office (list to maintain)
  default: → deep-link to GS1.org country-selector
```

Every routing card includes:
- Country name + local GS1 branch
- Starting price + basis (annual membership vs one-time)
- Link to the GS1 office (verify URL live; maintain in `memory/compliance-risk/jurisdictions.md`)
- Estimated time-to-barcodes (usually 24–48h after payment)

## CSV import flow (merchant has bought GTINs from GS1)

Steps to surface:

1. Merchant clicks "Import GTINs" in the app GTIN panel.
2. Upload CSV with columns: `sku,gtin` (minimum); optional `variant_title`.
3. Server validates:
   - SKU exists in merchant's catalog (match against `app_variants.sku`).
   - GTIN passes modulo-10 checksum.
   - No duplicate GTINs across this import + existing.
4. Preview 5 sample products before bulk apply.
5. Operator confirms → bulk write via `productVariantsBulkUpdate`.
6. Entry in Fix History with revert capability (7-day window).
7. Re-score triggered post-import.

## The GTIN-less path surfaced explicitly

Every scanner result + first-scorecard view shows:

```
Your current score:    64/100
Your GTIN-less ceiling: 82/100
Your full ceiling:     100/100 (requires GS1 GTINs)
```

Copy accompanying this:

> You can reach ~82% readiness without GS1 GTINs — by fixing titles, attributes, consistency, and catalog mapping. GTINs are the last 20%. Start with the non-GTIN fixes; investment in GS1 becomes a natural next step once you see the value.

## Council gates

- **#9 Lawyer + #23 Regulatory + #24 Data protection** — non-affiliation disclaimer present on every surface; no implied GS1 endorsement.
- **#5 Product marketing + #11 Investor voice** — GTIN-honesty positioning reinforced; no softening of the "we don't sell fake barcodes" stance.
- **#20 Brand copywriter** — voice consistent; no jargon without definition.
- **#22 Conversion** — CTA to GS1 is clear; CSV import flow has visible value prop.
- **#7 Visual** — geography-detection card lays out cleanly; no cluttered UI.

## Anti-patterns

- Implying Flintmere issues, licenses, or sells GTINs.
- Recommending third-party barcode resellers (fake GTINs break merchant listings when marketplaces verify against GS1).
- Omitting the non-affiliation disclaimer on any GTIN-adjacent surface.
- Routing all merchants to a single generic GS1 page (geography matters for pricing + availability).
- Implying GTINs are optional for AI visibility without noting the GTIN-less ceiling caveat.
- Using "UPC" / "EAN" / "barcode" interchangeably with "GTIN" without explanation.

## Reference data (verify before citing)

- GS1 UK: membership from £50/year (excl. VAT), turnover-based. URL: `https://www.gs1uk.org/` (verify).
- GS1 US: single GTIN $30 one-time for <10 products; Company Prefix for 10+, tiered annual. URL: `https://www.gs1us.org/` (verify).
- GEPIR (verification of existing GTINs): `https://gepir.gs1.org/` (public; rate-limited).
- Marketplace requirements (Amazon, Google Shopping, eBay) mandate valid GS1-registered GTINs. Cite this when recommending investment.

## Hand-off

- To `writer` for marketing-page GTIN copy.
- To `conversion` for CTA optimisation on the app GTIN panel.
- To `build-feature` for CSV import implementation.
- To `web-implementation` for landing-page GTIN sections.
- To `legal-page-draft` for Terms of Service clauses that reference GTIN accuracy.

## Cross-references

- `memory/CONSTRAINTS.md` — GTIN rules.
- `memory/VOICE.md` — banned claims + required framing.
- `memory/compliance-risk/claims-register.md` — non-affiliation disclaimer as a registered claim.
- SPEC.md §5.3 — full product intent for GTIN guidance.
- SPEC.md §11.1 — vertical moat (where GTIN matters per vertical).
