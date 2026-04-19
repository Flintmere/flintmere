# Flintmere — Product & Go-to-Market Plan

*A Shopify app that scores product catalogs for AI-agent readiness and fixes what's broken so ChatGPT, Gemini, and Copilot can actually recommend them.*

**Status**: Pre-build scoping document. v1.2
**Target market**: Shopify merchants, 100–5,000 SKUs, $500K–$20M revenue
**Brand**: Flintmere (parent brand). Public scanner lives at `audit.flintmere.com`. Main marketing site at `flintmere.com`.

*v1.2 updates: domain locked to flintmere.com / audit.flintmere.com, Next-7-days list refreshed to reflect v1.1 changes, risk section updated to cross-reference §11.2 Channel Health.*

*v1.1 added: vertical moat strategy, Enterprise tier, viral badge + share-for-trial loop, Channel Health measurement, GTIN-less path, Fix History UX, SLA commitments, streaming JSONL architecture, renamed pillar terminology.*

---

## 1. Executive summary

AI shopping agents (ChatGPT, Gemini, Microsoft Copilot) now drive measurable commerce traffic — Shopify reports AI-agent-driven orders grew ~15x year-over-year in 2025. But roughly 40% of Shopify catalogs get excluded from agent recommendations because their product data isn't structured correctly: missing GTINs, under-populated metafields, inconsistent pricing between surfaces, poor catalog mapping.

The market for fixing this is nascent. Two early players exist (Agent IQ / 40rty.ai and Alhena AI). Neither has "Built for Shopify" status or meaningful install base yet. There's a 6–12 month window to establish a category-leading position before Shopify ships this natively or incumbents pivot.

**Flintmere's pitch**: run a free 60-second audit → see your AI-readiness score → fix the highest-ROI issues in one click → monitor continuously. Free public scanner is the top-of-funnel. £49/month is the entry subscription. Agency tier at £399/month is the economic engine.

**Most important decision in this plan**: validate demand before building. Ship a public URL-based scanner this week. If it doesn't pull submissions and email opt-ins, pivot positioning before writing app code.

---

## 2. Validation — Week 1 (do this before anything else)

The single biggest risk is building for a problem merchants don't know they have yet. Validate first.

### 2.1 Public scanner (ship by end of week 1)

A standalone web page at `audit.flintmere.com`. User enters a Shopify store URL. App scrapes:

- Public product feed (`/products.json`)
- Sitemap (`/sitemap_products_1.xml`)
- Sample product pages (JSON-LD structured data)
- Homepage (detects theme, store policies)

Returns a partial score (3 of 6 pillars) with specific issues. Full report gated behind email.

**No install, no OAuth, no Shopify app listing.** Pure marketing funnel.

### 2.1.1 Email report — personalised economic framing

The emailed full report is where conversion happens. Every scanner user must receive a report that quantifies opportunity in their language:

- "Fixing your 47 missing GTINs could increase AI-channel visibility by ~34% (estimated from comparable beauty stores in your size band)."
- "Your title quality score sits at the 42nd percentile. Top-decile stores in your vertical average 87. Estimated revenue impact of closing that gap: £14,000–£38,000 annually."
- Direct CTA: "Apply all recommended fixes in one click — start Growth tier (£49/mo, first month £29 for scanner users)."

Without economic framing, merchants take the PDF and leave. With it, the scanner becomes a conversion funnel, not just a lead gen tool.

### 2.1.2 Shareable badge (viral acquisition)

After audit, generate a public shareable URL showing the store's score with branding attribution. Example: `flintmere.com/score/acme-supplements`. Merchant can:

- Embed a badge widget in their site footer: "AI-readiness score: 84/100 · Flintmere"
- Share on LinkedIn / X: "Our AI-readiness improved from 52 to 84 in 30 days using @flintmere"
- Download a PDF certificate for internal use

Each share = a free backlink and an organic inbound signal. Merchants love flexing benchmarks; lean into that.

### 2.1.3 Share-for-trial loop

After audit completion: *"Share your score on LinkedIn or X and unlock 7 days of Growth tier free, no card required."* Verification via URL submission. Converts scanner users into paid-tier trialists without needing to ask for a credit card upfront.

### 2.2 Week 1 success metrics

| Metric | Threshold | Interpretation if below |
|---|---|---|
| URL submissions | ≥50 | Positioning is wrong — reframe around a narrower pain (Amazon listing rejection? Google Shopping disapprovals?) |
| Email opt-in rate | ≥40% of submitters | Hook/copy isn't compelling — rewrite |
| DM-response rate on follow-up | ≥20% | Low intent — these are tire-kickers, not buyers |
| Paid £97 audit conversions | ≥3 of first 20 DMs | Strong buy signal — proceed to MVP |

### 2.3 Distribution (zero-budget)

**Day 3 — write the hooks before building the scanner.** If you can't make the problem urgent in one sentence, the scanner won't convert. Draft and refine these first, in this order:

- LinkedIn headline (founder account): *"I audited 200 Shopify stores. 40% of their products are invisible to ChatGPT. Here's a free tool to see if yours are."*
- Reddit post title (r/shopify, r/ecommerce): *"Built a free tool that scores Shopify catalogs for AI-agent readiness — curious what your store scores"*
- Cold DM opener: *"Ran your store through our scanner — you're at 48/100 for AI readiness. Want the full breakdown? No pitch."*

If any of these feel weak on the page, the problem isn't painful enough yet — reposition before shipping the scanner.

1. **LinkedIn post** from founder account (the headline above). Include screenshot of scanner output.
2. **r/shopify, r/ecommerce** — share the free tool, not a product pitch.
3. **Shopify Partner Slack** channels.
4. **Twitter/X** — tag Shopify dev relations team members who post about agentic commerce.
5. **10 cold calls to Shopify agencies**. Ask: "What's the dumbest, most repetitive data cleanup task you bill clients for?" — identifies whether catalog hygiene is already on their radar.

### 2.4 Paid concierge audit (£97)

Offer to first 20 interested merchants: "I'll manually audit your store for AI-readiness and deliver a prioritized fix list." Takes ~1 hour each. Validates willingness to pay, but does NOT validate subscription appetite (that requires the app itself). Treat it as signal, not proof.

**Day 4 — ship a dedicated £97 audit landing page** alongside the scanner launch. Minimum viable:

- Single page with value prop, what's delivered, 48h turnaround promise
- Calendly link for kickoff call
- Stripe payment button (no account system needed for week 1)
- Drive traffic from scanner results page: *"Want us to do this for you — £97, full report within 48 hours?"*

Target: 5 takers in week 1. Fewer than that = pause and re-evaluate positioning.

---

## 3. Product definition

### 3.1 What Flintmere does

Three loops, increasing in value and price:

1. **Audit loop**: scan catalog → produce AI-readiness score + prioritized fix list
2. **Fix loop**: apply safe automated fixes, queue LLM-suggested fixes for merchant approval, write changes back via Admin API
3. **Monitor loop**: webhooks on product changes → re-score → alert on score drift, standards changes, or when a competitor passes them

### 3.2 What Flintmere is NOT

- A quiz app
- A general SEO tool
- A product listing optimizer for marketplaces (Amazon/eBay) — tangential but not core
- A chatbot or on-site AI assistant

Scope discipline matters. Merchants don't need another swiss-army-knife.

### 3.3 Target users

**Primary buyer**: Shopify store owner, 100–5,000 SKUs, $500K–$20M revenue. Usually also the person running marketing. Cares about visibility in new channels.

**Secondary buyer**: Shopify agency (Plus Partner or growing agency) managing 5–50 client stores. Wants white-label reports and a diagnostic tool they can pitch with.

**Not the buyer**: hobbyist stores <50 SKUs, <$100K revenue. They churn fast and don't have the catalog maturity for this to matter.

---

## 4. The scoring system

Single composite 0–100 score, six weighted pillars. The composite IS the product — a single-dimension audit is just a linter.

### 4.1 Pillars and weights

| Pillar | Weight | What it measures |
|---|---|---|
| Identifier completeness | 20% | GTIN, MPN, brand, SKU presence and validity |
| Attribute completeness | 25% | Metafield population against category template |
| Title & description quality | 15% | Literal language, length, agent-parseability |
| Catalog mapping coverage | 15% | Custom fields mapped to Shopify Catalog standard fields |
| Consistency & integrity | 15% | Price/inventory/status alignment across surfaces |
| AI checkout eligibility | 10% | External URL metafield, published status, store policies present |

*Note on terminology: we deliberately use "AI checkout eligibility" in merchant-facing language rather than "agentic readiness" — it maps to Shopify's own Agentic Storefronts vocabulary while being instantly legible to non-technical merchants. Internal code and API can still use `agentic_readiness` if preferred for brevity.*

### 4.2 Detailed checks per pillar

**Identifier (20%)**
- `barcode` field populated on variant (typically holds GTIN)
- GTIN passes checksum validation (modulo-10 check)
- GTIN verifiable in GS1 GEPIR database (optional real-time check, costs API calls)
- MPN field present where applicable (electronics, industrial)
- Brand metafield populated (fallback: vendor field)
- SKU present and unique across catalog

**Attribute completeness (25%)** — category-dependent template
- Apparel: material, size system, color, care, country of origin, gender/age target
- Electronics: model number, compatibility, power specs, dimensions, warranty
- Supplements: serving size, ingredients list, certifications, age restrictions
- Beauty: skin type, ingredients, volume, shelf life
- Default template for uncategorised products

Score = weighted % of expected attributes populated (typed metafields score higher than free-text).

**Title & description (15%)**
- Title ≤ 150 chars (hard cap for agent parseability)
- Title contains: brand, product type, primary differentiator
- No marketing fluff in title (LLM check for "BEST EVER!!!", "LIMITED!", etc.)
- Description ≥ 200 chars, has structural formatting (bullets/headings)
- Use-case phrases present ("ideal for X", "works with Y")
- LLM check: can an agent with only this data answer "what is this product for and who buys it?"

**Catalog mapping (15%)**
- % of merchant's custom metafields mapped to Shopify Catalog standard fields via Catalog Mapping
- Detection of tag-prefix patterns that should be mapped (e.g., `size-L`, `color-red`)
- Title delimiter patterns that should be broken out (e.g., "Shirt - Large - Blue")

**Consistency & integrity (15%)**
- Price in Admin API = price in Storefront API = price in rendered JSON-LD
- Inventory reflects correctly across all surfaces
- Product status alignment (ACTIVE vs DRAFT vs ARCHIVED)
- Images: valid URLs, alt text present, correct aspect ratios
- No product listed as active with zero inventory (unless explicitly allowed)

**AI checkout eligibility (10%)**
- External product URL populated in standard metafield (required for agentic storefronts)
- Store policies published (refund, privacy, terms, shipping)
- D2C-only products flagged correctly (B2B exclusions)
- Product status not set to Unlisted
- Agentic storefronts channel enabled

### 4.2.1 The GTIN-less path (80% ceiling)

Not every merchant can afford GS1 fees immediately. A store with 500 products needing a Company Prefix faces £200–£500+ annually — real friction, especially for early-stage brands.

**Flintmere's position**: you can reach ~80% readiness WITHOUT GTINs by fixing titles, attributes, consistency, catalog mapping, and checkout eligibility. GTINs are the last 20%. Show this path explicitly in the scorecard:

- "Your current score: 47/100. Your GTIN-less ceiling: 82/100. Your full ceiling (with GTINs): 100/100."
- Route merchants to the non-GTIN fixes first. Surface GTIN guidance as a second phase.

This lets every merchant climb the ladder, even on a £0 barcode budget. Once they see value from the first phase, the GS1 investment becomes a natural next step, not a barrier to entry.

### 4.3 Score presentation

**Store level**: single 0–100 score + letter grade + pillar breakdown + peer benchmark.

**Product level**: ranked list of fixable products sorted by `revenue_impact × score_deficit`. Top products fixed first = maximum ROI.

**Benchmarking** (key retention hook): percentile within vertical. "You scored 64. Top 10% of beauty stores score 89+. You are currently in the 42nd percentile."

---

## 5. The auto-fix engine

Three tiers. Gating based on safety, not arbitrary capability.

### 5.1 Tier 1 — Auto-safe (one-click apply, no approval needed)

Changes that cannot realistically go wrong:

- Move existing barcode values into a typed GTIN metafield
- Generate alt text for product images via vision LLM (Haiku or GPT-4o-mini — ~$0.001–0.005 per image)
- Populate `brand` metafield from vendor field
- Create missing metafield definitions with correct typed schemas
- Expose metafields to Storefront API (`access.storefront = "public_read"`) where agentic visibility requires it
- Flag GTIN checksum failures (read-only detection, no write)

Every auto-safe change is logged and reversible. Merchant can bulk-revert any category of change within 7 days.

### 5.2 Tier 2 — Auto-suggest (merchant approves)

Changes that involve interpretation or writing new content:

- LLM-inferred attribute values (material, care, dimensions, compatibility) from title + description + image
- Rewritten product titles in agent-optimal format — show before/after diff
- Category classification suggestions for Catalog Mapping
- External product URL suggestions (derived from handle + primary domain)
- Store policy templates

UX: bulk-approve with filters. "Apply all material inferences where confidence > 90%." Full audit trail.

**Dry-run preview (required before any Tier 2 bulk apply)**: show 5 representative example changes before applying at scale. Merchant sees the before/after pattern for 5 sample products, approves the pattern, and only then does the app roll the change across the full affected set. Prevents "I accidentally changed 500 titles I don't like" panic scenarios.

### 5.2.1 Fix History page

Every batch change generates an entry in a "Fix History" view inside the app:

- Date, user, change type, number of products affected
- One-click "View affected products" (drilldown)
- One-click "Revert this batch" — restores previous values via bulk mutation
- Filter by change type, date range, confidence threshold
- CSV export of all changes for audit trail

Merchants trust tools they can undo. This page is a feature, not a nice-to-have.

### 5.2.2 Performance SLA (publish, commit, monitor)

Merchants with 5,000+ SKUs will expect bulk enrichment to complete on a predictable schedule. Publish commitments:

- First 1,000 products: enriched within 2 hours of bulk approval
- Next 10,000 products: within 24 hours
- 10,000–50,000 products: within 72 hours (Scale and Enterprise tiers only)

Implementation: BullMQ queue with per-tier concurrency controls. Monitor queue length continuously; page on-call if backlog exceeds 4 hours above SLA. Surface live status in the app dashboard so merchants can see progress.

### 5.3 Tier 3 — Detect + guide (app cannot fix; merchant must act)

Things that fundamentally require merchant action:

**Missing GTINs**: The app cannot generate these. GTINs must be licensed from GS1. Auto-detect missing GTINs, group by merchant geography, and surface the right path:

- UK merchants → GS1 UK membership from £50/year (excl. VAT), based on annual turnover. App pre-fills the turnover band from the merchant's Shopify revenue data.
- US merchants with <10 products → GS1 US single GTIN, $30 one-time, no annual renewal.
- US merchants with 10+ products → GS1 US Company Prefix, tiered annual pricing.
- Other countries → deep-link to local GS1 office.

**Invalid GTINs** (third-party or resold codes). Explain why Amazon, Google, Shopify Catalog, and major retailers now verify against GS1's database — bad codes get listings suppressed. Recommend replacement.

**Post-purchase bulk import**: when merchant has bought codes from GS1, paste CSV → app maps SKU → GTIN → writes via `productVariantUpdate` in bulk. This is the "assist" layer. The purchase is manual, the application is automated.

**Partnership opportunity — GS1 discount referral**: once we have early install volume (target: 500 merchants), approach GS1 UK and GS1 US for a referral partnership. We funnel qualified small-business signups to them; they offer a discount code for Flintmere users (e.g. 10% off first-year membership). Win-win — they get volume, we remove friction. Not a day-1 item; revisit at month 4–6.

**Legal note on GTIN guidance**: the app surfaces factual information about marketplace requirements, not legal advice. All merchant-facing copy must include: *"Flintmere is not affiliated with GS1. Barcode and identifier requirements vary by marketplace and jurisdiction. Consult official sources for authoritative guidance."* Keep this in the in-app GTIN flow, the email reports, and the public scanner results page.

**Store policies missing**: templates provided, merchant must review and publish.

**B2B-only products mis-flagged**: app identifies candidates, merchant confirms.

### 5.4 What we explicitly don't auto-fix

- Pricing — too much business logic
- Inventory — owned by the merchant's ops system
- Product availability / publishing status — business decision
- Anything that would trigger a Shopify webhook cascade to connected apps

---

## 6. Architecture

### 6.1 Stack

| Component | Choice | Rationale |
|---|---|---|
| App framework | Remix (Shopify official template) | Maintained by Shopify, ships App Bridge integration, fast iteration |
| Language | TypeScript | Type safety with GraphQL codegen for Shopify schema |
| Database | Postgres | Well-understood, Prisma works well with Remix |
| Queue | BullMQ on Redis | Audit jobs run async for stores with 500+ SKUs |
| LLM | Anthropic Claude (Haiku for bulk, Sonnet for hard cases) | Cost-effective, good quality. Fallback to GPT-4o-mini if needed. |
| Hosting | Fly.io or Render | Cheap, scales linearly, good Postgres integrations |
| Admin UI | Shopify Polaris + App Bridge | Required for "Built for Shopify" badge |
| Analytics | PostHog | Self-hostable, good cohort analysis |
| Error tracking | Sentry | Standard |

### 6.2 Shopify API integration points

- **Admin GraphQL API**: primary data source. Use `bulkOperationRunQuery` for full catalog sync (one job returns signed URL to JSONL).
- **Storefront API**: verify what's actually published to the public storefront (vs what's in Admin).
- **Metafield APIs**: `metafieldDefinitionCreate`, `metafieldsSet`, `metafieldStorefrontVisibility`.
- **Product APIs**: `productUpdate`, `productVariantUpdate`, `productVariantsBulkUpdate`.
- **Webhooks**: `products/create`, `products/update`, `products/delete` for drift monitoring.
- **Billing**: Shopify's Managed Pricing / AppSubscription APIs (Shopify handles invoicing, you get 85% after the first $1M lifetime).

### 6.2.1 Bulk operation handling (critical — easy to get wrong)

`bulkOperationRunQuery` returns a signed URL to a JSONL file. For a 10,000-variant store that file can be hundreds of megabytes. Wrong handling will OOM the app.

**Correct approach:**
- Stream the JSONL file — never load it entirely into memory. Node.js: pipe the HTTPS response through a line-by-line JSONL parser (e.g. `ndjson` or a hand-rolled `readline` stream).
- Process products in chunks (e.g. 500 at a time), writing scoring results to Postgres incrementally.
- UI shows progressive state: "Catalog sync in progress — 3,400 of 12,000 products analysed. ETA 8 minutes." Never let the dashboard hang.
- For stores >5,000 SKUs, the initial sync is async by design. Email the merchant when the first full scorecard is ready.

### 6.2.2 Drift monitoring: webhooks + nightly sync, not webhooks alone

Shopify webhooks are best-effort, not guaranteed. A dropped webhook means a silent score drift. Belt and braces:

- Register webhooks for `products/create`, `products/update`, `products/delete` as the primary signal (fast, low-latency).
- Run a nightly incremental sync that fetches products with `updated_at_min` set to the last known sync timestamp. Catches anything webhooks missed.
- Weekly full re-sync for paid tiers as a final safety net.

This costs almost nothing at the API level and eliminates entire classes of "why is my score stale" support tickets.

### 6.3 Data flow

```
Merchant install
   ↓
OAuth → encrypted access tokens stored in Postgres
   ↓
Initial bulk catalog sync (bulkOperationRunQuery → streaming JSONL parse)
   ↓
Scoring engine runs per-product checks in chunks
   ↓
Aggregate → store scorecard in Postgres (incremental writes)
   ↓
Render dashboard via Polaris + App Bridge
   ↓
Merchant clicks "fix": queue job → LLM enrichment → write via Admin API
   ↓
Webhooks register for ongoing changes → re-score on drift
   ↓
Nightly incremental sync catches anything webhooks missed
```

### 6.4 Public scanner architecture (no-install)

Separate from the app. Simpler stack:

- Static Next.js landing page
- Edge function accepts URL → fetches `{shop}/products.json` + sitemap + sample product JSON-LD
- Partial scoring (3 pillars: identifiers, titles, consistency) runs in-edge
- Email-gated full report sent via Resend or Postmark
- Leads piped to a simple CRM (Attio, HubSpot free, or just a Postgres table with a Retool dashboard)

Build target: 2–3 days of focused work.

---

## 7. Pricing

### 7.1 Recommended tiers

| Tier | Price | Target user | Includes |
|---|---|---|---|
| Free | £0 | Tire-kickers, audit-only users | Scorecard, read-only. One refresh per 30 days. |
| Growth | £49/month | SMB, <500 SKUs | Unlimited audits, Tier 1 auto-fixes, 500 LLM enrichments/mo, weekly drift alerts |
| Scale | £149/month | Mid-market, 500–5,000 SKUs | Everything + unlimited enrichments, competitor benchmarking, priority support |
| Agency | £399/month | Agencies, 10+ stores | Everything + white-label reports, 25 client store seats, API access |
| Enterprise | £499/month (from) | Shopify Plus, 10,000+ SKUs | Everything + 50,000 SKU support, custom attribute templates, dedicated Slack support, monthly strategy call |

*Enterprise is a "Contact sales" tier at launch — published price but gated behind a booked call. Don't build dedicated infrastructure for it day one; let demand pull it. The first 2–3 enterprise deals will teach you what actually belongs in the tier.*

### 7.1.1 Launch promotion for scanner users

First 100 scanner users who convert to Growth tier get **first month at £29 instead of £49**. Creates urgency on the public scanner, gives a lower-price-point data signal for future A/B tests, and fills the early paid cohort with motivated merchants who'll give you feedback.

### 7.2 Rationale

- £49 entry filters out hobbyists (at $29 you get 50-SKU stores that churn in 60 days).
- £149 matches what stores already pay for Klaviyo / Yotpo tier apps — psychological anchor exists.
- £399 agency tier captures the 2% of installs that drive ~50% of MRR.
- £499 Enterprise tier anchors the Plus segment and signals "we take large catalogs seriously" even before we've built dedicated features.
- Flat-rate, not credit-based. Octane AI's biggest complaint is bill-shock from engagement-based pricing — being predictable is a feature.
- GS1 fees paid directly to GS1, not bundled. Explicit disclaimer on pricing page.

### 7.3 Pricing test plan

Run £49 vs £29 vs £69 at Growth tier. 30-day A/B via Shopify Billing API on new installs. Compare:
- Conversion rate from free to paid
- 60-day retention
- LTV

Let data decide. Don't pre-commit to £49.

---

## 8. Go-to-market

### 8.1 Sequence

**Weeks 1–2**: Public scanner live. Cold outreach to agencies + cold DMs to low-scoring merchants. Validate demand.

**Weeks 3–6**: Private MVP. 10–20 beta merchants invited directly (not via App Store). Iterate on feedback weekly.

**Weeks 7–10**: Polish. Submit to Shopify App Store.

**Weeks 11–14**: App Store review + launch. Content marketing in parallel.

**Month 4–6**: Agency tier launch. Vertical leaderboards as content.

**Month 6+**: "Built for Shopify" badge application once install base + reviews support it.

### 8.2 Distribution ranked by leverage

1. **Public scanner + vertical leaderboards**. "Top 50 UK supplement stores by AI readiness." Stores not on the list get FOMO. Agencies forward to prospects. Free marketing.
2. **Agency white-label**. One £399 sale = 25 stores on the platform. Agencies become your distribution.
3. **Founder-led LinkedIn content**. One post per vertical: "I audited 100 beauty stores..." — data-driven, shareable.
4. **Shopify App Store**. Important for credibility, but not your fastest channel early. Reviews take time; discovery is competitive.
5. **Partnerships with complementary tools** — SEO apps, PIM tools, headless platforms. Integration = discovery.
6. **Paid ads** — do NOT run these until you have 30-day LTV data. Burns cash at low efficiency.

### 8.3 Content strategy

Cornerstone content pieces to produce in first 90 days:

1. "We audited 500 Shopify stores for AI readiness" — the big data report
2. "Why 40% of Shopify catalogs are invisible to ChatGPT"
3. Vertical breakdowns: beauty, supplements, apparel, electronics, home goods — one per month
4. "A Shopify merchant's guide to GS1 barcodes in the AI commerce era" — SEO play + trust signal
5. Shopify Catalog Mapping walkthrough

---

## 9. 30 / 60 / 90 day roadmap

### Weeks 1–2: Validation

- Day 1–3: Register domain, stand up Next.js landing page, build URL-input scanner (scrape + partial scoring)
- Day 4: Email capture + simple report generation (plain HTML, emailed)
- Day 5: Launch on LinkedIn, r/shopify, Partner Slack
- Day 6–10: Cold outreach to 50 agencies and 100 low-scoring merchants
- Day 11–14: Assess metrics. Run 5 paid £97 audits manually

### Weeks 3–6: MVP build (private)

- Week 3: Shopify Partner account, dev store, Remix scaffold, OAuth flow
- Week 4: Bulk catalog sync via `bulkOperationRunQuery`, scoring engine for 3 pillars (identifiers, titles, attributes)
- Week 5: Polaris dashboard, scorecard UI, product-level drilldown
- Week 6: Auto-safe fixes (Tier 1), webhook registration, onboard first 5 beta merchants

### Weeks 7–10: Complete feature set + polish

- Week 7: Remaining 3 pillars (mapping, consistency, AI checkout eligibility)
- Week 8: Tier 2 LLM suggestions flow with approval UI, competitor benchmarking, Fix History page
- Week 9: Shopify Managed Pricing integration, subscription tiers, drift alerts, Channel Health tab (UTM injection on external URL metafield + attribution dashboard)
- Week 10: Agency dashboard groundwork, shareable badge + share-for-trial viral loop

### Weeks 11–14: Launch

- Week 11: Polish, accessibility pass, docs, legal disclaimers for GTIN content
- Week 12: App Store submission
- Week 13: Review cycle (expect 1–2 revisions)
- Week 14: Public launch, content push, outreach to agencies at scale

### Month 4–6: Scale + vertical moat

- **Pick one vertical and go deep** (recommended first: beauty OR supplements — high AI-visibility ROI, clear attribute taxonomies)
- Build per-vertical attribute templates with LLM inference tuned on 10,000+ products in that category
- Publish flagship report: "The State of AI Readiness in [Vertical]" — becomes both content marketing and the proof of category leadership
- Agency tier, white-label reports at scale
- Vertical leaderboards as ongoing content engine
- Partnership conversations with complementary tools (PIM, SEO, headless platforms)
- Apply for "Built for Shopify" badge
- Revisit GS1 partnership (we now have volume to offer)

---

## 10. Risks and mitigations

### 10.1 Strategic risks

**Shopify ships this natively within 12 months.** Moderately likely. Mitigation: go deep on vertical-specific enrichment (Shopify won't build per-vertical templates), establish agency relationships (stickier than raw merchant accounts), and build actual AI-visibility measurement (Shopify won't query ChatGPT on merchants' behalf).

**AI-shopping traffic doesn't materialize at predicted scale.** Plausible — growth is from a small base. Mitigation: the Channel Health layer (see §11.2) reframes value when AI traffic is still small — catalog fixes improve Google Shopping listing approvals, Amazon listing acceptance, and Google AI Overviews citations simultaneously. A merchant seeing zero ChatGPT referrals still gets quantifiable gains in parallel channels. Multi-channel framing from day one prevents the "is this working?" subscription killer at month 3.

**Merchants see one-time value and cancel.** Real risk. Mitigations: competitor benchmarking (rankings move weekly), standards change alerts ("Google just changed AI shopping requirements"), drift monitoring with actual data changes, and vertical leaderboard FOMO.

### 10.2 Tactical risks

**LLM API costs balloon.** Mitigation: tiered models (Haiku for bulk, Sonnet only for hard reasoning), aggressive caching of attribute inferences (products don't change often), hard rate limits per subscription tier.

**Merchants don't trust automated changes to product data.** Mitigation: every Tier 2 change requires explicit approval by default; only flip to auto after merchant has approved 20+ suggestions manually; full audit trail with one-click revert within 7 days; never write to pricing or inventory.

**App Store review rejects for performance or UX issues.** Mitigation: follow "Built for Shopify" checklist from day one. Budget 2–4 weeks for review + revisions.

**Competitor (Agent IQ, Alhena AI) ships faster or better.** Mitigation: don't compete on features, compete on positioning. Be the agency-friendly one. Be the honest one ("we tell you GS1 costs money, others pretend otherwise").

### 10.3 Business risks

**Agency sales cycle is 30–90 days.** Mitigation: free white-label audit as foot-in-the-door. Monthly, not annual, contracts initially.

**Chargeback from dissatisfied merchants.** Mitigation: generous refund policy (30-day no-questions), explicit documentation of what the app does and doesn't do.

---

## 11. Competitive landscape (snapshot)

| Competitor | Position | Strengths | Weaknesses |
|---|---|---|---|
| Agent IQ (40rty.ai) | Direct competitor, early | Shopify-specific, claimed instant audit | Unknown install base, generic scoring |
| Alhena AI | Adjacent (AI shopping assistant + SEO audit) | Broader product surface | Not purely catalog-focused |
| Stellagent | Consulting + tooling | Domain expertise | Consulting model, not scalable product |
| Shopify Catalog (native) | Platform-provided | Free, auto-enrolled | Basic, not merchant-facing diagnostics |
| Generic SEO apps (Schema Plus, JSON-LD for SEO) | Adjacent | Established | Don't address agentic requirements directly |

Positioning gap: nobody is combining an agency-grade diagnostic + automated fix engine + honest GTIN guidance + real AI-visibility measurement. That's the opening.

### 11.1 The durable moat: vertical-specific attribute taxonomies

Shopify's native Catalog Mapping is generic and stays generic — they serve every merchant. That leaves a real opening for vertical depth:

- **Beauty** needs `skin_type`, `ingredients_list`, `volume_ml`, `product_form`, `fragrance_family`.
- **Supplements** needs `serving_size`, `ingredients`, `certifications`, `age_restriction`, `delivery_format`.
- **Electronics** needs `model_number`, `compatibility`, `power_requirements`, `connectivity`, `warranty_terms`.
- **Apparel** needs `material_composition`, `size_system`, `care_instructions`, `fit_type`, `gender_age`.

Build **per-vertical attribute templates** with LLM inference tuned on 10,000+ products per vertical. That dataset becomes the moat — competitors would need to replicate our training data to match quality. This compounds.

**Execution plan**: Month 2 — pick one vertical (recommended: beauty OR supplements, both high-value and clearly structured). Build templates. Month 3 — publish "State of AI Readiness in [Vertical]" report with data from 500+ stores in that category. Month 4 — expand to second vertical. Own the category before competitors notice.

### 11.2 Channel Health — the measurement layer nobody else has

The "does this actually work" question will kill the subscription at month 3 if we don't answer it clearly. Build a measurement layer into the product:

**How it works:**
1. When populating the external product URL metafield (required for agentic storefronts), inject a UTM parameter: `?utm_source=flintmere&utm_medium=ai_agent&utm_campaign=catalog_ready`.
2. When an AI agent sends a shopper to that URL, the UTM is captured in Shopify's analytics and the merchant's GA4.
3. Flintmere queries back: "Last 30 days — 142 clicks from AI agents → 12 orders → £840 attributed revenue."

**Fallback when AI traffic is still small**: show Google Shopping listing improvements, Amazon listing acceptance rates, Google AI Overviews citations. A merchant who sees zero AI-agent traffic but 40% improvement in Google Shopping approvals still gets value — frame the gains wherever they show up.

This turns the subscription from faith-based to measurable. It's also a moat: Shopify's native tooling won't instrument ChatGPT attribution for merchants, and generic SEO apps don't track AI agents specifically.

---

## 12. Next 7 days — what to actually do

In priority order. Each step has a stop-condition — skip to "only if time" once you've hit the success gate for the day.

1. **Day 1**: DNS for `audit.flintmere.com` (subdomain of the already-owned flintmere.com). Stand up basic Next.js project. Wire up a single URL-input form. Test that `fetch('https://{shop}/products.json')` works for any public Shopify store (no auth required for this endpoint).

2. **Day 2**: Build partial scoring function — titles (fluff detection, length, literal-language check), identifiers (barcode presence + GTIN checksum), simple consistency (price/availability). Return structured JSON score with per-pillar breakdown.

3. **Day 3** (critical, do before UI polish): **Write the hooks.** Draft and sharpen:
   - LinkedIn headline: *"I audited 200 Shopify stores. 40% of their products are invisible to ChatGPT. Here's a free tool."*
   - Reddit post title: *"Built a free tool that scores Shopify catalogs for AI-agent readiness — curious what your store scores"*
   - Cold DM opener: *"Ran your store through our scanner — you're at X/100 for AI readiness. Want the full breakdown? No pitch."*
   If none of these feel urgent, pause — positioning is wrong. Reframe before shipping.

4. **Day 3–4**: UI for the scorecard using the distinctive design (Fraunces + warm palette — not generic AI slop). Email capture gates the full report. Include economic framing in the report preview ("Your 47 missing GTINs could lift AI visibility by ~34%").

5. **Day 4**: Stand up the `/audit` paid-concierge landing page — Stripe £97 button + Calendly link + 48h turnaround promise. Cross-link from scanner results: *"Want us to do this for you?"*

6. **Day 5**: Plain emailed PDF report (manual generation fine for week 1). Soft launch: LinkedIn post from founder account, submit to r/shopify, r/ecommerce, Shopify Partner Slack, relevant Discord servers. Include the shareable-badge URL in the emailed report.

7. **Day 6–7**: Track submissions + email opt-in rate + £97 audit conversions. DM every scanner user who scored <50. No pitch — just walk them through their top 3 fixes on a 15-min call.

### Week 1 success gates

- ≥50 URL submissions → positioning is landing, proceed
- ≥40% email opt-in rate → hook is working
- ≥5 paid £97 audits → strong subscription intent signal
- ≥20% DM-response rate → real buyer interest

Miss two or more of these and pause to reposition before writing any Shopify app code.

---

*Only if time in week 1*:

8. Set up Postgres + simple Retool or Airtable dashboard for lead data (Google Sheet via webhook also fine for day 1)
9. Call 10 Shopify agencies — "what's the dumbest data cleanup task you bill clients for?"
10. Draft the Month 2 "State of AI Readiness in [Vertical]" report outline so it's ready to fill with scanner data
11. Set up basic PostHog for product analytics on the scanner — track funnel: URL entered → scan complete → email submitted → shared

---

## Appendix A: Key facts & references

- Shopify AI-agent orders grew ~15x YoY in 2025
- ~5.6 million Shopify stores auto-enrolled in Agentic Storefronts (ChatGPT, Gemini, Copilot by default)
- Production audit: ~40% of catalog inventory ignored by AI agents due to missing structured attributes
- 99%+ attribute completion correlates with 3–4x higher AI visibility
- 71% of ChatGPT-cited pages contain structured data
- GS1 UK: membership from £50/year (excl. VAT), turnover-based
- GS1 US: single GTIN $30 one-time, no renewal; Company Prefix has tiered annual fee
- Shopify App Store: 0% revenue share on first $1M lifetime, 15% after (as of 2025 policy change)
- Shopify App Partner registration: $19 one-time fee

## Appendix B: Glossary

- **GTIN**: Global Trade Item Number. The digits encoded in a UPC/EAN barcode. Licensed from GS1.
- **MPN**: Manufacturer Part Number. Brand-assigned product identifier.
- **JSON-LD**: Structured data format embedded in HTML. Primary signal for AI agents parsing product pages.
- **Agentic Storefront**: Shopify's AI-channel sales surface (ChatGPT, Gemini, Copilot).
- **Shopify Catalog**: Shopify's normalized product data layer that feeds agentic storefronts.
- **Catalog Mapping**: Shopify feature for mapping custom metafields to standard Catalog fields.
- **UCP (Universal Commerce Protocol)**: Google + Shopify joint standard for agentic checkout.
- **ACP (Agentic Commerce Protocol)**: OpenAI's equivalent protocol.

---

*End of plan. Iterate as reality hits.*