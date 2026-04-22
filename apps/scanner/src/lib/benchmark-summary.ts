/**
 * Aggregation helpers for /api/benchmark/summary.
 *
 * Pure functions — the Next.js route handler passes rows in and takes
 * JSON out. Separating this out keeps the DB call thin and the math
 * unit-testable.
 *
 * Publishing contract (memory/project_benchmark_decisions.md):
 *   - Aggregate only. Never expose individual-store data.
 *   - `available` = n >= BENCHMARK_FLOOR (minimum to render a number)
 *   - `preview`   = n <  BENCHMARK_PUBLISH_FLOOR (render as early sample,
 *                   never as "median Shopify store scores N")
 */

import { BENCHMARK_FLOOR, BENCHMARK_PUBLISH_FLOOR } from './copy'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'
const GRADE_ORDER: Grade[] = ['A', 'B', 'C', 'D', 'F']

export interface BenchmarkRow {
  score: number
  grade: string
  vertical: string | null
}

export interface GradeDistribution {
  A: number
  B: number
  C: number
  D: number
  F: number
}

export interface BenchmarkBucket {
  n: number
  medianScore: number | null
  meanScore: number | null
  gradeDistribution: GradeDistribution
}

export interface BenchmarkSummary {
  asOf: string
  floor: number
  publishFloor: number
  available: boolean
  preview: boolean
  overall: BenchmarkBucket
  byVertical: Record<string, BenchmarkBucket>
}

export function summariseBenchmark(rows: BenchmarkRow[]): BenchmarkSummary {
  const overall = bucket(rows)

  const verticals = new Set<string>()
  for (const r of rows) {
    if (r.vertical) verticals.add(r.vertical)
  }
  const byVertical: Record<string, BenchmarkBucket> = {}
  for (const v of verticals) {
    byVertical[v] = bucket(rows.filter((r) => r.vertical === v))
  }

  return {
    asOf: new Date().toISOString(),
    floor: BENCHMARK_FLOOR,
    publishFloor: BENCHMARK_PUBLISH_FLOOR,
    available: overall.n >= BENCHMARK_FLOOR,
    preview: overall.n < BENCHMARK_PUBLISH_FLOOR,
    overall,
    byVertical,
  }
}

function bucket(rows: BenchmarkRow[]): BenchmarkBucket {
  const n = rows.length
  if (n === 0) {
    return {
      n: 0,
      medianScore: null,
      meanScore: null,
      gradeDistribution: emptyGradeDistribution(),
    }
  }
  const scores = rows.map((r) => r.score).sort((a, b) => a - b)
  const mid = Math.floor(scores.length / 2)
  const median =
    scores.length % 2 === 0
      ? Math.round((scores[mid - 1]! + scores[mid]!) / 2)
      : scores[mid]!
  const mean = Math.round(scores.reduce((a, b) => a + b, 0) / n)
  const gradeDistribution = emptyGradeDistribution()
  for (const r of rows) {
    if (isGrade(r.grade)) gradeDistribution[r.grade] += 1
  }
  return {
    n,
    medianScore: median,
    meanScore: mean,
    gradeDistribution,
  }
}

function emptyGradeDistribution(): GradeDistribution {
  return { A: 0, B: 0, C: 0, D: 0, F: 0 }
}

function isGrade(g: string): g is Grade {
  return (GRADE_ORDER as string[]).includes(g)
}
