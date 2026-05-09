import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { requireAdmin, verifyAdminSmokeToken } from '@/lib/admin-auth'
import {
  AUDIT_DRAFT_STATUSES,
  getAuditDraft,
  patchAuditDraft,
  type AuditDraftStatus,
} from '@/lib/audit-draft/db'
import { AuditDraftSchema } from '@/lib/audit-draft/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/audit-draft/[id] — operator reads a draft for review.
 * PATCH /api/admin/audit-draft/[id] — operator persists edits +
 * optionally advances status (`edited` on edit, `sent` after send).
 *
 * Both gated by `requireAdmin()`. Feature flag mirrors the generate
 * route — disabled = 404, no existence leak.
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, ctx: RouteParams) {
  if (process.env.FEATURE_AUDIT_ASSIST !== 'true') {
    return notFound()
  }
  const admin =
    verifyAdminSmokeToken(req.headers, process.env) ??
    (await requireAdmin(cookies, process.env))
  if (!admin) return unauth()

  const { id } = await ctx.params
  const draft = await getAuditDraft(id)
  if (!draft) {
    return NextResponse.json(
      { ok: false, code: 'not-found', message: 'Draft not found.' },
      { status: 404 },
    )
  }
  return NextResponse.json({ ok: true, draft }, { status: 200 })
}

const PatchBodySchema = z.object({
  editedDraft: AuditDraftSchema.optional(),
  status: z.enum(AUDIT_DRAFT_STATUSES).optional(),
  sentAt: z.string().datetime().optional(),
})

export async function PATCH(req: NextRequest, ctx: RouteParams) {
  if (process.env.FEATURE_AUDIT_ASSIST !== 'true') {
    return notFound()
  }
  const admin =
    verifyAdminSmokeToken(req.headers, process.env) ??
    (await requireAdmin(cookies, process.env))
  if (!admin) return unauth()

  const { id } = await ctx.params

  let body: z.infer<typeof PatchBodySchema>
  try {
    const json = await req.json()
    body = PatchBodySchema.parse(json)
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        code: 'bad-request',
        message: 'Invalid edit payload.',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    )
  }

  if (
    body.editedDraft === undefined &&
    body.status === undefined &&
    body.sentAt === undefined
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: 'bad-request',
        message: 'Provide at least one of editedDraft, status, sentAt.',
      },
      { status: 400 },
    )
  }

  const updated = await patchAuditDraft(id, {
    ...(body.editedDraft !== undefined ? { editedDraft: body.editedDraft } : {}),
    ...(body.status !== undefined
      ? { status: body.status as AuditDraftStatus }
      : {}),
    ...(body.sentAt !== undefined ? { sentAt: new Date(body.sentAt) } : {}),
  })

  if (!updated) {
    return NextResponse.json(
      { ok: false, code: 'not-found', message: 'Draft not found.' },
      { status: 404 },
    )
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'audit-draft.patched',
      draftId: id,
      status: updated.status,
      hadEditedDraft: body.editedDraft !== undefined,
      hadSentAt: body.sentAt !== undefined,
    }),
  )

  return NextResponse.json({ ok: true, draft: updated }, { status: 200 })
}

function unauth() {
  return NextResponse.json(
    { ok: false, code: 'unauth', message: 'Sign in to continue.' },
    { status: 401 },
  )
}

function notFound() {
  return NextResponse.json(
    { ok: false, code: 'feature-off', message: 'Not found.' },
    { status: 404 },
  )
}
