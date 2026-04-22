import { island } from './tokens';

export interface Pillar {
  n: string;
  name: string;
  score: number;
  weight: string;
}

// PillarGrid — 2×3 of bracketed pillar cells. Progress bar fills in amber
// when the pillar clears 70, neutral ink otherwise. DESIGN.md §Flintmere owns.

export function PillarGrid({ pillars }: { pillars: Pillar[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 0,
        border: `1px solid ${island.line}`,
        background: island.line,
      }}
    >
      {pillars.map((p) => (
        <Cell key={p.n} pillar={p} />
      ))}
    </div>
  );
}

function Cell({ pillar }: { pillar: Pillar }) {
  const strong = pillar.score >= 70;
  return (
    <div
      style={{
        background: island.paper,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <p
        aria-hidden="true"
        style={{
          margin: 0,
          fontFamily: island.fontMono,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: island.mute,
        }}
      >
        [&nbsp;{pillar.n}&nbsp;]
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: island.fontSans,
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: island.ink,
          lineHeight: 1.2,
        }}
      >
        {pillar.name}
      </p>
      <div
        style={{
          position: 'relative',
          height: 2,
          background: island.lineSoft,
          marginTop: 4,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${Math.max(0, Math.min(100, pillar.score))}%`,
            background: strong ? island.accent : island.ink,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: island.fontMono,
          fontSize: 11,
          fontWeight: 400,
          color: island.mute,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        <span>
          {pillar.score} / 100
        </span>
        <span>{pillar.weight}</span>
      </div>
    </div>
  );
}
