/**
 * Posts due SocialPost rows to their channel (X, Bluesky) — ADR 0026.
 * Invoked by Coolify cron (hourly) with the x-cron-secret header, same
 * contract as the other cron routes. A channel with missing credentials
 * is a soft state, not an error: its rows hold queued and the daily brief
 * tells the operator to finish the one-time key setup.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { runSocialPostBatch, type Poster } from '@/lib/social/queue'
import { postTweet, readXCredentials } from '@/lib/social/x-client'
import { postSkeet, readBlueskyCredentials } from '@/lib/social/bluesky-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function POST(): Promise<NextResponse> {
  const hdrs = await headers()
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'))
  if (authError) return authError

  try {
    // Build the channel allowlist from configured credentials. A channel
    // with no creds is simply not run — its queued rows hold rather than
    // failing terminally — so shipping before keys are set is safe.
    const xCreds = readXCredentials()
    const blueskyCreds = readBlueskyCredentials()
    const channels: string[] = []
    if (xCreds) channels.push('x')
    if (blueskyCreds) channels.push('bluesky')
    if (channels.length === 0) {
      return NextResponse.json(
        { event: 'social-post-cron', skipped: 'no-channel-credentials' },
        { status: 200 },
      )
    }
    const poster: Poster = (channel, text, images) => {
      if (channel === 'bluesky' && blueskyCreds) return postSkeet(text, blueskyCreds, fetch, images)
      if (channel === 'x' && xCreds) return postTweet(text, xCreds, fetch, images)
      return Promise.resolve({ ok: false, status: 0, error: `no credentials for channel ${channel}` })
    }
    const result = await runSocialPostBatch(undefined, poster, new Date(), channels)
    return NextResponse.json({ event: 'social-post-cron', channels, ...result }, { status: 200 })
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
