/**
 * Agent intake: stage an outreach batch — ADR 0026. Called by the
 * remote weekly marketing agent (no database access), authenticated by
 * the separately-scoped X-Agent-Secret header (see lib/cron-auth — the
 * agent's credential cannot fire /api/cron/* routes; staged batches
 * cannot send without the operator's approve click). Staging logic is shared
 * with the local script via lib/outreach/stage-batch. The response
 * carries the approve URL so the agent can include it in its run
 * summary; the daily brief re-surfaces it until clicked.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAgentSecret } from '@/lib/cron-auth'
import { scannerBaseUrl } from '@/lib/host-url'
import { buildApproveUrl } from '@/lib/outreach/approval'
import {
  STAGE_LIMIT_MAX,
  STAGE_LIMIT_MIN,
  stageOutreachBatch,
} from '@/lib/outreach/stage-batch'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const bodySchema = z.object({
  limit: z.number().int().min(STAGE_LIMIT_MIN).max(STAGE_LIMIT_MAX).default(20),
})

export async function POST(req: Request): Promise<NextResponse> {
  const hdrs = await headers()
  const authError = verifyAgentSecret(hdrs.get('x-agent-secret'))
  if (authError) return authError

  // Empty body is fine — default limit applies.
  let raw: unknown = {}
  try {
    const text = await req.text()
    if (text.trim().length > 0) raw = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { event: 'agent-stage-outreach-rejected', code: 'invalid-json' },
      { status: 400 },
    )
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      {
        event: 'agent-stage-outreach-rejected',
        code: 'validation',
        issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      },
      { status: 422 },
    )
  }

  try {
    const result = await stageOutreachBatch(parsed.data.limit)
    const secret = process.env.ADMIN_SESSION_SECRET
    const baseUrl = scannerBaseUrl()
    const approveUrl =
      result.batchId && secret ? buildApproveUrl(result.batchId, secret, baseUrl) : null
    return NextResponse.json(
      { event: 'agent-stage-outreach', ...result, approveUrl },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      {
        event: 'agent-stage-outreach-failed',
        code: 'internal-error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }
}
