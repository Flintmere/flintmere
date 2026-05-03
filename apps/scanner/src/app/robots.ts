import type { MetadataRoute } from 'next';

// Single canonical robots.txt. Sitemap host stays flintmere.com until
// the dual-host architecture decision (task #9 — A/B/C) lands.
// When that ships, this file gains per-host logic via headers().
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/score/*/raw',
        ],
      },
    ],
    sitemap: 'https://flintmere.com/sitemap.xml',
    host: 'https://flintmere.com',
  };
}
