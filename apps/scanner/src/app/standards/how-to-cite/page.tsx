import type { Metadata } from 'next';
import { Bracket } from '@flintmere/ui';
import { StandardsShell } from '@/components/standards/StandardsShell';
import { allCitationFormats } from '@/lib/standards/citation-formats';
import { CANONICAL_URL, PUBLISHED_AT } from '@/lib/standards/food-v1-fields';

/**
 * `/how-to-cite` — citation fitness.
 *
 * The binding IA calls this "the single 'conversion' surface" of the
 * standards host, and specifies the copy register: scholarly. The five
 * worked examples render from `citation-formats.ts`, the same module the
 * per-page "Cite this page" affordance uses, so the documented formats
 * and the generated ones cannot drift.
 */
export const dynamic = 'force-static';

const PAGE_URL = 'https://standards.flintmere.com/how-to-cite';

export const metadata: Metadata = {
  title: 'How to cite the Flintmere standards',
  description:
    'Citation formats for the Flintmere food catalog standard — APA, Chicago, IEEE, MLA, BibTeX — plus which URL form to cite and why.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'How to cite the Flintmere standards',
    description:
      'APA, Chicago, IEEE, MLA and BibTeX forms for citing the Flintmere food catalog standard.',
    url: PAGE_URL,
    type: 'article',
  },
};

const PAD = {
  paddingLeft: 'clamp(24px, 4vw, 48px)',
  paddingRight: 'clamp(24px, 4vw, 48px)',
} as const;

const EXAMPLES = allCitationFormats({
  title: 'Food catalog standard, version 1.0',
  url: CANONICAL_URL,
  publishedAt: PUBLISHED_AT,
  bibtexKey: 'flintmere2026foodv10',
});

export default function HowToCite() {
  return (
    <StandardsShell reviewedOn={PUBLISHED_AT}>
      <section
        aria-labelledby="cite-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(56px, 7vw, 112px)', paddingBottom: 'clamp(40px, 5vw, 72px)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 'clamp(24px, 3vw, 40px)' }}
        >
          For research, regulatory and trade-press use.
        </p>
        <h1
          id="cite-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
          style={{ fontSize: 'var(--scale-h1-anchor)', letterSpacing: '-0.04em', lineHeight: 0.98 }}
        >
          How to <Bracket size="display">cite</Bracket> the Flintmere
          standards.
        </h1>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[58ch]"
          style={{ marginTop: 'clamp(28px, 4vw, 48px)', fontSize: '20px', lineHeight: 1.5 }}
        >
          Everything published here is free to cite, quote and reproduce
          under CC-BY 4.0. No permission needed and no notification asked
          for.
        </p>
      </section>

      <section
        aria-labelledby="what-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 'clamp(40px, 5vw, 72px)', borderTop: '1px solid var(--color-line)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          What to cite.
        </p>
        <h2
          id="what-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Cite the pinned URL, not the rolling one.
        </h2>
        <ul
          className="text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 28,
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gap: 14,
            fontSize: '16px',
            lineHeight: 1.6,
            maxWidth: '64ch',
          }}
        >
          {[
            'Use the pinned form — /food/v1.0/ — which is immutable. The rolling alias /food/v1/ tracks whatever the current release happens to be, so a citation pointing at it will drift out from under you.',
            'Give the publication date of the version you read, not the date you read it.',
            'When quoting a specific field, cite its section anchor — for example /food/v1.0/#field-allergen.',
            'If you quote the document, quote its scope statement too. It bounds what the document claims.',
          ].map((line) => (
            <li key={line} style={{ borderLeft: '1px solid var(--color-line)', paddingInlineStart: 16 }}>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="formats-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 'clamp(40px, 5vw, 72px)', borderTop: '1px solid var(--color-line)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Format examples.
        </p>
        <h2
          id="formats-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Food catalog standard, v1.0.
        </h2>

        <dl style={{ marginTop: 32, display: 'grid', gap: 24, maxWidth: '78ch' }}>
          {EXAMPLES.map(({ style, label, text }) => (
            <div key={style}>
              <dt
                className="font-mono uppercase text-[color:var(--color-mute)]"
                style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 10 }}
              >
                {label}
              </dt>
              <dd style={{ margin: 0 }}>
                <pre
                  className="font-mono text-[color:var(--color-ink-2)]"
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    borderLeft: '1px solid var(--color-line)',
                    paddingInlineStart: 16,
                    paddingTop: 10,
                    paddingBottom: 10,
                  }}
                >
                  {text}
                </pre>
              </dd>
            </div>
          ))}
        </dl>

        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 32, fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
        >
          Change-log entries cite the same way, with the entry permalink as
          the URL and the entry’s own publication date. Every page on this
          site carries a “Cite this page” control that fills these five
          forms in for whatever you are reading.
        </p>
      </section>

      <section
        aria-labelledby="doi-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 'clamp(40px, 5vw, 72px)', borderTop: '1px solid var(--color-line)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          DOI status.
        </p>
        <h2
          id="doi-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          There isn’t one yet.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 24, fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
        >
          DOI assignment is deferred — we are not currently a CrossRef or
          DataCite member. URL stability is guaranteed instead by the
          version contract described at{' '}
          <a href="/about" className="text-[color:var(--color-ink)] underline underline-offset-4">
            /about
          </a>
          : pinned URLs never change meaning and stay live indefinitely.
          We will register DOIs when citation volume justifies the
          commitment.
        </p>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 20, fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
        >
          Questions about citing this work, or a correction to report?{' '}
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
