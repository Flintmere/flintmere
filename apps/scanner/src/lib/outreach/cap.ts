/**
 * Daily-cap ramp for the outreach send pipeline.
 *
 * The 117-merchant cohort goes out across sprint days 3–11 with a
 * conservative warming curve. team.flintmere.com is a fresh sending
 * subdomain — Gmail and friends key reputation on the sending domain,
 * so even though Resend's IP infrastructure has reputation, the new
 * subdomain still needs ramped volume to avoid spam-folding.
 *
 * Ramp anchored to OUTREACH_SPRINT_START (sprint Day 3 = first send day).
 * Returns 0 before sprint start (nothing should send before warming begins)
 * and 30 after the ramp completes. Operator can override via env var
 * OUTREACH_DAILY_CAP_OVERRIDE if deliverability is healthy on Day 3-4.
 */

const RAMP_SCHEDULE = [5, 10, 15, 20, 25, 30] as const;
const STEADY_STATE_CAP = 30;

export interface CapInput {
  /** ISO date YYYY-MM-DD; falls back to OUTREACH_SPRINT_START env. */
  sprintStart?: string;
  /** Today's date in ISO YYYY-MM-DD format; defaults to current UTC date. */
  today?: string;
  /** Operator override, parsed as integer ≥ 0; defaults to env OUTREACH_DAILY_CAP_OVERRIDE. */
  override?: number | null;
}

function parseIsoDate(s: string): Date {
  const parts = s.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, d));
}

function todayIsoUtc(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function readSprintStart(input: CapInput): string {
  return input.sprintStart ?? process.env.OUTREACH_SPRINT_START ?? '2026-05-11';
}

function readOverride(input: CapInput): number | null {
  if (input.override !== undefined) return input.override;
  const raw = process.env.OUTREACH_DAILY_CAP_OVERRIDE;
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Returns today's send cap. 0 before sprint start; ramps then plateaus at 30. */
export function dailyCap(input: CapInput = {}): number {
  const override = readOverride(input);
  if (override !== null) return override;

  const sprintStart = readSprintStart(input);
  const today = input.today ?? todayIsoUtc();
  const startMs = parseIsoDate(sprintStart).getTime();
  const todayMs = parseIsoDate(today).getTime();
  const dayIndex = Math.floor((todayMs - startMs) / (24 * 60 * 60 * 1000));

  if (dayIndex < 0) return 0;
  if (dayIndex < RAMP_SCHEDULE.length) {
    return RAMP_SCHEDULE[dayIndex] ?? STEADY_STATE_CAP;
  }
  return STEADY_STATE_CAP;
}

/** Exported for tests. */
export const _internal = { RAMP_SCHEDULE, STEADY_STATE_CAP };
