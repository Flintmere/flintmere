import type { Metadata } from 'next';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { ContactForm } from '@/components/ContactForm';
import { ALL_TOPICS } from '@/lib/contact-routing';
import type { ContactTopic } from '@/generated/prisma';

/**
 * /contact — canonical destination for every public route to a Flintmere
 * inbox. Per `memory/feedback_no_mailto_links_anywhere.md` (locked
 * 2026-05-03), there are no mailto: links anywhere on the site; this page
 * is the single funnel.
 *
 * Topic preselected via `?topic=<slug>` query param so deep links from
 * /security, /privacy, /pricing carry the right routing context to the
 * form. Unknown topics fall back to "general".
 */

export const metadata: Metadata = {
  title: 'Contact — Flintmere',
  description:
    'Talk to Flintmere about a privacy or security question, billing, a Plus enquiry, a catalog letter, partnership, or anything else. We reply within two working days.',
  alternates: { canonical: 'https://flintmere.com/contact' },
};

export const dynamic = 'force-dynamic';

function isContactTopic(value: string | undefined): value is ContactTopic {
  return value !== undefined && (ALL_TOPICS as readonly string[]).includes(value);
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;
  const requested = params?.topic;
  const defaultTopic: ContactTopic = isContactTopic(requested)
    ? requested
    : 'general';

  return (
    <>
      <main
        id="main"
        className="flintmere-main bg-[color:var(--color-paper)]"
      >
        <section
          aria-labelledby="contact-heading"
          className="mx-auto max-w-[960px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(80px, 10vw, 160px)',
            paddingBottom: 'clamp(64px, 8vw, 128px)',
          }}
        >
          <p
            className="eyebrow-micro"
            style={{ marginBottom: 'clamp(28px, 4vw, 56px)' }}
          >
            Contact.
          </p>
          <h1
            id="contact-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
            style={{
              fontSize: 'var(--scale-h1-page)',
              letterSpacing: '-0.035em',
              lineHeight: 1.0,
            }}
          >
            Talk to <Bracket size="display">Flintmere</Bracket>.
          </h1>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[52ch]"
            style={{
              marginTop: 'clamp(24px, 4vw, 40px)',
              fontSize: '18px',
              lineHeight: 1.55,
            }}
          >
            Every message lands with the right pair of hands: privacy goes
            to privacy, security to security, billing to billing. Pick the
            topic that fits, write what&rsquo;s on your mind, we reply within
            two working days.
          </p>
          <div style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}>
            <ContactForm defaultTopic={defaultTopic} source="/contact" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
