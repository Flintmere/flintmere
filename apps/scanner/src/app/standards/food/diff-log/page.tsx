import type { Metadata } from 'next';
import { Bracket } from '@flintmere/ui';
import { StandardsShell } from '@/components/standards/StandardsShell';
import { PUBLISHED_AT } from '@/lib/standards/food-v1-fields';

/**
 * `/food/diff-log/` — the public regulatory-change ledger.
 *
 * Empty at v1.0 by design: the ledger records regulatory changes observed
 * SINCE publication, so on publication day there is nothing in it. The
 * page ships anyway because the disclaimer on every standards page points
 * here as part of the operating model, and a disclaimer that links to a
 * 404 undermines the thing it is supposed to establish.
 *
 * The empty state says why it is empty rather than showing a blank list —
 * an unexplained empty ledger reads as neglect, which is the opposite of
 * the signal this surface exists to send.
 *
 * Entry rendering, filters, year archives, and per-entry permalinks land
 * with the nightly regulatory-monitor cron (binding IA §Authoring +
 * publication workflow). Nothing appears here without #39 review.
 */
export const dynamic = 'force-static';

const DIFF_LOG_URL = 'https://standards.flintmere.com/food/diff-log/';

export const metadata: Metadata = {
  title: 'Food standard — change log — Flintmere',
  description:
    'Regulatory changes affecting the Flintmere food catalog standard, recorded as they are observed and reviewed. Append-only.',
  alternates: {
    canonical: DIFF_LOG_URL,
    types: { 'application/atom+xml': '/food/diff-log/feed.xml' },
  },
  openGraph: {
    title: 'Food standard — change log — Flintmere',
    description:
      'Regulatory changes affecting the Flintmere food catalog standard.',
    url: DIFF_LOG_URL,
    type: 'website',
  },
};

export default function DiffLog() {
  return (
    <StandardsShell reviewedOn={PUBLISHED_AT}>
      <section
        aria-labelledby="diff-log-heading"
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
          Change log.
        </p>
        <h1
          id="diff-log-heading"
          className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
          style={{ fontSize: 'var(--scale-h1-anchor)', letterSpacing: '-0.04em', lineHeight: 0.98 }}
        >
          What the regulators <Bracket size="display">changed</Bracket>.
        </h1>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[58ch]"
          style={{ marginTop: 'clamp(28px, 4vw, 48px)', fontSize: '20px', lineHeight: 1.5 }}
        >
          Every regulatory change that touches a field in this standard
          gets an entry here, with the date it was flagged, the date it was
          reviewed, and a link to the regulation itself. Entries are
          permanent: once published, an entry keeps its URL even after the
          change is merged into a version.
        </p>

        <div
          style={{
            marginTop: 'clamp(40px, 5vw, 72px)',
            borderTop: '1px solid var(--color-line)',
            paddingTop: 32,
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em', marginBottom: 16 }}
          >
            No entries yet.
          </p>
          <p
            className="text-[color:var(--color-ink-2)]"
            style={{ fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch' }}
          >
            The ledger records changes observed after v1.0 was published on{' '}
            {PUBLISHED_AT}. Nothing has been observed and reviewed since.
            When something is, it appears here first and is folded into a
            numbered version at the next release.
          </p>
          <p
            className="text-[color:var(--color-ink-2)]"
            style={{ fontSize: '16px', lineHeight: 1.6, maxWidth: '62ch', marginTop: 16 }}
          >
            An automated monitor watches the regulator sources cited by
            each field. Nothing it flags reaches this page without review
            by Flintmere Regulatory Affairs, and every published entry
            carries the date of both steps.
          </p>

          <p
            className="font-mono text-[color:var(--color-ink-2)]"
            style={{ marginTop: 28, fontSize: '13px', lineHeight: 1.8 }}
          >
            <a
              href="/food/diff-log/feed.xml"
              className="text-[color:var(--color-ink)] underline underline-offset-4"
            >
              Atom feed
            </a>{' '}
            — subscribe and you will see entries as they publish.
          </p>
        </div>
      </section>
    </StandardsShell>
  );
}
