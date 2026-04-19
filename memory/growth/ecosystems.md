# ecosystems.md

Live tracked ecosystems for Flintmere with their programmes, deadlines, contacts, and evaluation criteria. This is the **operational file** for `grant-application`, `partnership-brief`, and `integration-proposal`. Targets in general live in `targets.md`; programme-specific detail lives here.

Flintmere's primary ecosystem is **Shopify**. Secondary ecosystems are the UK/EU SaaS startup environment, ecommerce trade organisations, and the tooling adjacencies (PIM, SEO, headless, analytics) that operate around Shopify.

## Tracking format

```
## <Ecosystem name>

- **Programme(s):** <named programmes that open to us>
- **Application / submission URL:** <link — verify before use>
- **Amount range or benefit:** <cash, promotion, listing, access>
- **Evaluation cycle:** <rolling | seasonal | ad-hoc>
- **Typical deadline:** <>
- **Decision timeline:** <>
- **Contact:** <programme lead, email, community channel>
- **Evaluation criteria (verbatim or paraphrased with source):** <>
- **Common disqualifiers:** <>
- **Flintmere's fit:** <>
- **Evidence of Flintmere's fit:** <install count, merchant testimonials, Built-for-Shopify status, research publications>
- **Last updated:** YYYY-MM-DD
```

---

## Shopify (primary ecosystem)

### Shopify Partner Program

- **Programme(s):** Partner registration ($19 one-time); Plus Partner; Built-for-Shopify badge.
- **Application URL:** `https://partners.shopify.com/` (verify before use).
- **Amount range or benefit:** Revenue share (0% first $1M lifetime, 15% after); Plus Partner access; Built-for-Shopify review priority.
- **Evaluation cycle:** Partner registration is instant; Plus Partner is by application; Built-for-Shopify by review.
- **Decision timeline:** Partner: instant. Plus: weeks. Built-for-Shopify: after install base + reviews accumulated (~month 6+).
- **Evaluation criteria:** Technical quality + merchant outcomes + adherence to App Store requirements.
- **Flintmere's fit:** direct — we're a Shopify app.
- **Evidence:** install count, merchant NPS (via `weekly-metrics-brief`), case studies.
- **Last updated:** 2026-04-19

### Shopify App Store

- **Programme(s):** App listing; App Store categorisation; Shopify's curated selections ("Editor's Choice", "Trending", category features).
- **Application URL:** Via Partner Dashboard → App submission.
- **Amount range or benefit:** Discovery-driven installs. App Store is one of the top two install channels.
- **Evaluation cycle:** Initial submission + reviews with each version update.
- **Decision timeline:** 1–4 weeks for initial submission; 1–3 weeks for updates.
- **Evaluation criteria:** App Store requirements checklist (see `memory/compliance-risk/platform-rules.md`).
- **Flintmere's fit:** target categories — "Store management", "Product information", "Marketing & conversion", "AI" (if Shopify creates a dedicated category — watch for it).
- **Common disqualifiers:** missing GDPR webhooks, slow webhook responses (>5s), misleading listing copy, Polaris violations.
- **Last updated:** 2026-04-19

### Shopify Plus Partner Directory

- **Programme(s):** Plus Partner status → listed in Shopify Plus Partner Directory, visible to enterprise merchants.
- **Benefit:** direct agency prospecting channel + Enterprise-merchant visibility.
- **Evaluation criteria:** proven track record with mid-market / Plus merchants; agency business model; certifications.
- **Flintmere's fit:** **candidate path for scaling agency-tier revenue.** Get listed here once we have 5+ agencies using Agency tier successfully.
- **Last updated:** 2026-04-19

### Shopify events

- **ShopTalk (US, global)** — retail + ecom industry conference. Flintmere's primary target: sponsoring agency-track sessions + booking Enterprise merchant meetings.
- **ShopTalk Europe (UK)** — closer-to-home variant. Same strategy.
- **IRCE** — retail-focused. Secondary priority.
- **Shopify Unite** — platform-specific (when it resumes). Highest signal-to-noise ratio for Shopify ecosystem integrations.
- **Regional Shopify meetups** (London, NYC, Toronto) — grassroots. Good for agency network-building.

---

## Tooling adjacencies

### PIM vendors (Product Information Management)

- **Shape:** integration partnerships — PIM vendors feed cleaned product data into Shopify; Flintmere reads from Shopify and scores readiness. Natural complementarity.
- **Programme(s):** partner programmes vary per PIM vendor.
- **Named vendors:**
  - **Plytix** — mid-market PIM, Shopify-native integrations.
  - **Sales Layer** — mid-market → enterprise.
  - **Pimcore** — larger enterprise.
  - **Akeneo** — mid-market → enterprise; open-source variant exists.
- **Flintmere's fit:** "if you use PIM X, Flintmere reads from it to score your catalog" — positions us non-competitively.
- **Contact strategy:** `integration-proposal` + `partnership-brief` for each target vendor.
- **Last updated:** 2026-04-19

### Shopify SEO app ecosystem

- **Shape:** complementary positioning — SEO apps target Google; Flintmere targets AI agents. Cross-promotion opportunities.
- **Vendors:** Schema Plus, JSON-LD for SEO, Booster SEO. We do not compete with these; Flintmere is about agentic commerce, not keyword-SEO.
- **Flintmere's fit:** joint content ("the SEO/AI split in 2026 catalog optimisation"), co-webinars, cross-referral.
- **Last updated:** 2026-04-19

### Headless commerce + composable stack vendors

- **Shape:** integration partnerships — headless storefronts (Hydrogen, Remix, Next.js commerce) still need scored catalog data to publish to agentic surfaces.
- **Named vendors:**
  - **Hydrogen agencies** (Shopify's own).
  - **Composable commerce agencies** — Occtoo, Fabric.
- **Flintmere's fit:** adjacent; we score what's published regardless of the front-end stack.
- **Last updated:** 2026-04-19

---

## Ecommerce press + media

Primary channels for launch + research-report amplification (not grants — editorial coverage).

- **Modern Retail** — US, ecom-focused, good for research-piece pickup.
- **Retail Dive / Retail Week** — US + UK. Wider retail, less ecom-native.
- **RetailWire** — industry commentary.
- **eComExperts** — Shopify-ecosystem focused.
- **Shopify Masters (podcast)** — Shopify-native.
- **Modern Retail Unlimited (newsletter)** — ecom insider.

See `memory/marketing/outreach.md` for contact protocol.

---

## UK / EU startup programmes (low priority at launch)

SPEC does not position Flintmere as a grant-funded product. These are tracked in case they become relevant.

- **Innovate UK** — SME innovation grants. Relevant if Flintmere pursues AI-specific R&D funding. Low priority pre-launch.
- **EU Horizon Europe** — digital commerce research programmes. Very bureaucratic; not a launch fit.
- **Tech Nation / UK Digital** (successor programmes) — UK digital scale-up programmes. Relevant at Series A-adjacent stage.
- **R&D Tax Credits** (UK) — not a grant, but material cash-flow instrument for SaaS dev. Route through accountancy.

**Current posture:** none actively pursued. Revisit at month 4+ when traction exists.

---

## Ecosystems we do not pursue

Write down to avoid re-asking:

- **Web3 ecosystem grants** (Ethereum Foundation, Optimism, Base, Arbitrum, Polygon, Gitcoin) — inherited from allowanceguard kit; do not apply. Flintmere is not Web3.
- **Crypto accelerators** (a16z Crypto, Paradigm) — not applicable.
- **Closed-source only programmes** — if we consider open-sourcing `packages/scoring`, revisit; not currently.
- **Programmes in OFAC-sanctioned jurisdictions** (see `memory/compliance-risk/jurisdictions.md`).

## How this file is maintained

- On every `grant-application` / `partnership-brief` run: verify URLs live + criteria current.
- When a programme launches / ends / restructures: update here + note in `grants-history.md` or `partnerships-history.md`.
- Every entry cites source + date on its last-updated line.

## Open questions for the operator

Most answers live in `BUSINESS.md` / `PROJECT.md`. Flintmere-specific:

- Are we open to being the "Shopify-only AI readiness tool" long-term, or do we plan to expand to WooCommerce / BigCommerce / other platforms? Affects ecosystem partnership strategy.
- Is Agency tier the primary distribution channel, or do we plan a direct Enterprise sales motion in year 1?
- Do we participate in Shopify Unite (speaking slots, booth presence) once it resumes?

Answer once; they become canonical in `BUSINESS.md` or an ADR.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced Web3 ecosystem programmes (Ethereum Foundation, Optimism, Base, Arbitrum, Polygon, Gitcoin, Protocol Guild, a16z Crypto) with Shopify ecosystem (Partner Program, App Store, Plus Partner Directory, Shopify events) + tooling adjacencies (PIM, SEO apps, headless) + ecommerce press + UK/EU startup programmes.
