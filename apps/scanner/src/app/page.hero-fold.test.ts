import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Regression guard for the fold-locked-hero clipping family — fourth
// incident 2026-06-07 (operator screenshot, 16:29): at viewport heights
// below ~800px the homepage hero's text stack (5-line clamp h1 + lede +
// CTA + paddings) exceeded the section height. Because the section was
// `lg:h-screen` (hard height lock) AND `overflow-hidden`, the primary
// "Run the scan" CTA was amputated — not below the fold, unreachable at
// any scroll position. Playwright repro at 1280×680: CTA bottom 88px past
// the section edge, 165px total overflow.
//
// Prior incidents in the family: 2026-05-02, 2026-05-11 bracket floors,
// 2026-06-06 connect-hero (PR #65). Remedy class is always the same:
// fluid type inside a hard-clipped fold-locked container must either
// height-cap the type or let the container grow.
//
// Invariant: a section that hard-clips (`overflow-hidden`) must not hard-
// lock its height to the viewport on desktop. `lg:min-h-screen` keeps the
// hero fold-perfect when content fits and lets it grow when it doesn't.
//
// This is a source-level invariant test (layout is not measurable in
// jsdom); the behavioural verification lives in the PR notes.

describe('homepage hero fold lock (clipping regression)', () => {
  const source = readFileSync(join(__dirname, 'page.tsx'), 'utf8');

  it('hero section does not hard-lock desktop height with lg:h-screen', () => {
    // Word-boundary match: `lg:h-screen` must be gone; `lg:min-h-screen`
    // is the sanctioned replacement and must not satisfy the negative.
    expect(source).not.toMatch(/(?<!min-)\blg:h-screen\b/);
  });

  it('hero section grows instead of clipping (lg:min-h-screen present)', () => {
    expect(source).toMatch(/\blg:min-h-screen\b/);
  });
});
