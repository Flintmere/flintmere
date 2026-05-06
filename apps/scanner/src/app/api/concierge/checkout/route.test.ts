import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { __resetRateLimitState } from '@/lib/rate-limit';

describe('concierge checkout route', () => {
  const ORIGINAL_KEY = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    __resetRateLimitState();
  });

  afterEach(() => {
    if (ORIGINAL_KEY !== undefined) {
      process.env.STRIPE_SECRET_KEY = ORIGINAL_KEY;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns 503 when STRIPE_SECRET_KEY missing', async () => {
    vi.resetModules();
    delete process.env.STRIPE_SECRET_KEY;

    const { POST } = await import('./route');
    const res = await POST(
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@store.com',
          shopUrl: 'meridian-coffee.myshopify.com',
          bandSlug: 'band-1',
        }),
      }) as unknown as import('next/server').NextRequest,
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('stripe-not-configured');
  });

  it('returns 400 when bandSlug is missing or invalid', async () => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({
        paymentIntents: { create: vi.fn() },
      }),
    }));

    const { POST } = await import('./route');

    const missing = await POST(
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@store.com',
          shopUrl: 'meridian-coffee.myshopify.com',
        }),
      }) as unknown as import('next/server').NextRequest,
    );
    expect(missing.status).toBe(400);

    const wrong = await POST(
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@store.com',
          shopUrl: 'meridian-coffee.myshopify.com',
          bandSlug: 'band-99',
        }),
      }) as unknown as import('next/server').NextRequest,
    );
    expect(wrong.status).toBe(400);

    vi.doUnmock('@/lib/stripe');
  });

  it('rejects band-3 with bespoke-band code (Band 3 routes to mailto, not Stripe)', async () => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

    const create = vi.fn();
    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({
        paymentIntents: { create },
      }),
    }));

    const { POST } = await import('./route');

    const res = await POST(
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@store.com',
          shopUrl: 'large-store.com',
          bandSlug: 'band-3',
        }),
      }) as unknown as import('next/server').NextRequest,
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('bespoke-band');
    expect(create).not.toHaveBeenCalled();

    vi.doUnmock('@/lib/stripe');
  });

  it('creates a £197 PaymentIntent for band-1 with audit_band metadata', async () => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

    const create = vi.fn().mockResolvedValue({
      id: 'pi_test_b1',
      client_secret: 'pi_test_b1_secret',
    });
    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({
        paymentIntents: { create },
      }),
    }));

    const { POST } = await import('./route');

    const res = await POST(
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@store.com',
          shopUrl: 'meridian-coffee.myshopify.com',
          bandSlug: 'band-1',
        }),
      }) as unknown as import('next/server').NextRequest,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.amountPence).toBe(19700);
    expect(body.bandSlug).toBe('band-1');

    expect(create).toHaveBeenCalledTimes(1);
    const args = create.mock.calls[0]![0] as Record<string, unknown>;
    expect(args.amount).toBe(19700);
    expect(args.currency).toBe('gbp');
    const metadata = args.metadata as Record<string, string>;
    expect(metadata.audit_band).toBe('band-1');
    expect(metadata.band_label).toBe('Band 1');
    expect(metadata.kind).toBe('concierge-audit');
    expect(args.statement_descriptor_suffix).toBe('FLINT B1');
    expect(args.statement_descriptor).toBeUndefined();

    // 3DS liability-shift floor — forces 3D Secure on every supported
    // card, regardless of region or Radar score. Closes the non-EEA
    // gap left by Stripe's `automatic` default.
    const pmo = args.payment_method_options as
      | { card?: { request_three_d_secure?: string } }
      | undefined;
    expect(pmo?.card?.request_three_d_secure).toBe('any');

    vi.doUnmock('@/lib/stripe');
  });

  it('returns 429 with Retry-After once the per-email burst is exhausted', async () => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

    const create = vi.fn().mockResolvedValue({
      id: 'pi_test_rl',
      client_secret: 'pi_test_rl_secret',
    });
    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({
        paymentIntents: { create },
      }),
    }));

    const { POST } = await import('./route');

    const makeReq = (ip: string) =>
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({
          email: 'rate-limit@store.com',
          shopUrl: 'meridian-coffee.myshopify.com',
          bandSlug: 'band-1',
        }),
      }) as unknown as import('next/server').NextRequest;

    // Five legitimate attempts from rotating IPs (so per-IP doesn't fire
    // first) consume the per-email burst.
    for (let i = 0; i < 5; i++) {
      const r = await POST(makeReq(`198.51.100.${i + 1}`));
      expect(r.status).toBe(200);
    }

    // Sixth attempt — same email — must be blocked with 429.
    const blocked = await POST(makeReq('198.51.100.99'));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toMatch(/^\d+$/);
    const body = await blocked.json();
    expect(body.code).toBe('rate-limited');
    expect(body.reason).toBe('email');
    // Stripe was not called for the blocked attempt.
    expect(create).toHaveBeenCalledTimes(5);

    vi.doUnmock('@/lib/stripe');
  });

  it('creates a £397 PaymentIntent for band-2', async () => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

    const create = vi.fn().mockResolvedValue({
      id: 'pi_test_b2',
      client_secret: 'pi_test_b2_secret',
    });
    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({
        paymentIntents: { create },
      }),
    }));

    const { POST } = await import('./route');

    const res = await POST(
      new Request('http://localhost/api/concierge/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@midsize.com',
          shopUrl: 'midsize-foods.myshopify.com',
          bandSlug: 'band-2',
        }),
      }) as unknown as import('next/server').NextRequest,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.amountPence).toBe(39700);
    expect(body.bandSlug).toBe('band-2');

    const args = create.mock.calls[0]![0] as Record<string, unknown>;
    expect(args.amount).toBe(39700);
    const metadata = args.metadata as Record<string, string>;
    expect(metadata.audit_band).toBe('band-2');
    expect(metadata.band_label).toBe('Band 2');
    expect(args.statement_descriptor_suffix).toBe('FLINT B2');
    expect(args.statement_descriptor).toBeUndefined();

    vi.doUnmock('@/lib/stripe');
  });
});
