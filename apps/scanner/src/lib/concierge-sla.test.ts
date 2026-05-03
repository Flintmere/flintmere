import { describe, expect, it } from 'vitest';
import { workingDaysBetween } from './concierge-sla';

describe('workingDaysBetween', () => {
  it('returns 0 when end is before start', () => {
    const start = new Date('2026-05-04T10:00:00Z'); // Mon
    const end = new Date('2026-05-03T10:00:00Z'); // Sun (earlier)
    expect(workingDaysBetween(start, end)).toBe(0);
  });

  it('returns 0 when end equals start', () => {
    const t = new Date('2026-05-04T10:00:00Z');
    expect(workingDaysBetween(t, t)).toBe(0);
  });

  it('counts a single weekday', () => {
    const start = new Date('2026-05-04T10:00:00Z'); // Mon
    const end = new Date('2026-05-05T10:00:00Z'); // Tue
    expect(workingDaysBetween(start, end)).toBe(1);
  });

  it('skips Saturday + Sunday', () => {
    const start = new Date('2026-05-01T10:00:00Z'); // Fri
    const end = new Date('2026-05-04T10:00:00Z'); // Mon (3 calendar days later)
    expect(workingDaysBetween(start, end)).toBe(1);
  });

  it('counts a full working week as 5', () => {
    const start = new Date('2026-05-04T10:00:00Z'); // Mon
    const end = new Date('2026-05-11T10:00:00Z'); // Mon next week (7 calendar days)
    expect(workingDaysBetween(start, end)).toBe(5);
  });

  it('handles a Wednesday charge — 2 working days lands Friday', () => {
    const start = new Date('2026-05-06T10:00:00Z'); // Wed
    const friday = new Date('2026-05-08T10:00:00Z'); // Fri
    expect(workingDaysBetween(start, friday)).toBe(2);
  });

  it('handles a Thursday charge — 2 working days lands Monday across weekend', () => {
    const start = new Date('2026-05-07T10:00:00Z'); // Thu
    const monday = new Date('2026-05-11T10:00:00Z'); // Mon (4 calendar days)
    expect(workingDaysBetween(start, monday)).toBe(2);
  });

  it('handles a Friday charge — 2 working days lands Tuesday', () => {
    const start = new Date('2026-05-01T10:00:00Z'); // Fri
    const tuesday = new Date('2026-05-05T10:00:00Z'); // Tue (4 calendar days)
    expect(workingDaysBetween(start, tuesday)).toBe(2);
  });

  it('Saturday charge — by Wed same time, function reads 3 (we are inside the 3rd working day)', () => {
    // SLA semantics: a Sat charge gets Mon+Tue+Wed as its three working days.
    // The 09:00-UTC cron firing on Wed sees ~95h elapsed (floor 3 calendar
    // days) → returns 2 → fires the "≥2 working days" alert correctly.
    // The exact-96h case asserted here represents "just after the boundary":
    // function reads 3, meaning we're inside the third working day, SLA
    // breach window has opened.
    const start = new Date('2026-05-02T10:00:00Z'); // Sat
    const wed = new Date('2026-05-06T10:00:00Z'); // Wed exactly 96h later
    expect(workingDaysBetween(start, wed)).toBe(3);
  });

  it('Saturday charge — Wed at 09:00 (cron time) fires the 2wd alert', () => {
    // The realistic case: cron runs at 09:00 UTC, charge happened Sat 10:00.
    // 95h gap → floor 3 calendar days → Sun(skip)+Mon+Tue = 2 working days.
    const start = new Date('2026-05-02T10:00:00Z'); // Sat
    const wedCron = new Date('2026-05-06T09:00:00Z'); // Wed cron run
    expect(workingDaysBetween(start, wedCron)).toBe(2);
  });
});
