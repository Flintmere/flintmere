import type { Metadata } from 'next';
import { Bracket, SiteFooter } from '@flintmere/ui';

export const metadata: Metadata = {
  title: 'Audit booked',
  description: 'Your Flintmere concierge audit is booked. Delivered within three working days.',
};

interface Props {
  searchParams: Promise<{
    payment_intent?: string;
    redirect_status?: string;
  }>;
}

export default async function AuditSuccess({ searchParams }: Props) {
  const { payment_intent, redirect_status } = await searchParams;
  const calendly = process.env.CALENDLY_CONCIERGE_URL ?? '';
  const processing = redirect_status === 'processing';

  return (
    <main id="main" className="flintmere-main">
      <section className="bg-[color:var(--color-paper)] mx-auto max-w-[640px] px-6 py-24 text-center">
        <p className="eyebrow mb-6">
          {processing ? 'Payment processing' : 'Payment confirmed'}
        </p>
        <h1 className="mx-auto max-w-[16ch]">
          You&rsquo;re <Bracket>in</Bracket>.
        </h1>
        <p
          className="mx-auto mt-8 max-w-[48ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          We start reading your store today. Within three working days your
          audit letter, per-product CSV, and 30-day fix sequence will land in
          your inbox. No call needed — the URL is all we need.
        </p>
        <p
          className="mx-auto mt-4 max-w-[48ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          Watch for a confirmation email from the team in the next minute.
        </p>

        {calendly ? (
          <div
            className="mx-auto mt-12 max-w-[48ch] text-left"
            style={{
              borderTop: '1px solid var(--color-line-soft)',
              paddingTop: 24,
            }}
          >
            <p className="eyebrow mb-3">Optional</p>
            <p
              className="text-[color:var(--color-ink-2)]"
              style={{ fontSize: 14, lineHeight: 1.55 }}
            >
              If it&rsquo;s easier, book a 15-minute call to walk the team
              through the store. Most people skip this — the URL is all we
              need.
            </p>
            <a
              href={calendly}
              target="_blank"
              rel="noreferrer"
              className="btn mt-4 inline-flex"
            >
              Book a 15-minute call →
            </a>
          </div>
        ) : null}

        <p
          className="mt-16 text-[color:var(--color-mute)]"
          style={{ fontSize: 12, lineHeight: 1.55 }}
        >
          {payment_intent
            ? `Stripe receipt: ${payment_intent}. A separate receipt has been emailed for your records.`
            : 'A Stripe receipt has been emailed for your records.'}
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
