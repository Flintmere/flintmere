/**
 * Coolify-scheduled cron endpoint for auto-enrichment.
 *
 *   curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" \
 *        https://audit.flintmere.com/api/cron/outreach-enrich
 *
 * Frequency suggestion: 0 * * * * (top of every hour). Pulls up to 10
 * pending targets per run; with a 117-cohort, the full sweep completes
 * in ~12 hours. Per-target work: fetch up to 3 public pages of merchant
 * site → regex pass for emails → Gemini Flash extraction for first-name.
 *
 * Re-attempt window: 24h. Targets whose last attempt failed naturally
 * retry the next day without thrashing the merchant's site.
 *
 * Auto-apply: gated on env OUTREACH_AUTO_APPLY_ENRICHMENT=true AND draft
 * confidence='high' AND email-domain matches the merchant's apex (e.g.,
 * hello@origincoffee.co.uk for origincoffee.co.uk). Everything else is
 * stored as a draft for operator review in /admin/outreach.
 *
 * Operator opt-out: set OUTREACH_AUTO_APPLY_ENRICHMENT=false (or unset)
 * in Coolify env. Cron still fetches + drafts, just never auto-applies.
 *
 * Kill switch: disable the scheduled task in Coolify, OR set
 * OUTREACH_ENRICH_BATCH_SIZE=0.
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'
import { enrichTarget, canAutoApply } from '@/lib/outreach/enrich'
import type { Prisma } from '@/generated/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

const DEFAULT_BATCH_SIZE = 10
const RE_ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000

interface RunSummary {
  attempted: number
  drafted: number
  autoApplied: number
  failed: number
  skipped: number
  perTarget: Array<{
    shopDomain: string
    outcome: 'drafted' | 'auto-applied' | 'failed' | 'skipped'
    reason?: string
  }>
}

export async function POST() {
  const hdrs = await headers()
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'))
  if (authError) return authError

  const batchSize = Number.parseInt(process.env.OUTREACH_ENRICH_BATCH_SIZE ?? '', 10)
  const limit = Number.isFinite(batchSize) && batchSize >= 0 ? batchSize : DEFAULT_BATCH_SIZE
  if (limit === 0) {
    return NextResponse.json(
      { event: 'outreach-enrich-cron', attempted: 0, drafted: 0, autoApplied: 0, failed: 0, skipped: 0, perTarget: [], note: 'batch-size-zero' },
      { status: 200 },
    )
  }

  const autoApplyEnabled = process.env.OUTREACH_AUTO_APPLY_ENRICHMENT === 'true'

  const cutoff = new Date(Date.now() - RE_ATTEMPT_WINDOW_MS)
  const targets = await prisma.outreachTarget.findMany({
    where: {
      status: 'pending',
      recipientEmail: null,
      OR: [
        { enrichmentAttemptedAt: null },
        { enrichmentAttemptedAt: { lt: cutoff } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  if (targets.length === 0) {
    return NextResponse.json(
      { event: 'outreach-enrich-cron', attempted: 0, drafted: 0, autoApplied: 0, failed: 0, skipped: 0, perTarget: [] },
      { status: 200 },
    )
  }

  const summary: RunSummary = {
    attempted: targets.length,
    drafted: 0,
    autoApplied: 0,
    failed: 0,
    skipped: 0,
    perTarget: [],
  }

  for (const target of targets) {
    try {
      const result = await enrichTarget({ shopDomain: target.shopDomain })
      if (!result.ok) {
        await prisma.outreachTarget.update({
          where: { id: target.id },
          data: {
            enrichmentAttemptedAt: new Date(),
            enrichmentFailedReason: result.reason,
          },
        })
        summary.failed += 1
        summary.perTarget.push({
          shopDomain: target.shopDomain,
          outcome: 'failed',
          reason: result.reason,
        })
        continue
      }

      const draft = result.draft
      // Persist the draft regardless. If auto-apply qualifies, also
      // promote the row to 'enriched' with the email + first_name.
      const auto = autoApplyEnabled && canAutoApply(draft, target.shopDomain)
      const updateData: Prisma.OutreachTargetUpdateInput = {
        enrichmentDraft: draft as unknown as Prisma.InputJsonValue,
        enrichmentAttemptedAt: new Date(),
        enrichmentFailedReason: null,
      }

      if (auto) {
        const email = draft.recipientEmail.value
        if (email) {
          updateData.recipientEmail = email.toLowerCase().trim()
          if (draft.firstName.value) {
            updateData.firstName = draft.firstName.value.trim()
          }
          // Promote to 'enriched' only when score is also present —
          // /admin/outreach UI gates queue on score+email both.
          if (target.score != null && target.grade && target.productCount != null) {
            updateData.status = 'enriched'
          }
        }
      }

      await prisma.outreachTarget.update({
        where: { id: target.id },
        data: updateData,
      })

      if (auto) {
        summary.autoApplied += 1
        summary.perTarget.push({ shopDomain: target.shopDomain, outcome: 'auto-applied' })
      } else {
        summary.drafted += 1
        summary.perTarget.push({ shopDomain: target.shopDomain, outcome: 'drafted' })
      }
    } catch (err) {
      summary.failed += 1
      summary.perTarget.push({
        shopDomain: target.shopDomain,
        outcome: 'failed',
        reason: err instanceof Error ? err.message : String(err),
      })
      try {
        await prisma.outreachTarget.update({
          where: { id: target.id },
          data: {
            enrichmentAttemptedAt: new Date(),
            enrichmentFailedReason: 'exception',
          },
        })
      } catch {
        // best-effort log; loop continues
      }
    }
  }

  return NextResponse.json(
    { event: 'outreach-enrich-cron', ...summary, autoApplyEnabled },
    { status: 200 },
  )
}
