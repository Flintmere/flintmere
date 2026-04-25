import type { NextConfig } from 'next';
import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const config: NextConfig = {
  output: 'standalone',
  // Repo root — without this, standalone tracing roots at apps/scanner/ and
  // misses pnpm-symlinked workspace packages (@flintmere/scoring/dist),
  // server.js path, static assets, and public dir all break in production.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@flintmere/scoring'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

// Wrap with Sentry. Source-map upload disabled by default; enable later by
// setting SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT in build env.
export default withSentryConfig(config, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  hideSourceMaps: true,
  disableLogger: true,
});
