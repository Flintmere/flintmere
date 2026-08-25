import { test, expect } from '@playwright/test';

/**
 * Mobile reflow guard — WCAG 2.1 AA 1.4.10 (design-critique 2026-06-13, Thane P1).
 *
 * 1.4.10 Reflow requires content to reflow to a 320px-CSS-width viewport WITHOUT
 * two-dimensional (horizontal) scrolling. The invariant: a page must never be
 * wider than the viewport — `documentElement.scrollWidth <= clientWidth`.
 *
 * Why this exists: the homepage hero saks bracket (`[ suppressed ]`) overran the
 * viewport on phones and recurred 3+ times, because the real fault was in the
 * `@flintmere/ui` build path (stale prebuilt dist + Tailwind v4 not scanning the
 * package), not in any source file a unit test could see. Only a real browser
 * measuring layout catches this class — so it is guarded here, on the routes
 * that carry the saks cover-art bracket and the densest headline typography.
 *
 * NOTE on clipping: this guard asserts the page does not SCROLL sideways. It does
 * not assert that every word renders un-clipped — a cover whose container is
 * wider than the viewport but sits under `overflow:hidden` passes this scroll
 * check while still clipping its word (a separate information-loss concern). The
 * `/bot` cover is one such case, tracked separately.
 */

const ROUTES = ['/', '/bot', '/pricing', '/methodology', '/scan', '/catalog-letter'] as const;

// 320 is the WCAG floor; 360 + 393 are the most common Android/iPhone widths.
const WIDTHS = [320, 360, 393] as const;

const TOLERANCE_PX = 1; // sub-pixel rounding only; a real overflow is many px.

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`no horizontal overflow — ${route} @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: 'networkidle' });

      const { scrollWidth, clientWidth, widest } = await page.evaluate(() => {
        const clientW = document.documentElement.clientWidth;
        // Identify the widest offending element to make failures actionable.
        let widest: { tag: string; cls: string; text: string; right: number } | null = null;
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > clientW + 1) {
            if (!widest || r.right > widest.right) {
              widest = {
                tag: el.tagName,
                cls: (el.className || '').toString().slice(0, 60),
                text: (el.textContent || '').trim().slice(0, 30),
                right: Math.round(r.right),
              };
            }
          }
        }
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: clientW,
          widest,
        };
      });

      expect(
        scrollWidth,
        `${route} scrolls horizontally at ${width}px (scrollWidth ${scrollWidth} > clientWidth ${clientWidth}). ` +
          `Widest offender: ${widest ? `<${widest.tag} class="${widest.cls}"> "${widest.text}" right=${widest.right}` : 'none in viewport'}`,
      ).toBeLessThanOrEqual(clientWidth + TOLERANCE_PX);
    });
  }
}
