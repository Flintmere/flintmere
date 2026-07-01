import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prisma } from '@/lib/db';
import { validateDomainSegment } from '@/lib/badge-url';

export const runtime = 'nodejs';

const SIZE = { width: 400, height: 120 };

async function loadFont(filename: string) {
  const url = new URL(`../../og-fonts/${filename}`, import.meta.url);
  const buf = await readFile(fileURLToPath(url));
  return new Uint8Array(buf).buffer;
}

// GET /badge/[shop]
//
// Public embeddable PNG score badge — a merchant drops
// `<img src="https://flintmere.com/badge/their-shop.com">` on their own
// site. Served ONLY for a domain that has a completed scan AND has
// consented to a public page (`publishPublicPage`, the same gate the
// public /score/[shop] route uses). Any other domain — unpublished,
// unscanned, or an invalid segment — returns 404 (a broken <img>, no
// placeholder), so a non-consented domain leaks nothing about having been
// scanned (#24 Data protection). Canon mirrors score/[shop]/opengraph-image.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  const { shop } = await params;
  const domain = validateDomainSegment(shop);

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

  if (!domain || !scan) {
    return new Response(null, { status: 404 });
  }

  const [geistMedium, monoBold, monoRegular] = await Promise.all([
    loadFont('Geist-Medium.ttf'),
    loadFont('GeistMono-Bold.ttf'),
    loadFont('GeistMono-Regular.ttf'),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#FAF7F2',
          color: '#0A0A0A',
          padding: '0 30px',
          alignItems: 'center',
          fontFamily: 'Geist',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: 'Geist',
              fontWeight: 500,
              fontSize: 66,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {scan.score}
          </span>
          <span
            style={{
              display: 'flex',
              width: 26,
              height: 6,
              background: '#F8BF24',
              marginLeft: 8,
              marginBottom: 14,
            }}
          />
          <span
            style={{
              fontFamily: 'GeistMono',
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: -1,
              marginLeft: 14,
              opacity: 0.85,
            }}
          >
            {scan.grade}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 'auto',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontFamily: 'Geist',
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: -0.5,
            }}
          >
            <span>Flintmere</span>
            <span
              style={{ fontFamily: 'GeistMono', fontWeight: 700, marginLeft: 1 }}
            >
              ]
            </span>
          </div>
          <div
            style={{
              fontFamily: 'GeistMono',
              fontWeight: 400,
              fontSize: 13,
              opacity: 0.6,
            }}
          >
            {domain}
          </div>
          <div
            style={{
              fontFamily: 'GeistMono',
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: 1,
              opacity: 0.5,
              textTransform: 'uppercase',
            }}
          >
            catalog data score / 100
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        'Cache-Control':
          'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
      fonts: [
        { name: 'Geist', data: geistMedium, weight: 500, style: 'normal' },
        { name: 'GeistMono', data: monoBold, weight: 700, style: 'normal' },
        { name: 'GeistMono', data: monoRegular, weight: 400, style: 'normal' },
      ],
    },
  );
}
