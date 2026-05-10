/**
 * POST /api/admin/outreach/{id}/send — operator triggers a single send.
 *
 * Body: { kind: 'initial' | 'followup' }
 *
 * Wraps `lib/outreach/send.ts`. All preconditions enforced there:
 *   - target exists + has recipient_email + has score/grade/productCount
 *   - status matches the kind (queued for initial, sent for followup)
 *   - recipient not in outreach_unsubscribes
 *
 * Idempotent on (target_id, kind) — duplicate clicks return ok=true with
 * idempotentReplay=true; no double-send.
 *
 * Daily-cap is NOT enforced here — manual one-off sends happen on demand.
 * The batch script `scripts/send-outreach-batch.ts` enforces the cap.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { sendOutreach } from '@/lib/outreach/send'

const bodySchema = z.object({
  kind: z.enum(['initial', 'followup']),
  dryRun: z.boolean().optional(),
})

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(cookies, process.env)
  if (!admin) {
    return NextResponse.json({ ok: false, reason: 'unauth' }, { status: 401 })
  }

  const { id } = await context.params
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : 'invalid body' },
      { status: 400 },
    )
  }

  const result = await sendOutreach({
    targetId: id,
    kind: body.kind,
    dryRun: body.dryRun,
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 })
  }
  return NextResponse.json(result)
}
