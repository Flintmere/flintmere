import { island } from './tokens';

// ScoreRing — the signature motion. Conic-gradient amber fill, Geist numeral
// centre, bracket `[ N ]` caption above. Sized for the embedded dashboard;
// the scanner's version lives in apps/scanner/src/components/ScoreRing.tsx.
//
// Static variant only in this spike; the animated version (requestAnimationFrame
// + prefers-reduced-motion) lands once the dashboard is interactive.

export function ScoreRing({
  score,
  grade,
  size = 200,
}: {
  score: number;
  grade?: string;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div
      role="img"
      aria-label={`AI-readiness score: ${score} out of 100${grade ? `, grade ${grade}` : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${island.accent} 0 ${pct}%, ${island.lineSoft} ${pct}% 100%)`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          width: size - 24,
          height: size - 24,
          borderRadius: '50%',
          background: island.paper,
          border: `1px solid ${island.line}`,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <div>
          <p
            aria-hidden="true"
            style={{
              margin: 0,
              fontFamily: island.fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: island.mute,
              textTransform: 'uppercase',
            }}
          >
            [&nbsp;score&nbsp;]
          </p>
          <p
            style={{
              margin: 0,
              marginTop: 4,
              fontFamily: island.fontSans,
              fontSize: Math.round(size * 0.36),
              fontWeight: 500,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              color: island.ink,
            }}
          >
            {score}
          </p>
          <p
            style={{
              margin: 0,
              marginTop: 4,
              fontFamily: island.fontMono,
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.14em',
              color: island.mute,
              textTransform: 'uppercase',
            }}
          >
            of 100{grade ? ` · ${grade}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
