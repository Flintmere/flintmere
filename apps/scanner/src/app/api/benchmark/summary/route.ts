import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary'

export const runtime = 'nodejs'
export const revalidate = 3600

/**
 * Public read-only aggregate endpoint. Reads every completed bot scan
 * plus every merchant scan opted-in via /api/scan/[id]/publish, then
 * emits vertical + overall medians + grade distributions. Never exposes
 * individual shop domains — aggregate-only publishing rule per
 * memory/project_benchmark_decisions.md.
 *
 * Consumed by:
 *   - Scanner's /research page (vertical reports, monthly refresh)
 *   - Scanner score pages (gradeBadgeAnchor median caption)
 *   - Marketing "N stores scanned" claims (gated on BENCHMARK_FLOOR)
 */
export async function GET(): Promise<NextResponse> {
  const rows = await prisma.scan.findMany({
    where: {
      OR: [{ source: 'bot' }, { publishedToBenchmark: true }],
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    },
    select: {
      score: true,
      grade: true,
      vertical: true,
    },
  })

  const typed: BenchmarkRow[] = rows.map((r) => ({
    score: r.score ?? 0,
    grade: r.grade ?? '',
    vertical: r.vertical,
  }))

  const summary = summariseBenchmark(typed)

  return NextResponse.json(summary, {
    headers: {
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
