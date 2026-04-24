import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prisma } from '@/lib/db';
import { validateDomainSegment } from '@/lib/badge-url';

export const alt = 'Flintmere AI-readiness score';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadFont(filename: string) {
  const url = new URL(`../../og-fonts/${filename}`, import.meta.url);
  const buf = await readFile(fileURLToPath(url));
  return new Uint8Array(buf).buffer;
}

export default async function OG({
  params,
}: {
  params: { shop: string };
}) {
  const domain = validateDomainSegment(params.shop);
  const scan = domain
    ? await prisma.scan.findFirst({
        where: {
          normalisedDomain: domain,
          publishPublicPage: true,
          status: 'complete',
          score: { not: null },
          grade: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        select: { score: true, grade: true },
      })
    : null;

  const score = scan?.score ?? null;
  const grade = scan?.grade ?? null;

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
          backgroundColor: '#FAF7F2',
          color: '#0A0A0A',
          padding: '72px 80px',
          justifyContent: 'space-between',
          fontFamily: 'Geist',
        }}
      >
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
          <span style={{ opacity: 0.45 }}>//</span>
          <span style={{ opacity: 0.7 }}>AI-readiness score</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Geist',
            fontWeight: 500,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: 'GeistMono',
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 1,
              opacity: 0.7,
              marginBottom: 16,
            }}
          >
            {domain ?? 'unknown'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontSize: 280,
              lineHeight: 0.9,
              letterSpacing: -10,
            }}
          >
            <span>{score ?? '—'}</span>
            <span
              style={{
                display: 'flex',
                width: 48,
                height: 8,
                background: '#F8BF24',
                marginLeft: 18,
                marginBottom: 60,
              }}
            />
            <span
              style={{
                marginLeft: 40,
                fontFamily: 'GeistMono',
                fontWeight: 700,
                fontSize: 140,
                letterSpacing: -4,
                opacity: 0.85,
              }}
            >
              {grade ?? '—'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'GeistMono',
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: 1,
              opacity: 0.55,
              marginTop: 8,
            }}
          >
            / 100 · grade
          </div>
        </div>

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
              opacity: 0.65,
            }}
          >
            flintmere.com/score
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
