import { describe, expect, it } from 'vitest'
import { formatElapsed } from './format-elapsed'

describe('formatElapsed', () => {
  it('floors sub-second to 00:00', () => {
    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(999)).toBe('00:00')
  })

  it('formats single seconds', () => {
    expect(formatElapsed(1000)).toBe('00:01')
    expect(formatElapsed(59_000)).toBe('00:59')
  })

  it('formats minutes', () => {
    expect(formatElapsed(60_000)).toBe('01:00')
    expect(formatElapsed(3_599_000)).toBe('59:59')
  })

  it('switches to Hh MM:SS at the hour mark', () => {
    expect(formatElapsed(3_600_000)).toBe('1h 00:00')
    expect(formatElapsed(3_661_000)).toBe('1h 01:01')
    expect(formatElapsed(36_000_000)).toBe('10h 00:00')
  })

  it('returns 00:00 for negatives, NaN, and Infinity', () => {
    expect(formatElapsed(-1)).toBe('00:00')
    expect(formatElapsed(Number.NaN)).toBe('00:00')
    expect(formatElapsed(Number.POSITIVE_INFINITY)).toBe('00:00')
    expect(formatElapsed(Number.NEGATIVE_INFINITY)).toBe('00:00')
  })
})
