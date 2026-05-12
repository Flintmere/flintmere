---
runbook: marketing-launch-and-cadence
date_written: 2026-05-11
operator: Abdur-Rahman Morris
audience: operator (internal)
canon_sources:
  - memory/marketing/brand.md
  - memory/marketing/audiences.md
  - memory/marketing/metrics.md
  - memory/marketing/outreach.md
  - memory/marketing/imagery.md
  - memory/VOICE.md
  - apps/scanner/src/lib/audit-pricing.ts
canon_audit_run: pending — runbook is operator-internal, audit fires when copy ships
status: live (W0 starts today)
---

# Marketing Launch + Cadence Runbook

Written for one operator on ~5hr/week of marketing time. Date-anchored. Baby-step per day. Every asset has a generation recipe. Read top to bottom once; live in §Operator weekly rhythm + §Asset generation pipeline thereafter.

## TL;DR

Today (Mon 2026-05-11) we have one LinkedIn carousel in draft, zero shipped posts, and no accounts. Over the next eight weeks the operator: sets up LinkedIn + X presence in W0, ships one founder text post on **Mon 2026-05-19**, the existing carousel on **Thu 2026-05-28**, the first blog post on **Fri 2026-06-05**, and the first outreach batch (20 emails) on **Tue 2026-06-09**. By **Mon 2026-07-13** we have 6–8 LinkedIn posts, 8–12 X posts, two blog posts, ~80 outreach emails sent, and enough signal to decide what's working. Channel order is LinkedIn-first because the one drafted asset fits it, the audience there (mid-market ops + agencies) converts harder, and the operator's bandwidth cannot support two channels from zero in parallel.

## Council pre-flight (per 2026-05-09 binding)

Three load-bearing canon sources for the runbook:

1. **`memory/marketing/brand.md`** — voice principles, banned phrases, bracket signature copy rule. Every post draft runs through §Hard bans before publish.
2. **`memory/marketing/audiences.md`** — four-segment channel map. LinkedIn = mid-market + agency + enterprise. X = SMB + Shopify dev-relations. Different people, different register.
3. **`memory/marketing/metrics.md`** — primary metric per surface. Social's primary metric is **clicks to scanner or blog**, not impressions. The North Star is the agency-merchant ratio in MRR; runbook tracks the leading indicators that feed it.

Lenses convened (Standing Council, abbreviated):

- **#1 Marketing GTM** — sequence one channel first; LinkedIn-first.
- **#11 Founder voice + #20 Brand copy review + #37 Consumer psychologist** — every post passes the banned-phrase list, the trace-to-source check, and the plain-language test.
- **#14 Data / analytics** — pre-declared primary metric per phase; vanity counts are observations.
- **#9 Legal + #23 Regulatory + #24 GDPR / PECR** — outreach gates; "costing millions" carousel claim still needs softening (see W2 §Carousel sign-off).
- **#25 Risk** — Stripe / Meta / Google Ads policy posture: organic-only for the first 90 days. No paid ads until we have the £197 audit conversion baseline.
- **#38 Data intake engineer** — outreach seed lists from public sources (Plus Partner directory, agency case-study URLs); never from scraped or purchased lists.

## What you have today (honest baseline)

- ✅ `audit.flintmere.com` live; £197 Band 1 audit Stripe-validated 2026-05-05.
- ✅ `flintmere.com` marketing site live with /for/food-and-drink, /for/beauty, /for/apparel, /for/plus, /pricing, /about, /methodology, blog scaffolding.
- ✅ One LinkedIn carousel drafted: `context/marketing/linkedin-xgentech-carousel.md` (10 slides, copy only, no rendered PNGs, publish-checklist all unchecked).
- ✅ Resend transactional pipeline working (used by audit deliverables + outreach retry).
- ✅ ICO data-controller registration ZC137268 issued 2026-05-06 — clears us for B2B cold outreach under UK PECR legitimate interest.
- ❌ No LinkedIn company page. No personal LinkedIn marketing posture.
- ❌ No X handle.
- ❌ No newsletter list.
- ❌ No Shopify Partner Dashboard listing live yet (Shopify app is post-launch).
- ❌ No blog posts shipped. `memory/marketing/content-history.md` is empty.

## The cadence assumption

Operator total time: ~20hr/week sustainable (9-to-5 covers bills; ref `project_operator_bandwidth_posture.md`). Marketing budget within that: **5 hours per week**, split as:

- **Mon 30 min** — weekly review (metrics + queue check).
- **Wed evening 90 min** — drafting block (one long-form post or blog section).
- **Thu evening 90 min** — design/render block (carousel slides, OG images, alt text) OR outreach drafting.
- **Fri/Sat 60 min** — publish + respond to replies + log.

This is the floor. If a week loses the Wed block to engineering, the §Bandwidth-crash fallback covers it.

---

# Phase 0 — Foundations

**Dates: Mon 2026-05-11 → Sun 2026-05-17.** No public output. Only setup. Goal: every account, page, profile, tracking code, asset template, and skill invocation is wired so W1 can ship copy without yak-shaving.

## Day-by-day baby steps

### Mon 2026-05-11 (today) — 45 minutes
1. **Read this runbook end-to-end** (15 min). Mark anything to push back on.
2. **Create LinkedIn company page** for "Flintmere" under Eazy Access Ltd (10 min). Pick "Small business," industry "Software Development," company size 2–10 employees, founded 2026.
3. **Reserve the X handle** `@flintmere` (5 min). Don't customise yet — just claim and confirm email.
4. **Reserve `@flintmere` on Threads + Bluesky** (5 min) as defensive holds. We will not post there in this runbook.
5. **Create a `marketing/` folder in your password manager** with the three logins. Tag them "Flintmere — public."

### Tue 2026-05-12 — 30 minutes
6. **Edit operator personal LinkedIn profile** (20 min):
   - Headline: `Building Flintmere — catalog readiness for AI-shopping. We score Shopify catalogs against six pillars and fix what's broken.`
   - About section: 4 sentences. Plain English. British. No banned phrases (see §Banned-claim cheat sheet).
   - Featured: pin `flintmere.com` and `audit.flintmere.com`.
   - Banner: solid ink (`#0A0A0B`) with `[ flintmere ]` in Geist Mono amber centre — generate via the carousel template once built (W2), placeholder neutral until then.
7. **Set the company-page logo + banner** (10 min) — same wordmark treatment, ink background, amber accent.

### Wed 2026-05-13 — 90 minutes (drafting block)
8. **Write the first founder post** (60 min) — use the brief in §First four posts → Post 1. Save the draft to `context/marketing/2026-05-19-linkedin-founder-intro.md`. **Do not publish yet.**
9. **Set up Plausible site filter for marketing** (15 min) — Plausible is already on the stack. Confirm both `flintmere.com` and `audit.flintmere.com` are tracked. Note the share-link URL for the weekly review.
10. **Create the UTM template** (15 min) — see §UTM scheme. Bookmark a UTM builder (Chrome extension, free).

### Thu 2026-05-14 — 90 minutes (design block)
11. **Render the founder-post OG image** (30 min) — use the existing OG route in `apps/scanner/src/app/api/og/route.ts`. If it doesn't have a generic "marketing" variant, this is the W0 engineering ask: add one accepting `?title=…&bracket=…`. Otherwise hand-compose a single 1200×630 PNG with the post's bracket word.
12. **Set up a Buffer free account** (15 min) — or skip and post manually for the first month. Recommended: post manually until W4 so you feel the algorithm before automating.
13. **Read `memory/VOICE.md` end-to-end** (45 min) if you have not in the last fortnight. The banned-phrase list is binding; the operator is the final gate.

### Fri 2026-05-15 — 30 minutes
14. **Decide carousel-render path** (15 min):
   - **Path A (recommended):** schedule a 6–10hr engineering block in W2 to build `apps/scanner/src/app/admin/carousel-render/` — server route that takes JSON spec, renders 10 PNG slides via Satori / @vercel/og using existing Geist + ink + amber tokens. One-time cost, every future carousel is JSON → PNGs.
   - **Path B:** compose the first carousel manually in Figma. ~4hr per carousel. Acceptable for one but not sustainable.
   - Recommendation: **Path B for the first carousel (Thu 2026-05-28), Path A built in parallel during W2.**
15. **Block calendar time** (15 min) — add recurring weekly blocks: Mon 30 min, Wed 90 min, Thu 90 min, Fri 60 min. Label them "Flintmere marketing — do not move."

### Sat 2026-05-16 — 30 minutes
16. **Run the first audit on your own test merchant** (or matersandco.com — the canonical smoke fixture per `project_canonical_smoke_fixture_matersandco.md`) and **save the result PDF + scorecard screenshots** (20 min). These become real source material for the blog post in W3.
17. **Send the founder-post draft to yourself by email** (10 min) and read it on phone. Edit on Sun if anything reads awkward.

### Sun 2026-05-17 — 15 minutes
18. **Final polish on the founder post.** Confirm the bracket word lands. Confirm zero banned phrases. Schedule the post for Mon 2026-05-19 09:30 BST (LinkedIn peak engagement window UK B2B).

## W0 success criterion (binary)

- [ ] LinkedIn company page exists + branded.
- [ ] Personal LinkedIn profile updated.
- [ ] `@flintmere` X handle claimed.
- [ ] Plausible confirmed tracking both domains.
- [ ] UTM template documented.
- [ ] Founder post drafted, OG image rendered, scheduled for Mon 2026-05-19.
- [ ] Carousel-render path decided.

If any of these slip past Sun: do not start W1. Push everything by one week. The runbook stays the runbook; only the dates move.

---

# Phase 1 — First publish

**Dates: Mon 2026-05-18 → Sun 2026-05-24.** Goal: one LinkedIn post live, X bio claimed and lurked, blog brief commissioned.

## Day-by-day baby steps

### Mon 2026-05-18 — 30 min (weekly review)
- Confirm Sunday's scheduled post is queued for 09:30 tomorrow.
- Pull last-7-day Plausible numbers for `audit.flintmere.com` — establish baseline before the first post hits.

### Tue 2026-05-19 — POST 1 GOES LIVE, 09:30 BST
- **Watch the first hour.** Reply to every genuine comment (not just emoji). LinkedIn weights early engagement heavily.
- **Re-share from the company page** at 10:30 with a one-line additional comment.
- **Total time:** 30 min spread across the day.

### Wed 2026-05-20 — 90 min (drafting block)
- **Brief the SEO skill** for the first blog post: `/seo` → keyword cluster 2 (catalog readiness & scoring) + cluster 1 (AI shopping awareness). Output: SERP map + outline. (45 min)
- **Customise X bio + pinned tweet draft** (15 min). Bio: `Catalog readiness for AI-shopping. We score Shopify catalogs against six pillars. audit.flintmere.com`
- **Set up X follow list** — follow 50 accounts in three buckets (15 min each, 30 min total):
  - Shopify Dev Relations + Plus team (~15 accounts)
  - Indie ecom founders ~£500K–£20M (~20 accounts) — find via "ecom founder" + "shopify" search
  - Agency principals (~15 accounts) — find via Shopify Plus Partner directory

### Thu 2026-05-21 — 90 min (design/draft block)
- **Draft Post 2** (X single post, see §First four posts → Post 2). Save to `context/marketing/2026-05-26-x-first-post.md`. (60 min)
- **Start composing the carousel slides in Figma** (Path B) for Thu 2026-05-28. Slide 1 + 2 done tonight. (30 min)

### Fri 2026-05-22 — 60 min
- **Post 1 wrap-up** — write a 100-word note to yourself in `context/marketing/2026-05-22-post-1-postmortem.md`: impressions, comments, clicks to `audit.flintmere.com`, what the LinkedIn algorithm decided about the post.
- **Append Post 1 to `memory/marketing/content-history.md`** with the format defined there (channel, angle, surface, result).

### Sat–Sun 2026-05-23/24 — optional
- Compose carousel slides 3–6 in Figma (~2 hr if you have it; skip without guilt if you don't).

## W1 success criterion

- [ ] Post 1 live, ≥5 comments responded to.
- [ ] X bio + pinned tweet set; following 50+ accounts.
- [ ] SEO brief for blog post 1 saved to `context/marketing/2026-05-20-blog-post-1-seo-brief.md`.
- [ ] Post 1 logged in `content-history.md`.
- [ ] Carousel slides ≥6/10 designed (or carousel-render route scoped for W2 engineering).

## W1 primary metric (pre-declared)

**Clicks to `audit.flintmere.com` from LinkedIn**, attributed via UTM `?utm_source=linkedin&utm_medium=organic&utm_campaign=founder-intro`. Target: ≥15 clicks in the first 48hr. Lower than that = the post didn't land; iterate the angle for Post 3.

---

# Phase 2 — Steady rhythm

**Dates: Mon 2026-05-25 → Sun 2026-06-14 (three weeks).** Goal: carousel ships, X starts posting, blog post 1 ships, first outreach batch goes out. End-state: posting once a week on LinkedIn, twice a week on X, blog every other week.

## Week 2: 2026-05-25 → 2026-05-31

### Mon 2026-05-25 — 30 min weekly review
- Pull Plausible numbers; compare W1 baseline vs W2 with Post 1 live.

### Tue 2026-05-26 — POST 2 GOES LIVE (X, ~11:00 BST)
- Pin to profile. Watch first 2hr for replies (X moves faster than LinkedIn).
- **Total time:** 30 min.

### Wed 2026-05-27 — 90 min
- **Final founder sign-off on carousel claims** — Variant A post body locked. "Costing millions" claim → soften to "quietly costing Shopify Plus brands meaningful revenue" unless we have a substantiating citation. (#11 + #9 binding — 20 min.)
- **Write alt-text for all 10 slides** per `memory/marketing/imagery.md` §Accessibility + #8 Noor binding. (30 min.)
- **UTM-tag both CTAs** on slide 10 (`?utm_campaign=carousel-eight-mistakes`). (10 min.)
- **Render remaining slides** in Figma — slides 7–10. (30 min.)

### Thu 2026-05-28 — POST 3 GOES LIVE (LinkedIn carousel, 10:00 BST)
- Upload as native LinkedIn document (PDF of 10 slides exported from Figma). LinkedIn carousels reach 2–3× the impressions of static posts.
- **Total time:** 45 min publish + monitor.

### Fri 2026-05-29 — 60 min
- **Draft `/writer` brief for blog post 1** from the SEO outline. Save to `context/marketing/2026-06-05-blog-post-1-brief.md`.
- **Start engineering W2 carousel-render route** if Path A chosen — this is a 6–10hr task. Use `/build-feature`.

### Sat–Sun 2026-05-30/31 — optional drafting
- Invoke `/writer` against the brief. Output: full draft of blog post 1.

## Week 3: 2026-06-01 → 2026-06-07

### Mon 2026-06-01 — 30 min weekly review
### Tue 2026-06-02 — 30 min — POST 4 GOES LIVE (X single post — observation from carousel reactions)
### Wed 2026-06-03 — 90 min
- **Edit blog post 1 draft.** Run through `/claim-review` if any pricing / regulatory claim appears. Run through `/canon-audit` per 2026-05-09 binding.
### Thu 2026-06-04 — 90 min
- **Land blog post 1 in `apps/scanner/src/app/blog/[slug]/page.tsx`** via `/web-implementation`. Generate hero image via Adobe Stock (preferred) or Runware (operator override) per `imagery.md` §Photography.
### Fri 2026-06-05 — BLOG POST 1 GOES LIVE
- Cross-post to LinkedIn (single text post + link).
- Tweet a single quote from the post on X.
- Append to `content-history.md`.

## Week 4: 2026-06-08 → 2026-06-14

### Mon 2026-06-08 — 30 min weekly review
### Tue 2026-06-09 — FIRST OUTREACH BATCH (20 emails)
- Use `/outreach` skill. Target: 20 Shopify agencies from the Plus Partner directory, picked for vertical fit (food / mid-market grocery / DTC ecom).
- Each email ≤150 words. Identifies sender + lawful basis + opt-out per `outreach.md` §Standing rules.
- Send via the Resend outreach pipeline (operate via `/outreach-operate send-initial`).
- Log to outreach append-log in `memory/marketing/outreach.md`.
### Wed 2026-06-10 — 90 min — POST 5 (LinkedIn long-form: "What we saw in [N] food merchant scans")
### Thu 2026-06-11 — 60 min — outreach reply handling + POST 6 (X thread, 5 posts, breaking down one pillar)
### Fri 2026-06-12 — 60 min — wrap-up + content-history update

## W2–W4 success criterion

- [ ] LinkedIn carousel live + ≥2,500 impressions + ≥40 clicks to scanner.
- [ ] Blog post 1 live, indexed by Google within 14 days.
- [ ] First 20-email outreach batch sent; ≥2 replies, ≥1 meeting booked.
- [ ] X has 5+ posts live, ≥50 follows of operator.
- [ ] `content-history.md` has 5+ entries logged.

## W2–W4 primary metric

**Paid £197 audits attributable to marketing channels** via UTM. Target W4 cumulative: **3 paid audits.** This is conservative; below it = the funnel needs work, above it = we double down on what's converting.

---

# Phase 3 — Measure + adjust

**Dates: Mon 2026-06-15 → Sun 2026-07-12 (four weeks).** Cadence holds: 1 LinkedIn/week, 2 X/week, 1 blog/fortnight, 20-email outreach batch/fortnight. Two new moves:

1. **Funnel-analysis pass** (W5, Mon 2026-06-15) — invoke `/funnel-analysis` against the first month's data. Output: per-post conversion rate, drop-off step, three experiment proposals.
2. **First experiment** (W6, starting Mon 2026-06-22) — design via `/experiment-design`, log to `experiment-log.md` as `planned`, observe for 2 weeks, read out via `/experiment-readout` end of W8.

By end of W8 (Sun 2026-07-12) you have:
- 8–10 LinkedIn posts shipped.
- 12–16 X posts shipped.
- 2 blog posts live.
- ~80 outreach emails sent.
- One ran experiment with a documented decision.
- Enough signal to commit or pivot.

## W5–W8 primary metric

**Paid £197 audits attributable to marketing.** Target cumulative end-of-W8: **8 paid audits.** That's £1,576 of audit revenue from marketing alone — proves the channel without spending paid acquisition.

---

# Phase 4 — Compound

**Dates: from Mon 2026-07-13.** Outline only — refine in a fresh runbook revision at end of W8.

- Newsletter setup (Resend audience, monthly digest of the blog).
- Podcast guesting (target: 2 Shopify-ecosystem podcasts in W9–W12).
- First sponsorship evaluation (`/sponsorship-brief` against one Shopify-adjacent newsletter).
- Open the X DMs for inbound. Open LinkedIn for inbound demo bookings.
- Consider paid acquisition only after **15+ paid audits attributable to organic**.

---

# Operator weekly rhythm

```
Mon  09:00–09:30  Weekly review (Plausible + LinkedIn + X analytics)
Wed  19:00–20:30  Drafting block (one long-form post OR blog section)
Thu  19:00–20:30  Design / outreach block (slides, OG images, email batches)
Fri  18:00–19:00  Publish + respond to replies + log to content-history.md
```

If any block crashes due to engineering / life: §Bandwidth-crash fallback below. Do not double up the next week — protect the cadence. Missing a week is fine; missing two consecutive weeks invalidates Phase 3's primary-metric target.

---

# Asset generation pipeline

Every asset has one canonical recipe. Time given assumes the canon is read and the skill is briefed (not from scratch every time).

## A. LinkedIn long-form post (250–1500 words)

- **Invoke:** `/social` with `target=linkedin`, `audience=<mid-market | agency | enterprise>`, `length=long`.
- **Brief contents:** angle (which of the seven narrative anchors from `content-history.md`), bracket word, one source citation, one CTA.
- **Output:** post body + 2 A/B headline variants + suggested OG image direction + suggested posting time.
- **Approval gates:** #11 founder voice + #20 brand copy review + §Banned-claim cheat sheet self-check.
- **Time:** 45 min draft + 15 min approve + 5 min publish = **65 min.**
- **Log:** append to `memory/marketing/content-history.md` after publish.

## B. X single post or thread (5–7 posts)

- **Invoke:** `/social` with `target=x`, `format=<single | thread>`.
- **Brief contents:** angle, the single observation, link.
- **Output:** post(s) with alt text on any image, hashtag-free (Flintmere voice — `brand.md` doesn't ban them but the technical-confidence register reads cleaner without).
- **Approval gates:** same three. X tolerates a touch more punch in headline copy; the bans still apply.
- **Time:** 30–45 min total.

## C. Blog post (1500–3000 words)

1. **Brief:** `/seo` against a keyword cluster from `memory/marketing/seo.md`. (20 min.)
2. **Draft:** `/writer` against the SEO brief. (60–90 min.)
3. **Claim review:** `/claim-review` if pricing / regulatory / AI-outcome claim appears. (15 min.)
4. **Canon audit:** `/canon-audit` per 2026-05-09 binding. (15 min.)
5. **Hero image:** Adobe Stock (preferred) or Runware (`project_runware_image_workflow.md`). (15 min.)
6. **Land:** `/web-implementation` into `apps/scanner/src/app/blog/[slug]/page.tsx`. (30 min.)
7. **Cross-promote:** one LinkedIn text post + one X single post.
- **Time total:** ~3.5 hours over 3–4 days.
- **Cadence:** every 2 weeks, not weekly.

## D. Carousel slides (10 PNGs, 1080×1350)

Two paths:

- **Path A — built (preferred long-term):** `apps/scanner/src/app/admin/carousel-render/` server route renders slides from JSON spec using Satori / @vercel/og with our existing token set (Geist Sans + Mono, `--color-ink`, `--color-paper`, `--color-amber`, bracket utility class). One-time engineering: 6–10 hr. Every future carousel is JSON → 10 PNGs in 5 minutes. Build in W2 alongside the first manual carousel.
- **Path B — Figma (first carousel only):** compose manually with our canon. 3–4 hr per carousel. Off-load after Path A ships.

Both paths must produce: 1080×1350 PNG per slide, alt-text per slide (in a sibling JSON), ink background (`#0A0A0B`), amber only for bracket underlines + CTA fill, Geist Sans display + Geist Mono brackets.

## E. Blog header / hero image

- **Default:** Adobe Stock — unbranded photoreal, warm-treated to canon (warm overlay, slightly desaturated), exported AVIF ≤100KB. Operator licence binding per `imagery.md` §Adobe Stock licence clause 4.7 — no visible third-party trademarks.
- **Operator override:** Runware Flux Dev per `project_runware_image_workflow.md` — only with explicit operator instruction per surface; AI-imagery ban on marketing surfaces stands by default.
- **Time:** 15 min Adobe Stock; 30 min Runware.

## F. Outreach email batch (10–20 emails)

- **Invoke:** `/outreach` with target list, segment angle, and template selection from `memory/marketing/outreach.md` §Example drafts.
- **Approval gates:** #9 Legal + #24 GDPR + #11 voice — all three binding. Every email identifies sender + lawful basis (UK B2B legitimate interest, ICO ZC137268) + opt-out link.
- **Send:** via `/outreach-operate send-initial` against the Resend pipeline.
- **Log:** append to `memory/marketing/outreach.md` after each batch (target, ask, status).
- **Time:** 30 min drafting per batch + 30 min approve + 30 min send/log = **90 min per batch.**
- **Cadence:** 20 emails per fortnight max. No mass blasts.

## G. OG image (per post / per landing page)

- **Generated:** server-side via `apps/scanner/src/app/api/og/route.ts`. If a marketing-generic variant doesn't exist yet, this is W0 engineering (single route accepting `?title=…&bracket=…&variant=marketing`).
- **Dimensions:** 1200×630 (LinkedIn + X both consume this).
- **Time:** 0 min once route exists; 1 hr engineering to add the variant.

## H. Line-art diagram (inline SVG)

- **Invoke:** `/image-direction` with the diagram brief.
- **Output:** inline SVG, 1px ink hairline strokes per `imagery.md` §Stroke convention.
- **Use sparingly:** process diagrams (e.g., "Audit → Fix → Monitor") + technical schematics. Not decoration.
- **Time:** 30–60 min per diagram.

---

# First four posts — briefs you can hand to skills today

## Post 1 — LinkedIn, Tue 2026-05-19, 09:30 BST — founder intro

**Skill:** `/social` with `target=linkedin`, `audience=mid-market+agency`, `length=long`.

**Brief:**
- **Angle:** narrative anchor 1 ("The AI shopping shift is here") with founder voice. Posted from operator's personal profile, re-shared by company page 1 hour later.
- **Bracket word:** `[ visible ]` or `[ catalog ]` — operator picks.
- **Source:** BUSINESS.md trend data — agentic-commerce growth, auto-enrolled stores. Plus one observation from running matersandco.com through the scanner (anonymise if needed: "a 1,200-SKU UK food merchant").
- **CTA:** soft — "Scan your store free at audit.flintmere.com" at end. UTM: `?utm_source=linkedin&utm_medium=organic&utm_campaign=founder-intro&utm_content=personal`.
- **Tone:** founder voice acceptable on personal profile (per `VOICE.md` "bootstrapped" allowance in founder-posts); team voice ("we") on company-page reshare.
- **Length:** 250–400 words.
- **Banned:** every phrase in `brand.md` §Hard bans. Also: do not claim "guaranteed visibility", "make your store appear in ChatGPT", or any AI-outcome promise (#24 binding).

## Post 2 — X, Tue 2026-05-26, ~11:00 BST — first observation

**Skill:** `/social` with `target=x`, `format=single`.

**Brief:**
- **Angle:** narrative anchor 2 ("Your catalog is invisible") — one concrete observation from real scans.
- **Format:** ≤280 chars, no thread yet.
- **Bracket:** `[ invisible ]` — render literally in mono characters or use unicode bracket characters (X renders `[ invisible ]` cleanly).
- **CTA:** scanner link only.
- **UTM:** `?utm_source=x&utm_medium=organic&utm_campaign=first-observation`.

## Post 3 — LinkedIn carousel, Thu 2026-05-28, 10:00 BST — eight mistakes

**Skill:** none — use the existing draft at `context/marketing/linkedin-xgentech-carousel.md`.

**Action items before publish:**
1. Lock Variant A post body (the direct one).
2. **Soften "costing millions"** to "quietly costing Shopify Plus brands meaningful revenue" unless a substantiating citation is found. (#11 + #9.)
3. Render 10 slides via Path B (Figma) — Path A engineering runs in parallel.
4. Write alt text per slide per `imagery.md`.
5. UTM-tag both slide-10 CTAs.
6. Schedule for Thu 2026-05-28 10:00 BST.
7. Publish as native LinkedIn document upload (PDF of all 10 slides).

## Post 4 — Blog, Fri 2026-06-05 — "What we saw in [N] food merchant scans"

**Skills:** `/seo` (brief) → `/writer` (draft) → `/claim-review` → `/canon-audit` → `/web-implementation` (land).

**Brief:**
- **Keyword cluster:** 2 (catalog readiness & scoring) + 6 (AI agent / LLM shopping behaviour). Primary: `shopify catalog audit`. Secondary: `how chatgpt finds products`.
- **Title (draft):** `What we saw in the first [ N ] Shopify food catalogs.`
- **Honest constraint:** N is whatever the real number is on 2026-06-04. If it's 12, it's 12. Do not pretend to have audited 500.
- **Angle:** data-led — narrative anchor 1 + 2. Show the shape of the problem with real numbers (anonymised). Lead with the most surprising single stat from the scans.
- **Internal links:** scanner CTA (×2), pillar explainer page, GTIN guidance page if it exists.
- **Outbound citations:** Shopify Engineering blog on multimodal LLMs (per `linkedin-xgentech-carousel.md` sources), one OpenAI / Anthropic / Google statement on agentic shopping.
- **Word count:** 1,500–2,200.
- **Bracket headline:** `[ findings ]` or the surprising number itself.
- **Hero image:** Adobe Stock warm-treated photoreal (preferred) — UK grocery shelf, no visible trademarks.
- **UTM-aware internal links:** scanner CTAs use `?utm_source=blog&utm_medium=organic&utm_campaign=first-food-scans`.

---

# Tooling stack

## Free / already paid

- **LinkedIn (personal + company page)** — primary channel.
- **X** — secondary channel.
- **Plausible** — already deployed for both domains.
- **Resend** — already in stack; outreach pipeline live.
- **Adobe Stock** — operator licence per `imagery.md`.
- **Runware** — operator override only.
- **Shopify Partner account** — get one in W2 if not already (free; gives access to Plus Partner directory).
- **Reddit + Indie Hackers + Shopify Community** — free, no posting in this runbook (W9+ consideration).

## Skip until later

- **LinkedIn Sales Navigator** — skip. Free LinkedIn search is enough at 20 emails/fortnight.
- **Buffer / Typefully / Hootsuite** — skip until W4. Post manually so you feel the algorithm.
- **Mailchimp / ConvertKit** — skip. Use Resend audiences when newsletter ships in W9+.
- **Paid ads (Google / Meta / LinkedIn / X)** — skip until ≥15 paid audits from organic.
- **HARO / press distribution services** — skip until 6 months of blog content exists.

---

# UTM scheme + attribution

Every outbound link from every marketing surface uses:

```
?utm_source=<linkedin | x | blog | newsletter | outreach | partner>
&utm_medium=<organic | email | paid | referral>
&utm_campaign=<short-kebab-slug>
&utm_content=<optional-variant>
```

Examples:
- LinkedIn founder post: `?utm_source=linkedin&utm_medium=organic&utm_campaign=founder-intro`
- X observation: `?utm_source=x&utm_medium=organic&utm_campaign=first-observation`
- Carousel CTA: `?utm_source=linkedin&utm_medium=organic&utm_campaign=carousel-eight-mistakes&utm_content=slide-10-scan`
- Carousel concierge CTA: `?utm_source=linkedin&utm_medium=organic&utm_campaign=carousel-eight-mistakes&utm_content=slide-10-concierge`
- Blog post 1 internal scan CTA: `?utm_source=blog&utm_medium=organic&utm_campaign=first-food-scans&utm_content=above-fold`
- Outreach: `?utm_source=outreach&utm_medium=email&utm_campaign=agency-may-2026`

Plausible auto-captures these. Monday weekly-review reads them.

---

# Bandwidth-crash fallback (the 30-minute week)

If a week loses the Wed + Thu blocks entirely:

1. **Skip the long-form post.** Do not ship a half-cooked one.
2. **Post one X observation** (≤280 chars, 5 min).
3. **Respond to outstanding LinkedIn / X comments** (15 min).
4. **Append a one-line note to `content-history.md`** marking the week as paused with reason.
5. **Resume next week.** Do not double-post.

Two consecutive bandwidth-crash weeks = trigger a runbook revision; cadence assumption was wrong.

---

# Banned-claim cheat sheet

Single-card reminder. Full list in `memory/VOICE.md` §Banned phrases.

**Never write:**
- Unlock, leverage (verb), supercharge, elevate, empower
- Bulletproof, zero-risk, guaranteed, 100%
- Revolutionary, game-changing, disruptive, next-generation
- AI-powered (we are — we don't brag)
- Trusted by (we earn trust)
- Will increase your sales / Guaranteed ROI / Make your products appear in ChatGPT
- Get a GTIN for free / Generate valid barcodes (we don't issue GTINs; GS1 does)

**Replace with concrete:**
- "412 products missing GTINs" ≠ "many products have barcode issues"
- "We score six pillars" ≠ "We help you optimise visibility"
- "We saw drift on 38% of catalogs we scanned" ≠ "AI-readiness is a huge issue"

**Gatekeeper:** #11 Founder voice — final approval on every shipped piece.

---

# Channels we are NOT using (and why)

- **Farcaster** — Web3 audience, not Shopify food merchants. The `social` skill description mentions it from AllowanceGuard heritage; ignore.
- **TikTok / YouTube Shorts** — wrong register for technical-confidence B2B; expensive in operator hours.
- **Paid Google Ads** — until £197 audit conversion from organic is baseline. Also: regulatory care needed; AI-shopping-readiness language is novel and may trip ad-policy review.
- **Paid Meta Ads** — same. Meta also stricter on AI-outcome language.
- **Cold DMs on LinkedIn** — banned. Use email outreach with PECR identification + opt-out only.
- **Reddit posting** — until W9+. Reddit punishes brand accounts that arrive before contributing.
- **Discord / Slack ad placements** — until newsletter exists and we have something to send subscribers.

---

# Pricing reference (use the correct numbers in every post)

Per ADR 0022 + `apps/scanner/src/lib/audit-pricing.ts`:

| Tier | Price | Catalog size |
|---|---|---|
| Concierge audit Band 1 | £197 | ≤1,500 SKUs |
| Concierge audit Band 2 | £397 | 1,501–5,000 SKUs |
| Concierge audit Band 3 | from £597 (bespoke) | 5,001+ SKUs |

Per ADR 0016 — subscription ladder in transition:
- New sign-ups: Food single **£99/mo**, Food agency **£349/mo**, Food+Beauty bundle £159/mo (single) / £499/mo (agency), Concierge retainer £349/mo.
- Grandfathered: legacy Growth £79 / Scale £249 / Agency £499 — do not promote in new content.
- Plus tier — "from £1,200/mo on enquiry" (anchor only; embedded app first).

**Note on memory drift:** `memory/marketing/seo.md` §Fact guardrails still says Growth £49 / Scale £149 / Agency £399 — that is **stale post-ADR 0016**. Reference `audit-pricing.ts` and `pricing.ts` as ground truth, not seo.md.

---

# Council sign-off before any first post ships

Three lenses must approve Post 1 before scheduling on Sun 2026-05-17:

1. **#11 Founder voice** — operator self-check against banned-phrase list.
2. **#20 Brand copy review** — operator reads the draft cold on phone Sat morning.
3. **#37 Consumer psychologist** — plain-language test: can a non-Shopify operator parent understand the first sentence?

If any one fails: rewrite. Do not ship a "good enough" first post. The first post sets the register for everything that follows.

---

# Changelog

- 2026-05-11: Initial runbook. Phase 0 (foundations) starts today. Phases 1–4 dated through 2026-07-13.
