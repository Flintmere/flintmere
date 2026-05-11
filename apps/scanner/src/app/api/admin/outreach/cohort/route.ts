/**
 * Cohort CSV upload. POST { csv: string, source: string } → upserts
 * outreach_targets keyed on shop_domain.
 *
 * Required column: shop_domain. All others optional. Schema mirrors
 * `data/recruitment/cohort-food-outreach-2026-05-09.csv`:
 *   shop_domain, score, grade, product_count, uk_signal, scan_id, re_scan_url
 *
 * Recipient_email + first_name are NOT in the cohort CSV — operator
 * enriches per-row in the admin UI. A target with no email stays in
 * status='pending' until enriched.
 *
 * Idempotent: re-uploading the same CSV updates existing rows in place.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { requireAdmin, verifyAdminSmokeToken } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

/**
 * Deterministic 50/50 A/B subject-variant assignment, keyed on
 * shop_domain. Re-uploading the same CSV yields the same variant per
 * row — preserves experiment integrity. Once a target reaches a
 * lifecycle status (queued/sent/…), variant freezes.
 */
function variantForDomain(shopDomain: string): 'A' | 'B' {
  const hash = createHash('sha256').update(shopDomain).digest()
  return (hash[0] ?? 0) % 2 === 0 ? 'A' : 'B'
}

/**
 * Status decision shared by insert + pre-lifecycle update paths. When the
 * row has email + score + grade + product_count, send eligibility is met,
 * so we auto-promote past 'enriched' to 'queued' — the cron picks queued
 * rows directly with no operator click required ("automate over per-row
 * manual gates" memory 2026-05-11). Missing data → 'pending'.
 */
function statusForRow(args: {
  recipientEmail: string | null
  score: number | null
  grade: string | null
  productCount: number | null
}): 'pending' | 'queued' {
  const fullyPopulated =
    !!args.recipientEmail &&
    args.score != null &&
    !!args.grade &&
    args.productCount != null
  return fullyPopulated ? 'queued' : 'pending'
}

const bodySchema = z.object({
  csv: z.string().min(1).max(1_000_000),
  source: z.string().min(1).max(64),
})

interface ParsedRow {
  shopDomain: string
  recipientEmail: string | null
  firstName: string | null
  score: number | null
  grade: string | null
  productCount: number | null
  ukSignal: boolean
  scanId: string | null
  rescanUrl: string | null
}

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { rows: [], errors: ['CSV is empty'] }

  const headerLine = lines[0] ?? ''
  const header = headerLine.split(',').map((h) => h.trim().toLowerCase())
  const errors: string[] = []
  const rows: ParsedRow[] = []

  const idx = (name: string) => header.indexOf(name)
  const iDomain = idx('shop_domain')
  if (iDomain < 0) {
    errors.push('CSV header must include shop_domain')
    return { rows, errors }
  }
  const iEmail = idx('recipient_email')
  const iFirstName = idx('first_name')
  const iScore = idx('score')
  const iGrade = idx('grade')
  const iProductCount = idx('product_count')
  const iUkSignal = idx('uk_signal')
  const iScanId = idx('scan_id')
  const iRescanUrl = idx('re_scan_url')

  for (let lineNo = 1; lineNo < lines.length; lineNo += 1) {
    const line = lines[lineNo] ?? ''
    const cells = line.split(',')
    const get = (i: number): string => {
      if (i < 0 || i >= cells.length) return ''
      return (cells[i] ?? '').trim()
    }
    const domain = get(iDomain).replace(/^https?:\/\//, '').replace(/\/+$/, '')
    if (!domain) {
      errors.push(`line ${lineNo + 1}: missing shop_domain`)
      continue
    }
    const score = iScore >= 0 ? parseIntOrNull(get(iScore)) : null
    const productCount = iProductCount >= 0 ? parseIntOrNull(get(iProductCount)) : null
    const ukSignal = iUkSignal >= 0 ? get(iUkSignal) === '1' || get(iUkSignal).toLowerCase() === 'true' : false
    rows.push({
      shopDomain: domain.toLowerCase(),
      recipientEmail: iEmail >= 0 ? (get(iEmail) || null) : null,
      firstName: iFirstName >= 0 ? (get(iFirstName) || null) : null,
      score,
      grade: iGrade >= 0 ? (get(iGrade) || null) : null,
      productCount,
      ukSignal,
      scanId: iScanId >= 0 ? (get(iScanId) || null) : null,
      rescanUrl: iRescanUrl >= 0 ? (get(iRescanUrl) || null) : null,
    })
  }
  return { rows, errors }
}

function parseIntOrNull(s: string): number | null {
  if (!s) return null
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

export async function POST(req: Request) {
  const admin =
    verifyAdminSmokeToken(req.headers, process.env) ??
    (await requireAdmin(cookies, process.env))
  if (!admin) {
    return NextResponse.json({ ok: false, message: 'unauth' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : 'invalid body' },
      { status: 400 },
    )
  }

  const { rows, errors } = parseCsv(body.csv)
  if (errors.length > 0 && rows.length === 0) {
    return NextResponse.json(
      { ok: false, message: errors.join('; ') },
      { status: 400 },
    )
  }

  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const statusOnInsert = statusForRow({
      recipientEmail: row.recipientEmail,
      score: row.score,
      grade: row.grade,
      productCount: row.productCount,
    })

    const existing = await prisma.outreachTarget.findUnique({
      where: { shopDomain: row.shopDomain },
    })

    if (!existing) {
      await prisma.outreachTarget.create({
        data: {
          shopDomain: row.shopDomain,
          recipientEmail: row.recipientEmail?.toLowerCase().trim() ?? null,
          firstName: row.firstName,
          score: row.score,
          grade: row.grade,
          productCount: row.productCount,
          ukSignal: row.ukSignal,
          scanId: row.scanId,
          rescanUrl: row.rescanUrl,
          source: body.source,
          status: statusOnInsert,
          subjectVariant: variantForDomain(row.shopDomain),
        },
      })
      inserted += 1
      continue
    }

    // Don't reset status backwards — once a target reaches 'queued' or
    // any post-send status, the variant and status freeze. Subsequent
    // CSV uploads refresh data fields only.
    const lifecycleStatuses = new Set([
      'queued',
      'sent',
      'followed_up',
      'replied',
      'unsubscribed',
      'bounced',
      'dropped',
    ])
    if (lifecycleStatuses.has(existing.status)) {
      await prisma.outreachTarget.update({
        where: { id: existing.id },
        data: {
          score: row.score ?? existing.score,
          grade: row.grade ?? existing.grade,
          productCount: row.productCount ?? existing.productCount,
          ukSignal: row.ukSignal,
          scanId: row.scanId ?? existing.scanId,
          rescanUrl: row.rescanUrl ?? existing.rescanUrl,
        },
      })
      skipped += 1
      continue
    }

    // pending / enriched: refresh everything (status auto-promotes to
    // 'queued' when fully populated). Variant gets the canonical hashed
    // value — covers existing rows seeded before deterministic variants.
    const newEmail = row.recipientEmail?.toLowerCase().trim() ?? existing.recipientEmail
    const newScore = row.score ?? existing.score
    const newGrade = row.grade ?? existing.grade
    const newProductCount = row.productCount ?? existing.productCount
    const newStatus = statusForRow({
      recipientEmail: newEmail,
      score: newScore,
      grade: newGrade,
      productCount: newProductCount,
    })
    await prisma.outreachTarget.update({
      where: { id: existing.id },
      data: {
        recipientEmail: newEmail,
        firstName: row.firstName ?? existing.firstName,
        score: newScore,
        grade: newGrade,
        productCount: newProductCount,
        ukSignal: row.ukSignal,
        scanId: row.scanId ?? existing.scanId,
        rescanUrl: row.rescanUrl ?? existing.rescanUrl,
        source: body.source,
        status: newStatus,
        subjectVariant: variantForDomain(row.shopDomain),
      },
    })
    updated += 1
  }

  return NextResponse.json({
    ok: true,
    inserted,
    updated,
    skipped,
    rowErrors: errors,
  })
}
