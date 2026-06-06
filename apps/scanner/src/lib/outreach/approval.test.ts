import { describe, it, expect } from 'vitest';
import {
  signApproveToken,
  verifyApproveToken,
  approveBatch,
  type ApprovalPrisma,
} from './approval';

const SECRET = 'a'.repeat(64);

describe('approve token', () => {
  it('round-trips a valid token', () => {
    const token = signApproveToken('batch-1', SECRET, new Date('2026-06-06T00:00:00Z'));
    const result = verifyApproveToken(token, SECRET, new Date('2026-06-08T00:00:00Z'));
    expect(result).toEqual({ ok: true, batchId: 'batch-1' });
  });

  it('rejects a tampered token', () => {
    const token = signApproveToken('batch-1', SECRET, new Date('2026-06-06T00:00:00Z'));
    const [payload] = token.split('.');
    const forged = `${payload}.${'0'.repeat(64)}`;
    expect(verifyApproveToken(forged, SECRET, new Date('2026-06-07T00:00:00Z'))).toEqual({
      ok: false,
      reason: 'bad-signature',
    });
  });

  it('rejects an expired token (7 days)', () => {
    const token = signApproveToken('batch-1', SECRET, new Date('2026-06-06T00:00:00Z'));
    expect(verifyApproveToken(token, SECRET, new Date('2026-06-14T00:00:01Z'))).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects garbage', () => {
    expect(verifyApproveToken('not-a-token', SECRET, new Date())).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });
});

describe('approveBatch', () => {
  function makeFakePrisma(rows: Array<{ id: string; batchId: string | null; status: string; approvedAt: Date | null }>) {
    return {
      client: {
        outreachTarget: {
          updateMany: async ({ where, data }: {
            where: { batchId: string; status: string };
            data: { status: string; approvedAt: Date };
          }) => {
            let count = 0;
            for (const r of rows) {
              if (r.batchId === where.batchId && r.status === where.status) {
                r.status = data.status;
                r.approvedAt = data.approvedAt;
                count++;
              }
            }
            return { count };
          },
          count: async ({ where }: { where: { batchId: string; approvedAt: { not: null } } }) =>
            rows.filter((r) => r.batchId === where.batchId && r.approvedAt !== null).length,
        },
      } satisfies ApprovalPrisma,
      rows,
    };
  }

  it('flips ready_for_approval rows to queued and stamps approvedAt', async () => {
    const { client, rows } = makeFakePrisma([
      { id: 't1', batchId: 'b1', status: 'ready_for_approval', approvedAt: null },
      { id: 't2', batchId: 'b1', status: 'ready_for_approval', approvedAt: null },
      { id: 't3', batchId: 'b2', status: 'ready_for_approval', approvedAt: null },
      { id: 't4', batchId: 'b1', status: 'sent', approvedAt: null },
    ]);
    const result = await approveBatch('b1', client);
    expect(result).toEqual({ approved: 2, alreadyApproved: 0 });
    expect(rows[0]!.status).toBe('queued');
    expect(rows[2]!.status).toBe('ready_for_approval'); // other batch untouched
    expect(rows[3]!.status).toBe('sent'); // non-pending untouched
  });

  it('is idempotent — second call approves zero, reports alreadyApproved', async () => {
    const { client } = makeFakePrisma([
      { id: 't1', batchId: 'b1', status: 'ready_for_approval', approvedAt: null },
    ]);
    await approveBatch('b1', client);
    const second = await approveBatch('b1', client);
    expect(second).toEqual({ approved: 0, alreadyApproved: 1 });
  });
});
