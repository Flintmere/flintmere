---
canon_sources:
  - projects/flintmere/decisions/0029-retail-gate-pivot.md
  - projects/flintmere/decisions/0030-suppression-wedge-retirement.md
  - projects/flintmere/plans/2026-09-06-retail-gate-pivot-spec.md
  - projects/flintmere/plans/2026-11-01-revenue-unblock.md
  - projects/flintmere/STATUS.md
canon_audit_run: 2026-11-08
binding: CLAUDE.md §Binding 2026-05-09 (canon protection)
status: verdict — G1 passed, G2 lapsed unplayed, one instrument defect found
---

# Demand verdict — 2026-11-08

What this is: the gates of `plans/2026-09-06-retail-gate-pivot-spec.md`, run on their
own clock, with the evidence the running produced. It does not re-derive the thesis.
ADR 0029 did that on 2026-09-06 and this document accepts it.

**Pass mark, stated before the findings.** G1 passes at ≥15 named UK firms standing at
a retail-onboarding gate, each with an identified route in. G2 passes if a named firm
has agreed to route one client or has listed Flintmere as a supplier by week 8. The
diagnostic check passes if it produces a correct, named-product gap list in under two
operator-hours per brand. Verdicts against each are at the end.

Every figure below carries a source and a fetch date. Where evidence is absent the word
is "unknown", never an estimate.

---

## Part 1 — The gate audit

The pivot was ratified **2026-09-06**. Today is **2026-11-08**: **week 9**.

| Gate | Due | Condition | Status |
|---|---|---|---|
| G1 | week 3 (~2026-09-27) | ≥15 firms named with a route in | **Passed — late.** Done today, 6 weeks after due. See Part 2. |
| G1b | weeks 2–4 | Booths diagnostic v1 | **Built today**, with a defect found. See Checks. |
| G2 | week 8 (~2026-11-01) | ≥1 partner agreed to route a client | **Lapsed, unmet — and unplayed.** |
| G3 | week 14 (~2026-12-13) | delivered engagement + nameable case study | Not reached; blocked on G2. |

### What happened instead

25 commits since 2026-09-06. Their file-change distribution:

| Area | File-changes |
|---|---|
| `apps/scanner` | 100 |
| `packages/scoring` | 21 |
| `projects/flintmere` | 14 |
| `apps/shopify-app` | 5 |
| `.github/workflows` | 3 |
| `memory/*` | 6 |

Every one is scanner copy, scoring weights, tests, lint or ADR prose. The commits whose
subject lines mention the gate (#114, #121, #125, #126) are all *retirements* of the
old wedge, not approaches to the new buyer. `context/outreach/` holds nothing since
**2026-05-05**. No intermediary map, no partner approach, no diagnostic.

The operator confirms, asked directly on 2026-11-08, that no partner or brand contact
happened off-repo either. So the record is complete: **in the nine weeks since the
pivot, the commercial programme the pivot exists to run was never started.**

### The distinction that decides what to do next

G2's kill criterion reads: *"no partner traction by week 8 → ADR 0029 §Consequences,
Option C. Park it, stop the burn, write the closing ADR."*

Read literally, that fires today. But it should not be applied as written, and the
reason matters more than the verdict:

**G2 was designed to test the market's response to eight weeks of individual partner
approaches. Zero approaches were made.** The gate therefore produced no information
about the market at all. It produced information about execution. A gate that was never
played has not been lost — it has been forfeited, and those license different decisions.
Invoking Option C now would be shutting the business on the result of a test that never
ran.

What the forfeit *is* evidence for is ADR 0029 premise 8, *"One person can build and
sell this: **False**"*, and this document must not wave that away. Nine weeks of available
capacity went entirely into code that the same ADR had already declared off-thesis. That
is the second gate in a row to expire unlogged, after ADR 0019's mid-window check
(2026-07-26) and ADR 0024's Gate 2 (2026-08-10). The pattern is consistent and it is not
a market signal. It is a capacity-and-attention signal, and it is the strongest finding
in Part 1.

### Three records closed today

- `STATUS.md` §Adoption check log carried exactly **one** entry, from 2026-04-26. The
  2026-07-26 mid-window check, ADR 0024's 2026-08-10 Gate 2, and the 2026-10-26 window
  close were all unlogged. Entries appended today.
- ADR 0029 P0 item 2, *"Disable the concierge SLA cron"*, **cannot be confirmed from
  the repository.** `apps/scanner/src/app/api/cron/concierge-sla/route.ts` is still
  present with no disable guard in its entry path, and the schedule that calls it lives
  in Coolify, outside this repo. Treat as open until checked on the box.
- `projects/flintmere/plans/2026-11-01-revenue-unblock.md` is untracked in git. Its four
  operator blockers are unchanged.

---

## Part 2 — The intermediary map

Two research branches enumerated **~102 UK entities** standing at a retail-onboarding
gate, each with a source URL and a fetch date of 2026-11-07 or 2026-11-08. Full tables:
`scratchpad/intermediaries-standards.md` (33 rows / 32 firms) and
`scratchpad/intermediaries-retailer.md` (70 entities, plus 20 refuted with reasons).

### G1 shortlist — named, with a route in

Ordered by route quality. C/C is competes/complements.

| # | Firm | At the gate | Route in | Named contact | C/C |
|---|---|---|---|---|---|
| 1 | **GS1 UK** | Licenses GTINs; runs productDNA, the induction platform used across most UK grocery | Published 4-step partner programme + public partner finder | Partnerships team (no individual public) | **Complements** |
| 2 | **Syndigo** | GDSN pool, PIM, syndication, *and* managed services; operates productDNA | Self-service partner registration, no gatekeeper | none public | Competes (hybrid) |
| 3 | **SALSA** | The accreditation Ocado, Waitrose and Bread & Jam name by brand; co-publishes Defra's *Routes to Retail* | Public join route; **already sells mentoring as a paid add-on** | via FDF (Caroline Keohane, Head of Industry Growth) | **Complements** |
| 4 | **Subrosa** | Retailer product set-up, retailer-specific barcodes, non-conformance management | The one consultancy in this sweep that a UK retailer publicly refers brands to, linked from Booths' own supplier site. Not an exhaustive claim about the UK | Rachel O'Brien + Amanda Peberdy (founders/directors); Natasha Fishwick (Head of Supply) | **Complements** on exactly what it omits |
| 5 | **Erudus** | UK foodservice/wholesale data pool; 1,577 manufacturers, 219 wholesalers | Two public directories: integration partners + industry consultants | Jon Shayler (title ambiguous on Erudus' own page) | **Complements** |
| 6 | **Co-op** | Publishes ~40 supplier documents with no login, incl. barcode and allergen rules | Open supplier hub | **Sarah Lawrence, Code Compliance Officer** — public direct email | **Complements** |
| 7 | **Ocado Retail** | The hardest published gate in the UK, and the price anchor | Public Supplier Manual; Roots is referral-shaped | **Robert Skelton, Code Compliance Officer** — gscop@ocadoretail.com | **Complements** |
| 8 | **Bread & Jam** | ~12,000 UK food founders; buyer pitches require SALSA/BRC | GS1 UK Community Partner listing + co-branded offer | **Jason Gibb** | **Complements** |
| 9 | **productDNA** | The induction chokepoint; third-party verification | Sign-up routes via Syndigo | none public | **Complements** |
| 10 | **RSSL** | UKAS-accredited nutrition testing — produces the panel numbers | none published | Jacinta George (MD) | **Complements** — the one true complement in the consultancy layer |
| 11 | **Food Alert** | Pack-copy compliance + spec documentation | **Paid introducer programme** — the only firm in the set that pays for referrals | Fraser Parramint (MD) | Competes |
| 12 | **The Good Food Group** | Official Supply Partner to 11 major UK retailers; produces artwork in-house | Direct enquiry | none public | Ambiguous — likely doing the data work unadvertised |
| 13 | **iWeb** | Built the Erudus↔Akeneo allergen connector | Listed Erudus integration partner | none public | Build-partner shaped |
| 14 | **YF** (ex-Young Foodies) | QAS, label compliance, barcodes, listing prep | Preferred Suppliers programme | none public | Competes — and the nearest competitor |
| 15 | **Morrisons** | Spec gate is "Morrisons Create" | Public register-of-interest funnel | supplierportal@ | **Complements** — and it already **outsources its own packaging-data collection to Valpak**, which is precedent that a retailer will buy this function |

**G1 verdict: PASSED.** 15 named, with routes, out of ~102 enumerated. The threshold was
not close.

### The structural read, which is worse news than G1 is good

Counting across both branches: of the 32 standards-and-consultancy firms, **21 compete** —
they do the data-preparation work themselves. Of the 70 retailer-side entities,
**56 complement** — not one UK retailer or wholesaler prepares a brand's data.

So the gate is real and unmanned on the retailer side, and crowded on the service side.
Five firms are full-service competitors: Ashbury, Campden BRI, Food Alert, One Scientific,
and ZERO2FIVE (Wales-only, state-funded). Of ~102 entities, **20 publish no price at
all**. SJW Technical states it as policy, *"We don't publish generic prices"*, citing
SKU count, retailer and turnaround, which are the exact variables ADR 0022's band ladder
prices in public. A published price remains a genuine differentiator here.

Three jobs that **nobody** in ~102 entities offers:

1. **Pack images shot to retailer spec.** The only providers are the retailers, charging
   it as a penalty.
2. **GTIN/barcode setup as a service.** GS1 UK issues the numbers; the brand populates
   them. Waitrose sends suppliers to GS1 UK as homework.
3. **One artefact satisfying a whole retailer requirement.** Spec writing is split across
   four firms; nutrition calculation exists at three. Nobody assembles allergens +
   nutrition + ingredients + images + GTIN + master data into a single submission.

And the counterweight, which is the hardest fact in Part 2: **three of the biggest gates
hand the brand a free tool for the mechanical part.** M&S sponsors Syndigo outright —
"there is no cost to suppliers". Asda and Morrisons point at productDNA free. Amazon's
templates are free. The unmet work is extraction, mapping and verification. It is not the
upload surface. Any offer built around "we'll submit it for you" is selling a form that
three retailers already give away.

### The trigger event is invisible, and that is the thesis-level problem

This came out of an adversarial pass over the recommendation and it is the strongest
argument against the whole position. It survives checking, so it goes here rather than in
a footnote.

Put Check 1b together with the free-tool finding and the buyer narrows to almost nobody:

- A brand **already listed** has already passed the gate. It is not a buyer.
- A brand **not yet listed** is blocked by the buyer meeting, not by its data. It is not
  a buyer either.
- The only buyer is a brand in the **window between winning a listing and submitting the
  data** — weeks long, and the one moment the work is both necessary and urgent.

That cohort is invisible from outside. It does not appear in a Shopify scan, because the
scan cannot see regulatory fields (Check 1b) and because nothing on a storefront says
"we just won Ocado". It does not appear in any public register. It cannot be found by
cold email, because you would be emailing the whole population to reach the few in the
window.

This also explains the competition count better than "the category is crowded" does.
**The 21 firms that do the data work in-house can see the trigger** — they are already
engaged with the brand on artwork, spec writing or accreditation when the listing lands.
Flintmere would be selling the same service with no way of knowing when anyone needs it.
That is not a positioning problem. It is a missing funnel, and no amount of outbound
fixes it: the addressable list does not exist.

The corollary is the only route that would work: reach the brands **through whoever is
already in the room** — which is the partner-first strategy ADR 0029 already chose, and
it raises the stakes on whether a partner will route anyone.

### The price anchor, published by the buyer

Ocado Retail Supplier Manual, May 2026 — public PDF, no login. I verified this myself
with `pdftotext` rather than taking it on report; it sits at lines 591 and 606 of the
extracted text:

> "Ocado will delay the launch of a new product until at least one image and
> comprehensive back of pack data have been provided and approved."

> "Current costs are £100 per SKU for images and £50 per SKU for back of pack collation."

The **£150/SKU is a sum I derived**, not a figure Ocado publishes: the manual states
£100 and £50 as separate line items for separate jobs. What Ocado publishes is its own
price for each half of exactly this work, charged via its in-house photographer on
Buying Manager referral. The same wording and the same figures appear in
the September 2023 edition, so the number has not moved in three years. It is not
Brandbank's price and must never be presented as such.

Other first-party anchors: Kitwave/Creed £100 + cost of product per SKU for imagery,
**£10,000** for an allergen addition, 3% of annual gross turnover for failing to upload
specs to Erudus. Brakes **£1,800 per SKU** for regulatory compliance checks on a spec
change, £850–£2,000/yr Assure subscription. GS1 UK membership is published in full:
£50 to £4,250/yr by turnover band. Erudus is **£0/yr for manufacturers under £2M
turnover**.

### The three desk questions, closed

**Brandbank's UK subscription price: unknown, and the absence is now verified rather
than merely unsearched.** The NielsenIQ Brandbank Terms & Conditions (March 2018, rev.
13.01.2022) name the fee *structure*: a set-up fee that is never refunded, a monthly subscription
banded by how many consumer units you upload, a fee on each upload, a support fee, and a
minimum term of 12 months that renews itself. It contains **zero currency amounts** across 101,667
characters of extracted text. Clause 7.1 defers to "the then current NielsenIQ Brandbank
rate card", which is not published anywhere. The complete Wayback indexes for
`brandbank.com` (6,420 captures since 2003) and `nielseniq.com` (172,162) contain no
pricing page, ever. The one route to a real figure is a merchant's own renewal invoice.

**Amazon UK is not a second Ocado.** It publishes a food-information *obligation* with a
named attribute list (ingredients, allergen_information, the full per-serving nutrition
set, country_of_origin, and image slot codes including `INGR` and `FACT`) — and that
document contains **no enforcement language whatsoever**: a grep for suppress / blocked /
removed / cannot list / enforce returned zero hits in any food-data context. The UK
product-compliance article index carries no article on food information, allergens or
nutrition. A generic required-attribute enforcement mechanism exists in SP-API, but
whether it marks allergen/nutrition as required for FOOD/GROCERY is **credential-walled
and was not inferred**. The one published consequence with teeth is the image gate:
"If there is no main image that meets the requirements, we may temporarily remove the
product listing from search."

**UCP's Food vertical: announced, not shipped.** Latest release `v2026-08-25`. I checked
the repository tree myself: `docs/specification/` contains common, lodging, overview,
payment and shopping — **there is no `food` directory**, and no food schemas. The August
release landed store locators, opening hours and weighted-item pricing under "Grocery
readiness". Where UCP does touch allergens it is a free-text `code: "allergens"`
disclosure that defers to the physical pack as authoritative. ADR 0029's standing
monitor has **not** fired. The watch-point remains `docs/specification/food/`.

---

## Part 3 — The paths

Each path carries a dated kill criterion and a cost in operator hours per week against
the standing <10 h/week constraint.

### Path A — Option C: park it, write the closing ADR, and probe on the way out

ADR 0029's own named path, taken deliberately. Stop the ~£130/month burn, keep the
domains, and write the ADR that records what nine weeks and today's research established.

Carve out **3–4 hours** for a buyer-side probe first — not as a condition for reversing
the decision, but so the closing ADR carries numbers instead of inference:

1. **Ask the five full-service competitors what an engagement costs** (Ashbury, Campden
   BRI, Food Alert, One Scientific, NSF). This is the unpublished price the whole
   pricing question rests on, and 20 of ~102 firms publish nothing. Ask openly as
   someone scoping a service — not posing as a brand. Some will decline, and a decline
   is itself a data point about how closely held the number is.
2. **Phone three of the brands already scanned** and ask one question: who did your
   retailer data submission, and what did it cost? One hour. This tests the thesis from
   the demand side, which nothing in this project has ever done.
3. **Apply to GS1 UK's partner programme.** It is a credential application with a
   published four-step process, not a cold email, and the application itself tells you
   whether a neutral standards body will list you.

- **Cost:** ~3 h probe + ~3 h to write the ADR. Once, not weekly.
- **Kill criterion:** none. This *is* the terminal state. What reopens it is named and
  narrow — see below.

### Path B — The 15-approach demand test (rejected, and why)

Three weeks, ~12 hours: approach the 15 mapped firms individually offering to do one
client's submission free. This was the recommendation until an adversarial pass took it
apart, and the objections hold:

- **No falsifier.** 15 cold B2B approaches at a realistic reply rate expects **0–1
  replies**. Thirty cold emails in May 2026 returned zero, confirmed against the mailbox.
  Zero replies would therefore license nothing about the market — only that this channel
  does not work, which May already established. One polite "happy to chat" licenses
  nothing either. A test whose outcomes both leave the decision unchanged is a delay in a
  gate's clothing.
- **It re-cuts a gate after the ball went through.** G2's criterion fired at week 8.
  Designing a fresh window, now, is the fourth consecutive instance of a gate not
  binding — and the precedent that gates are advisory costs more than the ~£390 of
  hosting it defers.
- **Roughly half the recipients are competitors** (21 of 32 in the standards layer do the
  work themselves) who would read the approach as reconnaissance.

### Path C — Sell the one job nobody does (rejected, with a caveat)

Nobody in ~102 entities shoots pack images to retailer spec; the only providers are the
retailers, charging £100/SKU as a penalty. It is narrower, more mechanical and has a
published price.

It fails on capability. Ocado's spec needs product samples shipped in, controlled
lighting, colour profiles and dieline control. That is capital equipment and a studio,
not software, and it is the half of the £150 that carries the margin. The half Flintmere
*could* do, the £50 back-of-pack collation, is the half Syndigo and productDNA give
away free on three major gates, so its anchor is £0, not £50.

**Caveat worth keeping:** this becomes viable only as a referral partnership with an
existing UK product photographer, where Flintmere brings the data half and the
retailer-spec knowledge. That is a different business and needs a partner who does not
yet exist. Kill by **2026-12-06** if no photographer will work per-SKU on referral.

### The arithmetic that settles it

At under 10 h/week, and taking an optimistic 20–30 minutes per SKU with QA, capacity is
roughly **20 SKUs per week**. A 200-SKU brand therefore consumes **ten weeks of total
capacity** for a single one-off fee — and then the next client has to be found in a
cohort that is invisible from outside (Part 2). Even where the service sells, it does not
fit the capacity it has to be delivered from. ADR 0029 premise 8 said this in September;
today's numbers put a figure on it.

### Two things no one had costed

- **Liability.** Allergen declarations are food-safety exposure. A wrong "may contain" is
  a recall and an FSA matter, and Erudus' own terms put "sole responsibility for the
  legality, reliability, integrity, accuracy and quality of the Customer Data" on the
  manufacturer with an indemnity attached. No consultancy routes a client to someone
  without professional indemnity cover and a contract. **Free is read as uninsured, not
  as cheap** — so the free pilot raises a partner's risk rather than lowering it. Whether
  Flintmere holds PI cover is unknown to this document and is a blocker on any delivery,
  paid or free.
- **What happens on a yes.** Without PI cover and without the image capability, the
  honest answer to a partner saying yes is "I can't take it." A test you cannot afford to
  pass is not a test.

### Recommendation

**Path A. Park it, run the 3-hour buyer-side probe, write the closing ADR.**

I changed this recommendation during the writing of this document. The earlier version
was Path B, on the reasoning in Part 1 that a forfeited gate is not a lost one and the
market had not answered. That distinction is still correct — and it does not rescue a
test with no falsifier, against an invisible buyer cohort, which the operator could not
deliver on if it passed. Three separate findings have to be true at once for Path B to
be worth twelve hours, and none of them is.

**What would reopen this, stated narrowly so it cannot be stretched:** a named brand,
with a named retailer, and a named submission deadline. That is the only configuration in
which the buyer is visible, the urgency is real and the scope is bounded. If one arrives,
through the GS1 UK application or a brand phone call or any route at all, this decision
is back on the table the same day. Nothing short of it is.

---

## Part 4 — The gaps

### Gaps closable by reading

| Gap | Where | Cost |
|---|---|---|
| Bidfood's Technical Services Requirements Guide (Sep 2025) | public URL; defeated every automated reader | one manual browser download |
| Tesco's product-data guidelines | hosted on gs1uk.org, which bot-blocks crawlers; readable in a browser | 10 min |
| Erudus' enumerated 200+ attributes, bands above £2M | behind a JS slider | 15 min |
| Whether the concierge SLA cron is actually disabled | Coolify, not the repo | 5 min on the box |
| Sun Branding Solutions' "Legal Impackt" — closest thing to Flintmere's job | site refused all five fetch tiers | manual visit |
| Whether `/llms.txt` and the scanner's public claims still match post-ADR-0030 | repo | covered by `canon-audit` |

### Gaps only a human buyer can close

These are the ones that matter, and no amount of reading touches them.

1. **What the five full-service firms actually charge.** 20 of ~102 publish nothing. This
   is the single number the whole pricing question rests on, and one afternoon of asking
   would produce it.
2. **Whether a brand in the window would pay, and who it used instead.** Three phone
   calls. No one on this project has ever asked a brand anything.
3. **What Brandbank costs a small supplier.** Needs one merchant's invoice; the contract
   structure is now known, so a single invoice populates it.
4. **What the work actually takes per SKU by hand.** The £150/SKU anchor cannot become a
   price until the hours are known, and the hours decide whether the capacity arithmetic
   above is survivable.
5. **Whether the Good Food Group already does this quietly** for 11 retailers. One
   enquiry settles it.
6. ~~**Whether the canon binding still works.** `memory/canon-source-register.md` cites
   **12** `feedback_*.md` files and **none of them exists** in the repository.~~
   **Corrected 2026-11-08, same day — this gap was wrong in its central claim.** The
   files exist. They are operator memory under
   `~/.claude/projects/-Users-abuaa-Projects-Flintmere/memory/`, outside the repository,
   and a git-history sweep shows they were never repository files, so nothing was lost.
   Verified count: **16 citations over 14 distinct names**, 12 resolving as cited and 2
   miscited under a `feedback_` prefix where the file is `project_*`. What survives is
   narrower and still real: the register names no directory, so a dispatch searching the
   repository finds nothing — which is precisely how this document's own canon-audit
   reached the wrong conclusion. The register is repaired and the pivot spec §10 count is
   closed. The residual risk is that these sources are machine-local and unreviewable,
   which is an operator decision recorded in ADR 0031 §Consequences, not a gap a buyer
   closes.
7. **Whether Flintmere holds professional indemnity cover.** Not a market question — an
   operator fact this document does not know, and a hard blocker on delivering anything
   touching an allergen declaration, free or paid.

### The outbound, for the operator to send

Three probes, in `context/outreach/2026-11-08-buyer-side-probe.md`. They replace the
15-firm partner approach, which Part 3 rejects. Each is addressed to someone who answers
buyers rather than peers, each produces a number or a refusal rather than silence, and
none of them claims Flintmere has done this work before — because it has not.

---

## Checks

### Check 1 — The diagnostic was built and run

Instrument: a throwaway script importing the repository's existing public fetcher
(`apps/scanner/src/lib/shopify-fetcher.ts`) and `isValidGtin`. No new package, nothing
added to the repo. **Gate A held:** the fetcher imports no Prisma, and the script ran
with `DATABASE_URL` unset. No database was touched, nothing was written, and the live
Booths application form was read only.

Scored against Booths' 6 product-data items and Ocado's published image spec, on three
real UK food Shopify brands, 2026-11-08:

| | Pip & Nut | Rude Health | Minor Figures |
|---|---|---|---|
| products sampled | 6 | 44 | 39 |
| barcode present | 100% | 0% | 3% |
| barcode valid GTIN | 83% | 0% | 3% |
| ≥1 image | 100% | 100% | 100% |
| image longest side ≥1280px | 100% | 27% | 74% |
| image square | 100% | 89% | 44% |
| ingredients | 0% | 0% | 0% |
| nutrition | 0% | 0% | 0% |
| allergen declaration | 0% | 0% | 8% |

### Check 1b — The instrument is defective, and this is the most important finding here

Those three 0% columns are **wrong**. They are an artefact of the instrument, not a
property of the brands.

I checked Pip & Nut's peanut butter product page by hand. It carries, published, on the
page: the full ingredient declaration with allergens in bold ("Argentinian High-Oleic
**Peanuts** (99.4%), Sea Salt"), the FIR allergen formula verbatim ("For allergens see
ingredients in **bold**"), a cross-contamination warning, storage instructions, and a
complete nutrition table per 100g and per serving — energy in both kJ and kcal, fat, of
which saturates, carbohydrates, of which sugars, fibre, protein, salt.

**None of it appears in `products.json`.** Shopify keeps food regulatory data in
metafields rendered into the product page; the public catalog endpoint the entire scanner
architecture is built on cannot see any of it.

Three consequences, in increasing order of importance:

1. The diagnostic, as built, can only honestly score barcode presence, GTIN validity and
   image dimensions. The regulatory half, the part ADR 0029 calls the moat, is
   invisible to it.
2. The fix is cheap and was proven today: one rendered product-page fetch returns all of
   it. A diagnostic that renders PDPs would work. One built on `products.json` never can.
3. **The brands already have compliant data, already published.** Pip & Nut's storefront
   is FIR-correct. The gap is not that UK food brands lack allergen and nutrition data —
   it is that the data is not in a retailer-submittable *form*. That is precisely ADR
   0029's surviving finding ("extraction, mapping and verification, not the upload
   surface"), now confirmed from the merchant side rather than the retailer side. It also
   kills "scan a storefront, show them what's missing" as an acquisition mechanic for
   regulatory fields, because on this evidence nothing is missing.

### Check 2 — Timing

Machine time: **1.4s** for Pip & Nut (6 products), **3.9s** and **3.8s** for the
44- and 39-product catalogues. Operator time is not the fetch: it is interpretation,
the hand-check that caught the defect, and writing the page. Honest estimate for a
correct one-page gap list on a new brand, with a PDP-rendering instrument in place:
**35–50 minutes**. Against the two-hour pass mark, **passes** — but only because the
instrument does the counting. Doing it by hand across 50+ SKUs would not pass, and that
is the per-SKU economics problem Path A's first delivery has to answer.

### Check 3 — Line-by-line against the published checklist

Booths' *Retail Ready Checklist* (`RETAIL-READY-CHECKLIST-6.pdf`, no version or date
printed on it; PDF created 2026-06-05; fetched 2026-11-07) has **16 items**, transcribed
verbatim and verified against the PDF text layer by me independently of the agent that
found it.

| Booths' item, verbatim | Class | In the diagnostic |
|---|---|---|
| Ingredient analysis | data | yes — but blind, see 1b |
| Nutritional information | data | yes — but blind |
| Shelf life testing | data | **no** — a test record, never on a storefront |
| Barcode | data | yes, present + GTIN checksum |
| Attractive packaging and labelling appropriate for a retail environment | data | **no** — subjective, not machine-checkable |
| FIR compliant (Food Information Regulations) | data | yes, as allergen proxy — but blind |
| HACCP systems in place | compliance | no |
| Local Authority, Environmental Health inspection | compliance | no |
| Any other quality assurance (Salsa, BRC) | compliance | no |
| Ability to scale production to supply 25 stores | commercial | no |
| Ability to deliver to the Booths central DC, Preston | commercial | no |
| Ability to deliver product on pallets | commercial | no |
| Orders sent using EDI | commercial | no |
| A cost price that will enable a realistic retail price | commercial | no |
| Prepared to support the product with tastings | commercial | no |
| Prepared to support the product with promotions | commercial | no |

**4 of 16 items are in the diagnostic. 6 of 16 are product data. 2 of those 6 are not
checkable from any public source.** Any claim that Flintmere "scores the Booths
checklist" is therefore true of a quarter of it, and the disclaimer must travel:
*"It is by no means exhaustive and only relates to the mainly technical aspects of what
you need to do."*

Two corrections to premises this project has been carrying:

- **Booths' checklist is not a schema.** It is a yes/no readiness tick-list with zero
  fields. It names the topics and signposts GS1 UK and the FSA. A diagnostic built
  against it inherits that thinness.
- **Booths is not the only UK retailer publishing openly, and it publishes the least.**
  Ocado's Supplier Manual carries a genuine field-level spec including an image spec.
  Co-op publishes ~40 documents with no login. Whole Foods UK, Lidl GB, Brakes and
  Kitwave/Creed all publish more. Creed's is the richest found: a full field list, a
  pixel spec, and priced enforcement. **Ocado's manual, not Booths' checklist, is the
  right target for any future instrument.** The pivot spec's open question, whether
  Booths generalises, is answered: it does not, because it is not detailed enough to
  generalise from.

---

## Verdicts against the pass mark

| Check | Pass mark | Verdict |
|---|---|---|
| G1 | ≥15 firms named with routes in | **PASS** — 15 named, ~102 enumerated |
| G2 | ≥1 partner agreed by week 8 | **FAIL, unplayed** — zero approaches made; forfeited, not lost |
| Diagnostic produces a correct named-product gap list | under 2 operator-hours | **PASS on time, FAIL on correctness** — three of its six checks are blind, and the defect was found by hand-checking, not by the tool |
| Brandbank price obtained | a figure from a primary source | **UNKNOWN** — verified absent from every public source |
| UCP Food kill-switch | has a food spec shipped? | **NOT FIRED** — announced only; no `food` directory exists |
| Addressable funnel exists | a way to find brands at the gate | **FAIL** — the trigger event is invisible from outside (Part 2) |
| Domain expert review | correctness confirmed by a human in the trade | **NOT RUN** — see below |

Three load-bearing external claims were spot-checked by me independently of the agents
that found them, because an agent's confidence is not evidence: the Booths checklist
against the PDF's own text layer, Ocado's £100/£50 and the "delay the launch" sentence
against my own `pdftotext` extraction, and UCP's missing food directory against the
GitHub API. All three held. Everything else in this document carries the URL and fetch
date it came with, and where a source was unreachable it says so.

**The expert to pay.** One hour from either a GS1 UK partner manager or SJW Technical's
Sarah Wolton — the cleanest named contact in the consultancy layer, and the only one who
publicly describes working inside the retailers' own systems to pack-copy stage. The
question to ask is exactly one thing: *"If I hand a brand a one-page gap list built from
their public product data against Ocado's published spec, does that save you any work —
and would you ever route a client to someone who did it?"* Price it well under Campden
BRI's published £1,300 associate floor. A yes is the first real market signal this
project would have. A shrug is Path B.
