import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import {
  ADMIN_COOKIE_NAME,
  requireAdmin,
  verifyAdminSmokeToken,
} from '@/lib/admin-auth'
import {
  AuditDraftGenerationError,
  generateAuditDraftForShop,
} from '@/lib/audit-draft/generate'
import { averageConfidence } from '@/lib/audit-draft/markdown-export'
import { checkAuditDraftGenerateRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// LLM call budget: scan resolution + catalog fetch + Gemini 2.5 Pro p95
// (15–25s) + one-shot repair retry. 180s gives headroom without enabling
// runaway cost.
export const maxDuration = 180

const BodySchema = z.object({
  shopUrl: z.string().min(4).max(512),
  bandSlug: z.enum(['band-1', 'band-2', 'band-3']),
  vertical: z
    .enum(['food', 'beauty', 'apparel', 'home', 'electronics', 'other'])
    .optional(),
})

/**
 * POST /api/admin/audit-draft/generate — operator-only.
 *
 * Flow: feature flag → admin cookie → per-cookie rate limit → body
 * parse → orchestrator (`generateAuditDraftForShop`) → JSON response.
 *
 * The flag check fires first and returns a real 404 (not 403) so a
 * disabled deployment doesn't leak the route's existence. Auth comes
 * before rate limit so an unauthenticated flood is rejected by 401
 * without consuming a token (per `security-posture.md`: 401 is cheaper
 * to serve than a token bucket entry per IP).
 *
 * Band 3 is rejected at the schema layer alongside band-1 / band-2 only
 * for now — bespoke quoting routes through the public /contact path,
 * not audit-assist.
 */
export async function POST(req: NextRequest) {
  if (process.env.FEATURE_AUDIT_ASSIST !== 'true') {
    return NextResponse.json(
      { ok: false, code: 'feature-off', message: 'Not found.' },
      { status: 404 },
    )
  }

  const admin =
    verifyAdminSmokeToken(req.headers, process.env) ??
    (await requireAdmin(cookies, process.env))
  if (!admin) {
    return NextResponse.json(
      { ok: false, code: 'unauth', message: 'Sign in to continue.' },
      { status: 401 },
    )
  }

  // Rate limit by cookie value — single-admin-cookie at v0, but the key
  // is right when multi-admin auth lands (each operator gets their own
  // bucket). Smoke-token callers fall back to the admin email as the key.
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? admin.email
  const rl = checkAuditDraftGenerateRateLimit({ cookieValue })
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'rate-limited',
        message: 'Too many generations. Try again in a minute.',
        retryAfterSec: rl.retryAfterSec,
      },
      { status: 429 },
    )
  }

  let body: z.infer<typeof BodySchema>
  try {
    const json = await req.json()
    body = BodySchema.parse(json)
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        code: 'bad-request',
        message: 'Check the shop URL and band selection.',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    )
  }

  try {
    const draft = await generateAuditDraftForShop({
      shopUrl: body.shopUrl,
      bandSlug: body.bandSlug,
      vertical: body.vertical,
    })
    const confidenceAvg = averageConfidence(draft.rawDraft)
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        event: 'audit-draft.generated',
        draftId: draft.id,
        shop: draft.shop,
        bandSlug: draft.bandSlug,
        modelUsed: draft.modelUsed,
        latencyMs: draft.latencyMs,
        confidenceAvg,
      }),
    )
    // Response includes the props the client needs to fire the
    // PostHog `audit_draft_generated` event without a follow-up
    // round-trip.
    return NextResponse.json(
      {
        ok: true,
        draftId: draft.id,
        telemetry: {
          shop: draft.shop,
          bandSlug: draft.bandSlug,
          model: draft.modelUsed,
          latencyMs: draft.latencyMs,
          pillarCount: draft.rawDraft.pillarFindings.length,
          confidenceAvg,
        },
      },
      { status: 200 },
    )
  } catch (err) {
    if (err instanceof AuditDraftGenerationError) {
      return mapGenerationError(err)
    }
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'audit-draft.unhandled-error',
        error: err instanceof Error ? err.message : String(err),
      }),
    )
    // Don't echo err.message into the response body — unhandled errors
    // can carry stack frames, DB connection strings, or prompt fragments.
    // Server-side log above retains the full context.
    return NextResponse.json(
      {
        ok: false,
        code: 'internal-error',
        message: 'Audit-assist failed. Try again.',
        detail: 'Internal error — see server logs.',
      },
      { status: 500 },
    )
  }
}

function mapGenerationError(err: AuditDraftGenerationError): NextResponse {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      event: 'audit-draft.generation-error',
      code: err.code,
      message: err.message,
    }),
  )
  // Admin-only route, but defense-in-depth: vertex-error + llm-schema-fail
  // carry Vertex error text that can echo prompt fragments (merchant
  // catalog data + email metadata). For those two codes, redact the
  // detail and rely on the structured server log above. Other codes
  // (config / scan-shape / catalog-fetch) carry low-PII operator-useful
  // detail and stay verbose so smoke callers can diagnose without
  // docker-logs round-trips.
  const detail = err.message
  const safeDetail = 'See server logs for full error.'
  switch (err.code) {
    case 'config-missing':
      return NextResponse.json(
        {
          ok: false,
          code: 'config-missing',
          message:
            'Audit-assist is misconfigured. The operator has been alerted.',
          detail,
        },
        { status: 503 },
      )
    case 'no-recent-scan':
      return NextResponse.json(
        {
          ok: false,
          code: 'no-recent-scan',
          message:
            'No recent public scan for this shop. Run /scan first, then retry.',
          detail,
        },
        { status: 409 },
      )
    case 'scan-incomplete':
      return NextResponse.json(
        {
          ok: false,
          code: 'scan-incomplete',
          message: 'The latest scan for this shop is missing pillar data.',
          detail,
        },
        { status: 409 },
      )
    case 'catalog-unfetchable':
      return NextResponse.json(
        {
          ok: false,
          code: 'catalog-unfetchable',
          message: 'Could not fetch catalog from this shop.',
          detail,
        },
        { status: 503 },
      )
    case 'vertex-error':
      return NextResponse.json(
        {
          ok: false,
          code: 'vertex-error',
          message: 'LLM provider rejected the request.',
          detail: safeDetail,
        },
        { status: 502 },
      )
    case 'llm-schema-fail':
      return NextResponse.json(
        {
          ok: false,
          code: 'llm-schema-fail',
          message: 'LLM produced malformed output twice. Check the prompt.',
          detail: safeDetail,
        },
        { status: 502 },
      )
    case 'llm-unavailable':
    default:
      return NextResponse.json(
        {
          ok: false,
          code: 'llm-unavailable',
          message: 'Audit-assist LLM is temporarily unavailable.',
          detail,
        },
        { status: 503 },
      )
  }
}
