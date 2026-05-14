import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { fetchBetterStack } from './_signals/betterstack';
import { fetchPlausibleViews } from './_signals/plausible';
import { fetchResendBounces } from './_signals/resend';
import { fetchOutreachCounts } from './_signals/outreach';
import { fetchSentryNewIssues } from './_signals/sentry';
import { HealthCard } from './_components/HealthCard';

export const metadata: Metadata = {
  title: 'Health — Flintmere operator',
  robots: 'noindex, nofollow',
};

// Dynamic — requireAdmin() reads cookies(). The five signal fetches
// individually opt into the 60s data cache via `next.revalidate`, so
// F5-spam on this page doesn't burn upstream API budget.
export const dynamic = 'force-dynamic';

// Council pre-flight (per memory binding 2026-05-09 + admin console
// parity with /admin/outreach):
//   1. /admin/outreach — operator console pattern: paper background,
//      bracket H1, eyebrow row, dense type-only sections.
//   2. /admin/audit-draft — colocated `_components` / page-private
//      module layout under the route folder.
//   3. memory/design/tokens.md §Signature — one bracket moment per
//      page; the H1 carries it.
export default async function AdminHealthPage() {
  const admin = await requireAdmin(cookies, process.env);
  if (!admin) redirect('/admin/login?error=unauth');

  const [betterstack, resend, plausible, outreach, sentry] = await Promise.all(
    [
      fetchBetterStack(),
      fetchResendBounces(),
      fetchPlausibleViews(),
      fetchOutreachCounts(),
      fetchSentryNewIssues(),
    ],
  );

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--color-paper)',
        color: 'var(--color-ink)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '3rem 1.5rem 6rem',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          <p
            className="eyebrow"
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <span>Flintmere</span>
            <span aria-hidden="true">·</span>
            <span>Operator</span>
            <span aria-hidden="true">·</span>
            <span>Daily check</span>
          </p>
          <h1
            className="bracket"
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.1,
            }}
          >
            Health
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: '64ch',
              fontSize: '0.9375rem',
              lineHeight: 1.55,
              color: 'var(--color-ink-2)',
            }}
          >
            Five signals, one glance. Each card caches 60s — refresh to
            force a poll. Drill into anything red via the card&rsquo;s
            open-link.
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
          }}
        >
          <HealthCard title="BetterStack" signal={betterstack} />
          <HealthCard title="Resend" signal={resend} />
          <HealthCard title="Plausible" signal={plausible} />
          <HealthCard title="Outreach" signal={outreach} />
          <HealthCard title="Sentry" signal={sentry} />
        </section>
      </div>
    </main>
  );
}
