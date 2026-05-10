import { describe, expect, it } from 'vitest';
import { dailyCap } from './cap';

describe('dailyCap', () => {
  const sprintStart = '2026-05-11';

  it('returns 0 the day before sprint start', () => {
    expect(dailyCap({ sprintStart, today: '2026-05-10', override: null })).toBe(0);
  });

  it('returns 5 on day 0 (sprint start)', () => {
    expect(dailyCap({ sprintStart, today: '2026-05-11', override: null })).toBe(5);
  });

  it('ramps 5/10/15/20/25/30 across days 0-5', () => {
    const expected = [5, 10, 15, 20, 25, 30];
    const dates = ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16'];
    for (let i = 0; i < dates.length; i += 1) {
      expect(dailyCap({ sprintStart, today: dates[i], override: null })).toBe(expected[i]);
    }
  });

  it('plateaus at 30 after the ramp', () => {
    expect(dailyCap({ sprintStart, today: '2026-05-17', override: null })).toBe(30);
    expect(dailyCap({ sprintStart, today: '2026-05-25', override: null })).toBe(30);
    expect(dailyCap({ sprintStart, today: '2026-06-01', override: null })).toBe(30);
  });

  it('honours an explicit override over the ramp', () => {
    expect(dailyCap({ sprintStart, today: '2026-05-11', override: 50 })).toBe(50);
    expect(dailyCap({ sprintStart, today: '2026-05-11', override: 0 })).toBe(0);
  });

  it('treats UTC date arithmetic correctly across DST boundaries', () => {
    // UK summer time begins last Sunday of March; this verifies date math
    // doesn't drift by one day across the boundary.
    expect(dailyCap({ sprintStart: '2026-03-28', today: '2026-03-28', override: null })).toBe(5);
    expect(dailyCap({ sprintStart: '2026-03-28', today: '2026-04-02', override: null })).toBe(30);
  });
});
