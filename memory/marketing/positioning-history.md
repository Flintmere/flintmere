# positioning-history.md

Append-only log of Flintmere positioning decisions. Skills write one row per decision. Most recent at the bottom.

Format:

```
### YYYY-MM-DD — <short slug>

- Message: <the positioning sentence>
- Context: <what prompted the decision — campaign, audit, reviewer feedback, competitor action>
- Audience: <SMB | mid-market | agency | enterprise | multiple>
- Outcome: <what shipped or what followed>
```

## Anchored positioning (load-bearing)

Current anchored positioning statements — load-bearing for all downstream copy. Change only via explicit decision logged here + update to `BUSINESS.md` §Positioning.

- **Hero**: `Your product catalog is [ invisible ] to ChatGPT.`
- **Category claim**: Flintmere scores Shopify catalogs for AI-agent readiness and fixes what's broken.
- **Wedge**: agency-friendly + honest GTIN + real Channel Health measurement. No other tool combines these.
- **Against**: generic SEO apps retrofitted for AI, fake-GTIN sellers, black-box AI-fix vendors, one-time consulting audits.
- **Trademark line (marketing only)**: "Catalogs built for the agentic web™."

## Historical positioning decisions

### 2026-04-19 — canon-and-signature-lock

- Message: `Your product catalog is [ invisible ] to ChatGPT.`
- Context: Canon / signature choice in ADR 0003. Operator chose hybrid (Apple-bold neutrals + legibility-bracket signature) over wireframes-as-shipped (midnight/parchment/sulphur). Canon supports declarative, technical-confidence positioning against SMB + Plus merchant + agency audiences.
- Audience: multiple (primary anchor for all surfaces).
- Outcome: Hero copy + bracket signature adopted across marketing site, scanner, Shopify app.

### 2026-04-19 — GTIN honesty as differentiator

- Message: "Honest GTIN guidance — buy them from GS1, we'll help you import them."
- Context: Competitors include fake-GTIN resellers. Flintmere's refusal to sell / imply GTIN issuance is a deliberate differentiator. #23 + #24 veto on any implied GS1 affiliation.
- Audience: multiple.
- Outcome: Pricing page, scanner results, Shopify app GTIN panel all carry the non-affiliation disclaimer. SEO cluster 3 (GTIN guidance) anchors on the honesty angle.

### 2026-04-19 — Channel Health as the retention story

- Message: "Measured impact, not faith-based subscription."
- Context: SPEC §11.2 identifies "does this actually work" as the subscription-killer at month 3. Channel Health (UTM attribution on external product URL metafield) is the answer. Positioning emphasises it from day one.
- Audience: mid-market + Plus primarily. Secondary for agencies (gives them retention story for clients).
- Outcome: Channel Health widget is a feature of every scorecard in the app. Marketing copy anchors "measured" against competitor "faith-based."

---

<!-- New entries appended below by the positioning skill. -->

## Changelog

- 2026-04-19: Initial Flintmere positioning log. Seeded with canon-and-signature lock (ADR 0003), GTIN honesty as differentiator, Channel Health as retention story.
