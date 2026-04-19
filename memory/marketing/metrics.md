# metrics.md — What success looks like

One primary metric per surface. Everything else is secondary observation.

## Primary metrics per surface

| Surface | Primary metric | Why |
|---|---|---|
| Public scanner (`audit.flintmere.com`) | Successful scans per day | The free scanner is top-of-funnel. If merchants aren't scanning, nothing else matters. |
| Scanner → email capture | Email opt-in rate (% of completed scans that submit email) | The only signal we have for intent before install. |
| Scanner → concierge audit | Paid £97 audits per week | Week 1 validation metric (SPEC §2). Proves willingness to pay. |
| Marketing site blog | Organic search sessions to `flintmere.com/blog/*` | Content's job is discovery. Social traffic is a bonus. |
| Pricing page | Growth tier signup rate (pricing visits → installs) | Conversion is the whole point of the page. |
| Shopify App Store listing | Install rate (listing views → installs) | Platform-own metric; Shopify shows this in Partner Dashboard. |
| Shopify app (post-install) | First-scorecard completion rate (installs → scorecard shown) | If install doesn't lead to a scorecard, onboarding is broken. |
| Growth → Scale upgrade | Upgrade rate per month | Measures whether value grows with usage. |
| Agency tier | Agency signups + active client-seats | The economic engine per SPEC §8.2. |
| Social (LinkedIn, X) | Clicks to scanner or blog | Vanity metrics (likes, impressions) are observations. Traffic is the outcome. |
| Outreach | Replies + meetings booked | Not opens. Not sends. |

## The North Star

**Agency-merchant ratio** — active agency-tier customers × 25 client seats + direct merchants, as a share of total MRR. Per SPEC §8.2, agencies are the economic engine. If the ratio is <30% agency-derived, we're over-indexed on direct-merchant sales and leaving leverage on the table.

Target by stage:

| Stage | Agency-derived MRR share |
|---|---|
| Month 3 (post-MVP) | >10% |
| Month 6 | >25% |
| Month 12 | >40% |

## Secondary observations (not decisions)

- Impressions, likes, reposts, shares.
- Time on page, scroll depth.
- Scanner-submitted URL distribution by vertical.
- Segment split (SMB / mid-market / agency / enterprise) where identifiable.
- Public scanner's bracket-word test (which bracket moments get screenshotted into LinkedIn posts).

## Data hygiene (gated by #24 Data protection + #19 Privacy)

- Analytics skill works from **aggregated data only**. No PII.
- Never process merchant end-buyer behaviour (we don't see it anyway; Shopify does).
- Merchant operator email retained for consent-based outreach only; scanner lead emails under opt-in from the email gate.
- No cross-site tracking pixels on marketing pages.
- Current cookie consent language governs what can be collected. If an experiment would violate it, rewrite the experiment, not the consent.
- `metric-catalog.md` (data-intelligence) is the canonical definition source for every metric used in reporting.

## Reporting cadence

- **Weekly brief** — `weekly-metrics-brief` skill runs Monday against pre-aggregated exports under `context/data-intelligence/`.
- **Monthly review** — `campaign-manager` skill ties metrics back to `experiments.md` and `content-history.md`.
- **Quarterly reset** — revisit the primary metric per surface. A surface's primary metric is a decision, not a constant.

## Anti-patterns

- Treating likes, impressions, or follower counts as a goal.
- A/B testing without a pre-declared minimum observation window.
- Measuring the blog by pricing conversions (blog's job is discovery, not conversion).
- Pulling individual-merchant data without a documented purpose.
- Claiming a lift from a single data point ("conversion doubled last week!") without pre-registered metric + observation window.
- Shifting the primary metric mid-experiment to catch a positive signal.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Replaced Web3 surfaces (homepage scanner with wallet input, Sentinel page, API pages, chain distribution) with Shopify surfaces (public URL scanner, concierge £97, Shopify app listing, first-scorecard, Agency tier). Added the agency-merchant ratio as North Star.
