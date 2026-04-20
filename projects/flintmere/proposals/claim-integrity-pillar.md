# Proposal — Claim-integrity pillar

- **Status:** Draft — pending Legal Council (#9 + #23 + #24) review before implementation.
- **Author:** Claude, drafted 2026-04-20 after industry research (xgentech + Rankfirms).
- **Target:** Post-launch (Phase 2+). Not a pre-launch pillar.

---

## Problem

AI agents that source product descriptions from merchant catalogs can amplify merchant claims. When those claims are unverified or non-compliant, the downstream agent is a force-multiplier: a hallucinated "FDA-approved" in a product description reaches thousands of shoppers through agent surfaces without human review.

Industry surveys (Rankfirms ecommerce-AI playbook, xgentech Plus-brand research) flag claim integrity as the next merchant-liability frontier for agentic commerce. Merchants ship content at scale; regulators apply the same rules regardless of whether a human or an LLM drafted the copy.

Three symptom patterns we see in Shopify catalogs today:

1. **Restricted claim words in descriptions** — "clinically proven", "cures", "FDA-approved", "GMC-certified", "100% effective", "guaranteed results" — especially common in supplements, beauty, and medical-device-adjacent verticals.
2. **Geographic compliance mismatches** — a UK merchant using FDA language (US regulator) or a US merchant using CE-marking language without certification.
3. **Auto-translated claim drift** — the English description says "supports healthy skin". The Spanish translation drifts to "cura problemas de la piel" (cures skin problems — a medical claim).

## Proposed scope

A **new scoring pillar** that evaluates description text against a curated restricted-language library. Scoring-only in the scanner; remediation suggestions in the embedded app.

### What the pillar checks

1. **Restricted-term detection** — regex + dictionary lookup against a curated claim library.
2. **Geographic applicability** — merchant's Shopify store address → expected regulator (UK ASA, US FDA/FTC, EU CPR/GPSR, AU TGA, CA Health Canada). Flag claims that reference the wrong regulator.
3. **Evidence-back requirement detection** — claims that require substantiation ("clinically proven", "X% more effective") surface as issues until the merchant attaches supporting evidence.
4. **Category-aware rules** — supplements and skincare have stricter rules than apparel. Default to permissive outside high-risk categories.

### What it does NOT check

- Flintmere does not adjudicate whether a claim is true. We flag regulatory-risk language patterns and leave verdicts to the merchant's legal team.
- Flintmere does not replace a compliance review. The pillar surfaces "probable review items"; the footer of every claim-integrity issue reads: "Consult your regulatory counsel. Flintmere does not provide legal advice."
- Flintmere does not auto-rewrite claim language in Tier 2 remediation. Claim-integrity issues are surface-only until Legal Council approves a supervised rewrite flow.

## Restricted-language sources (seed library)

### United Kingdom
- **ASA / CAP Code** — Advertising Standards Authority non-broadcast code, sections 12 (Medicines, medical devices, health-related products and beauty products) and 13 (Weight control and slimming). Primary source: `asa.org.uk/codes-and-rulings/advertising-codes/non-broadcast-code.html`.
- **MHRA guidance on medicinal claims** — borderline products flagged when claims "treat, cure or prevent" are used in non-medicinal contexts.
- **ICO sensitive-category guidance** — for health-related personal data processing references.

### United States
- **FDA 21 CFR 101** — food labelling, nutrient content claims.
- **FDA 21 CFR 201** — drug labelling; "unapproved new drug" status triggers when supplements make disease claims.
- **FTC Endorsement Guides (16 CFR Part 255)** — testimonial and influencer language.
- **FTC Green Guides** — environmental marketing claims ("eco-friendly", "recyclable", "compostable").

### European Union
- **Regulation (EU) 1924/2006** — nutrition and health claims made on foods.
- **General Product Safety Regulation (EU) 2023/988** — applies to product descriptions on online marketplaces from 13 December 2024.
- **Cosmetic Products Regulation (EC) 1223/2009** — Article 20 + technical document on claims (published 2023 revision).

### Australia
- **ACCC consumer guarantees** — "lifetime guarantee" usage.
- **TGA Therapeutic Goods advertising code** — restricted representations list.

### Canada
- **Competition Bureau — Deceptive Marketing Practices Digest**.
- **Health Canada Natural Health Products Regulations** — claim substantiation.

## Risk footprint (why this pillar is gated on Legal Council)

### Liability classes Flintmere must evaluate before shipping

1. **False-positive reputational risk** — we flag a compliant claim as "restricted", merchant removes it unnecessarily, loses conversion, attributes loss to Flintmere. *Mitigation:* conservative seed library, "probable review" language, never auto-rewrite.
2. **False-negative liability transfer** — we fail to flag a non-compliant claim, merchant ships copy to agents, regulator issues a ruling. Does the merchant argue Flintmere signed off? *Mitigation:* explicit disclaimer on every pillar issue, terms-of-service clause stating Flintmere does not provide legal advice. Requires #9 Lawyer review.
3. **Jurisdictional coverage gaps** — a merchant in Singapore operating under MAS rules gets zero value. *Mitigation:* launch with UK/US/EU only; document gaps; add jurisdictions as user demand surfaces.
4. **Library staleness** — regulators update rules. Our seed library ages. *Mitigation:* quarterly library review (Admin/Ops `regulatory-change-response` skill — already exists in `memory/compliance-risk/`).
5. **Translation/localisation liability** — flagging English-source claims is tractable; flagging Japanese-translated claims requires native regulator knowledge we don't yet have. *Mitigation:* English-only at launch; add locales when we can stand up equivalent library quality.

### Council gates

- **#9 Lawyer (veto)** — reviews the seed library, the scoring contract, the terms-of-service language around the pillar, the disclaimer placement.
- **#24 Data protection** — confirms no claim text is sent to external LLMs without explicit merchant consent. Pattern-matching stays local.
- **#11 Founder** — approves the positioning ("we flag, we don't adjudicate") before the pillar is marketed.
- **#20 Brand copy** — approves the in-product language. Current draft: "Probable review · may require regulatory substantiation · not legal advice."
- **#13 UX writer** — approves the issue-description template so merchants understand what to do next.

## Build scope (when approved)

### Phase A — research + library

- Build the restricted-language YAML library under `packages/scoring/data/claim-integrity/`.
- Structure: per-jurisdiction YAML file, each containing `{ term, category, severity, citation, remediation }` entries.
- Seed with 150–300 entries drawn from the sources above, reviewed by #9.

### Phase B — scoring pillar

- `packages/scoring/src/pillars/claim-integrity.ts` — takes `CatalogInput` + merchant's jurisdiction, runs dictionary scan across `title` + `bodyHtml` (stripped), returns `PillarResult`.
- Weight: TBD post-#9 review. Candidate: 10% (rebalance from consistency or attributes).
- Severity map: critical (drug/medical claim without evidence) → high (unsubstantiated quantitative claim) → medium (regulator-specific language mismatch) → low (ambiguous).

### Phase C — scanner surface

- New pillar in the scanner scorecard, same treatment as existing pillars.
- Issue descriptions cite the specific term + regulator + suggested rewrite pattern.
- Footer disclaimer on every claim-integrity issue.

### Phase D — embedded app remediation (future)

- Tier 2 LLM rewrite with #9 Lawyer-approved prompt template + human-in-the-loop approval queue.
- No auto-apply. Every rewrite goes through the existing Fix History + revert flow.

## Business case

### Revenue angle

Plus merchants (xgentech's ICP, our stretch-target) are explicitly flagged as at-risk on this topic. Claim-integrity is a natural Scale-tier (£149) feature and a strong Agency-tier (£399) differentiator. Legal-compliance-themed pillars convert on fear, not on hope — different buying motion from the existing six pillars.

### Moat angle

The restricted-language library becomes an institutional asset. Every quarter, the library gets better. Competitors need to rebuild it from zero. This is the same moat model as the existing GTIN checksum + GS1 geography logic — curated data that pays compounding dividends.

### Positioning angle

"Flintmere scores the catalog mistakes that cost you sales. And now: the catalog mistakes that cost you lawsuits." Extends the product promise from revenue-protection to brand-protection.

## Non-scope (explicit deferrals)

- Image claim analysis (packaging photos with on-pack claims) — not in Phase A. Requires vision LLM + separate risk review.
- Reviews + UGC claim analysis — out of scope (merchant does not control that text).
- Full legal-review queue integration — out of scope; this is a surfacing tool, not a review workflow platform.

## Decision required

1. **Proceed to Phase A (library build)?** Yes/No.
2. **If Yes**, who reviews the seed library before Phase B begins? Default: #9 Lawyer consulting with external counsel for the specific jurisdiction.
3. **If No**, keep this document as the rationale for future revisit. Re-open when (a) a Plus merchant explicitly asks or (b) a regulator ruling against an AI-agent commerce surface surfaces.

## Open questions

- Does the pillar score against what agents *see* (the description Shopify serves) or what the merchant *wrote* (the description stored in Admin)? Agent-facing is the right target; confirm with #12 Ecosystem that the two are always identical on Shopify.
- Do we offer a free scanner-level version (scanner flags critical-severity only) and gate medium/low to Growth-tier+? Revenue-positive; need #11 sign-off on positioning.
- Does the disclaimer footer go on every issue, or is one page-level disclaimer sufficient? Legal answer likely "every issue"; confirm with #9.

## Changelog

- 2026-04-20: Initial draft. Scope proposal, seed-library plan, risk register, council-gate map. Awaiting Legal Council review before any code lands.
