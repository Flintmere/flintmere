import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Pins the scan-scope disclosure on the persisted, shareable /score/[shop]
 * page (Task 7 follow-up fix — the results page and report email got the
 * disclosure; this public page did not, and its renormalised pillar
 * percentages (see page.tsx's `pct` calc) can read as full-catalog
 * strength when only a sample's barcodes were ever read).
 *
 * `ScorePage` is a plain async function (no client-runtime magic), so it
 * can be called directly and awaited — the result is the constructed
 * React element tree, not rendered HTML. Walking `.props.children` finds
 * text nodes without executing any child component (`@flintmere/ui`
 * primitives included), so no DOM/jsdom renderer is needed. No existing
 * test file covered this page before this change; colocated here per the
 * app directory's page-adjacent test convention (see e.g.
 * `apps/scanner/src/app/page.hero-fold.test.ts`).
 */

interface ScanRow {
  score: number | null;
  grade: string | null;
  shopUrl: string;
  scoreJson: unknown;
  completedAt: Date | null;
  publicPageAt: Date | null;
  publishGmcOnPublicPage: boolean;
}

function baseScan(scoreJson: Record<string, unknown>): ScanRow {
  return {
    score: 82,
    grade: 'B',
    shopUrl: 'https://widgetco.example.com',
    scoreJson,
    completedAt: new Date('2026-09-01T00:00:00Z'),
    publicPageAt: new Date('2026-09-01T00:00:00Z'),
    publishGmcOnPublicPage: false,
  };
}

function onePillar() {
  return [
    { pillar: 'identifiers', score: 20, maxScore: 25, locked: false, lockedReason: null },
  ];
}

function collectText(node: unknown, acc: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === 'boolean') return acc;
  if (typeof node === 'string' || typeof node === 'number') {
    acc.push(String(node));
    return acc;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, acc);
    return acc;
  }
  if (typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
    collectText((node as { props?: { children?: unknown } }).props?.children, acc);
    return acc;
  }
  return acc;
}

async function renderScorePage(scan: ScanRow | null): Promise<string[]> {
  vi.resetModules();
  const findFirst = vi.fn().mockResolvedValue(scan);
  vi.doMock('@/lib/db', () => ({ prisma: { scan: { findFirst } } }));
  const { default: ScorePage } = await import('./page');
  const element = await ScorePage({
    params: Promise.resolve({ shop: 'widgetco.example.com' }),
  });
  return collectText(element);
}

describe('/score/[shop] scan-scope disclosure', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/db');
  });

  it('renders no scope line for a scan persisted before the sampling-honesty fields shipped (absent)', async () => {
    const scan = baseScan({
      productCount: 120,
      pillars: onePillar(),
      // No `truncated` / `actualProductCount` / `barcodesRead` keys at
      // all — the pre-fields shape. Rendering "0" or guessing here would
      // be a new false claim, not a fix.
    });

    const texts = await renderScorePage(scan);

    expect(texts.some((t) => /^Scanned [\d,]+/.test(t))).toBe(false);
    // Sanity: the pillar section itself still rendered (so the assertion
    // above is "no scope line", not "nothing rendered").
    expect(texts).toContain('Product IDs');
  });

  it('states "barcodes not read" when barcodesRead is 0', async () => {
    const scan = baseScan({
      productCount: 120,
      pillars: onePillar(),
      truncated: false,
      actualProductCount: 120,
      barcodesRead: 0,
    });

    const texts = await renderScorePage(scan);

    expect(texts).toContain('Scanned 120 products · barcodes not read · 60 seconds');
  });

  it('states the barcode count when it is smaller than the sampled count', async () => {
    const scan = baseScan({
      productCount: 1000,
      pillars: onePillar(),
      truncated: true,
      actualProductCount: 4312,
      barcodesRead: 50,
    });

    const texts = await renderScorePage(scan);

    expect(texts).toContain(
      'Scanned 1,000 of 4,312 products · barcodes on 50 · 60 seconds',
    );
  });
});

/**
 * The pillar percentages themselves. This page always divided by `maxScore`
 * (`pillarPercent`, since consolidated onto the shared helper); Results.tsx
 * and report-email.ts printed the raw score, so the same persisted scan was
 * reported "Product IDs 80%" here and "25%" in the merchant's email. The
 * fixture's `{ score: 20, maxScore: 25 }` is the shape that only exists
 * because the barcode pass read too little to speak.
 */
describe('/score/[shop] pillar percentages', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/db');
  });

  it('renders the percentage of what the pillar could assess, not the raw score', async () => {
    const texts = await renderScorePage(
      baseScan({ productCount: 120, pillars: onePillar() }),
    );

    expect(texts).toContain('Product IDs');
    expect(texts).toContain('80');
    expect(texts).not.toContain('20');
  });

  it('renders 0, never NaN, when the pillar assessed nothing', async () => {
    const texts = await renderScorePage(
      baseScan({
        productCount: 120,
        pillars: [
          { pillar: 'identifiers', score: 0, maxScore: 0, locked: false, lockedReason: null },
        ],
      }),
    );

    expect(texts).toContain('0');
    expect(texts.some((t) => t.includes('NaN'))).toBe(false);
  });
});
