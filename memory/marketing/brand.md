# brand.md — Flintmere voice (operational brief)

Canonical voice lives in `memory/VOICE.md`. Commercial rationale lives in `projects/flintmere/BUSINESS.md`. This file is the operational brief marketing skills read before they write.

## Principles

- **Declarative.** Imperative mood for rules. Short sentences. No hedging, no apologies, no filler.
- **No emoji** unless the user explicitly asks.
- **Evidence-first.** Every claim traces to `claims-register.md`, `BUSINESS.md`, `SPEC.md`, or an ADR.
- **Technical-confidence register.** Talk to professionals who respect craft. No growth-hacking, no hype, no condescension.
- **Educate, clarify, guide.** Do not exaggerate. Do not weaponise fear about AI or merchant visibility.

## The signature (copy rule)

Every headline and major section carries **one bracketed word** — the key noun you want the reader to remember. See `memory/design/tokens.md` §Signature and `memory/VOICE.md` §The legibility-bracket signature in copy.

- `Your product catalog is [ invisible ] to ChatGPT.`
- `Missing [ GTIN ] on 412 products.`
- `[ Six ] pillars. One score.`

One per section. Two per page maximum. Brackets structure-only — nouns, numbers, identifiers. Never verbs or filler.

## Hard bans (non-negotiable)

Full list in `memory/VOICE.md` §Banned phrases. Summary of the most-likely-to-appear in marketing copy:

- "Bulletproof", "zero-risk", "guaranteed", "100%"
- "Revolutionary", "game-changing", "disruptive", "next-generation"
- "Unlock", "elevate", "empower", "supercharge"
- "AI-powered" (we are — we don't brag about it)
- "Best-in-class", "industry-leading" without benchmark citation
- "Trusted by" (we earn trust; don't claim it)
- "Leverage" as a verb
- "Free forever" as a blanket
- "Generate valid barcodes" / "Get a GTIN for free" (we don't — **#23 veto**)
- "Will appear in ChatGPT" / "Guaranteed AI visibility" (we can't — **#24 veto**)

Gatekeeper for banned-phrase enforcement: **#11 Investor / founder voice.**

## Preferred phrasing

- "Your product catalog is `[ invisible ]` to ChatGPT."
- "We score it, fix what's broken, and show you what changed."
- "Built for Shopify merchants and the agencies who serve them."
- "Honest GTIN guidance — buy them from GS1, we'll help you import them."
- "Every change previewed. Every change reversible for 7 days."
- "Measured impact, not faith-based subscription."
- "Catalogs built for the agentic web™." (trademark — marketing site only, use sparingly)

## Register

| Use | Avoid |
|---|---|
| catalog, product data, attribute, metafield, GTIN, SKU, MPN | "products" when we mean "catalog records" |
| AI agent, agentic storefront, ChatGPT / Gemini / Copilot | "bots", "AI robots", "the algorithm" |
| readiness, visibility, parseability, machine-readable | "SEO", "rankings", "ranking signal" (we're not an SEO tool) |
| score, pillar, ceiling, percentile | "rating", "grade" (grade is OK as a secondary label only) |
| scan, audit, fix, revert, enrich | "optimise", "improve" (too vague) |
| install, merchant, agency, store | "users", "customers" (merchants are the buyer) |

Technical-confidence register. Not growth-hack register. Not academic register.

## Proof standards

- **Pillar count**: 6. Source: `SPEC.md` §4.1. Never "multiple pillars" when the number is known.
- **Pricing**: Growth £49 / Scale £149 / Agency £399 / Enterprise £499+. Source: `BUSINESS.md` §Tiers.
- **SKU bands**: Growth <500, Scale 500–5,000, Enterprise 10,000+. Source: `BUSINESS.md`.
- **Agency seats**: 25. Source: `BUSINESS.md`.
- **AI uplift numbers**: 15× YoY / 40% invisible / 5.6M stores / 3–4× at 99% attr completion. Source: `SPEC.md` Appendix A. Cite the year (2025). Never "at least" without anchor.
- **Fix reversibility**: 7 days. Source: `SPEC.md` §5.1.
- **60-second scan**: public promise. Source: `SPEC.md` §2.1 + `performance-budget.md`.

## Never claim

- **Outcome promises**: "will appear", "guaranteed visibility", "you will rank higher on ChatGPT".
- **GS1 affiliation**: never imply Flintmere issues, licenses, or sells GTINs.
- **Absolute safety**: "100% safe", "never fail", "fool-proof".
- **Legal, financial, or tax advice.**
- **Results without evidence**: "thousands of happy customers" pre-launch.

## Cross-references

- Banned phrases + voice rules — `memory/VOICE.md`
- Claim verification — `memory/compliance-risk/claims-register.md`
- Copy Council workflow — `memory/PROCESS.md` §Sub-councils (Copy Council #20 + #21 + #22)
- Legal gating — `memory/PROCESS.md` §Sub-councils (Legal Council #9 + #23 + #24)

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced Web3 voice brief (token approvals, wallet register, "degen/wagmi" bans) with Shopify-app voice brief (catalog, GTIN, AI agent register; outcome-promise bans; agency-friendly positioning).
