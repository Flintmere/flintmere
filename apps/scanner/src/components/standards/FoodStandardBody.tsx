import { Bracket } from '@flintmere/ui';
import {
  DEFERRED_FIELDS,
  FOOD_V1_FIELDS,
  FREEZES_AT,
  PUBLISHED_AT,
  STANDARD_STATUS,
  type FieldDescriptor,
} from '@/lib/standards/food-v1-fields';

/**
 * The body of the food catalog standard.
 *
 * Rendered by BOTH `/food/v1.0/` (the immutable citation target) and
 * `/food/v1/` (the rolling alias). One component, so the two URLs can
 * never disagree about what the standard says — which for a document
 * whose entire value is citability would be the worst possible defect.
 *
 * Every field renders from `FOOD_V1_FIELDS`. Nothing about the standard's
 * content is written in JSX: add a field to the schema and it appears
 * here, with its regulator citations, automatically. That is deliberate —
 * the immutability guard hashes the schema file, so the schema has to be
 * the only place the standard's substance lives.
 */

const SECTION_PADDING = {
  paddingLeft: 'clamp(24px, 4vw, 48px)',
  paddingRight: 'clamp(24px, 4vw, 48px)',
} as const;

function FieldSection({ field, index }: { field: FieldDescriptor; index: number }) {
  const anchor = `field-${field.name}`;
  const typeLabel =
    field.cardinality === 'array' ? `${field.primitive}[]` : field.primitive;

  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-heading`}
      style={{
        ...SECTION_PADDING,
        paddingTop: 'clamp(40px, 5vw, 72px)',
        paddingBottom: 'clamp(40px, 5vw, 72px)',
        borderTop: '1px solid var(--color-line)',
        scrollMarginTop: '24px',
      }}
      className="mx-auto max-w-[1080px]"
    >
      <p
        className="font-mono uppercase text-[color:var(--color-mute)]"
        style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 16 }}
      >
        Field {String(index + 1).padStart(2, '0')} — {typeLabel} —{' '}
        {field.required ? 'required' : 'optional'}
      </p>

      <h2
        id={`${anchor}-heading`}
        className="font-medium text-[color:var(--color-ink)]"
        style={{
          fontSize: 'clamp(26px, 3.4vw, 40px)',
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
        }}
      >
        <a
          href={`#${anchor}`}
          className="font-mono text-[color:var(--color-ink)] no-underline"
          style={{ display: 'inline-block', minHeight: 44, paddingTop: 4 }}
          aria-label={`Permanent link to the ${field.name} field`}
        >
          <Bracket size="display">{field.name}</Bracket>
        </a>
      </h2>

      <p
        className="text-[color:var(--color-ink-2)]"
        style={{
          marginTop: 20,
          fontSize: '18px',
          lineHeight: 1.55,
          maxWidth: '62ch',
        }}
      >
        {field.summary}
      </p>

      <dl style={{ marginTop: 'clamp(28px, 3vw, 40px)', display: 'grid', gap: 24 }}>
        <div>
          <dt
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 10 }}
          >
            Source standard
          </dt>
          <dd style={{ margin: 0 }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {field.sources.map((source) => (
                <li
                  key={source.url + source.label}
                  className="text-[color:var(--color-ink-2)]"
                  style={{
                    fontSize: '16px',
                    lineHeight: 1.55,
                    borderLeft: '1px solid var(--color-line)',
                    paddingInlineStart: 16,
                    maxWidth: '62ch',
                  }}
                >
                  <a
                    href={source.url}
                    rel="noopener"
                    className="text-[color:var(--color-ink)] underline underline-offset-4"
                    style={{ display: 'inline-block', paddingTop: 2, paddingBottom: 2 }}
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </dd>
        </div>

        <div>
          <dt
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 10 }}
          >
            What this standard adds
          </dt>
          <dd
            className="text-[color:var(--color-ink-2)]"
            style={{ margin: 0, fontSize: '16px', lineHeight: 1.55, maxWidth: '62ch' }}
          >
            {field.flintmereAdds}
          </dd>
        </div>

        <div>
          <dt
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 10 }}
          >
            Shopify encoding
          </dt>
          <dd style={{ margin: 0 }}>
            <code
              className="font-mono text-[color:var(--color-ink-2)]"
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                display: 'block',
                maxWidth: '62ch',
                wordBreak: 'break-word',
              }}
            >
              {field.shopifyEncoding}
            </code>
          </dd>
        </div>

        {field.enumValues ? (
          <div>
            <dt
              className="font-mono uppercase text-[color:var(--color-mute)]"
              style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 10 }}
            >
              Permitted values ({field.enumValues.length})
            </dt>
            <dd style={{ margin: 0 }}>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {field.enumValues.map((value) => (
                  <li
                    key={value}
                    className="font-mono text-[color:var(--color-ink-2)]"
                    style={{
                      fontSize: '13px',
                      border: '1px solid var(--color-line)',
                      padding: '6px 10px',
                    }}
                  >
                    {value}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

export function FoodStandardBody({ canonicalPath }: { canonicalPath: string }) {
  const isRollingAlias = canonicalPath === '/food/v1/';

  return (
    <>
      <section
        aria-labelledby="standard-heading"
        className="mx-auto max-w-[1080px]"
        style={{
          ...SECTION_PADDING,
          paddingTop: 'clamp(56px, 7vw, 112px)',
          paddingBottom: 'clamp(40px, 5vw, 72px)',
        }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 'clamp(24px, 3vw, 40px)' }}
        >
          Food catalog standard — v1.0
          {STANDARD_STATUS === 'rc' ? ' — release candidate' : ''}
        </p>

        <h1
          id="standard-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
          style={{
            fontSize: 'var(--scale-h1-anchor)',
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
          }}
        >
          How a food catalog should <Bracket size="display">describe</Bracket>{' '}
          itself.
        </h1>

        <p
          className="text-[color:var(--color-ink-2)] max-w-[58ch]"
          style={{ marginTop: 'clamp(28px, 4vw, 48px)', fontSize: '20px', lineHeight: 1.5 }}
        >
          {FOOD_V1_FIELDS.length} fields, each one carrying a primary
          regulator citation and a Shopify encoding rule. Written for the
          shopping channels and AI agents that read a catalog before a
          person ever does.
        </p>

        <p
          className="text-[color:var(--color-ink-2)] max-w-[58ch]"
          style={{ marginTop: 20, fontSize: '17px', lineHeight: 1.55 }}
        >
          Free to read, free to cite. Spec text is CC-BY 4.0; the machine
          artefacts are CC0.
        </p>

        {isRollingAlias ? (
          <p
            className="text-[color:var(--color-ink-2)] max-w-[58ch]"
            style={{
              marginTop: 28,
              fontSize: '15px',
              lineHeight: 1.6,
              borderLeft: '1px solid var(--color-line)',
              paddingInlineStart: 16,
            }}
          >
            This is the rolling alias — it always serves the current v1.x
            release, so what it says will change. When citing, use the
            pinned URL{' '}
            <a
              href="/food/v1.0/"
              className="text-[color:var(--color-ink)] underline underline-offset-4"
            >
              /food/v1.0/
            </a>
            , which never changes.
          </p>
        ) : null}

        <dl
          style={{
            marginTop: 'clamp(32px, 4vw, 56px)',
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            maxWidth: '72ch',
          }}
        >
          {[
            { term: 'Status', value: STANDARD_STATUS === 'rc' ? `Release candidate until ${FREEZES_AT}` : 'Stable' },
            { term: 'Published', value: PUBLISHED_AT },
            { term: 'Fields', value: String(FOOD_V1_FIELDS.length) },
            { term: 'Cadence', value: 'Half-yearly' },
          ].map(({ term, value }) => (
            <div key={term}>
              <dt
                className="font-mono uppercase text-[color:var(--color-mute)]"
                style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 8 }}
              >
                {term}
              </dt>
              <dd
                className="text-[color:var(--color-ink)]"
                style={{ margin: 0, fontSize: '16px', lineHeight: 1.5 }}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <nav
          aria-label="Machine-readable artefacts"
          style={{
            marginTop: 'clamp(28px, 3vw, 40px)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 20px',
          }}
        >
          {[
            { href: '/food/v1.0/spec', label: 'Spec contract' },
            { href: '/food/v1.0/spec.json', label: 'spec.json' },
            { href: '/food/v1.0/spec.schema.json', label: 'spec.schema.json' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[color:var(--color-ink)] underline underline-offset-4"
              style={{
                fontSize: '13px',
                // Standalone links in a row, not inline in prose — WCAG
                // 2.5.8 applies in full, so pad to a 24px minimum box.
                minHeight: 24,
                display: 'inline-flex',
                alignItems: 'center',
                paddingTop: 4,
                paddingBottom: 4,
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </section>

      {FOOD_V1_FIELDS.map((field, i) => (
        <FieldSection key={field.name} field={field} index={i} />
      ))}

      <section
        aria-labelledby="scope-heading"
        className="mx-auto max-w-[1080px]"
        style={{
          ...SECTION_PADDING,
          paddingTop: 'clamp(40px, 5vw, 72px)',
          paddingBottom: 'clamp(40px, 5vw, 72px)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Out of scope, and why.
        </p>
        <h2
          id="scope-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          What v1.0 deliberately does not cover.
        </h2>

        <ul
          className="text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 'clamp(28px, 3vw, 40px)',
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
            'Nutrition panels. A separate encoding problem with its own regulatory surface.',
            'Nutrition and health claims ("low fat", "high fibre"). Claim encoding is governed separately and carries its own approval regime.',
            'Schema.org/Recipe alignment. Adjacent, but a different document type.',
            'Beauty INCI and apparel materials. Other verticals, other cadences.',
          ].map((line) => (
            <li
              key={line}
              style={{ borderLeft: '1px solid var(--color-line)', paddingInlineStart: 16 }}
            >
              {line}
            </li>
          ))}
        </ul>

        {DEFERRED_FIELDS.length > 0 ? (
          <>
            <p
              className="font-mono uppercase text-[color:var(--color-mute)]"
              style={{
                fontSize: '11px',
                letterSpacing: '0.16em',
                marginTop: 'clamp(32px, 4vw, 56px)',
                marginBottom: 16,
              }}
            >
              Held back from this version.
            </p>
            <ul
              style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 16 }}
            >
              {DEFERRED_FIELDS.map((deferred) => (
                <li
                  key={deferred.name}
                  className="text-[color:var(--color-ink-2)]"
                  style={{
                    fontSize: '16px',
                    lineHeight: 1.55,
                    maxWidth: '64ch',
                    borderLeft: '1px solid var(--color-line)',
                    paddingInlineStart: 16,
                  }}
                >
                  <span className="font-mono text-[color:var(--color-ink)]">
                    {deferred.name}
                  </span>{' '}
                  — {deferred.reason} Planned for {deferred.plannedFor}.
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section
        aria-labelledby="related-heading"
        className="mx-auto max-w-[1080px]"
        style={{
          ...SECTION_PADDING,
          paddingTop: 'clamp(40px, 5vw, 72px)',
          paddingBottom: 'clamp(40px, 5vw, 72px)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 20 }}
        >
          Related work.
        </p>
        <h2
          id="related-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
          style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
        >
          Where this sits next to what already exists.
        </h2>
        <div
          className="text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 'clamp(28px, 3vw, 40px)',
            display: 'grid',
            gap: 18,
            fontSize: '16px',
            lineHeight: 1.6,
            maxWidth: '64ch',
          }}
        >
          <p style={{ margin: 0 }}>
            <a
              href="https://world.openfoodfacts.org/"
              rel="noopener"
              className="text-[color:var(--color-ink)] underline underline-offset-4"
            >
              Open Food Facts
            </a>{' '}
            is a public dataset of food products. This is an encoding
            standard for Shopify catalogs. The two are complementary: a
            dataset records what products exist; this document says how a
            merchant should structure their own catalog so a channel can
            read it.
          </p>
          <p style={{ margin: 0 }}>
            <a
              href="https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications"
              rel="noopener"
              className="text-[color:var(--color-ink)] underline underline-offset-4"
            >
              GS1
            </a>{' '}
            governs identifiers. This standard cites GS1 for the identifier
            and adds the Shopify encoding path around it.
          </p>
          <p style={{ margin: 0 }}>
            <a
              href="https://schema.org/Product"
              rel="noopener"
              className="text-[color:var(--color-ink)] underline underline-offset-4"
            >
              Schema.org Product
            </a>{' '}
            has no first-class allergen field. The JSON-LD artefact extends
            it with a vocabulary for the fields above.
          </p>
        </div>
      </section>
    </>
  );
}
