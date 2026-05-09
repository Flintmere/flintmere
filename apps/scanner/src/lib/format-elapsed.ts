/**
 * Elapsed-time formatter for the Stage Ledger primitive.
 * `MM:SS` under one hour, `Hh MM:SS` at one hour and beyond.
 * Sub-second floors to "00:00" so the ticker doesn't read fractional.
 * Defensive against negative / NaN / Infinity inputs.
 */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}h ${mm}:${ss}` : `${mm}:${ss}`
}
