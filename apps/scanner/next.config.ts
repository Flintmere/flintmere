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
  // PostHog Cloud EU first-party proxy (ADR 0025) — ad-blocker-resistant
  // capture. PostHog's API uses trailing slashes; skipTrailingSlashRedirect
  // below stops Next.js 308'ing them. Pattern per
  // posthog.com/docs/advanced/proxy/nextjs.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://eu-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // payment=() — non-checkout surfaces deny the Payment Request API.
          // Stripe Payment Element on /audit/checkout uses Stripe's iframe
          // which has its own Permissions-Policy delegation; explicit deny
          // here doesn't break that flow. Added 2026-05-09 pre-launch audit.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // HSTS — declares HTTPS-only for a year. Coolify already 301s
          // HTTP→HTTPS at the edge; this header tells browsers to skip
          // the HTTP attempt entirely on subsequent visits. `preload`
          // is omitted intentionally — operator must explicitly submit
          // to the HSTS preload list before adding it.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Cross-Origin-Opener-Policy — isolates the page's browsing
          // context. Tightens the Spectre-class side-channel surface
          // and unlocks performance.now() higher resolution.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      // Static marketing assets — long-cache + immutable. The default
      // Next.js standalone server emits `cache-control: public, max-age=0`
      // for /public files, forcing every revisit to revalidate. These
      // assets ship with a commit hash in their path (or change identity
      // when the bytes change), so a year-long immutable cache is safe
      // and cuts repeat-visit image fetches to 0.
      {
        source: '/marketing/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
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

  // Bundle-size optimisations (2026-05-05). Mobile PageSpeed measured
  // the @sentry/nextjs client SDK at 128 KB on the marketing surface.
  // We don't use Session Replay, the client SDK has tracing disabled
  // (instrumentation-client.ts dropped tracesSampleRate), and we ship
  // production without debug statements. Tree-shaking these unused
  // subsystems should drop the Sentry chunk substantially.
  bundleSizeOptimizations: {
    excludeTracing: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
    excludeDebugStatements: true,
  },

  // Sentry's internal debug logger — production doesn't need it.
  disableLogger: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Vercel Cron Monitors instrumentation — irrelevant; we deploy on
    // Coolify, not Vercel. Disabling drops ~5 KB of unused
    // instrumentation code from the client bundle.
    automaticVercelMonitors: false,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
