import type { Metadata } from 'next';
import Script from 'next/script';
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
  twitter: {
    card: 'summary_large_image',
    title: 'Flintmere — Catalog readiness for AI agents',
    description:
      'Score your Shopify catalog for AI-agent readiness. Free scan, 60 seconds.',
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
        {/* Plausible analytics — cookieless, EU-hosted (Plausible Cloud).
            ADR 0013. Event helper at apps/scanner/src/lib/plausible.ts.
            URL set via NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC in Coolify env;
            Plausible's modern snippet uses a hashed per-site URL. The fallback
            `script.js` is generic (won't track until env var is set). */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC ? (
          <>
            <Script
              async
              src={process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC}
              strategy="afterInteractive"
            />
            <Script id="plausible-init" strategy="afterInteractive">
              {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
