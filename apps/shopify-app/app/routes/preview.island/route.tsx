import type { LinksFunction } from '@remix-run/node';
import { IslandFrame } from '~/components/island/IslandFrame';
import { ScoreRing } from '~/components/island/ScoreRing';
import { PillarGrid, type Pillar } from '~/components/island/PillarGrid';
import { island } from '~/components/island/tokens';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&family=Geist+Mono:wght@400;500;700&display=swap',
  },
];

// Standalone preview of the Polaris-island art spike — no auth, no Shopify,
// no Partners plumbing. Renders under `remix vite:dev` at /preview/island
// so we can verify the canon (amber, bracket, Geist) without OAuth.

const PILLARS: Pillar[] = [
  { n: '01', name: 'Identifiers', score: 42, weight: '20%' },
  { n: '02', name: 'Titles', score: 78, weight: '18%' },
  { n: '03', name: 'Consistency', score: 61, weight: '16%' },
  { n: '04', name: 'Schema', score: 84, weight: '16%' },
  { n: '05', name: 'Attributes', score: 55, weight: '16%' },
  { n: '06', name: 'Availability', score: 72, weight: '14%' },
];

export default function PreviewIsland() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: island.paper2,
        padding: '48px 24px',
        fontFamily: island.fontSans,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <IslandFrame eyebrow="[ art spike — static sample ]">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 32,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            <ScoreRing score={64} grade="C+" />
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: island.fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: island.mute,
                }}
              >
                [ ai-readiness ]
              </p>
              <h1
                style={{
                  margin: '8px 0 0',
                  fontSize: 40,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  fontWeight: 500,
                }}
              >
                Your catalog is partly <span style={{ fontFamily: island.fontMono, fontWeight: 700 }}>[ legible ]</span>.
              </h1>
              <p
                style={{
                  marginTop: 12,
                  maxWidth: 52 + 'ch',
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: island.ink2,
                }}
              >
                Six pillars scored. Two are strong, four need work. Fix them and
                your catalog becomes legible to ChatGPT, Gemini, and Google Shopping.
              </p>
            </div>
          </div>
          <PillarGrid pillars={PILLARS} />
        </IslandFrame>
      </div>
    </main>
  );
}
