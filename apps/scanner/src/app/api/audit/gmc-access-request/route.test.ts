import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auditFindUnique = vi.fn();
const accessRequestCreate = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    conciergeAudit: {
      findUnique: (...args: unknown[]) => auditFindUnique(...args),
    },
    gmcAccessRequest: {
      create: (...args: unknown[]) => accessRequestCreate(...args),
    },
  },
}));

import { POST } from './route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3001/api/audit/gmc-access-request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/audit/gmc-access-request', () => {
  beforeEach(() => {
    auditFindUnique.mockReset();
    accessRequestCreate.mockReset();
    accessRequestCreate.mockResolvedValue({ id: 'gar_1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 on missing fields', async () => {
    const res = await POST(makeRequest({ auditId: 'a' }));
    expect(res.status).toBe(400);
    expect(accessRequestCreate).not.toHaveBeenCalled();
  });

  it('returns 400 on bad email', async () => {
    const res = await POST(
      makeRequest({
        auditId: 'aud_1',
        email: 'not-an-email',
        shopUrl: 'https://acme.com',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when audit not found', async () => {
    auditFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest({
        auditId: 'aud_missing',
        email: 'op@acme.com',
        shopUrl: 'https://acme.com',
      }),
    );
    expect(res.status).toBe(404);
    expect(accessRequestCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when audit is refunded', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_r',
      status: 'refunded',
      shopUrl: 'https://acme.com',
      email: 'op@acme.com',
    });
    const res = await POST(
      makeRequest({
        auditId: 'aud_r',
        email: 'op@acme.com',
        shopUrl: 'https://acme.com',
      }),
    );
    expect(res.status).toBe(403);
    expect(accessRequestCreate).not.toHaveBeenCalled();
  });

  it('inserts a row for paid audit', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_paid',
      status: 'paid',
      shopUrl: 'https://www.acme.com/products',
      email: 'op@acme.com',
    });
    const res = await POST(
      makeRequest({
        auditId: 'aud_paid',
        email: 'OP@acme.com',
        shopUrl: 'https://www.acme.com/products',
        reason: 'Specific products are showing as suppressed',
      }),
    );
    expect(res.status).toBe(200);
    expect(accessRequestCreate).toHaveBeenCalledTimes(1);
    const args = accessRequestCreate.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(args.data.auditId).toBe('aud_paid');
    expect(args.data.email).toBe('op@acme.com');
    expect(args.data.normalisedDomain).toBe('acme.com');
    expect(args.data.reason).toBe('Specific products are showing as suppressed');
  });

  it('inserts a row for delivered audit', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_delivered',
      status: 'delivered',
      shopUrl: 'https://shop.example.co.uk',
      email: 'op@example.co.uk',
    });
    const res = await POST(
      makeRequest({
        auditId: 'aud_delivered',
        email: 'op@example.co.uk',
        shopUrl: 'https://shop.example.co.uk',
      }),
    );
    expect(res.status).toBe(200);
    expect(accessRequestCreate).toHaveBeenCalledTimes(1);
  });

  it('treats empty reason as null', async () => {
    auditFindUnique.mockResolvedValue({
      id: 'aud_paid',
      status: 'paid',
      shopUrl: 'https://acme.com',
      email: 'op@acme.com',
    });
    await POST(
      makeRequest({
        auditId: 'aud_paid',
        email: 'op@acme.com',
        shopUrl: 'https://acme.com',
        reason: '   ',
      }),
    );
    const args = accessRequestCreate.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(args.data.reason).toBeNull();
  });
});
