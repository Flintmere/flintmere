import type { Metadata } from 'next';
import { Bracket } from '@flintmere/ui';
import { StandardsShell } from '@/components/standards/StandardsShell';
import {
  FOOD_V1_FIELDS,
  PUBLISHED_AT,
  STANDARD_VERSION,
} from '@/lib/standards/food-v1-fields';
import { SCHEMA_DIALECT } from '@/lib/standards/food-v1-jsonschema';
import { VOCAB_URL } from '@/lib/standards/food-v1-jsonld';

/**
 * `/food/v1.0/spec` — human-readable companion to the two machine files.
 *
 * Per the binding IA §Routes table: explains the JSON shape, gives a curl
 * example, documents the stability contract, and lists field types and
 * cardinalities. A developer lands here from the JSON, or from developer
 * documentation backlinks, wanting to know what they are looking at.
 */
export const dynamic = 'force-static';

const SPEC_URL = 'https://standards.flintmere.com/food/v1.0/spec';

export const metadata: Metadata = {
  title: 'Spec contract, food v1.0 — Flintmere',
  description:
    'The JSON-LD and JSON Schema artefacts for the Flintmere food catalog standard v1.0: shape, field types, stability contract, and how to fetch them.',
  alternates: { canonical: SPEC_URL },
  openGraph: {
    title: 'Spec contract, food v1.0 — Flintmere',
    description:
      'JSON-LD and JSON Schema artefacts for the food catalog standard v1.0.',
    url: SPEC_URL,
    type: 'article',
  },
};

const PAD = {
  paddingLeft: 'clamp(24px, 4vw, 48px)',
  paddingRight: 'clamp(24px, 4vw, 48px)',
} as const;

const CURL_EXAMPLE = `curl -H 'Accept: application/ld+json' \\
  https://standards.flintmere.com/food/v1.0/spec.json`;

export default function SpecContract() {
  return (
    <StandardsShell
      reviewedOn={PUBLISHED_AT}
      citable={{
        title: 'Spec contract, food catalog standard version 1.0',
        url: SPEC_URL,
        publishedAt: PUBLISHED_AT,
        bibtexKey: 'flintmere2026foodv10spec',
      }}
    >
      <section
        aria-labelledby="spec-heading"
        className="mx-auto max-w-[1080px]"
        style={{ ...PAD, paddingTop: 'clamp(56px, 7vw, 112px)', paddingBottom: 'clamp(40px, 5vw, 72px)' }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 'clamp(24px, 3vw, 40px)' }}
        >
          Spec contract — food v{STANDARD_VERSION}
        </p>
        <h1
          id="spec-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
          style={{ fontSize: 'var(--scale-h1-anchor)', letterSpacing: '-0.04em', lineHeight: 0.98 }}
        >
          Two files, one <Bracket size="display">schema</Bracket>.
        </h1>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[58ch]"
          style={{ marginTop: 'clamp(28px, 4vw, 48px)', fontSize: '20px', lineHeight: 1.5 }}
        >
          Both artefacts render from a single schema definition, so they
          cannot disagree. One is for citation and linked-data tooling; the
          other is for validators.
        </p>

        <div
          style={{
            marginTop: 'clamp(36px, 4vw, 64px)',
            display: 'grid',
            gap: 28,
            maxWidth: '70ch',
          }}
        >
          {[
            {
              file: 'spec.json',
              href: '/food/v1.0/spec.json',
              mime: 'application/ld+json',
              what: 'JSON-LD. The citation-grade artefact. Extends schema.org with a vocabulary for the fields this standard adds.',
              extra: `Vocabulary: ${VOCAB_URL}`,
            },
            {
              file: 'spec.schema.json',
              href: '/food/v1.0/spec.schema.json',
              mime: 'application/schema+json',
              what: 'JSON Schema. What tooling validates a product record against.',
              extra: `Dialect: ${SCHEMA_DIALECT}`,
            },
          ].map((artefact) => (
            <div
              key={artefact.file}
              style={{ borderLeft: '1px solid var(--color-line)', paddingInlineStart: 20 }}
            >
              <a
                href={artefact.href}
                className="font-mono text-[color:var(--color-ink)] underline underline-offset-4"
                style={{ fontSize: '18px', display: 'inline-block', minHeight: 44, paddingTop: 8 }}
              >
                {artefact.file}
              </a>
              <p
                className="font-mono uppercase text-[color:var(--color-mute)]"
                style={{ fontSize: '11px', letterSpacing: '0.16em', marginTop: 4 }}
              >
                {artefact.mime}
              </p>
              <p
                className="text-[color:var(--color-ink-2)]"
                style={{ marginTop: 12, fontSize: '16px', lineHeight: 1.55 }}
              >
                {artefact.what}
              </p>
              <p
                className="font-mono text-[color:var(--color-mute)]"
                style={{ marginTop: 10, fontSize: '12px', lineHeight: 1.6, wordBreak: 'break-all' }}
              >
                {artefact.extra}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="fetch-heading"
        className="mx-auto max-w-[1080px]"
        style={{
          ...PAD,
          paddingTop: 'clamp(40px, 5vw, 72px)',
          paddingBottom: 'clamp(40px, 5vw, 72px)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Fetching it.
        </p>
        <h2
          id="fetch-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          No key, no rate limit, no attribution required.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 24, fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
        >
          Both files are CC0 and served with a permissive CORS header, so
          they can be fetched from a browser as well as a server.
        </p>
        <pre
          className="font-mono text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 24,
            fontSize: '13px',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderLeft: '1px solid var(--color-line)',
            paddingInlineStart: 16,
            paddingTop: 12,
            paddingBottom: 12,
            maxWidth: '70ch',
            overflowX: 'auto',
          }}
        >
          {CURL_EXAMPLE}
        </pre>
      </section>

      <section
        aria-labelledby="fields-heading"
        className="mx-auto max-w-[1080px]"
        style={{
          ...PAD,
          paddingTop: 'clamp(40px, 5vw, 72px)',
          paddingBottom: 'clamp(40px, 5vw, 72px)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Field types.
        </p>
        <h2
          id="fields-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Shape and cardinality.
        </h2>

        <div style={{ marginTop: 32, overflowX: 'auto' }}>
          <table
            style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}
          >
            <thead>
              <tr>
                {['Field', 'Type', 'Required'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="font-mono uppercase text-[color:var(--color-mute)]"
                    style={{
                      fontSize: '11px',
                      letterSpacing: '0.16em',
                      textAlign: 'left',
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--color-line)',
                      fontWeight: 400,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FOOD_V1_FIELDS.map((field) => (
                <tr key={field.name}>
                  <td
                    className="font-mono text-[color:var(--color-ink)]"
                    style={{ fontSize: '14px', padding: '14px 16px 14px 0', borderBottom: '1px solid var(--color-line)' }}
                  >
                    <a
                      href={`/food/v1.0/#field-${field.name}`}
                      className="text-[color:var(--color-ink)] underline underline-offset-4"
                    >
                      {field.name}
                    </a>
                  </td>
                  <td
                    className="font-mono text-[color:var(--color-ink-2)]"
                    style={{ fontSize: '14px', padding: '14px 16px 14px 0', borderBottom: '1px solid var(--color-line)' }}
                  >
                    {field.cardinality === 'array'
                      ? `${field.primitive}[]`
                      : field.primitive}
                  </td>
                  <td
                    className="font-mono text-[color:var(--color-ink-2)]"
                    style={{ fontSize: '14px', padding: '14px 0', borderBottom: '1px solid var(--color-line)' }}
                  >
                    {field.required ? 'yes' : 'no'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-labelledby="stability-heading"
        className="mx-auto max-w-[1080px]"
        style={{
          ...PAD,
          paddingTop: 'clamp(40px, 5vw, 72px)',
          paddingBottom: 'clamp(40px, 5vw, 72px)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Stability contract.
        </p>
        <h2
          id="stability-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          What can change under a URL, and what cannot.
        </h2>
        <ul
          className="text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 32,
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gap: 14,
            fontSize: '16px',
            lineHeight: 1.55,
            maxWidth: '64ch',
          }}
        >
          {[
            'A pinned URL (/food/v1.0/) never changes meaning. Its artefacts are byte-stable except where a patch release explicitly says otherwise.',
            'A patch (v1.0.1) fixes a typo or a citation URL without changing meaning, and publishes at its own URL.',
            'A minor (v1.1) adds an optional field. Records valid against v1.0 stay valid.',
            'A major (v2) redefines something. Old pinned URLs stay live indefinitely.',
            'The rolling alias /food/v1/ tracks the current v1.x and will change. Do not cite it.',
          ].map((line) => (
            <li key={line} style={{ borderLeft: '1px solid var(--color-line)', paddingInlineStart: 16 }}>
              {line}
            </li>
          ))}
        </ul>
      </section>
    </StandardsShell>
  );
}
