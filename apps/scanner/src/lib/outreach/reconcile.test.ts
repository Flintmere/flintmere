import { describe, expect, it } from 'vitest';
import { reconcileExistingSend } from './reconcile';

describe('reconcileExistingSend', () => {
  it("short-circuits as idempotent replay when the prior row was 'sent'", () => {
    const action = reconcileExistingSend({
      deliveryStatus: 'sent',
      resendMessageId: '6638615d-f093-496b-990c-6cb17925a566',
    });
    expect(action).toEqual({
      kind: 'short-circuit-replay',
      resendMessageId: '6638615d-f093-496b-990c-6cb17925a566',
    });
  });

  it('carries a null resendMessageId through the replay (e.g. dev no-op send)', () => {
    const action = reconcileExistingSend({
      deliveryStatus: 'sent',
      resendMessageId: null,
    });
    expect(action).toEqual({
      kind: 'short-circuit-replay',
      resendMessageId: null,
    });
  });

  it("returns update-in-place when the prior row was 'failed'", () => {
    // The regression. Before this branching, a prior failed row was treated
    // as a successful replay — leaving the target queued forever even after
    // Resend recovered. See incident 2026-05-11 (team.flintmere.com API key
    // scope rejection produced 5 failed rows that blocked retries).
    const action = reconcileExistingSend({
      deliveryStatus: 'failed',
      resendMessageId: null,
    });
    expect(action).toEqual({ kind: 'update-in-place' });
  });

  it('treats any non-sent status as updateable (defence in depth)', () => {
    // Today only 'sent' and 'failed' are written. A future status that the
    // INSERT path adds without updating this helper should fall through to
    // the safe update-in-place branch rather than silently short-circuiting.
    for (const deliveryStatus of ['queued-for-retry', 'rate-limited', '']) {
      const action = reconcileExistingSend({ deliveryStatus, resendMessageId: null });
      expect(action).toEqual({ kind: 'update-in-place' });
    }
  });
});
