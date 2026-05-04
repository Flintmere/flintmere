/**
 * Shared mistake-row composition for /for/* vertical landing pages.
 *
 * Three columns desktop: ordinal numeral (80px) · title + symptom + fix
 * (1fr) · `Check · {pillar}` eyebrow (clamp 200–240px). One column on
 * mobile. The right-hand eyebrow renders as two intentional lines —
 * `Check ·` (mute-2) on top, pillar (ink) on the bottom — so long
 * pillar names ("AGENT CRAWLABILITY", "IDENTIFIER COMPLETENESS") read
 * as designed stacking rather than wrap-mid-phrase. `text-wrap: balance`
 * gracefully handles the edge case where the pillar itself wraps.
 *
 * Originally inlined four times across /for/{plus,food-and-drink,
 * beauty,apparel}/page.tsx. Extracted 2026-05-04 after the design-
 * system audit caught a P0 overflow class; the four duplicates had
 * already drifted in column-width geometry between sibling pages.
 */
export interface Mistake {
  n: string;
  title: string;
  symptom: string;
  pillar: string;
  fix: string;
}

export function MistakeRow({ mistake }: { mistake: Mistake }) {
  return (
    <li className="grid grid-cols-[80px_1fr_clamp(200px,18vw,240px)] gap-8 py-9 items-start max-md:grid-cols-1 max-md:gap-4">
      <span
        aria-hidden="true"
        className="bracket-inline"
        style={{
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        {mistake.n}
      </span>
      <div>
        <h3
          className="mb-3"
          style={{ fontSize: 22, letterSpacing: '-0.015em', lineHeight: 1.2 }}
        >
          {mistake.title}
        </h3>
        <p
          className="text-[color:var(--color-ink-2)] mb-3"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          {mistake.symptom}
        </p>
        <p
          className="text-[color:var(--color-mute)]"
          style={{ fontSize: 14, lineHeight: 1.5 }}
        >
          <strong className="text-[color:var(--color-ink)]">Flintmere:</strong>{' '}
          {mistake.fix}
        </p>
      </div>
      <p
        className="eyebrow text-right max-md:text-left"
        style={{ textWrap: 'balance' }}
      >
        <span className="block" style={{ color: 'var(--color-mute-2)' }}>
          Check ·
        </span>
        <span className="block">{mistake.pillar}</span>
      </p>
    </li>
  );
}
