import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

interface Captured {
  subject: string;
  html: string;
  text: string;
}

async function loadWithCaptureSendEmail(): Promise<{
  send: (args: {
    auditId?: string;
  }) => Promise<Captured>;
}> {
  vi.resetModules();
  const captured: Captured[] = [];
  vi.doMock('./resend', () => ({
    sendEmail: async (args: {
      subject: string;
      html: string;
      text: string;
    }) => {
      captured.push({ subject: args.subject, html: args.html, text: args.text });
      return { sent: true } as const;
    },
  }));
  const mod = await import('./concierge-delivery-email');
  return {
    send: async ({ auditId }) => {
      captured.length = 0;
      await mod.sendConciergeDeliveryEmail({
        to: 'op@acme.com',
        shopUrl: 'acme.myshopify.com',
        bandSlug: 'band-1',
        letterFilename: 'letter.pdf',
        letterBuffer: Buffer.from('letter'),
        csvFilename: 'audit.csv',
        csvBuffer: Buffer.from('csv'),
        auditId,
      });
      return captured[0]!;
    },
  };
}

describe('sendConciergeDeliveryEmail', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://audit.flintmere.com';
  });

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it('includes GMC connect link when auditId is provided', async () => {
    const { send } = await loadWithCaptureSendEmail();
    const email = await send({ auditId: 'aud_123' });
    const expectedUrl =
      'https://audit.flintmere.com/catalog-letter/connect?audit=aud_123';
    expect(email.html).toContain(expectedUrl);
    expect(email.text).toContain(expectedUrl);
    expect(email.html).toContain('Connect Google Merchant Center');
    expect(email.text).toContain('Connect Google Merchant Center');
  });

  it('omits GMC connect link when auditId is absent', async () => {
    const { send } = await loadWithCaptureSendEmail();
    const email = await send({});
    expect(email.html).not.toContain('/catalog-letter/connect');
    expect(email.text).not.toContain('/catalog-letter/connect');
    expect(email.html).not.toContain('Connect Google Merchant Center');
  });

  it('keeps the audit-letter narrative even when connect is included', async () => {
    const { send } = await loadWithCaptureSendEmail();
    const email = await send({ auditId: 'aud_456' });
    expect(email.text).toContain('Read the letter first');
    expect(email.text).toContain('per-product CSV');
  });
});
