import type { Metadata } from 'next';
import { Bracket } from '@flintmere/ui';
import { StandardsShell } from '@/components/standards/StandardsShell';
import { PUBLISHED_AT } from '@/lib/standards/food-v1-fields';

/**
 * `/about` on the standards host — the operating model.
 *
 * A distinct page from flintmere.com/about, deliberately: the binding IA
 * §Routes table resolves this as standalone because academics cite this
 * URL and sending them to a commercial about-page mid-citation is a
 * context switch that costs credibility. Procurement detail stays on
 * flintmere.com and is linked, not duplicated.
 *
 * This page is also why `STANDARDS_OWNED_PREFIXES` in host-routing.ts
 * exists — without it, /about on this host 301s away to flintmere.com
 * because /about is also a marketing route.
 *
 * Per ADR 0015's public-framing rule, no single-named-individual framing:
 * the operating model is described by function and council seat.
 */
export const dynamic = 'force-static';

const PAGE_URL = 'https://standards.flintmere.com/about';

export const metadata: Metadata = {
  title: 'About the Flintmere standards',
  description:
    'How the Flintmere food catalog standard is maintained: who reviews it, on what cadence, how versions are numbered, and what the URL stability guarantee actually promises.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'About the Flintmere standards',
    description:
      'How the Flintmere food catalog standard is maintained, reviewed, and versioned.',
    url: PAGE_URL,
    type: 'article',
  },
};

const PAD = {
  paddingLeft: 'clamp(24px, 4vw, 48px)',
  paddingRight: 'clamp(24px, 4vw, 48px)',
} as const;

const SECTIONS = [
  {
    id: 'who',
    eyebrow: 'Who maintains it.',
    heading: 'Flintmere Regulatory Affairs, council seat #39.',
    body: [
      'Flintmere runs a standing council of functional seats. Seat #39, Regulatory Affairs, owns the accuracy of everything published here and holds a veto on regulatory claims — including a veto on the scope statement at the foot of every page.',
      'Flintmere is a commercial company: we sell catalog auditing and a Shopify app. This standard is published free, under CC-BY 4.0, because a specification nobody can read or cite is worth nothing as a specification. We would rather it be used than owned.',
    ],
  },
  {
    id: 'cadence',
    eyebrow: 'How often it changes.',
    heading: 'Half-yearly releases, continuous monitoring.',
    body: [
      'Numbered releases publish half-yearly. Between releases, an automated monitor watches the regulator sources each field cites and flags changes for review.',
      'We deliberately do not name the months. A published cadence we might miss would cost more credibility than the planning convenience is worth.',
      'Nothing the monitor flags reaches a public page without review. Every published change-log entry carries both dates — when it was flagged, and when it was reviewed.',
    ],
  },
  {
    id: 'versions',
    eyebrow: 'How versions work.',
    heading: 'Pinned URLs never change meaning.',
    body: [
      'A pinned URL — /food/v1.0/ — is immutable once published. A correction does not edit it; a correction publishes v1.0.1 at its own URL and leaves the original in place.',
      'Old versions stay live indefinitely, including after a major release supersedes them. A citation made today resolves to the same document years from now, which is the only property that makes a URL worth citing at all.',
      'A continuous-integration check hashes the specification and fails the build if a published version changes without a paired change-log entry. The guarantee is enforced, not just promised.',
    ],
  },
  {
    id: 'contributions',
    eyebrow: 'Contributing.',
    heading: 'Issues and corrections, yes. Merged changes, from v1.1.',
    body: [
      'Corrections and challenges are welcome now and are the fastest way to improve the document — particularly from anyone who works with these regulations directly.',
      'We are not merging external changes before v1.1. One reviewer cannot sustain a merge cadence, and saying so is more honest than a contribution process that quietly stalls.',
    ],
  },
] as const;

export default function StandardsAbout() {
  return (
    <StandardsShell
      reviewedOn={PUBLISHED_AT}
      citable={{
        title: 'About the Flintmere standards',
        url: PAGE_URL,
        publishedAt: PUBLISHED_AT,
        bibtexKey: 'flintmere2026standardsabout',
      }}
    >
      <section
        aria-labelledby="about-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(56px, 7vw, 112px)', paddingBottom: 'clamp(40px, 5vw, 72px)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 'clamp(24px, 3vw, 40px)' }}
        >
          About.
        </p>
        <h1
          id="about-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
          style={{ fontSize: 'var(--scale-h1-anchor)', letterSpacing: '-0.04em', lineHeight: 0.98 }}
        >
          Who <Bracket size="display">maintains</Bracket> this, and how.
        </h1>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[58ch]"
          style={{ marginTop: 'clamp(28px, 4vw, 48px)', fontSize: '20px', lineHeight: 1.5 }}
        >
          If you are deciding whether to cite this document, this page is
          the part you should read first.
        </p>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="mx-auto max-w-[1080px]"
          style={{
            ...PAD,
            paddingTop: 'clamp(40px, 5vw, 72px)',
            paddingBottom: 'clamp(40px, 5vw, 72px)',
            borderTop: '1px solid var(--color-line)',
            scrollMarginTop: '24px',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
          >
            {section.eyebrow}
          </p>
          <h2
            id={`${section.id}-heading`}
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            {section.heading}
          </h2>
          <div
            className="text-[color:var(--color-ink-2)]"
            style={{ marginTop: 24, display: 'grid', gap: 18, fontSize: '16px', lineHeight: 1.6, maxWidth: '64ch' }}
          >
            {section.body.map((para) => (
              <p key={para} style={{ margin: 0 }}>
                {para}
              </p>
            ))}
          </div>
        </section>
      ))}

      <section
        aria-labelledby="company-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 'clamp(40px, 5vw, 72px)', borderTop: '1px solid var(--color-line)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          The company behind it.
        </p>
        <h2
          id="company-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Procurement, security and company detail.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 24, fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
        >
          Registered company information, the security posture, and
          procurement contacts live on the main site at{' '}
          <a
            href="https://flintmere.com/about"
            rel="noopener"
            className="text-[color:var(--color-ink)] underline underline-offset-4"
          >
            flintmere.com/about
          </a>
          . Questions about the standard itself go to{' '}
          <a
            href="mailto:hello@flintmere.com"
            className="text-[color:var(--color-ink)] underline underline-offset-4"
          >
            hello@flintmere.com
          </a>
          .
        </p>
      </section>
    </StandardsShell>
  );
}
