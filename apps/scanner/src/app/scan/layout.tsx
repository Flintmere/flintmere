import type { Metadata } from 'next';

/**
 * Per-route metadata for `/scan`.
 *
 * Lives in a server-component layout because `scan/page.tsx` is
 * `'use client'` and Next.js forbids metadata exports on client
 * components. The layout is a pass-through render; its only job is
 * to override the global `openGraph` / `twitter` block set in
 * `src/app/layout.tsx` with the framing that matches the page's own
 * hero. Same chord at share-time and at land-time.
 *
 * The `opengraph-image.tsx` sibling in this folder is the per-route
 * card; Next.js automatically wires it as `og:image` for any route
 * resolving to this layout.
 */
export const metadata: Metadata = {
  title: 'Free catalog scan',
  description:
    'How much of your product data is actually structured? Free 60-second scan against the seven pillars of catalog quality. No signup.',
  openGraph: {
    title: 'How much of your product data is actually structured?',
    description:
      'Paste your URL. We read your public catalog and score it against seven pillars of product-data quality.',
    url: '/scan',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How much of your product data is actually structured?',
    description:
      'Paste your URL. We read your public catalog and score it against seven pillars of product-data quality.',
  },
};

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
