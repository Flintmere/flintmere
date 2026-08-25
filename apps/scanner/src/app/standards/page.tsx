import type { Metadata } from 'next';
import { Bracket } from '@flintmere/ui';
import { StandardsShell } from '@/components/standards/StandardsShell';
import {
  FOOD_V1_FIELDS,
  FREEZES_AT,
  PUBLISHED_AT,
  STANDARD_STATUS,
} from '@/lib/standards/food-v1-fields';

/**
 * `standards.flintmere.com/` — index of published standards.
 *
 * Replaces the holding page that lived here from 2026-05-03 until food
 * v1.0 published. ADR 0024 supersedes that page's rationale explicitly;
 * the waitlist capture it carried has no purpose now that the thing
 * people were waiting for is one click away.
 *
 * Reached two ways: `standards.flintmere.com/` (middleware rewrites to
 * `/standards`, so the user-facing URL stays the clean root — canonical),
 * and `flintmere.com/standards` (middleware 301s to this host).
 *
 * `force-static` — content surface, no DB and no LLM. A scanner-side
 * runtime failure leaves the authority surface serving from cache.
 */
export const dynamic = 'force-static';

const ROOT_URL = 'https://standards.flintmere.com/';

export const metadata: Metadata = {
  title: 'Flintmere Standards — open standards for catalog readiness',
  description:
    'Published, citable standards for how a catalog should describe itself so shopping channels and AI agents can read it. Food v1.0 is live. Free to read, free to cite.',
  alternates: { canonical: ROOT_URL },
  openGraph: {
    title: 'Flintmere Standards — open standards for catalog readiness',
    description:
      'Published, citable standards for how a catalog should describe itself. Food v1.0 is live.',
    url: ROOT_URL,
    type: 'website',
  },
};

const PAD = {
  paddingLeft: 'clamp(24px, 4vw, 48px)',
  paddingRight: 'clamp(24px, 4vw, 48px)',
} as const;

const PUBLISHED = [
  {
    vertical: 'Food',
    href: '/food/',
    current: '/food/v1.0/',
    status:
      STANDARD_STATUS === 'rc'
        ? `v1.0 release candidate — freezes ${FREEZES_AT}`
        : 'v1.0 — current',
    summary: `${FOOD_V1_FIELDS.length} fields covering identifiers, allergens, ingredients, origin, net content, shelf life and certification. Each cites a primary regulator.`,
  },
] as const;

const FORTHCOMING = [
  { vertical: 'Beauty', note: 'INCI encoding. No published date.' },
  { vertical: 'Apparel', note: 'Materials and care. No published date.' },
] as const;

export default function StandardsIndex() {
  return (
    <StandardsShell reviewedOn={PUBLISHED_AT}>
      <section
        aria-labelledby="standards-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(56px, 7vw, 112px)', paddingBottom: 'clamp(40px, 5vw, 72px)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 'clamp(24px, 3vw, 40px)' }}
        >
          Standards.
        </p>
        <h1
          id="standards-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[18ch]"
          style={{ fontSize: 'var(--scale-h1-anchor)', letterSpacing: '-0.04em', lineHeight: 0.98 }}
        >
          How a catalog should <Bracket size="display">describe</Bracket>{' '}
          itself.
        </h1>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[56ch]"
          style={{ marginTop: 'clamp(28px, 4vw, 48px)', fontSize: '20px', lineHeight: 1.5 }}
        >
          A shopping channel reads a product listing before any person
          does. These documents specify what it needs to find there —
          field by field, each one grounded in the regulation that governs
          it.
        </p>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[56ch]"
          style={{ marginTop: 20, fontSize: '17px', lineHeight: 1.55 }}
        >
          Free to read. Free to cite. Spec text under CC-BY 4.0, machine
          artefacts under CC0.
        </p>
      </section>

      <section
        aria-labelledby="published-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 'clamp(40px, 5vw, 72px)', borderTop: '1px solid var(--color-line)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Published.
        </p>
        <h2
          id="published-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Live now.
        </h2>

        <ul style={{ marginTop: 32, listStyle: 'none', padding: 0, display: 'grid', gap: 0 }}>
          {PUBLISHED.map((entry) => (
            <li
              key={entry.vertical}
              style={{ borderTop: '1px solid var(--color-line)', paddingTop: 24, paddingBottom: 24 }}
            >
              <a
                href={entry.current}
                className="text-[color:var(--color-ink)] no-underline"
                style={{ display: 'block', minHeight: 44 }}
              >
                <span
                  className="font-medium text-[color:var(--color-ink)]"
                  style={{ fontSize: '24px', letterSpacing: '-0.02em' }}
                >
                  {entry.vertical}
                </span>
                <span
                  className="font-mono uppercase text-[color:var(--color-mute)]"
                  style={{ fontSize: '11px', letterSpacing: '0.16em', marginLeft: 16 }}
                >
                  {entry.status}
                </span>
                <span
                  className="text-[color:var(--color-ink-2)]"
                  style={{ display: 'block', marginTop: 12, fontSize: '16px', lineHeight: 1.55, maxWidth: '60ch' }}
                >
                  {entry.summary}
                </span>
              </a>
              <p
                className="font-mono text-[color:var(--color-ink-2)]"
                style={{ marginTop: 14, fontSize: '13px', lineHeight: 1.8 }}
              >
                <a href={entry.href} className="text-[color:var(--color-ink)] underline underline-offset-4">
                  All versions
                </a>
                {'  ·  '}
                <a href="/food/diff-log" className="text-[color:var(--color-ink)] underline underline-offset-4">
                  Change log
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="forthcoming-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 'clamp(40px, 5vw, 72px)', borderTop: '1px solid var(--color-line)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Not yet written.
        </p>
        <h2
          id="forthcoming-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Other verticals.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 24, fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
        >
          Food is the vertical we work in most closely, so it is the one we
          can specify honestly. The others are listed for completeness, not
          as a commitment to a date.
        </p>
        <ul
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 24, listStyle: 'none', padding: 0, display: 'grid', gap: 12, fontSize: '16px', lineHeight: 1.55, maxWidth: '62ch' }}
        >
          {FORTHCOMING.map((entry) => (
            <li key={entry.vertical} style={{ borderLeft: '1px solid var(--color-line)', paddingInlineStart: 16 }}>
              <span className="text-[color:var(--color-ink)]">{entry.vertical}</span> — {entry.note}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="citing-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 'clamp(40px, 5vw, 72px)', borderTop: '1px solid var(--color-line)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Using this work.
        </p>
        <h2
          id="citing-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Quote it, cite it, build on it.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 24, fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
        >
          <a href="/how-to-cite" className="text-[color:var(--color-ink)] underline underline-offset-4">
            How to cite
          </a>{' '}
          carries worked examples in five formats and explains which URL
          form to use.{' '}
          <a href="/about" className="text-[color:var(--color-ink)] underline underline-offset-4">
            About
          </a>{' '}
          covers who reviews this, on what cadence, and what the URL
          stability guarantee actually promises.
        </p>
      </section>
    </StandardsShell>
  );
}
