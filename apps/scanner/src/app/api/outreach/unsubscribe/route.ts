/**
 * Public unsubscribe handler. Honours both:
 *   - GET  /api/outreach/unsubscribe?t=<id>&s=<hmac>  (link click)
 *   - POST /api/outreach/unsubscribe?t=<id>&s=<hmac>  (List-Unsubscribe-Post one-click)
 *
 * Idempotent: re-clicking returns the same acknowledgement page.
 * HMAC verification rejects guessed/forged links.
 *
 * On success: persist outreach_unsubscribes row + flip any matching
 * outreach_targets to status='unsubscribed'. Both runs through
 * `recordUnsubscribe` in `lib/outreach/db.ts` (single source of truth).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyUnsubscribeToken } from '@/lib/outreach/unsubscribe'
import { recordUnsubscribe, OUTREACH_STATUS } from '@/lib/outreach/db'

export const dynamic = 'force-dynamic'

async function handle(req: Request) {
  const url = new URL(req.url)
  const targetId = url.searchParams.get('t') ?? ''
  const sig = url.searchParams.get('s') ?? ''

  if (!targetId || !sig) {
    return ackPage('missing-params', 400)
  }

  let valid = false
  try {
    valid = verifyUnsubscribeToken(targetId, sig)
  } catch {
    return ackPage('config-error', 500)
  }
  if (!valid) {
    return ackPage('invalid-signature', 400)
  }

  const target = await prisma.outreachTarget.findUnique({ where: { id: targetId } })
  if (!target) {
    // Don't leak existence; respond with the same ack page.
    return ackPage('done', 200)
  }

  if (target.recipientEmail) {
    await recordUnsubscribe(target.recipientEmail, 'list-unsubscribe-header')
  } else {
    await prisma.outreachTarget.update({
      where: { id: targetId },
      data: { status: OUTREACH_STATUS.unsubscribed },
    })
  }

  return ackPage('done', 200)
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}

function ackPage(state: string, status: number): NextResponse {
  // Plain HTML — no client JS. Type-only register per the trust-load-bearing
  // surface memory. Bracket signature carries the brand work.
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed — Flintmere</title>
  <meta name="robots" content="noindex,nofollow">
  <style>
    body { margin:0; padding:0; background:#F7F7F4; color:#0A0A0B; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }
    main { max-width:32rem; margin:0 auto; padding:6rem 1.5rem; }
    .eyebrow { font-family:ui-monospace,Menlo,monospace; font-size:0.75rem; letter-spacing:0.14em; text-transform:uppercase; color:#8B8D95; margin:0 0 0.5rem 0; }
    h1 { font-family:ui-monospace,Menlo,monospace; font-size:clamp(2rem,4vw,3rem); margin:0 0 1.5rem 0; letter-spacing:-0.01em; line-height:1.1; }
    p { font-size:1rem; line-height:1.6; margin:0 0 1rem 0; max-width:48ch; }
    .ack { color:#0A0A0B; }
    .err { color:#B33A3A; }
    a { color:#0A0A0B; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Flintmere · Outreach</p>
    <h1>[ ${state === 'done' ? 'unsubscribed' : 'error'} ]</h1>
    <p class="${state === 'done' ? 'ack' : 'err'}">
      ${
        state === 'done'
          ? "You're off the list. We won't email you again from outreach."
          : 'That link is invalid or expired. If you intended to unsubscribe, reply to the original email with "unsubscribe" and we\'ll handle it manually.'
      }
    </p>
    <p style="font-size:0.8125rem; color:#5A5C64; margin-top:2.5rem;">
      Eazy Access Ltd (trading as Flintmere) · Companies House 13205428 · ICO ZC137268 · <a href="https://flintmere.com">flintmere.com</a>
    </p>
  </main>
</body>
</html>`

  return new NextResponse(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
