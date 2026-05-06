#!/usr/bin/env node
// Audit-draft edit-rate analysis. One-off, run after ~20 drafts have
// landed and been edited by the operator. Reads the persisted rows
// (raw_draft + edited_draft as JSONB) and computes:
//
//   - edited_count / sent_count vs draft_count
//   - per-section edit rate (which fields the operator most often
//     touches — exec headline? specific pillar observations? top
//     priority titles?)
//   - mean character delta per edited field (heavy rewrite vs minor)
//   - confidence distribution (raw vs as-shipped)
//
// Output is a tab-separated summary to stdout — paste into a Notion
// page or spreadsheet for prompt-tuning signals. NOT a continuous
// metric; rerun this each time we accumulate ~20 new drafts.
//
// Run from the repo root:
//   node packages/llm/scripts/audit-draft-edit-analysis.mjs
//
// DATABASE_URL must be set (the same one apps/scanner uses).

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

// Lazy-require the generated Prisma client from apps/scanner — keeps
// this script outside the scanner's TypeScript graph but reuses the
// already-generated client.
const { PrismaClient } = require('../../../apps/scanner/src/generated/prisma')

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.auditDraft.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const counts = { draft: 0, edited: 0, sent: 0 }
  const fieldEditRates = new Map() // path → { count, totalDelta }
  const rawConfidences = []
  const editedConfidences = []

  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1
    if (!row.editedDraft) continue

    walkDiff('', row.rawDraft, row.editedDraft, (path, before, after) => {
      const stats = fieldEditRates.get(path) ?? { count: 0, totalDelta: 0 }
      stats.count += 1
      stats.totalDelta += charDelta(before, after)
      fieldEditRates.set(path, stats)
    })

    pushConfidences(row.rawDraft, rawConfidences)
    pushConfidences(row.editedDraft, editedConfidences)
  }

  console.log('# Audit-draft edit-rate analysis')
  console.log('')
  console.log(`Total drafts: ${rows.length}`)
  console.log(`  draft / edited / sent — ${counts.draft ?? 0} / ${counts.edited ?? 0} / ${counts.sent ?? 0}`)
  console.log('')
  console.log('## Per-field edit rates (top 25 by edit count)')
  console.log('path\tedits\tmean_char_delta')
  const sorted = [...fieldEditRates.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 25)
  for (const [path, stats] of sorted) {
    const mean = (stats.totalDelta / stats.count).toFixed(0)
    console.log(`${path}\t${stats.count}\t${mean}`)
  }
  console.log('')
  console.log('## Confidence distributions')
  console.log(`raw    — n=${rawConfidences.length}, mean=${mean(rawConfidences).toFixed(3)}`)
  console.log(`edited — n=${editedConfidences.length}, mean=${mean(editedConfidences).toFixed(3)}`)
  console.log('')
  console.log('## Notes')
  console.log('Hot paths (high edit count + high mean delta) are prompt-tuning')
  console.log('candidates. If a field is edited every time and a lot, the')
  console.log('system prompt is wrong about that field; rewrite or constrain it.')

  await prisma.$disconnect()
}

function walkDiff(prefix, a, b, emit) {
  if (typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') {
    if (a !== b) emit(prefix, a, b)
    return
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i += 1) {
      walkDiff(`${prefix}[${i}]`, a[i], b[i], emit)
    }
    return
  }
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) {
      walkDiff(prefix ? `${prefix}.${k}` : k, a[k], b[k], emit)
    }
    return
  }
  if (a !== b) emit(prefix, a, b)
}

function charDelta(before, after) {
  const a = typeof before === 'string' ? before.length : 0
  const b = typeof after === 'string' ? after.length : 0
  return Math.abs(b - a)
}

function pushConfidences(draft, sink) {
  if (!draft || typeof draft !== 'object') return
  if (typeof draft.executiveSummary?.confidence === 'number')
    sink.push(draft.executiveSummary.confidence)
  if (Array.isArray(draft.pillarFindings)) {
    for (const p of draft.pillarFindings) {
      if (typeof p?.confidence === 'number') sink.push(p.confidence)
      if (Array.isArray(p?.actionableFixes)) {
        for (const f of p.actionableFixes) {
          if (typeof f?.confidence === 'number') sink.push(f.confidence)
        }
      }
    }
  }
  if (Array.isArray(draft.topPriorities)) {
    for (const p of draft.topPriorities) {
      if (typeof p?.confidence === 'number') sink.push(p.confidence)
    }
  }
  if (typeof draft.estimatedRevenueImpact?.confidence === 'number') {
    sink.push(draft.estimatedRevenueImpact.confidence)
  }
}

function mean(arr) {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
