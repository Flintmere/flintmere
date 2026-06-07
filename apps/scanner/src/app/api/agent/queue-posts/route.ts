/**
 * Agent intake: queue X posts — ADR 0026. Called by the remote weekly
 * marketing agent (which has no database access), authenticated by the
 * separately-scoped X-Agent-Secret header (see lib/cron-auth — the
 * agent's credential cannot fire /api/cron/* routes). Validation is
 * shared with the local script via lib/social/queue-posts: 280-char
 * cap, banned-phrase refusal, ISO scheduledAt, ≤10 posts per call.
 * Additionally enforces a ≥12h scheduling lead so every agent-queued
 * post appears in at least one daily brief before it can fire.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyAgentSecret } from '@/lib/cron-auth'
import { AGENT_MIN_LEAD_MS, queuePosts, queuePostsSchema } from '@/lib/social/queue-posts'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request): Promise<NextResponse> {
  const hdrs = await headers()
  const authError = verifyAgentSecret(hdrs.get('x-agent-secret'))
  if (authError) return authError

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { event: 'agent-queue-posts-rejected', code: 'invalid-json' },
      { status: 400 },
    )
  }

  const parsed = queuePostsSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      {
        event: 'agent-queue-posts-rejected',
        code: 'validation',
        issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      },
      { status: 422 },
    )
  }

  const minScheduledAt = Date.now() + AGENT_MIN_LEAD_MS
  const tooSoon = parsed.data.filter((p) => Date.parse(p.scheduledAt) < minScheduledAt)
  if (tooSoon.length > 0) {
    return NextResponse.json(
      {
        event: 'agent-queue-posts-rejected',
        code: 'lead-time',
        issues: tooSoon.map(
          (p) => `scheduledAt ${p.scheduledAt} is less than 12h out: ${p.body.slice(0, 40)}…`,
        ),
      },
      { status: 422 },
    )
  }

  try {
    const queued = await queuePosts(parsed.data)
    return NextResponse.json({ event: 'agent-queue-posts', queued }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      {
        event: 'agent-queue-posts-failed',
        code: 'internal-error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }
}
