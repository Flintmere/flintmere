import { island } from './tokens';

export interface Pillar {
  n: string;
  name: string;
  score: number;
  weight: string;
  locked?: boolean;
  lockedReason?: string;
}

// PillarGrid — bracketed pillar cells. Progress bar fills in amber when
// the pillar clears 70, neutral ink otherwise. Locked cells render a
// `[ locked ]` eyebrow with reason microcopy and skip the progress fill.
// DESIGN.md §Flintmere owns. Auto-fit handles the 7-pillar layout.

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
  const locked = pillar.locked === true;
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
        [&nbsp;{locked ? 'locked' : pillar.n}&nbsp;]
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: island.fontSans,
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: locked ? island.mute : island.ink,
          lineHeight: 1.2,
        }}
      >
        {pillar.name}
      </p>
      {locked ? (
        <p
          style={{
            margin: 0,
            marginTop: 4,
            fontFamily: island.fontMono,
            fontSize: 11,
            color: island.mute2,
            letterSpacing: '0.04em',
            lineHeight: 1.4,
          }}
        >
          {lockedCopy(pillar.lockedReason)}
        </p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

function lockedCopy(reason: string | undefined): string {
  switch (reason) {
    case 'requires-install':
      return 'Unlocks after first catalog sync.';
    case 'crawlability-not-fetched':
      return 'Re-scan to populate.';
    case 'locked-by-caller':
      return 'Locked.';
    default:
      return reason ? `Locked — ${reason}.` : 'Locked.';
  }
}
