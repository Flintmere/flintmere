/**
 * A pillar's score as a 0-100 percentage of what that pillar could actually
 * assess.
 *
 * `maxScore` is not always 100. `scoreIdentifiers` drops the 75 barcode
 * points out of the denominator when the barcode pass read nothing
 * (`pillars/identifiers.ts`), so a store that is perfect on the 25
 * assessable points returns `{ score: 25, maxScore: 25 }` — which renders as
 * "25%" if you print `score` directly. `computeComposite` (`score.ts`) has
 * always divided by `maxScore`; every display site has to do the same or two
 * Flintmere surfaces report the same scan up to 75 points apart.
 *
 * Structurally typed on purpose: it takes a `PillarResult`, a persisted
 * `scoreJson.pillars[n]` entry and the scanner's `ScanResult['pillars'][n]`
 * without any of those needing to know about each other.
 */
export function pillarPercent(pillar: {
  score: number;
  maxScore: number;
}): number {
  if (!(pillar.maxScore > 0)) return 0;
  return Math.round((pillar.score / pillar.maxScore) * 100);
}
