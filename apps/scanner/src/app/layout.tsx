import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Flintmere — Catalog readiness for AI agents',
    template: '%s · Flintmere',
  },
  description:
    'Score your Shopify catalog for AI-agent readiness. Free scan, 60 seconds, no signup to start.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://flintmere.com'),
  openGraph: {
    title: 'Flintmere — Catalog readiness for AI agents',
    description:
      'Score your Shopify catalog for AI-agent readiness. Free scan, 60 seconds.',
    url: '/',
    siteName: 'Flintmere',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        // expose Geist via CSS variables declared in globals.css @theme
        ['--geist-sans' as string]: GeistSans.style.fontFamily,
        ['--geist-mono' as string]: GeistMono.style.fontFamily,
      }}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-[color:var(--color-ink)] focus:px-3 focus:py-2 focus:text-[color:var(--color-paper)]"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
