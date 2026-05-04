import { describe, expect, it, vi, afterEach } from 'vitest';

const ORIGINAL = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

describe('POST /api/webhooks/stripe', () => {
  afterEach(() => {
    for (const [k, v] of Object.entries(ORIGINAL)) {
      if (v !== undefined) process.env[k] = v;
      else delete process.env[k];
    }
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  function setupEnv() {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy';
  }

  function makeRequest(opts: { signature?: string | null; body?: string } = {}) {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (opts.signature !== null) {
      headers['stripe-signature'] = opts.signature ?? 't=1,v1=fake';
    }
    return new Request('https://audit.flintmere.com/api/webhooks/stripe', {
      method: 'POST',
      headers,
      body: opts.body ?? '{}',
    }) as unknown as import('next/server').NextRequest;
  }

  it('returns 503 when Stripe env vars are missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.resetModules();
    vi.doMock('@/lib/db', () => ({ prisma: {} }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('stripe-not-configured');

    vi.doUnmock('@/lib/db');
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    setupEnv();
    vi.resetModules();
    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({
        webhooks: { constructEvent: vi.fn() },
      }),
    }));
    vi.doMock('@/lib/db', () => ({ prisma: {} }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ signature: null }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('missing-signature');

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
  });

  it('returns 400 when signature verification fails', async () => {
    setupEnv();
    vi.resetModules();
    const constructEvent = vi.fn().mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });
    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({ prisma: {} }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('bad-signature');
    expect(constructEvent).toHaveBeenCalledTimes(1);

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
  });

  it('happy path — payment_intent.succeeded creates concierge row, sends both emails, marks notificationSentAt', async () => {
    setupEnv();
    vi.resetModules();
    const conciergeRow = { id: 'ca_new', notificationSentAt: null };
    const upsert = vi.fn().mockResolvedValue(conciergeRow);
    const update = vi.fn().mockResolvedValue({ ...conciergeRow, notificationSentAt: new Date() });
    const sendCustomer = vi.fn().mockResolvedValue({ sent: true });
    const sendOps = vi.fn().mockResolvedValue({ sent: true });

    const event = {
      id: 'evt_test_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_live_1',
          metadata: {
            kind: 'concierge-audit',
            email: 'merchant@store.com',
            shop_url: 'meridian-coffee.myshopify.com',
            audit_band: 'band-1',
          },
          receipt_email: 'merchant@store.com',
        },
      },
    };
    const constructEvent = vi.fn().mockReturnValue(event);

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: { conciergeAudit: { upsert, update } },
    }));
    vi.doMock('@/lib/concierge-email', () => ({
      sendConciergeCustomerEmail: sendCustomer,
      sendConciergeOpsEmail: sendOps,
    }));
    vi.doMock('@/lib/stripe-invoice', () => ({
      createConciergeInvoice: vi.fn().mockResolvedValue(null),
    }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.received).toBe('evt_test_1');
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripePaymentIntentId: 'pi_live_1' },
      }),
    );
    expect(sendCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'merchant@store.com',
        shopUrl: 'meridian-coffee.myshopify.com',
        bandSlug: 'band-1',
      }),
    );
    expect(sendOps).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripePaymentIntentId: 'pi_live_1' },
        data: expect.objectContaining({ notificationSentAt: expect.any(Date) }),
      }),
    );

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/concierge-email');
    vi.doUnmock('@/lib/stripe-invoice');
  });

  it('issues a Stripe invoice and threads URL into the customer email', async () => {
    setupEnv();
    vi.resetModules();
    const upsert = vi.fn().mockResolvedValue({ id: 'ca_inv', notificationSentAt: null });
    const update = vi.fn().mockResolvedValue({});
    const sendCustomer = vi.fn().mockResolvedValue({ sent: true });
    const sendOps = vi.fn().mockResolvedValue({ sent: true });
    const createInvoice = vi.fn().mockResolvedValue({
      hostedUrl: 'https://invoice.stripe.com/i/acct_x/test_y',
      pdfUrl: 'https://pay.stripe.com/invoice/test_y/pdf',
      number: 'FLINT-0001',
    });

    const event = {
      id: 'evt_invoice_test',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_invoice',
          metadata: {
            kind: 'concierge-audit',
            email: 'merchant@store.com',
            shop_url: 'meridian-coffee.myshopify.com',
            audit_band: 'band-2',
          },
        },
      },
    };
    const constructEvent = vi.fn().mockReturnValue(event);

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: { conciergeAudit: { upsert, update } },
    }));
    vi.doMock('@/lib/concierge-email', () => ({
      sendConciergeCustomerEmail: sendCustomer,
      sendConciergeOpsEmail: sendOps,
    }));
    vi.doMock('@/lib/stripe-invoice', () => ({
      createConciergeInvoice: createInvoice,
    }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'merchant@store.com',
        shopUrl: 'meridian-coffee.myshopify.com',
        paymentIntentId: 'pi_invoice',
        bandSlug: 'band-2',
      }),
    );
    expect(sendCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: expect.objectContaining({
          hostedUrl: 'https://invoice.stripe.com/i/acct_x/test_y',
          pdfUrl: 'https://pay.stripe.com/invoice/test_y/pdf',
          number: 'FLINT-0001',
        }),
      }),
    );

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/concierge-email');
    vi.doUnmock('@/lib/stripe-invoice');
  });

  it('booking still completes when invoice creation fails (graceful degrade)', async () => {
    setupEnv();
    vi.resetModules();
    const upsert = vi.fn().mockResolvedValue({ id: 'ca_noinv', notificationSentAt: null });
    const update = vi.fn().mockResolvedValue({});
    const sendCustomer = vi.fn().mockResolvedValue({ sent: true });
    const sendOps = vi.fn().mockResolvedValue({ sent: true });
    const createInvoice = vi.fn().mockResolvedValue(null);

    const event = {
      id: 'evt_noinvoice',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_noinvoice',
          metadata: {
            kind: 'concierge-audit',
            email: 'merchant@store.com',
            shop_url: 'meridian-coffee.myshopify.com',
            audit_band: 'band-1',
          },
        },
      },
    };
    const constructEvent = vi.fn().mockReturnValue(event);

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: { conciergeAudit: { upsert, update } },
    }));
    vi.doMock('@/lib/concierge-email', () => ({
      sendConciergeCustomerEmail: sendCustomer,
      sendConciergeOpsEmail: sendOps,
    }));
    vi.doMock('@/lib/stripe-invoice', () => ({
      createConciergeInvoice: createInvoice,
    }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(createInvoice).toHaveBeenCalledTimes(1);
    expect(sendCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ invoice: null }),
    );
    expect(update).toHaveBeenCalledTimes(1); // notificationSentAt still flipped

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/concierge-email');
    vi.doUnmock('@/lib/stripe-invoice');
  });

  it('idempotent replay — duplicate event for same intent skips email send when notificationSentAt already set', async () => {
    setupEnv();
    vi.resetModules();
    const alreadyDone = new Date('2026-05-01T00:00:00Z');
    const upsert = vi.fn().mockResolvedValue({
      id: 'ca_existing',
      notificationSentAt: alreadyDone,
    });
    const update = vi.fn();
    const sendCustomer = vi.fn();
    const sendOps = vi.fn();

    const event = {
      id: 'evt_test_replay',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_live_existing',
          metadata: {
            kind: 'concierge-audit',
            email: 'merchant@store.com',
            shop_url: 'meridian-coffee.myshopify.com',
            audit_band: 'band-1',
          },
        },
      },
    };
    const constructEvent = vi.fn().mockReturnValue(event);

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: { conciergeAudit: { upsert, update } },
    }));
    vi.doMock('@/lib/concierge-email', () => ({
      sendConciergeCustomerEmail: sendCustomer,
      sendConciergeOpsEmail: sendOps,
    }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(sendCustomer).not.toHaveBeenCalled();
    expect(sendOps).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/concierge-email');
  });

  it('partial email failure — DB row created, notificationSentAt NOT set so a retry can re-send', async () => {
    setupEnv();
    vi.resetModules();
    const upsert = vi
      .fn()
      .mockResolvedValue({ id: 'ca_partial', notificationSentAt: null });
    const update = vi.fn();
    const sendCustomer = vi.fn().mockResolvedValue({ sent: true });
    const sendOps = vi.fn().mockResolvedValue({ sent: false, reason: 'resend-503' });

    const event = {
      id: 'evt_test_partial',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_live_partial',
          metadata: {
            kind: 'concierge-audit',
            email: 'merchant@store.com',
            shop_url: 'meridian-coffee.myshopify.com',
            audit_band: 'band-2',
          },
        },
      },
    };
    const constructEvent = vi.fn().mockReturnValue(event);

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: { conciergeAudit: { upsert, update } },
    }));
    vi.doMock('@/lib/concierge-email', () => ({
      sendConciergeCustomerEmail: sendCustomer,
      sendConciergeOpsEmail: sendOps,
    }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(sendCustomer).toHaveBeenCalledTimes(1);
    expect(sendOps).toHaveBeenCalledTimes(1);
    // critical: notificationSentAt NOT marked because one of the sends failed
    expect(update).not.toHaveBeenCalled();

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/concierge-email');
  });

  it('non-concierge payment intent is acknowledged but skipped (no DB write, no emails)', async () => {
    setupEnv();
    vi.resetModules();
    const upsert = vi.fn();
    const sendCustomer = vi.fn();
    const sendOps = vi.fn();

    const event = {
      id: 'evt_test_other',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_other',
          metadata: { kind: 'something-else' },
        },
      },
    };
    const constructEvent = vi.fn().mockReturnValue(event);

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: { conciergeAudit: { upsert, update: vi.fn() } },
    }));
    vi.doMock('@/lib/concierge-email', () => ({
      sendConciergeCustomerEmail: sendCustomer,
      sendConciergeOpsEmail: sendOps,
    }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(upsert).not.toHaveBeenCalled();
    expect(sendCustomer).not.toHaveBeenCalled();
    expect(sendOps).not.toHaveBeenCalled();

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/concierge-email');
  });

  it('handler exception bubbles to 500 so Stripe retries', async () => {
    setupEnv();
    vi.resetModules();
    const upsert = vi.fn().mockRejectedValue(new Error('database connection lost'));
    const event = {
      id: 'evt_test_dberr',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_dberr',
          metadata: {
            kind: 'concierge-audit',
            email: 'merchant@store.com',
            shop_url: 'meridian-coffee.myshopify.com',
            audit_band: 'band-1',
          },
        },
      },
    };
    const constructEvent = vi.fn().mockReturnValue(event);

    vi.doMock('@/lib/stripe', () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));
    vi.doMock('@/lib/db', () => ({
      prisma: { conciergeAudit: { upsert, update: vi.fn() } },
    }));
    vi.doMock('@/lib/concierge-email', () => ({
      sendConciergeCustomerEmail: vi.fn(),
      sendConciergeOpsEmail: vi.fn(),
    }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('handler-failed');

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/concierge-email');
  });
});
