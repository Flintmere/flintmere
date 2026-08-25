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
 * `/food/` — vertical index.
 *
 * Lists every published version with its date and status, per the binding
 * IA §Routes table. One version today; the page exists now so the URL is
 * stable before there are two, because adding an index later would mean
 * changing links that external parties may already have saved.
 */
export const dynamic = 'force-static';

const INDEX_URL = 'https://standards.flintmere.com/food/';

export const metadata: Metadata = {
  title: 'Food catalog standard — versions — Flintmere',
  description:
    'Every published version of the Flintmere food catalog standard, with publication dates and status.',
  alternates: { canonical: INDEX_URL },
  openGraph: {
    title: 'Food catalog standard — versions — Flintmere',
    description:
      'Every published version of the Flintmere food catalog standard.',
    url: INDEX_URL,
    type: 'website',
  },
};

const VERSIONS = [
  {
    version: '1.0',
    href: '/food/v1.0/',
    published: PUBLISHED_AT,
    status:
      STANDARD_STATUS === 'rc'
        ? `Release candidate — freezes ${FREEZES_AT}`
        : 'Current',
    summary: `${FOOD_V1_FIELDS.length} fields. First published version.`,
  },
] as const;

export default function FoodVerticalIndex() {
  return (
    <StandardsShell reviewedOn={PUBLISHED_AT}>
      <section
        aria-labelledby="food-index-heading"
        className="mx-auto max-w-[1080px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 48px)',
          paddingRight: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(56px, 7vw, 112px)',
          paddingBottom: 'clamp(48px, 6vw, 96px)',
        }}
      >
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 'clamp(24px, 3vw, 40px)' }}
        >
          Food.
        </p>
        <h1
          id="food-index-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
          style={{ fontSize: 'var(--scale-h1-anchor)', letterSpacing: '-0.04em', lineHeight: 0.98 }}
        >
          Every published <Bracket size="display">version</Bracket>.
        </h1>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[56ch]"
          style={{ marginTop: 'clamp(28px, 4vw, 48px)', fontSize: '20px', lineHeight: 1.5 }}
        >
          Pinned versions never change once published. Corrections publish
          as a new version at a new URL, so a citation made today resolves
          to the same document in five years.
        </p>

        <ul
          style={{
            marginTop: 'clamp(36px, 4vw, 64px)',
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gap: 0,
          }}
        >
          {VERSIONS.map((v) => (
            <li
              key={v.version}
              style={{
                borderTop: '1px solid var(--color-line)',
                paddingTop: 24,
                paddingBottom: 24,
              }}
            >
              <a
                href={v.href}
                className="text-[color:var(--color-ink)] no-underline"
                style={{ display: 'block', minHeight: 44 }}
              >
                <span
                  className="font-mono text-[color:var(--color-ink)]"
                  style={{ fontSize: '22px', letterSpacing: '-0.01em' }}
                >
                  v{v.version}
                </span>
                <span
                  className="font-mono uppercase text-[color:var(--color-mute)]"
                  style={{ fontSize: '11px', letterSpacing: '0.16em', marginLeft: 16 }}
                >
                  {v.status}
                </span>
                <span
                  className="text-[color:var(--color-ink-2)]"
                  style={{ display: 'block', marginTop: 10, fontSize: '16px', lineHeight: 1.55 }}
                >
                  {v.summary} Published {v.published}.
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p
          className="font-mono text-[color:var(--color-ink-2)]"
          style={{
            marginTop: 'clamp(32px, 4vw, 56px)',
            fontSize: '13px',
            lineHeight: 1.8,
            borderTop: '1px solid var(--color-line)',
            paddingTop: 24,
          }}
        >
          <a href="/food/v1/" className="text-[color:var(--color-ink)] underline underline-offset-4">
            /food/v1/
          </a>{' '}
          is the rolling alias — always the current v1.x. Useful for
          linking, not for citing.
          <br />
          <a href="/food/diff-log" className="text-[color:var(--color-ink)] underline underline-offset-4">
            /food/diff-log
          </a>{' '}
          tracks regulatory changes observed between versions.
        </p>
      </section>
    </StandardsShell>
  );
}
