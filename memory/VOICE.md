# VOICE

How Flintmere sounds in every user-facing surface — marketing copy, scanner UI, app microcopy, emails, legal pages, social posts, support replies.

## TL;DR

Write like you mean it. Declarative. Unhedged. Technical but not hostile. Short sentences. No hype. No apology.

The brand posture: **technical confidence**. We're serious about catalog readiness the way a manufacturing engineer is serious about tolerances. No pep, no growth-hack excitement, no emoji flare.

## How we write

- **Imperative for rules.** "Install the app" not "You can install the app".
- **Short sentences.** Long ones earn their length. Most don't.
- **Specific over abstract.** "40% of catalogs are ignored by AI agents" beats "many catalogs have visibility issues."
- **Concrete numbers.** If you can count it, count it. "412 products missing GTINs" not "many products missing barcodes".
- **One idea per paragraph.** If you find yourself using "and also" or "additionally", split the paragraph.
- **Active voice.** "We audit your catalog" not "Your catalog is audited by us".
- **No qualifiers that aren't load-bearing.** Kill "very", "really", "quite", "just". If "literally" isn't load-bearing, kill it.
- **Name the thing.** If it's a GTIN, call it a GTIN. If it's a metafield, call it a metafield. The Shopify merchant audience understands technical vocabulary; condescending simplifications break trust.

## The legibility-bracket signature in copy

The signature from `memory/design/tokens.md` is also a copy rule. Every Flintmere headline and major section heading has **one bracketed key word** that names the token the agent would extract:

- `Your product catalog is [ invisible ] to ChatGPT.`
- `Missing [ GTIN ] on 412 products.`
- `Your [ 64 ] / 100 AI-readiness score.`

Copy rules:

- Bracket nouns, numbers, identifiers. Never verbs, articles, or filler.
- One bracket per section. Two per page max.
- The bracketed word should be the word you'd want to burn into the reader's memory from that section.
- If the bracket feels forced, the sentence is wrong, not the bracket.

## Banned phrases (hard — Flintmere's own list)

Hard bans on consumer copy, marketing pages, docs, emails, social:

### Generic SaaS fluff

- "Bulletproof", "zero-risk", "guaranteed", "100%"
- "Revolutionary", "game-changing", "disruptive"
- "Unlock", "elevate", "empower"
- "AI-powered" (we are — we don't brag about it)
- "Supercharge", "turbocharge"
- "Best-in-class" without a benchmark citation
- "Leverage" as a verb
- "Next-generation"

### Credibility theatre

- "Trusted by" (we earn trust; we don't claim it)
- "Industry-leading" (unless measured)
- "The only" (unless verifiably)
- "Award-winning" at launch (we have no awards yet — don't invent)

### Overpromises (#9 Legal + #23 Regulatory veto)

- "Will increase your sales" (we can't promise outcomes)
- "Guaranteed ROI"
- "Fix all your catalog problems"
- "Make your products appear in ChatGPT" (claim is that we make catalogs machine-readable; outcomes depend on many factors)

### Self-deprecating financial framing

- "Free forever" as a blanket statement
- "Bootstrapped" as a core positioning element (acceptable in a founder-post, not in product copy)
- "Community-funded", "donation-funded"

**Why banned:** positions the product as charity, blocks institutional sales, and misrepresents the commercial model.

### GTIN / identifier claims (#23 Regulatory veto)

- "Get a GTIN for free" (GTINs cost money from GS1 — honesty is the positioning)
- "Generate valid barcodes" (we don't; we guide merchants to GS1)
- Any claim that implies Flintmere issues, licenses, or sells GTINs

### AI-agent outcome claims (#24 Data protection + #21 Technical veto)

- "Appear in ChatGPT results" (we can't guarantee ranking — only readiness)
- "Get recommended by AI shopping agents" (same)
- "AI agents will prefer your store" (same)
- Quantitative outcome promises without "estimated" + benchmark source

Use instead: "improves catalog readability for AI agents", "raises AI-readiness score from X to Y", "estimated visibility lift of ~N% based on comparable stores in your vertical (source: our concierge audits)."

## Preferred positioning language

- "Your product catalog is `[ invisible ]` to ChatGPT." (hero)
- "We score it, fix what's broken, and show you what changed."
- "Built for Shopify merchants and the agencies who serve them."
- "Honest GTIN guidance — buy them from GS1, we'll help you import them."
- "Every change previewed. Every change reversible for 7 days."
- "Measured impact, not faith-based subscription."
- "Catalogs built for the agentic web™." (trademark line — use sparingly, marketing site only)

## Tone by surface

### Marketing site (`flintmere.com`)

Manifesto energy. Long paragraphs allowed. Declarative. Numbers and named customers carry the social proof. Zero emoji.

> Example hero prose — "AI shopping agents now drive measurable commerce traffic on Shopify. Roughly 40% of catalogs get excluded from agent recommendations because the product data isn't structured the way agents read it. We tell you where you stand in 60 seconds."

### Scanner results (`audit.flintmere.com`)

Diagnostic voice. Like a doctor's report — specific, calm, honest about what we can and can't see from outside.

> Example — "We analysed 412 products and 1,247 variants. Identifier completeness and catalog mapping are your two biggest gaps. Fix those and you'd climb to the 72nd percentile of supplement stores in your size band."

### Shopify app (`app.flintmere.com`)

Functional voice inside Polaris chrome. Short. Instructional where needed. Never hype. Matches the register of Shopify's own admin UI.

> Example — "412 products missing GTINs. Estimated ~34% visibility lift if resolved. Review fixes →"

### Email reports

Editorial but personal. First-person-plural ("we analysed") without being saccharine. Always close with a specific next step and an estimated time-to-complete.

### Support replies

Short. Specific. Name the thing. Don't apologise for Shopify's behaviour — own what's ours, clarify what's theirs.

### Legal pages

Plain-English where possible, lawyerly where necessary. No soft language in privacy / DPA / ToS. No emoji. No hype.

## Copy Council (convened on every user-facing asset)

Per `PROCESS.md` Sub-councils:

- **#20 Brand copywriter** — does this sound like Flintmere?
- **#21 Technical copywriter** — is every claim accurate?
- **#22 Conversion copywriter** — does it move the reader to the next step?

Every sentence in a shipped asset must survive all three lenses. If any fails, revise.

## The gatekeeper

**#11 Investor / founder voice** holds the banned-phrases purge. Any copy that fails their review must be revised before shipping. Their test: "Would a Series A B2B SaaS investor deck feel at home with this language?" If the answer is no, we're either too charity-coded, too hype-coded, or too vague.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced allowanceguard-era banned-phrase list (centred on Web3 funding-model concerns: "No token", "No VC", "Community-funded") with Flintmere's list (centred on SaaS fluff, credibility theatre, GTIN claims, and AI-outcome overpromises). Added legibility-bracket copy rule matching the design signature.
