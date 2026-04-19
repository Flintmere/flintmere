import Link from 'next/link';
import { Bracket } from '@/components/Bracket';

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { status } = await searchParams;
  const isOk = status === 'ok';

  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" className="text-[18px] font-medium tracking-tight">
            Flintmere
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[720px] px-8 py-24">
        <p className="eyebrow mb-6">Email preferences</p>
        {isOk ? (
          <>
            <h1 className="max-w-[20ch]">
              You&rsquo;re <Bracket>unsubscribed</Bracket>.
            </h1>
            <p
              className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
              style={{ fontSize: 17, lineHeight: 1.55 }}
            >
              No more Flintmere scanner reports or updates to this address. Your scan data is retained for 30 days; after that, it&rsquo;s purged.
            </p>
            <p
              className="mt-4 text-[color:var(--color-mute)]"
              style={{ fontSize: 14 }}
            >
              If you unsubscribed by mistake, you can run another scan and opt in again at <Link href="/scan" className="underline">audit.flintmere.com/scan</Link>.
            </p>
          </>
        ) : (
          <>
            <h1 className="max-w-[20ch]">That link is <Bracket>invalid</Bracket>.</h1>
            <p
              className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
              style={{ fontSize: 17, lineHeight: 1.55 }}
            >
              The unsubscribe token is expired, malformed, or already used. If you keep getting emails you don&rsquo;t want, reply to any Flintmere email with &quot;unsubscribe&quot; and we&rsquo;ll take care of it manually.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
