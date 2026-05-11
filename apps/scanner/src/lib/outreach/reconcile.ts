/**
 * Pure reconciliation logic for the OutreachSend (target_id, kind) unique
 * violation. Lives in its own module so unit tests can exercise the
 * branching without importing send.ts (which pulls in env validation at
 * import time and would require a running DATABASE_URL).
 *
 * See send.ts for the surrounding orchestration.
 */

export type ReconciliationAction =
  | { kind: 'short-circuit-replay'; resendMessageId: string | null }
  | { kind: 'update-in-place' };

// Decide what to do when an INSERT into scanner_outreach_sends hits the
// (target_id, kind) unique constraint. Pure function over the existing row's
// deliveryStatus. Any non-'sent' status is treated as updateable (defence in
// depth: today only 'sent' and 'failed' are written, but a future state like
// 'queued-for-retry' should fall through the same path rather than silently
// short-circuit as a successful replay).
export function reconcileExistingSend(
  existing: { deliveryStatus: string; resendMessageId: string | null },
): ReconciliationAction {
  if (existing.deliveryStatus === 'sent') {
    return { kind: 'short-circuit-replay', resendMessageId: existing.resendMessageId };
  }
  return { kind: 'update-in-place' };
}
