import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { estimateAov, estimateSuppression, scoreCatalog } from '@flintmere/scoring';
import { prisma } from '@/lib/db';
import { fetchCrawlability } from '@/lib/crawlability-fetcher';
import { fetchCatalog, ShopifyFetchError } from '@/lib/shopify-fetcher';
import { hashIp } from '@/lib/hash';
import { checkScanRateLimit } from '@/lib/rate-limit';

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

  const normalisedDomain = body.shopUrl.toLowerCase().trim();

  // Bot scans bypass the rate limit — they're already scheduled by the
  // operator with their own concurrency floor. Human submissions go through
  // both the per-IP bucket and the per-domain dedupe TTL.
  // Dev bypass: limiter is anti-abuse, not anti-self. Local testing of the
  // same shop in tight windows is normal; only enforce in production.
  if (source === 'user' && process.env.NODE_ENV === 'production') {
    const limit = checkScanRateLimit({ ip, normalisedDomain });
    if (!limit.ok) {
      const message =
        limit.reason === 'domain'
          ? 'This shop was scanned moments ago. Try again shortly.'
          : 'Too many scans from this connection. Try again shortly.';
      return NextResponse.json(
        { ok: false, code: 'rate-limited', message },
        {
          status: 429,
          headers: { 'retry-after': String(limit.retryAfterSec) },
        },
      );
    }
  }

  const scan = await prisma.scan.create({
    data: {
      shopUrl: body.shopUrl,
      normalisedDomain,
      status: 'running',
      source,
      vertical,
      ipHash: hashIp(ip),
      userAgent,
      startedAt,
    },
  });

  try {
    const fetched = await fetchCatalog(body.shopUrl, { maxPages: 4 });
    const { catalog, truncated, actualProductCount } = fetched;
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
    const aovResult = estimateAov(catalog, suppressionEstimate);

    // Ratio-scaling for truncated catalogs — projects sample-derived counts
    // up to the merchant's true catalog size so the displayed £-figure
    // reflects their REAL exposure, not the sampled-1000 exposure. Per
    // BUSINESS.md:19 council ruling 2026-04-27 #2: emit scaled estimates
    // alongside raw so the UI can render the projection with disclosure.
    const sampledCount = catalog.products.length;
    const scaleRatio =
      truncated && actualProductCount !== null && actualProductCount > sampledCount
        ? actualProductCount / sampledCount
        : null;

    const scaledSuppressionEstimate =
      scaleRatio !== null
        ? {
            low: Math.ceil(suppressionEstimate.low * scaleRatio),
            high: Math.ceil(suppressionEstimate.high * scaleRatio),
            signals: {
              missingGtin: Math.ceil(suppressionEstimate.signals.missingGtin * scaleRatio),
              ambiguousAllergen: Math.ceil(
                suppressionEstimate.signals.ambiguousAllergen * scaleRatio,
              ),
              missingGmcCategory: Math.ceil(
                suppressionEstimate.signals.missingGmcCategory * scaleRatio,
              ),
            },
          }
        : null;

    const scaledRevenueEstimate =
      scaleRatio !== null && aovResult?.revenueEstimate
        ? {
            low: Math.floor(aovResult.revenueEstimate.low * scaleRatio),
            high: Math.ceil(aovResult.revenueEstimate.high * scaleRatio),
            aovEstimate: aovResult.revenueEstimate.aovEstimate,
          }
        : null;

    // Persist the projection envelope alongside the score so /score/[shop]
    // can render historical scans without recomputing from the catalog.
    // The wedge fields (truncated, actualProductCount, suppressionEstimate,
    // aovEstimate, revenueEstimate, scaled*) live on the persisted JSON,
    // not on dedicated columns — they're consumer-side projections, not
    // queryable signals.
    const persistedScoreJson = {
      ...(score as unknown as Record<string, unknown>),
      truncated,
      actualProductCount,
      suppressionEstimate,
      scaledSuppressionEstimate,
      aovEstimate: aovResult?.aovEstimate ?? null,
      revenueEstimate: aovResult?.revenueEstimate ?? null,
      scaledRevenueEstimate,
    };

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'complete',
        normalisedDomain: catalog.shopDomain,
        score: score.score,
        grade: score.grade,
        productCount: score.productCount,
        variantCount: score.variantCount,
        scoreJson: persistedScoreJson as unknown as object,
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
        // Sampling-honesty fields per BUSINESS.md:19 council ruling 2026-04-27.
        // `truncated` flags when the per-scan page cap was hit; `actualProductCount`
        // is the merchant's true catalog total (null when /products/count.json blocked).
        // UI uses these to render "Sampled N of M products" not "N products".
        truncated,
        actualProductCount,
        suppressionEstimate,
        // When truncated, the scaled estimates project sample counts up to
        // the merchant's full catalog. UI displays scaled when present and
        // falls back to raw otherwise. Both surfaces ship with disclosure.
        scaledSuppressionEstimate,
        aovEstimate: aovResult?.aovEstimate ?? null,
        revenueEstimate: aovResult?.revenueEstimate ?? null,
        scaledRevenueEstimate,
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
