/* eslint-disable no-console */
/**
 * Batch sender for the cold-email outreach pipeline.
 *
 * Picks up to today's daily-cap-budget targets (per lib/outreach/cap.ts)
 * that match the requested kind ('initial' or 'followup') and dispatches
 * them through lib/outreach/send.ts with PACE_MS spacing between sends.
 *
 * Env vars (all optional):
 *   KIND               'initial' | 'followup'   default: 'initial'
 *   DRY_RUN            'true' to render without sending; default: false
 *   PACE_MS            ms between sends (rate-limit Resend API);
 *                      default 60_000 (60s — kindness contract + Resend politeness)
 *   LIMIT              hard limit on this run; default = today's daily cap
 *                      remaining (cap minus what's already been sent today)
 *
 * Usage:
 *   pnpm tsx scripts/send-outreach-batch.ts                      # initial sends
 *   KIND=followup pnpm tsx scripts/send-outreach-batch.ts        # follow-ups
 *   DRY_RUN=true pnpm tsx scripts/send-outreach-batch.ts         # preview
 *   LIMIT=1 DRY_RUN=true pnpm tsx scripts/send-outreach-batch.ts # smoke
 */

import { prisma } from '../src/lib/db'
import { sendOutreach } from '../src/lib/outreach/send'
import { dailyCap } from '../src/lib/outreach/cap'
import { findEligibleTargets, countSentSince } from '../src/lib/outreach/db'

const KIND = (process.env.KIND ?? 'initial') as 'initial' | 'followup'
const DRY_RUN = process.env.DRY_RUN === 'true'
const PACE_MS = Number.parseInt(process.env.PACE_MS ?? '60000', 10)
const LIMIT_OVERRIDE = process.env.LIMIT ? Number.parseInt(process.env.LIMIT, 10) : null

async function main(): Promise<void> {
  if (KIND !== 'initial' && KIND !== 'followup') {
    console.error(`KIND must be 'initial' or 'followup'; got '${KIND}'`)
    process.exit(2)
  }
  if (!Number.isFinite(PACE_MS) || PACE_MS < 0) {
    console.error(`PACE_MS must be a non-negative integer; got '${process.env.PACE_MS}'`)
    process.exit(2)
  }

  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const sentToday = await countSentSince(startOfDay)
  const cap = dailyCap()
  const remaining = Math.max(0, cap - sentToday)
  const limit = LIMIT_OVERRIDE !== null ? Math.min(LIMIT_OVERRIDE, remaining) : remaining

  console.log(
    JSON.stringify({
      event: 'outreach-batch.start',
      kind: KIND,
      dryRun: DRY_RUN,
      paceMs: PACE_MS,
      cap,
      sentToday,
      remaining,
      limit,
    }),
  )

  if (limit === 0) {
    console.log(JSON.stringify({ event: 'outreach-batch.no-budget', cap, sentToday }))
    await prisma.$disconnect()
    return
  }

  const targets = await findEligibleTargets(KIND, limit)
  if (targets.length === 0) {
    console.log(JSON.stringify({ event: 'outreach-batch.no-eligible-targets', kind: KIND }))
    await prisma.$disconnect()
    return
  }

  let okCount = 0
  let failCount = 0
  let replayCount = 0

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i]
    try {
      const result = await sendOutreach({
        targetId: target.id,
        kind: KIND,
        dryRun: DRY_RUN,
      })
      if (result.ok) {
        okCount += 1
        if (result.idempotentReplay) replayCount += 1
        console.log(
          JSON.stringify({
            event: 'outreach-batch.sent',
            targetId: target.id,
            shopDomain: target.shopDomain,
            recipientEmail: target.recipientEmail,
            resendMessageId: result.resendMessageId,
            replay: result.idempotentReplay,
            dryRun: DRY_RUN,
          }),
        )
      } else {
        failCount += 1
        console.error(
          JSON.stringify({
            event: 'outreach-batch.failed',
            targetId: target.id,
            shopDomain: target.shopDomain,
            recipientEmail: target.recipientEmail,
            reason: result.reason,
          }),
        )
      }
    } catch (err) {
      failCount += 1
      console.error(
        JSON.stringify({
          event: 'outreach-batch.exception',
          targetId: target.id,
          shopDomain: target.shopDomain,
          message: err instanceof Error ? err.message : String(err),
        }),
      )
    }
    if (i < targets.length - 1 && PACE_MS > 0) {
      await new Promise((r) => setTimeout(r, PACE_MS))
    }
  }

  console.log(
    JSON.stringify({
      event: 'outreach-batch.done',
      kind: KIND,
      attempted: targets.length,
      ok: okCount,
      replay: replayCount,
      failed: failCount,
      dryRun: DRY_RUN,
    }),
  )
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(
    JSON.stringify({ event: 'outreach-batch.fatal', message: err instanceof Error ? err.message : String(err) }),
  )
  process.exit(1)
})
