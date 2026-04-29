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
  transpilePackages: ['@flintmere/scoring', '@flintmere/ui'],
  // Tier-1 build optimisation 2026-04-29 — ESLint runs in CI on every PR
  // (.github/workflows/lint.yml); production build skips it for ~10-15s/build.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Marketing surfaces ship AVIF as primary, WebP as fallback.
    // See memory/design/tokens.md §Imagery weight budgets.
    formats: ['image/avif', 'image/webp'],
  },
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
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "flintmere",

  project: "flintmere-scanner",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Tier-1 build optimisation 2026-04-29 — widening explicitly increases build
  // time (per Sentry's own comment); standard source-map upload is sufficient
  // for our current stack-trace fidelity needs. Re-enable if a debugging
  // session shows we need the extra granularity.
  widenClientFileUpload: false,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
