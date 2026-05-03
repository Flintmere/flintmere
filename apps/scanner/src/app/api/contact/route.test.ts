import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// In-memory store of inserts so we can assert what was persisted.
const created: Array<Record<string, unknown>> = [];

vi.mock('@/lib/db', () => ({
  prisma: {
    contactMessage: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `mock-${created.length + 1}`, ...data };
        created.push(row);
        return row;
      }),
    },
  },
}));

const internalSends: Array<Record<string, unknown>> = [];
const confirmationSends: Array<Record<string, unknown>> = [];

vi.mock('@/lib/contact-email', () => ({
  sendContactInternalEmail: vi.fn(async (input: Record<string, unknown>) => {
    internalSends.push(input);
    return { id: 'internal-1', sent: true };
  }),
  sendContactConfirmationEmail: vi.fn(
    async (input: Record<string, unknown>) => {
      confirmationSends.push(input);
      return { id: 'confirmation-1', sent: true };
    },
  ),
}));

vi.mock('@/lib/hash', () => ({
  hashIp: vi.fn(() => 'hashed-ip'),
}));

import { POST } from './route';
import { __resetContactRateLimitState } from '@/lib/contact-rate-limit';

function makeRequest(body: unknown, ip = '203.0.113.10'): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      'user-agent': 'vitest-test-agent',
    },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  topic: 'general',
  name: 'Jane Doe',
  email: 'jane@example.com',
  company: 'Doe Foods',
  shopifyDomain: 'doe-foods.myshopify.com',
  message:
    'We sell artisan honey across three Shopify stores and we would like to talk about a Plus enquiry.',
  website: '',
  dwellMs: 8000,
  source: '/contact',
};

describe('POST /api/contact', () => {
  beforeEach(() => {
    created.length = 0;
    internalSends.length = 0;
    confirmationSends.length = 0;
    __resetContactRateLimitState();
  });

  it('persists the submission, fires both emails, returns 201', async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.submissionId).toMatch(/^mock-/);
    expect(json.internalSent).toBe(true);
    expect(json.confirmationSent).toBe(true);

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      topic: 'general',
      name: 'Jane Doe',
      email: 'jane@example.com',
      routedTo: 'support@flintmere.com',
      ipHash: 'hashed-ip',
      userAgent: 'vitest-test-agent',
    });

    expect(internalSends).toHaveLength(1);
    expect(internalSends[0]).toMatchObject({
      to: 'support@flintmere.com',
      topic: 'general',
    });
    expect(confirmationSends).toHaveLength(1);
    expect(confirmationSends[0]).toMatchObject({
      to: 'jane@example.com',
      topic: 'general',
    });
  });

  it('routes a privacy topic to privacy@', async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, topic: 'privacy', email: 'priv@example.com' }),
    );
    expect(res.status).toBe(201);
    expect(created[0]?.routedTo).toBe('privacy@flintmere.com');
    expect(internalSends[0]?.to).toBe('privacy@flintmere.com');
  });

  it('routes plus / concierge / partnership to john@', async () => {
    for (const topic of ['plus', 'concierge', 'partnership'] as const) {
      __resetContactRateLimitState();
      created.length = 0;
      internalSends.length = 0;
      await POST(
        makeRequest({
          ...VALID_BODY,
          topic,
          email: `${topic}@example.com`,
        }),
      );
      expect(created[0]?.routedTo).toBe('john@flintmere.com');
    }
  });

  it('rejects an invalid email with 422', async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, email: 'not-an-email' }),
    );
    expect(res.status).toBe(422);
    expect(created).toHaveLength(0);
  });

  it('rejects a too-short message with 422', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, message: 'too short' }));
    expect(res.status).toBe(422);
    expect(created).toHaveLength(0);
  });

  it('silently drops a honeypot-filled submission with 200', async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, website: 'https://spammer.example' }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.reason).toBe('honeypot');
    expect(created).toHaveLength(0);
    expect(internalSends).toHaveLength(0);
  });

  it('silently drops a too-fast submission (dwell < 3s) with 200', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, dwellMs: 500 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reason).toBe('dwell');
    expect(created).toHaveLength(0);
  });

  it('rate-limits per-IP after the burst budget is exhausted', async () => {
    // IP_POLICY.capacity = 5 in contact-rate-limit.ts. Six successive
    // submissions from the same IP should see the 6th rejected as 429.
    const ip = '198.51.100.7';
    for (let i = 0; i < 5; i++) {
      const res = await POST(
        makeRequest(
          { ...VALID_BODY, email: `flood-${i}@example.com` },
          ip,
        ),
      );
      expect(res.status).toBe(201);
    }
    const sixth = await POST(
      makeRequest({ ...VALID_BODY, email: 'flood-6@example.com' }, ip),
    );
    expect(sixth.status).toBe(429);
    const json = await sixth.json();
    expect(json.code).toBe('rate-limited');
    expect(json.reason).toBe('ip');
    expect(sixth.headers.get('Retry-After')).toMatch(/^\d+$/);
  });

  it('rate-limits per-email after the same address submits too many times', async () => {
    // EMAIL_POLICY.capacity = 3. Use distinct IPs so per-IP isn't the cause.
    for (let i = 0; i < 3; i++) {
      const res = await POST(
        makeRequest(
          { ...VALID_BODY, email: 'sameaddr@example.com' },
          `192.0.2.${i + 1}`,
        ),
      );
      expect(res.status).toBe(201);
    }
    const fourth = await POST(
      makeRequest(
        { ...VALID_BODY, email: 'sameaddr@example.com' },
        '192.0.2.99',
      ),
    );
    expect(fourth.status).toBe(429);
    const json = await fourth.json();
    expect(json.reason).toBe('email');
  });
});
