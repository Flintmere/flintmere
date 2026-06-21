import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — scanner end-to-end checks.
 *
 * Scope today: the mobile-reflow regression guard (design-critique 2026-06-13,
 * Thane P1). It asserts that no marketing route scrolls horizontally at phone
 * widths — the WCAG 2.1 AA 1.4.10 Reflow floor (Noor's veto), which the hero
 * saks-bracket overflow breached and which recurred multiple times because the
 * failure lived in the `@flintmere/ui` build/Tailwind-scan path, not in source.
 * A browser is required: horizontal overflow is a layout fact (scrollWidth vs
 * clientWidth) that jsdom cannot measure, so this lives outside the vitest
 * suite (which is `src/**​/*.test.ts`, node env).
 *
 * The webServer runs `pnpm dev` with `@flintmere/ui` pre-built by the CI step
 * (mirroring the lint workflow). That combination reproduces BOTH faults the
 * original bug hid in — the compiled `@flintmere/ui` dist AND live Tailwind CSS
 * generation — without needing the scanner's full production build env in CI.
 * Locally it reuses an already-running dev server if one is up.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
