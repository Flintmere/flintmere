/**
 * Resend webhook handler. Handles bounce + complaint events so the
 * outreach pipeline stops re-sending to dead/abusing recipients and
 * the operator's deliverability stays healthy.
 *
 * Verification: Resend signs webhooks via Svix. Required headers:
 *   svix-id, svix-timestamp, svix-signature
 * Signature is HMAC-SHA256(secret, "{id}.{timestamp}.{body}"), base64.
 * Signed-payload age limit: 5 min (replay-attack mitigation).
 *
 * Idempotency: PK race on scanner_resend_processed_events.event_id
 * mirrors the Stripe webhook pattern.
 *
 * Events handled:
 *   email.bounced    → status='bounced' + record unsubscribe
 *   email.complained → status='dropped'  + record unsubscribe (firmer signal)
 * Other events are accepted + persisted for idempotency but trigger
 * no side effects.
 *
 * Set RESEND_WEBHOOK_SECRET in Coolify to the Svix signing secret from
 * the Resend dashboard. If unset, the handler 503s — fail closed so a
 * misconfigured deploy doesn't silently accept unverified events.
 */

import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/db'
import { recordUnsubscribe, OUTREACH_STATUS } from '@/lib/outreach/db'

export const dynamic = 'force-dynamic'

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60

interface ResendWebhookEvent {
  type: string
  created_at?: string
  data?: {
    email_id?: string
    to?: string[] | string
    bounce?: { message?: string; type?: string }
    [key: string]: unknown
  }
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: 'webhook secret not configured' },
      { status: 503 },
    )
  }

  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ ok: false, message: 'missing svix headers' }, { status: 401 })
  }

  const tsSeconds = Number.parseInt(svixTimestamp, 10)
  if (!Number.isFinite(tsSeconds)) {
    return NextResponse.json({ ok: false, message: 'invalid timestamp' }, { status: 401 })
  }
  const skew = Math.abs(Date.now() / 1000 - tsSeconds)
  if (skew > MAX_TIMESTAMP_SKEW_SECONDS) {
    return NextResponse.json({ ok: false, message: 'timestamp too old' }, { status: 401 })
  }

  const rawBody = await req.text()
  if (!verifySvixSignature({ secret, svixId, svixTimestamp, body: rawBody, signatureHeader: svixSignature })) {
    return NextResponse.json({ ok: false, message: 'bad signature' }, { status: 401 })
  }

  let event: ResendWebhookEvent
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent
  } catch {
    return NextResponse.json({ ok: false, message: 'invalid JSON' }, { status: 400 })
  }

  // Idempotency. Insert; unique-violation = replay.
  try {
    await prisma.resendProcessedEvent.create({
      data: { eventId: svixId, eventType: event.type ?? 'unknown' },
    })
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ ok: true, replay: true })
    }
    throw err
  }

  // Side effects. Only bounce + complaint are handled today.
  const recipientEmails = extractRecipients(event)
  switch (event.type) {
    case 'email.bounced': {
      for (const email of recipientEmails) {
        await flipTargetByEmail(email, OUTREACH_STATUS.bounced, 'bounce')
      }
      break
    }
    case 'email.complained': {
      for (const email of recipientEmails) {
        await flipTargetByEmail(email, OUTREACH_STATUS.dropped, 'complaint')
        await recordUnsubscribe(email, 'list-unsubscribe-header')
      }
      break
    }
    default: {
      // Logged via the processed-events row; no side effect required.
      break
    }
  }

  return NextResponse.json({ ok: true })
}

function verifySvixSignature(args: {
  secret: string
  svixId: string
  svixTimestamp: string
  body: string
  signatureHeader: string
}): boolean {
  // Resend uses Svix; the secret comes from the dashboard prefixed with
  // `whsec_`. Strip the prefix before base64-decoding.
  const rawSecret = args.secret.startsWith('whsec_') ? args.secret.slice('whsec_'.length) : args.secret
  let keyBuf: Buffer
  try {
    keyBuf = Buffer.from(rawSecret, 'base64')
  } catch {
    return false
  }
  const signed = `${args.svixId}.${args.svixTimestamp}.${args.body}`
  const expected = createHmac('sha256', keyBuf).update(signed).digest('base64')

  // Header format: "v1,<sig> v1,<sig2>" — space-separated, multiple sigs allowed during rotation.
  const parts = args.signatureHeader.split(/\s+/)
  for (const part of parts) {
    const [version, sig] = part.split(',')
    if (version !== 'v1' || !sig) continue
    if (sig.length !== expected.length) continue
    if (timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))) {
      return true
    }
  }
  return false
}

function extractRecipients(event: ResendWebhookEvent): string[] {
  const to = event.data?.to
  if (!to) return []
  const list = Array.isArray(to) ? to : [to]
  return list
    .map((s) => s.toLowerCase().trim())
    .filter((s) => s.length > 0)
}

async function flipTargetByEmail(
  email: string,
  newStatus: string,
  reason: string,
): Promise<void> {
  await prisma.outreachTarget.updateMany({
    where: { recipientEmail: email },
    data: {
      status: newStatus,
      droppedReason: reason,
    },
  })
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  )
}
