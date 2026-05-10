/**
 * PATCH /api/admin/outreach/{id} — operator updates a single target.
 *
 * Allowed mutations (the union represents the admin-UI's intent surface):
 *   - recipientEmail (string|null) → enrichment + clearing
 *   - firstName     (string|null)  → enrichment + clearing
 *   - subjectVariant ('A'|'B')     → A/B subject toggle before queue
 *   - status (one of OUTREACH_STATUS) → operator advances or unsticks
 *   - droppedReason (string)       → operator-supplied note when dropping
 *
 * Status transitions are NOT enforced server-side here — operator can move
 * any status to any status. The send orchestrator (lib/outreach/send.ts)
 * enforces the lifecycle invariant on send paths; this endpoint is the
 * operator's escape hatch.
 *
 * Setting status='unsubscribed' AND recipientEmail present also writes
 * an outreach_unsubscribes row so future sends to that email skip too.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { requireAdmin, verifyAdminSmokeToken } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { recordUnsubscribe, OUTREACH_STATUS } from '@/lib/outreach/db'

const ALLOWED_STATUSES = new Set<string>(Object.values(OUTREACH_STATUS))

const bodySchema = z.object({
  recipientEmail: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  subjectVariant: z.enum(['A', 'B']).optional(),
  status: z
    .string()
    .refine((s) => ALLOWED_STATUSES.has(s), { message: 'invalid status' })
    .optional(),
  droppedReason: z.string().nullable().optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin =
    verifyAdminSmokeToken(req.headers, process.env) ??
    (await requireAdmin(cookies, process.env))
  if (!admin) {
    return NextResponse.json({ ok: false, message: 'unauth' }, { status: 401 })
  }

  const { id } = await context.params
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : 'invalid body' },
      { status: 400 },
    )
  }

  const existing = await prisma.outreachTarget.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'not-found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (body.recipientEmail !== undefined) {
    data.recipientEmail = body.recipientEmail
      ? body.recipientEmail.toLowerCase().trim()
      : null
  }
  if (body.firstName !== undefined) {
    data.firstName = body.firstName
  }
  if (body.subjectVariant) data.subjectVariant = body.subjectVariant
  if (body.status) {
    data.status = body.status
    if (body.status === OUTREACH_STATUS.replied && !existing.repliedAt) {
      data.repliedAt = new Date()
    }
  }
  if (body.droppedReason !== undefined) data.droppedReason = body.droppedReason

  const updated = await prisma.outreachTarget.update({
    where: { id },
    data,
  })

  // Side effect: status='unsubscribed' from this endpoint means the
  // operator marked it manually (e.g. reading a reply that says no thanks).
  // Persist to the unsubscribes table so future sends to that email
  // across all targets skip.
  if (body.status === OUTREACH_STATUS.unsubscribed && updated.recipientEmail) {
    await recordUnsubscribe(updated.recipientEmail, 'manual')
  }

  return NextResponse.json({ ok: true, target: updated })
}
