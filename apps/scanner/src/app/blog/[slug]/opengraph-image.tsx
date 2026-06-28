import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getPostBySlug, getAllPosts } from '@/lib/blog/posts';
import { CLUSTER_LABELS } from '@/components/blog/PostCard';

// Per-post OG card. Mirrors the root opengraph-image (src/app/opengraph-image.tsx)
// register — amber field, ink type, mono eyebrow + bracket signature, wordmark
// footer. Hex is literal because satori doesn't read CSS variables; keep in
// sync with globals.css @theme (--color-accent / --color-accent-ink).
//
// Fonts live at src/app/og-fonts/ — two segments up from this dynamic route.

export const alt = 'Flintmere — Food catalog data for Shopify';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Pre-generate one card per non-draft slug (matches the page's static params).
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.frontmatter.slug }));
}

async function loadFont(filename: string) {
  const url = new URL(`../../og-fonts/${filename}`, import.meta.url);
  const buf = await readFile(fileURLToPath(url));
  return new Uint8Array(buf).buffer;
}

/** Title scale by length so it always fits the 1040px content box. */
function titleSize(title: string): number {
  if (title.length <= 38) return 76;
  if (title.length <= 58) return 62;
  return 50;
}

export default async function OG({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  const title = post?.frontmatter.title ?? 'Flintmere';
  const clusterLabel = post ? CLUSTER_LABELS[post.frontmatter.cluster] : 'Field notes';

  const [geistBold, geistMedium, monoBold] = await Promise.all([
    loadFont('Geist-Bold.ttf'),
    loadFont('Geist-Medium.ttf'),
    loadFont('GeistMono-Bold.ttf'),
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
        {/* eyebrow — mono, bracketed cluster signature */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'GeistMono',
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          <span>Flintmere</span>
          <span style={{ opacity: 0.55 }}>//</span>
          <span style={{ opacity: 0.85 }}>[ {clusterLabel} ]</span>
        </div>

        {/* headline */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Geist',
            fontWeight: 700,
            fontSize: titleSize(title),
            lineHeight: 1.02,
            letterSpacing: -2,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        {/* footer — wordmark + host */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: 'Geist',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', fontWeight: 500, fontSize: 36, letterSpacing: -1 }}>
            <span>Flintmere</span>
            <span style={{ fontFamily: 'GeistMono', fontWeight: 700, marginLeft: 2 }}>]</span>
          </div>
          <div style={{ display: 'flex', fontFamily: 'GeistMono', fontWeight: 700, fontSize: 22, opacity: 0.7 }}>
            audit.flintmere.com/blog
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
      ],
    },
  );
}
