import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Match Next's automatic JSX runtime (tsconfig is `jsx: preserve`, so
  // esbuild would otherwise default to the classic React.createElement
  // transform and throw "React is not defined" when a tested route renders
  // JSX — e.g. the next/og image routes).
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
