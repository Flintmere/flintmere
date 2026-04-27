import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { estimateAov, estimateSuppression, scoreCatalog } from '@flintmere/scoring';
import { prisma } from '@/lib/db';
import { fetchCrawlability } from '@/lib/crawlability-fetcher';
import { fetchCatalog, ShopifyFetchError } from '@/lib/shopify-fetcher';
import { hashIp } from '@/lib/hash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BodySchema = z.object({
  shopUrl: z.string().min(1).max(512),
  vertical: z.string().min(1).max(64).optional(),
});

export async function POST(req: NextRequest) {
  const startedAt = new Date();

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, code: 'bad-request', message: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;
  const userAgent = req.headers.get('user-agent') ?? null;
  const source = userAgent?.includes('FlintmereBot') ? 'bot' : 'user';
  // Only persist the vertical hint on bot scans — the field is meant
  // for operator-curated aggregate data, not user-supplied free text.
  const vertical = source === 'bot' ? (body.vertical ?? null) : null;

  const scan = await prisma.scan.create({
    data: {
      shopUrl: body.shopUrl,
      normalisedDomain: body.shopUrl.toLowerCase().trim(),
      status: 'running',
      source,
      vertical,
      ipHash: hashIp(ip),
      userAgent,
      startedAt,
    },
  });

  try {
    const catalog = await fetchCatalog(body.shopUrl, { maxPages: 4 });
    const crawlability = await fetchCrawlability(catalog.shopDomain).catch(
      () => null,
    );
    const score = scoreCatalog(
      catalog,
      crawlability ? { crawlability } : {},
    );
    // Dead-inventory wedge — v2 strategic report §7. Computed from the
    // already-loaded catalog; no new fetches, no LLM, no OAuth.
    const suppressionEstimate = estimateSuppression(catalog);
    // AOV inference (wedge finish arc) — composes with the suppression
    // estimate to produce an annual-demand-at-risk band. Returns null for
    // non-food catalogs and below-sample-floor catalogs (food-first at
    // v1 per requirement Q1.1).
    //
    // OQ-1: persistence gap. `aovEstimate` and `revenueEstimate` are
    // surfaced on the scan response but NOT written to `scoreJson`. They
    // therefore won't render on /score/[shop] for historical scans
    // without a future migration that re-computes from the persisted
    // catalog or back-fills these fields.
    const aovResult = estimateAov(catalog, suppressionEstimate);

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'complete',
        normalisedDomain: catalog.shopDomain,
        score: score.score,
        grade: score.grade,
        productCount: score.productCount,
        variantCount: score.variantCount,
        scoreJson: score as unknown as object,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        id: scan.id,
        shopDomain: score.shopDomain,
        score: score.score,
        grade: score.grade,
        gtinlessCeiling: score.gtinlessCeiling,
        productCount: score.productCount,
        variantCount: score.variantCount,
        suppressionEstimate,
        aovEstimate: aovResult?.aovEstimate ?? null,
        revenueEstimate: aovResult?.revenueEstimate ?? null,
        pillars: score.pillars.map((p) => ({
          pillar: p.pillar,
          score: p.score,
          maxScore: p.maxScore,
          locked: p.locked,
          lockedReason: p.lockedReason,
        })),
        issues: score.issues.slice(0, 10),
      },
      { status: 200 },
    );
  } catch (err) {
    const errorCode =
      err instanceof ShopifyFetchError ? err.code : 'fetch-failed';
    const message =
      err instanceof Error ? err.message : 'Unexpected error during scan.';

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'failed',
        errorCode,
        errorMessage: message,
        completedAt: new Date(),
      },
    });

    const userMessage =
      errorCode === 'not-shopify'
        ? "That doesn't look like a public Shopify store. Check the URL."
        : errorCode === 'timeout'
          ? 'The store took too long to respond. Try again in a moment.'
          : errorCode === 'invalid-url'
            ? 'Please enter a valid store URL.'
            : errorCode === 'empty-catalog'
              ? 'The store is reachable but has no public products.'
              : 'We could not reach the store. Try again or check the URL.';

    return NextResponse.json(
      { ok: false, code: errorCode, message: userMessage },
      { status: errorCode === 'invalid-url' ? 400 : 502 },
    );
  }
}
