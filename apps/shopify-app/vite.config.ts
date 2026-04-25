import { sentryVitePlugin } from "@sentry/vite-plugin";
import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

export default defineConfig({
  server: {
  port: Number(process.env.PORT) || 3000,
  fs: { allow: ['app', 'node_modules'] },
  hmr: { port: 64999 },
  allowedHosts: [
    'clarinet-swagger-landmark.ngrok-free.dev',
    '.ngrok-free.dev',
    '.trycloudflare.com',
    '.ngrok.app',
  ],
},
  plugins: [remix({
    ignoredRouteFiles: ['**/.*'],
    future: {
      v3_fetcherPersist: true,
      v3_relativeSplatPath: true,
      v3_throwAbortReason: true,
      v3_singleFetch: true,
      v3_lazyRouteDiscovery: true,
    },
  }), tsconfigPaths(), sentryVitePlugin({
    org: "flintmere",
    project: "flintmere-shopify-app"
  })],
  build: {
    assetsInlineLimit: 0,
    sourcemap: true
  },
  optimizeDeps: {
    include: ['@shopify/app-bridge-react', '@shopify/polaris'],
  },
});
