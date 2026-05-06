// Prisma helpers for the AuditDraft model.
//
// Three operations:
//   - createAuditDraft — called by /api/admin/audit-draft/generate after
//     the LLM returns a schema-valid draft. Persists raw_draft and the
//     model+latency telemetry; status starts at 'draft'.
//   - getAuditDraft — called by /api/admin/audit-draft/[id] GET.
//   - patchAuditDraft — called by /api/admin/audit-draft/[id] PATCH on
//     operator edit. Stores edited_draft, sets edited_at, and (unless
//     the caller specifies otherwise) advances status: 'draft' → 'edited'
//     when an edited body lands, 'edited' → 'sent' when sentAt is set.
//
// Json fields are written from already-zod-validated AuditDraft values
// and read back as the same shape. We do NOT re-parse on read in v0 —
// the only writer is this module, and zod parses at the route boundary
// before persist. If the schema ever changes, a migration step will
// re-parse historical rows.

import { Prisma } from '../../generated/prisma'
import { prisma } from '../db'
import type { AuditBandSlug } from '../audit-pricing'
import type { AuditDraft, Vertical } from './schema'

export const AUDIT_DRAFT_STATUSES = ['draft', 'edited', 'sent'] as const
export type AuditDraftStatus = (typeof AUDIT_DRAFT_STATUSES)[number]

export interface PersistedAuditDraft {
  id: string
  shop: string
  vertical: Vertical
  bandSlug: AuditBandSlug
  scanId: string | null
  status: AuditDraftStatus
  modelUsed: string
  latencyMs: number
  rawDraft: AuditDraft
  editedDraft: AuditDraft | null
  generatedAt: Date
  editedAt: Date | null
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateAuditDraftInput {
  shop: string
  vertical: Vertical
  bandSlug: AuditBandSlug
  scanId?: string | null
  modelUsed: string
  latencyMs: number
  rawDraft: AuditDraft
  generatedAt: Date
}

export interface PatchAuditDraftInput {
  editedDraft?: AuditDraft
  status?: AuditDraftStatus
  sentAt?: Date
}

export async function createAuditDraft(
  input: CreateAuditDraftInput,
): Promise<PersistedAuditDraft> {
  const row = await prisma.auditDraft.create({
    data: {
      shop: input.shop,
      vertical: input.vertical,
      bandSlug: input.bandSlug,
      scanId: input.scanId ?? null,
      modelUsed: input.modelUsed,
      latencyMs: input.latencyMs,
      rawDraft: input.rawDraft as unknown as Prisma.InputJsonValue,
      generatedAt: input.generatedAt,
    },
  })
  return rowToDraft(row)
}

export async function getAuditDraft(
  id: string,
): Promise<PersistedAuditDraft | null> {
  const row = await prisma.auditDraft.findUnique({ where: { id } })
  return row ? rowToDraft(row) : null
}

/**
 * Patches editable fields. Returns the updated row, or null if the id
 * doesn't exist (P2025) — callers map null to 404.
 *
 * Status auto-advance:
 *   - If `editedDraft` is set and `status` is not, status moves to 'edited'.
 *   - If `sentAt` is set and `status` is not, status moves to 'sent'.
 *   - An explicit `status` always wins over the auto-advance.
 */
export async function patchAuditDraft(
  id: string,
  input: PatchAuditDraftInput,
): Promise<PersistedAuditDraft | null> {
  const data: Prisma.AuditDraftUpdateInput = {}
  let autoStatus: AuditDraftStatus | null = null

  if (input.editedDraft !== undefined) {
    data.editedDraft = input.editedDraft as unknown as Prisma.InputJsonValue
    data.editedAt = new Date()
    autoStatus = 'edited'
  }
  if (input.sentAt !== undefined) {
    data.sentAt = input.sentAt
    autoStatus = 'sent'
  }
  if (input.status !== undefined) {
    data.status = input.status
  } else if (autoStatus) {
    data.status = autoStatus
  }

  try {
    const row = await prisma.auditDraft.update({ where: { id }, data })
    return rowToDraft(row)
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return null
    }
    throw err
  }
}

// ---- Internal -------------------------------------------------------

interface AuditDraftRow {
  id: string
  shop: string
  vertical: string
  bandSlug: string
  scanId: string | null
  status: string
  modelUsed: string
  latencyMs: number
  rawDraft: Prisma.JsonValue
  editedDraft: Prisma.JsonValue | null
  generatedAt: Date
  editedAt: Date | null
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function rowToDraft(row: AuditDraftRow): PersistedAuditDraft {
  return {
    id: row.id,
    shop: row.shop,
    vertical: row.vertical as Vertical,
    bandSlug: row.bandSlug as AuditBandSlug,
    scanId: row.scanId,
    status: row.status as AuditDraftStatus,
    modelUsed: row.modelUsed,
    latencyMs: row.latencyMs,
    rawDraft: row.rawDraft as unknown as AuditDraft,
    editedDraft:
      row.editedDraft === null
        ? null
        : (row.editedDraft as unknown as AuditDraft),
    generatedAt: row.generatedAt,
    editedAt: row.editedAt,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
