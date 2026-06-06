/**
 * Posts due SocialPost rows to X — ADR 0026. Invoked by Coolify cron
 * (hourly) with the x-cron-secret header, same contract as the other
 * cron routes. Missing X credentials is a soft state, not an error:
 * the queue holds and the daily brief tells the operator to finish
 * the one-time key setup.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { runSocialPostBatch } from '@/lib/social/queue'
import { postTweet, readXCredentials } from '@/lib/social/x-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function POST(): Promise<NextResponse> {
  const hdrs = await headers()
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'))
  if (authError) return authError

  try {
    const creds = readXCredentials()
    if (!creds) {
      return NextResponse.json(
        { event: 'social-post-cron', skipped: 'x-credentials-missing' },
        { status: 200 },
      )
    }
    const result = await runSocialPostBatch(undefined, (text) => postTweet(text, creds))
    return NextResponse.json({ event: 'social-post-cron', ...result }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      {
        event: 'social-post-cron-failed',
        code: 'internal-error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }
}
