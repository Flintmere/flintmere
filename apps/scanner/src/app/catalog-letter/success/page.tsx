import type { Metadata } from 'next';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { prisma } from '@/lib/db';
import { isFeatureEnabled } from '@/lib/gmc/oauth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Audit booked',
  description: 'Your Flintmere concierge audit is booked. Delivered within three working days.',
  robots: { index: false, follow: false },
};

// Connect-friction spec (2026-06-07) fix 3 — resolve the buyer's audit from
// their payment-intent (possessed in the URL) and offer the connect path on
// the deliverable surface. Gated behind FEATURE_GMC_OAUTH; returns null when
// the flag is off, so it ships dark with the rest of the OAuth surface.
async function resolveConnectAuditId(
  paymentIntentId: string | undefined,
): Promise<string | null> {
  if (!isFeatureEnabled() || !paymentIntentId) return null;
  const audit = await prisma.conciergeAudit.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true, status: true },
  });
  if (!audit) return null;
  if (audit.status !== 'paid' && audit.status !== 'delivered') return null;
  return audit.id;
}

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
  const connectAuditId = await resolveConnectAuditId(payment_intent);

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

        {connectAuditId ? (
          <div
            className="mx-auto mt-12 max-w-[48ch]"
            style={{
              padding: '20px 24px',
              border: '1px solid var(--color-line)',
              borderLeft: '3px solid var(--color-accent)',
              background: 'var(--color-paper)',
              textAlign: 'left',
            }}
          >
            <p className="eyebrow" style={{ margin: 0, color: 'var(--color-mute)' }}>
              Optional · ground-truth track
            </p>
            <p
              className="mt-3"
              style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--color-ink-2)' }}
            >
              Connect Google Merchant Center and your audit reads Google&rsquo;s
              own disapproval reasons, not just public signals. Access is
              restricted to read-only at our call-site. Disconnect anytime.
            </p>
            <p style={{ marginTop: 16 }}>
              <a
                href={`/catalog-letter/connect?audit=${encodeURIComponent(connectAuditId)}`}
                className="text-[color:var(--color-ink)] underline"
                style={{ textUnderlineOffset: 3 }}
              >
                Connect Merchant Center →
              </a>
            </p>
          </div>
        ) : null}

        {calendly ? (
          <p
            className="mt-12 text-[color:var(--color-mute)]"
            style={{ fontSize: 12, lineHeight: 1.55 }}
          >
            Prefer voice?{' '}
            <a
              href={calendly}
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--color-ink)] underline"
            >
              Book a quick call →
            </a>
          </p>
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
