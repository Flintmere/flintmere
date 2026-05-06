import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashIp } from '@/lib/hash';
import { checkScanRateLimit } from '@/lib/rate-limit';
import { runScanForShop, type ScanSource } from '@/lib/run-scan';
import { verifyTurnstile } from '@/lib/turnstile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BodySchema = z.object({
  shopUrl: z.string().min(1).max(512),
  vertical: z.string().min(1).max(64).optional(),
  // Cloudflare Turnstile token from the public form. Optional in the
  // schema so operator-driven bot scans (FlintmereBot UA) and dev/test
  // round-trip without keys; verifyTurnstile bypasses below.
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
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
  const source: ScanSource = userAgent?.includes('FlintmereBot') ? 'bot' : 'user';

  const normalisedDomain = body.shopUrl.toLowerCase().trim();

  // Turnstile verification — same gate as the rate limit: bot scans
  // (operator-curated FlintmereBot UA) skip the human-form CAPTCHA.
  if (source === 'user') {
    const turnstile = await verifyTurnstile(body.turnstileToken, ip);
    if (!turnstile.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: 'turnstile-failed',
          reason: turnstile.reason,
          message:
            'Verification failed. Please refresh the page and try again.',
        },
        { status: 403 },
      );
    }
  }

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

  const result = await runScanForShop({
    shopUrl: body.shopUrl,
    source,
    vertical: body.vertical ?? null,
    ipHash: hashIp(ip),
    userAgent,
  });

  if (result.status === 'failed') {
    const userMessage =
      result.errorCode === 'not-shopify'
        ? "That doesn't look like a public Shopify store. Check the URL."
        : result.errorCode === 'timeout'
          ? 'The store took too long to respond. Try again in a moment.'
          : result.errorCode === 'invalid-url'
            ? 'Please enter a valid store URL.'
            : result.errorCode === 'empty-catalog'
              ? 'The store is reachable but has no public products.'
              : 'We could not reach the store. Try again or check the URL.';

    return NextResponse.json(
      { ok: false, code: result.errorCode, message: userMessage },
      { status: result.errorCode === 'invalid-url' ? 400 : 502 },
    );
  }

  return NextResponse.json(
    {
      id: result.scanId,
      shopDomain: result.shopDomain,
      score: result.score,
      grade: result.grade,
      gtinlessCeiling: result.gtinlessCeiling,
      productCount: result.productCount,
      variantCount: result.variantCount,
      // Sampling-honesty fields per BUSINESS.md:19 council ruling 2026-04-27.
      // `truncated` flags when the per-scan page cap was hit; `actualProductCount`
      // is the merchant's true catalog total (null when /products/count.json blocked).
      truncated: result.truncated,
      actualProductCount: result.actualProductCount,
      catalogSummary: result.catalogSummary,
      suppressionEstimate: result.suppressionEstimate,
      scaledSuppressionEstimate: result.scaledSuppressionEstimate,
      aovEstimate: result.aovEstimate,
      revenueEstimate: result.revenueEstimate,
      scaledRevenueEstimate: result.scaledRevenueEstimate,
      pillars: result.pillars,
      issues: result.issues.slice(0, 10),
    },
    { status: 200 },
  );
}
