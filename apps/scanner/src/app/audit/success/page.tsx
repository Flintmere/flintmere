import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

export const metadata: Metadata = {
  title: 'Audit booked',
  description: 'Your Flintmere concierge audit is booked. 48-hour delivery.',
};

interface Props {
  searchParams: Promise<{
    payment_intent?: string;
    redirect_status?: string;
  }>;
}

export default async function AuditSuccess({ searchParams }: Props) {
  const { payment_intent, redirect_status } = await searchParams;
  const calendly = process.env.CALENDLY_CONCIERGE_URL ?? '#';
  const processing = redirect_status === 'processing';

  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center">
          <Link
            href="/"
            aria-label="Flintmere home"
            className="text-[18px] font-medium tracking-tight"
          >
            Flintmere
            <span className="font-mono font-bold" aria-hidden="true">
              ]
            </span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[640px] px-6 py-24 text-center">
        <p className="eyebrow mb-6">
          {processing ? 'Payment processing' : 'Payment confirmed'}
        </p>
        <h1 className="mx-auto max-w-[16ch]">
          You&rsquo;re <Bracket>in</Bracket>.
        </h1>
        <p
          className="mx-auto mt-8 max-w-[44ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          Book your 15-minute kickoff call now — we start auditing the moment
          it&rsquo;s on the calendar.
        </p>
        <a
          href={calendly}
          target="_blank"
          rel="noreferrer"
          className="btn btn-accent mt-8 inline-flex"
        >
          Book your kickoff call →
        </a>

        <p
          className="mt-16 text-[color:var(--color-mute)]"
          style={{ fontSize: 12, lineHeight: 1.55 }}
        >
          {payment_intent
            ? `Stripe receipt: ${payment_intent}. Check your inbox for the confirmation email.`
            : 'Check your inbox for the receipt and next steps.'}
        </p>
      </section>
    </main>
  );
}
