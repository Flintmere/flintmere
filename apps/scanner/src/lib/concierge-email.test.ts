import { afterEach, describe, expect, it, vi } from 'vitest';

interface Captured {
  subject: string;
  html: string;
  text: string;
  tags: Array<{ name: string; value: string }> | undefined;
}

async function loadWithCaptureSendEmail(): Promise<{
  send: (args: {
    bandSlug: 'band-1' | 'band-2' | 'band-3';
  }) => Promise<Captured>;
  sendOps: (args: {
    bandSlug: 'band-1' | 'band-2' | 'band-3';
  }) => Promise<Captured>;
}> {
  vi.resetModules();
  const captured: Captured[] = [];
  vi.doMock('./resend', () => ({
    sendEmail: async (args: {
      to: string;
      subject: string;
      html: string;
      text: string;
      tags?: Array<{ name: string; value: string }>;
    }) => {
      captured.push({
        subject: args.subject,
        html: args.html,
        text: args.text,
        tags: args.tags,
      });
      return { sent: true } as const;
    },
  }));
  const mod = await import('./concierge-email');
  return {
    send: async ({ bandSlug }) => {
      captured.length = 0;
      await mod.sendConciergeCustomerEmail({
        to: 'merchant@store.com',
        shopUrl: 'meridian-coffee.myshopify.com',
        calendlyUrl: null,
        bandSlug,
      });
      return captured[0]!;
    },
    sendOps: async ({ bandSlug }) => {
      captured.length = 0;
      await mod.sendConciergeOpsEmail({
        to: 'ops@flintmere.com',
        customerEmail: 'merchant@store.com',
        shopUrl: 'meridian-coffee.myshopify.com',
        paymentIntentId: 'pi_test_123',
        bandSlug,
      });
      return captured[0]!;
    },
  };
}

afterEach(() => {
  vi.doUnmock('./resend');
  vi.resetModules();
});

describe('sendConciergeCustomerEmail', () => {
  it('uses Band 1 wording (worst 10) and £197 in body for band-1', async () => {
    const { send } = await loadWithCaptureSendEmail();
    const c = await send({ bandSlug: 'band-1' });

    expect(c.subject).toContain('Band 1');
    expect(c.text).toContain('£197');
    expect(c.text).toContain('worst 10 products drafted');
    expect(c.html).toContain('£197');
    expect(c.html).toContain('Band 1');
    expect(c.html).toContain('worst 10 products drafted');

    expect(c.tags).toEqual(
      expect.arrayContaining([{ name: 'band', value: 'band-1' }]),
    );
  });

  it('uses Band 2 wording (worst 25) and £397 in body for band-2', async () => {
    const { send } = await loadWithCaptureSendEmail();
    const c = await send({ bandSlug: 'band-2' });

    expect(c.subject).toContain('Band 2');
    expect(c.text).toContain('£397');
    expect(c.text).toContain('worst 25 products drafted');
    expect(c.html).toContain('£397');
    expect(c.html).toContain('worst 25 products drafted');
  });

  it('uses representative-sample wording for band-3', async () => {
    const { send } = await loadWithCaptureSendEmail();
    const c = await send({ bandSlug: 'band-3' });

    expect(c.text).toContain('representative sample');
    expect(c.text).toContain('worst 25 products drafted');
    expect(c.html).toContain('representative sample');
  });
});

describe('sendConciergeOpsEmail', () => {
  it('shows the band, SKU range, and price in the ops table', async () => {
    const { sendOps } = await loadWithCaptureSendEmail();
    const c = await sendOps({ bandSlug: 'band-2' });

    expect(c.subject).toContain('Band 2');
    expect(c.text).toContain('Band 2');
    expect(c.text).toContain('1,501–5,000 SKUs');
    expect(c.text).toContain('£397');
    expect(c.text).toContain('Full per-product audit');
    expect(c.text).toContain('worst 25 fully drafted');
  });

  it('shows representative-sample scope for band-3', async () => {
    const { sendOps } = await loadWithCaptureSendEmail();
    const c = await sendOps({ bandSlug: 'band-3' });

    expect(c.text).toContain('Representative-sample audit');
    expect(c.text).toContain('5,001+ SKUs');
  });
});
