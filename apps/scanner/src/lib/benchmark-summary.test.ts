import { describe, it, expect } from 'vitest'
import { summariseBenchmark, type BenchmarkRow } from './benchmark-summary'

function row(score: number, grade: string, vertical: string | null = null): BenchmarkRow {
  return { score, grade, vertical }
}

describe('summariseBenchmark', () => {
  it('handles empty input', () => {
    const s = summariseBenchmark([])
    expect(s.overall.n).toBe(0)
    expect(s.overall.medianScore).toBeNull()
    expect(s.overall.gradeDistribution).toEqual({ A: 0, B: 0, C: 0, D: 0, F: 0 })
    expect(s.byVertical).toEqual({})
    expect(s.available).toBe(false)
  })

  it('computes median for odd-count set', () => {
    const s = summariseBenchmark([
      row(10, 'F'),
      row(50, 'D'),
      row(90, 'A'),
    ])
    expect(s.overall.medianScore).toBe(50)
    expect(s.overall.meanScore).toBe(50)
  })

  it('computes median for even-count set', () => {
    const s = summariseBenchmark([
      row(10, 'F'),
      row(40, 'D'),
      row(60, 'C'),
      row(90, 'A'),
    ])
    expect(s.overall.medianScore).toBe(50)
  })

  it('tallies grade distribution', () => {
    const s = summariseBenchmark([
      row(85, 'A'),
      row(75, 'B'),
      row(75, 'B'),
      row(55, 'D'),
      row(20, 'F'),
    ])
    expect(s.overall.gradeDistribution).toEqual({
      A: 1,
      B: 2,
      C: 0,
      D: 1,
      F: 1,
    })
  })

  it('groups by vertical', () => {
    const s = summariseBenchmark([
      row(80, 'B', 'apparel'),
      row(60, 'C', 'apparel'),
      row(40, 'D', 'beauty'),
    ])
    expect(s.byVertical.apparel?.n).toBe(2)
    expect(s.byVertical.apparel?.medianScore).toBe(70)
    expect(s.byVertical.beauty?.n).toBe(1)
    expect(s.byVertical.beauty?.medianScore).toBe(40)
  })

  it('ignores rows with null vertical in byVertical but keeps them in overall', () => {
    const s = summariseBenchmark([
      row(50, 'D', null),
      row(70, 'B', 'apparel'),
    ])
    expect(s.overall.n).toBe(2)
    expect(Object.keys(s.byVertical)).toEqual(['apparel'])
    expect(s.byVertical.apparel?.n).toBe(1)
  })

  it('flips available=true once n >= floor', () => {
    const hundred = Array.from({ length: 100 }, (_, i) => row(50 + (i % 10), 'C'))
    const s = summariseBenchmark(hundred)
    expect(s.overall.n).toBe(100)
    expect(s.available).toBe(true)
  })

  it('ignores unknown grade strings without crashing', () => {
    const s = summariseBenchmark([row(50, 'A+'), row(60, 'B')])
    expect(s.overall.n).toBe(2)
    expect(s.overall.gradeDistribution.A).toBe(0)
    expect(s.overall.gradeDistribution.B).toBe(1)
  })
})
