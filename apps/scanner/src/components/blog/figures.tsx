/**
 * Blog in-post figures — inline JSX SVG line-art (tokens.md §Imagery, the
 * /methodology diagram register). Self-contained, no raster, no external
 * licence. Both figures are meaning-bearing → role="img" + aria-label.
 *
 * Art direction: context/imagery/2026-06-11-blog-catalog-readiness.tsx
 * References: Bloomberg Businessweek covers (weights as the visual), Hodinkee
 * Reference Points (restrained technical diagram), Pentagram case studies
 * (diagram as designed object).
 *
 * Used by mdx-components.tsx → available to MDX posts as <PillarWeightFigure/>
 * and <CatalogRecordFigure/>. Render inside .blog-prose (figure/figcaption CSS
 * already styles them). Static — no reduced-motion concern.
 */

const PUBLIC_FILL = 'var(--color-accent)'; // amber — readable on a free scan
const INK = 'var(--color-ink)';
const MUTE = 'var(--color-mute)';
const LINE = 'var(--color-line)';
const LINE_SOFT = 'var(--color-line-soft)';

const PILLARS: { name: string; weight: number; public: boolean }[] = [
  { name: 'Identifiers', weight: 20, public: true },
  { name: 'Attributes', weight: 20, public: false },
  { name: 'Titles', weight: 15, public: true },
  { name: 'Mapping', weight: 15, public: false },
  { name: 'Consistency', weight: 15, public: true },
  { name: 'Checkout eligibility', weight: 10, public: false },
  { name: 'Crawlability', weight: 5, public: true },
];

const BAR_X = 200;
const PX_PER_PT = 16; // weight 20 -> 320px
const ROW_STEP = 38;
const ROW_TOP = 30;
const BAR_H = 16;

/** The seven pillars as weighted bars (amber = free-scan-readable) + the 55/45 split. */
export function PillarWeightFigure() {
  const splitY = ROW_TOP + PILLARS.length * ROW_STEP + 14;
  const fullW = 100 * 3.4; // 340px across 100 points
  const publicW = 55 * 3.4;
  return (
    <figure aria-label="Bar chart of the seven catalog-readiness pillars and their weights out of 100. Identifiers 20, Attributes 20, Titles 15, Mapping 15, Consistency 15, Checkout eligibility 10, Crawlability 5. The four pillars a free public scan can read — Identifiers, Titles, Consistency, Crawlability — sum to 55 points; the three install-gated pillars — Attributes, Mapping, Checkout eligibility — sum to 45.">
      <svg viewBox={`0 0 600 ${splitY + 56}`} role="img" className="w-full h-auto" style={{ overflow: 'visible' }}>
        {PILLARS.map((p, i) => {
          const y = ROW_TOP + i * ROW_STEP;
          const w = p.weight * PX_PER_PT;
          return (
            <g key={p.name}>
              <text x={BAR_X - 12} y={y + BAR_H - 3} textAnchor="end" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fill: INK }}>
                {p.name}
              </text>
              <rect
                x={BAR_X}
                y={y}
                width={w}
                height={BAR_H}
                fill={p.public ? PUBLIC_FILL : 'none'}
                stroke={p.public ? 'none' : INK}
                strokeWidth={p.public ? 0 : 1.5}
              />
              <text x={BAR_X + w + 10} y={y + BAR_H - 3} style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, fill: INK }}>
                {p.weight}
              </text>
            </g>
          );
        })}

        <line x1={BAR_X} y1={splitY - 4} x2={BAR_X + fullW} y2={splitY - 4} stroke={LINE_SOFT} strokeWidth="1" />
        <rect x={BAR_X} y={splitY + 8} width={publicW} height={BAR_H} fill={PUBLIC_FILL} />
        <rect x={BAR_X + publicW} y={splitY + 8} width={fullW - publicW} height={BAR_H} fill="none" stroke={INK} strokeWidth="1.5" />
        <text x={BAR_X} y={splitY + 44} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: MUTE }}>
          55 — readable on a free scan
        </text>
        <text x={BAR_X + fullW} y={splitY + 44} textAnchor="end" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: MUTE }}>
          45 — install-gated
        </text>
      </svg>
      <figcaption>
        Seven pillars, weighted to 100. The amber four — <strong>[ 55 ]</strong> points — read from a public storefront; a free scan reports them with no install.
      </figcaption>
    </figure>
  );
}

const FIELDS = ['GTIN', 'Title', 'Brand', 'Attributes'];

function RecordCard({
  x,
  title,
  present,
  outcome,
  matched,
}: {
  x: number;
  title: string;
  present: boolean[];
  outcome: string;
  matched: boolean;
}) {
  const W = 250;
  return (
    <g>
      <rect x={x} y={20} width={W} height={250} fill="none" stroke={LINE} strokeWidth="1" />
      <text x={x + 18} y={50} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1.5, fill: MUTE }}>
        {title.toUpperCase()}
      </text>
      <line x1={x + 18} y1={62} x2={x + W - 18} y2={62} stroke={LINE_SOFT} strokeWidth="1" />
      {FIELDS.map((f, i) => {
        const cy = 92 + i * 38;
        const ok = present[i];
        return (
          <g key={f}>
            <circle cx={x + 30} cy={cy - 5} r={5} fill={ok ? PUBLIC_FILL : 'none'} stroke={ok ? 'none' : 'var(--color-mute-2)'} strokeWidth={ok ? 0 : 1.5} />
            <text
              x={x + 48}
              y={cy}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fill: ok ? INK : 'var(--color-mute-2)',
                textDecoration: ok ? 'none' : 'line-through',
              }}
            >
              {f}
            </text>
            {!ok ? (
              <text x={x + W - 18} y={cy} textAnchor="end" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-mute-2)' }}>
                missing
              </text>
            ) : null}
          </g>
        );
      })}
      <line x1={x + 18} y1={250} x2={x + W - 18} y2={250} stroke={LINE_SOFT} strokeWidth="1" />
      <text x={x + 18} y={266} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, fill: matched ? INK : 'var(--color-mute)' }}>
        {outcome}
      </text>
    </g>
  );
}

/** Same product, two records: complete (matched) vs missing GTIN+attributes (withheld). */
export function CatalogRecordFigure() {
  return (
    <figure aria-label="Two product records side by side. The left record has GTIN, Title, Brand, and Attributes all present and is matched into the Google comparison. The right record is the same product with GTIN and Attributes missing; it is withheld from the comparison.">
      <svg viewBox="0 0 600 300" role="img" className="w-full h-auto" style={{ overflow: 'visible' }}>
        <RecordCard x={20} title="Complete record" present={[true, true, true, true]} outcome="In the comparison" matched />
        <RecordCard x={330} title="Same product, no GTIN" present={[false, true, true, false]} outcome="Withheld" matched={false} />
      </svg>
      <figcaption>
        One product, two records. Drop the <strong>[ GTIN ]</strong> and the channel can no longer confirm what it is — so it withholds the listing rather than guess.
      </figcaption>
    </figure>
  );
}
