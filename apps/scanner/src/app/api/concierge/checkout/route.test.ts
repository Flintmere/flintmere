import { describe, expect, it, vi } from 'vitest';

describe('concierge checkout route', () => {
  it('returns 503 when STRIPE_SECRET_KEY missing', async () => {
    vi.resetModules();
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const { POST } = await import('./route');
    const res = await POST(
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@store.com',
          shopUrl: 'meridian-coffee.myshopify.com',
        }),
      }) as unknown as import('next/server').NextRequest,
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('stripe-not-configured');

    if (original !== undefined) process.env.STRIPE_SECRET_KEY = original;
  });
});
