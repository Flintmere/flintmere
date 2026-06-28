import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Flintmere — Food catalog data for Shopify',
    template: '%s · Flintmere',
  },
  description:
    'We score your food catalog on seven pillars Shopify Catalog leaves to you — GTINs, allergens, checkout eligibility. Free 60-second scan, no signup.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://flintmere.com'),
  openGraph: {
    title: 'Flintmere — Food catalog data for Shopify',
    description:
      'We score your food catalog on seven pillars Shopify Catalog leaves to you — GTINs, allergens, checkout eligibility. Free 60-second scan, no signup, no credit card.',
    url: '/',
    siteName: 'Flintmere',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flintmere — Food catalog data for Shopify',
    description:
      'We score your food catalog on seven pillars Shopify Catalog leaves to you — GTINs, allergens, checkout eligibility. Free 60-second scan, no signup, no credit card.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Declare the canon as a light-scheme surface. Without this, browsers
// in OS-level dark mode (especially Chrome with auto-dark-mode) tint
// the viewport — operator caught vertical pages showing black margins
// outside the paper content column on macOS dark mode 2026-05-03.
export const viewport: Viewport = {
  colorScheme: 'light',
  // Mirrors --color-paper. Next.js Metadata.themeColor doesn't accept CSS
  // variables; if --color-paper changes in globals.css @theme, update here too.
  themeColor: '#f7f7f4',
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
        {/* JSON-LD Organization + WebSite schema. AI-shopping crawlers and
            Google rich-result eligibility both consume this; absence is
            ironic for a catalog-data product. Single source — if
            entity details change, also update /about + /privacy + /terms. */}
        <Script
          id="ld-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://flintmere.com/#organization',
                name: 'Flintmere',
                legalName: 'Eazy Access Ltd',
                url: 'https://flintmere.com',
                logo: 'https://flintmere.com/icon.png',
                founder: { '@type': 'Person', name: 'Abdur-Rahman Morris' },
                foundingDate: '2021',
                identifier: [
                  {
                    '@type': 'PropertyValue',
                    propertyID: 'Companies House',
                    value: '13205428',
                  },
                ],
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: '71–75 Shelton Street, Covent Garden',
                  addressLocality: 'London',
                  postalCode: 'WC2H 9JQ',
                  addressCountry: 'GB',
                },
                sameAs: [
                  'https://github.com/Flintmere',
                  'https://x.com/flintmere_',
                  'https://bsky.app/profile/flintmere.bsky.social',
                  'https://instagram.com/flintmere.audit',
                ],
              },
              {
                '@type': 'WebSite',
                '@id': 'https://flintmere.com/#website',
                url: 'https://flintmere.com',
                name: 'Flintmere',
                publisher: { '@id': 'https://flintmere.com/#organization' },
                inLanguage: 'en-GB',
                potentialAction: {
                  '@type': 'SearchAction',
                  // SearchAction target is the scanner host where the
                  // search action actually executes — even though the
                  // WebSite entity itself is the brand site.
                  target:
                    'https://audit.flintmere.com/scan?shop={shop_url}',
                  'query-input': 'required name=shop_url',
                },
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Flintmere Scanner',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                // Scanner lives on the audit. subdomain per the C1
                // host-routing architecture (council 2026-05-03). The
                // Organization and WebSite entities stay on flintmere.com
                // (the brand domain) — only the SoftwareApplication URL
                // moves.
                url: 'https://audit.flintmere.com/scan',
                publisher: { '@id': 'https://flintmere.com/#organization' },
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'GBP',
                  description:
                    'Free 60-second catalog data audit for any public Shopify store.',
                },
              },
            ],
          })}
        </Script>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-[color:var(--color-ink)] focus:px-3 focus:py-2 focus:text-[color:var(--color-paper)]"
        >
          Skip to main content
        </a>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
