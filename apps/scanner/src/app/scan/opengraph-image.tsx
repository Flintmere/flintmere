import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Sibling card to `src/app/opengraph-image.tsx` — same amber-on-ink
// palette, same Geist Bold + GeistMono Bold typography, same eyebrow
// + asymmetric `Flintmere]` footer. Only the display claim shifts:
// the root card carries the brand statement ("What agents see. In
// [ 60 seconds ]."), this card carries the suppression wedge that
// matches the on-page hero verbatim. Share → click → land continuity.
//
// Hex values mirror --color-paper / --color-ink / --color-accent.
// Next.js OG generation runs in an Edge/satori context that doesn't
// read CSS variables; literal hex is the only option. Keep in sync
// with globals.css @theme if those tokens change.

export const alt =
  'Which of your products are suppressed in Google Shopping today? Flintmere — free 60-second catalog scan.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadFont(filename: string) {
  // Fonts live at `src/app/og-fonts/` — one directory up from this
  // route. The root opengraph-image.tsx uses `./og-fonts/`; we use
  // `../og-fonts/` to point at the same canonical asset rather than
  // duplicating four font files into every per-route OG folder.
  const url = new URL(`../og-fonts/${filename}`, import.meta.url);
  const buf = await readFile(fileURLToPath(url));
  return new Uint8Array(buf).buffer;
}

export default async function OG() {
  const [geistBold, geistMedium, monoBold, monoRegular] = await Promise.all([
    loadFont('Geist-Bold.ttf'),
    loadFont('Geist-Medium.ttf'),
    loadFont('GeistMono-Bold.ttf'),
    loadFont('GeistMono-Regular.ttf'),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#F8BF24',
          color: '#0A0A0A',
          padding: '72px 80px',
          justifyContent: 'space-between',
          fontFamily: 'Geist',
        }}
      >
        {/* top row — mono eyebrow (matches root card for series continuity) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: 'GeistMono',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          <span>Flintmere</span>
          <span style={{ opacity: 0.55 }}>//</span>
          <span style={{ opacity: 0.8 }}>Food catalog data</span>
        </div>

        {/* display claim — mirrors page hero line-break exactly */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Geist',
            fontWeight: 700,
            fontSize: 96,
            lineHeight: 0.95,
            letterSpacing: -4,
          }}
        >
          <span>Which of your products</span>
          <span style={{ display: 'flex', alignItems: 'baseline' }}>
            are&nbsp;
            <span
              style={{
                fontFamily: 'GeistMono',
                fontWeight: 700,
                marginRight: 6,
              }}
            >
              [
            </span>
            suppressed
            <span
              style={{
                fontFamily: 'GeistMono',
                fontWeight: 700,
                marginLeft: 6,
                marginRight: 6,
              }}
            >
              ]
            </span>
            in
          </span>
          <span>Google Shopping today?</span>
        </div>

        {/* footer — wordmark + URL (matches root card) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: 'Geist',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontFamily: 'GeistMono',
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: -1.4,
            }}
          >
            <span>Flintmere</span>
            <span style={{ marginLeft: 2 }} aria-hidden="true">]</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'GeistMono',
              fontWeight: 400,
              fontSize: 22,
              opacity: 0.7,
            }}
          >
            audit.flintmere.com/scan
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Geist', data: geistBold, weight: 700, style: 'normal' },
        { name: 'Geist', data: geistMedium, weight: 500, style: 'normal' },
        { name: 'GeistMono', data: monoBold, weight: 700, style: 'normal' },
        { name: 'GeistMono', data: monoRegular, weight: 400, style: 'normal' },
      ],
    },
  );
}
