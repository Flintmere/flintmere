import { describe, expect, it, vi } from 'vitest';

import { stageOutreachBatch } from './stage-batch';
import type { StageBatchPrisma } from './stage-batch';

function makeClient(
  candidates: Array<{ id: string; shopDomain: string }>,
  updatedCount?: number,
): { client: StageBatchPrisma; findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> } {
  const findMany = vi.fn().mockResolvedValue(candidates);
  const updateMany = vi.fn().mockResolvedValue({ count: updatedCount ?? candidates.length });
  return { client: { outreachTarget: { findMany, updateMany } }, findMany, updateMany };
}

describe('stageOutreachBatch', () => {
  it('throws on a non-integer limit', async () => {
    const { client } = makeClient([]);
    await expect(stageOutreachBatch(2.5, client)).rejects.toThrow('limit must be 1–30');
  });

  it('throws on a limit above 30', async () => {
    const { client } = makeClient([]);
    await expect(stageOutreachBatch(31, client)).rejects.toThrow('limit must be 1–30');
  });

  it('returns a null batchId when no enriched targets exist', async () => {
    const { client, updateMany } = makeClient([]);
    const result = await stageOutreachBatch(20, client);
    expect(result).toEqual({ staged: 0, batchId: null, shopDomains: [], skipped: 0 });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('stages candidates under a dated batchId', async () => {
    const { client, updateMany } = makeClient([
      { id: 't1', shopDomain: 'alpha.example.com' },
      { id: 't2', shopDomain: 'beta.example.com' },
    ]);
    const now = new Date('2026-06-07T18:00:00Z');

    const result = await stageOutreachBatch(20, client, now);

    expect(result.staged).toBe(2);
    expect(result.batchId).toMatch(/^batch-2026-06-07-[a-z0-9]{1,6}$/);
    expect(result.shopDomains).toEqual(['alpha.example.com', 'beta.example.com']);
    expect(result.skipped).toBe(0);

    const args = updateMany.mock.calls[0]![0] as {
      where: { id: { in: string[] }; status: string };
      data: { status: string; batchId: string };
    };
    expect(args.where.id.in).toEqual(['t1', 't2']);
    expect(args.where.status).toBe('enriched');
    expect(args.data.status).toBe('ready_for_approval');
    expect(args.data.batchId).toBe(result.batchId);
  });

  it('reports targets whose status changed mid-run as skipped', async () => {
    const { client } = makeClient(
      [
        { id: 't1', shopDomain: 'alpha.example.com' },
        { id: 't2', shopDomain: 'beta.example.com' },
      ],
      1,
    );
    const result = await stageOutreachBatch(20, client);
    expect(result.staged).toBe(1);
    expect(result.skipped).toBe(1);
  });
});
