/**
 * Agent intake: queue X posts — ADR 0026. Called by the remote weekly
 * marketing agent (which has no database access) with the same
 * X-Cron-Secret contract as the cron routes. Validation is shared with
 * the local script via lib/social/queue-posts: 280-char cap,
 * banned-phrase refusal, ISO scheduledAt, ≤10 posts per call.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { queuePosts, queuePostsSchema } from '@/lib/social/queue-posts'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request): Promise<NextResponse> {
  const hdrs = await headers()
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'))
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
