import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

export const metadata: Metadata = {
  title: 'Audit booked',
  description: 'Your Flintmere concierge audit is booked. 48-hour delivery.',
};

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function AuditSuccess({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const calendly = process.env.CALENDLY_CONCIERGE_URL ?? '#';

  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center">
          <Link href="/" aria-label="Flintmere home" className="text-[18px] font-medium tracking-tight">
            Flintmere<span className="font-mono font-bold" aria-hidden="true">]</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[720px] px-8 py-24">
        <p className="eyebrow mb-6">Payment confirmed</p>
        <h1 className="max-w-[18ch]">
          You&rsquo;re <Bracket>in</Bracket>. We&rsquo;ll be in touch within 2 hours.
        </h1>
        <p
          className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          The operator will email you to confirm your kickoff time and the scope of the audit. If you haven&rsquo;t booked a 15-minute call yet, grab a slot now so we can start:
        </p>
        <a
          href={calendly}
          target="_blank"
          rel="noreferrer"
          className="btn btn-accent mt-8 inline-flex"
        >
          Book your kickoff call →
        </a>

        <p className="mt-12 text-[color:var(--color-mute)]" style={{ fontSize: 13, lineHeight: 1.55 }}>
          {session_id
            ? `Stripe session: ${session_id}. Keep this page bookmarked if you need to refer back.`
            : 'Check your inbox for the receipt and next steps.'}
        </p>
      </section>
    </main>
  );
}
