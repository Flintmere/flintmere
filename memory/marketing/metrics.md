# metrics.md — What success looks like

One primary metric per surface. Everything else is a secondary observation.

## Primary metrics per surface

| Surface | Primary metric | Why |
|---|---|---|
| Homepage scanner (`/#scan`) | Successful scans per day | The free tool is the top of funnel. If people aren't scanning, nothing else matters. |
| Blog | Organic search sessions to `/blog/*` | Content has one job: get new people in. Social traffic is a bonus. |
| Pricing page | Pro signup rate (visits → paid subscriptions) | Conversion is the whole point of the page. |
| Sentinel page | Demo requests or Sentinel signups | Sentinel is discussed, not impulse-bought. Meetings are the metric. |
| API pages | Developer-tier signups per month | Self-serve API funnel. |
| Social (X, Farcaster, LinkedIn) | Clicks to `/#scan` or `/blog/*` | Vanity metrics (likes, impressions) are observations. Traffic is the outcome. |
| Outreach | Replies + meetings booked | Not opens. Not sends. |

## Secondary observations (not decisions)

- Impressions, likes, reposts, shares.
- Time on page, scroll depth.
- Chain distribution of scans.
- Segment split (retail / power / operator / ecosystem) where identifiable.

## Data hygiene (gated by #19 Privacy/GDPR)

- Analytics skill works from **aggregated data only**. No PII.
- Never request, store, or process wallet addresses tied to behavioural data.
- No cross-site tracking pixels in marketing pages.
- Current cookie consent language governs what can be collected. If an experiment would violate it, rewrite the experiment, not the consent.

## Reporting cadence

- Weekly brief by the analytics skill, pulled from whatever export file the user provides in `context/analytics/`.
- Monthly review by the campaign-manager skill — ties metrics back to `experiments.md` and `content-history.md`.

## Anti-patterns

- Treating likes as a goal.
- A/B testing without a pre-declared minimum observation window.
- Measuring surface health with the wrong metric (e.g. measuring the blog by pricing conversions).
- Pulling individual-user data without a documented purpose.
