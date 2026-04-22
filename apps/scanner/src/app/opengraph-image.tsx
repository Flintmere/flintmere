import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const alt = 'Flintmere — catalog readiness for AI agents';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadFont(filename: string) {
  const url = new URL(`./og-fonts/${filename}`, import.meta.url);
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
        {/* top row — mono eyebrow */}
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
          <span style={{ opacity: 0.8 }}>Agent-ready commerce</span>
        </div>

        {/* display claim */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Geist',
            fontWeight: 700,
            fontSize: 128,
            lineHeight: 0.95,
            letterSpacing: -5,
          }}
        >
          <span>What agents see.</span>
          <span style={{ display: 'flex', alignItems: 'baseline' }}>
            In&nbsp;
            <span
              style={{
                fontFamily: 'GeistMono',
                fontWeight: 700,
                marginRight: 6,
              }}
            >
              [
            </span>
            60 seconds
            <span
              style={{
                fontFamily: 'GeistMono',
                fontWeight: 700,
                marginLeft: 6,
              }}
            >
              ]
            </span>
            .
          </span>
        </div>

        {/* footer — wordmark + scan CTA */}
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
              fontWeight: 500,
              fontSize: 36,
              letterSpacing: -1,
            }}
          >
            <span>Flintmere</span>
            <span
              style={{
                fontFamily: 'GeistMono',
                fontWeight: 700,
                marginLeft: 2,
              }}
            >
              ]
            </span>
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
            audit.flintmere.com
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
