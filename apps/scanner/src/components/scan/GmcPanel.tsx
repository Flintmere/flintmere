/**
 * Public-safe GMC ground-truth panel for /score/[shop].
 *
 * Surfaces:
 *   - Approved / disapproved / pending counts.
 *   - Top three issue codes with Google's verbatim description.
 *   - "Last scanned" timestamp + truncation flag.
 *
 * What it does NOT surface (per #24 Data Protection):
 *   - Sample product titles. The public score page is opted in by the
 *     merchant for publishing their score, NOT for publishing their
 *     failing SKU list. Sample product titles are email-only.
 */

import { Bracket } from '@flintmere/ui';
import { TrackOnMount } from '@/components/TrackOnMount';
import {
  GMC_PANEL_EYEBROW,
  GMC_PANEL_HEADING,
  GMC_PUBLIC_FOOTNOTE,
  GMC_TOP_ISSUES_LABEL,
  formatFetchedAt,
  publicSafeIssue,
  truncatedNote,
} from '@/lib/gmc-copy';
import type { GmcGroundTruth } from '@/lib/gmc/types';

export interface GmcPanelProps {
  gmcGroundTruth: GmcGroundTruth;
  /**
   * Where this panel is rendering — distinguishes the public score page from
   * the merchant's private scan results in the funnel (ADR 0023 §measurement,
   * spec 2026-06-07). Defaults to 'public' so the existing /score/[shop]
   * call-site is unchanged.
   */
  surface?: 'public' | 'private';
}

export function GmcPanel({ gmcGroundTruth, surface = 'public' }: GmcPanelProps) {
  const { destinationCounts, topIssues, fetchedAt } = gmcGroundTruth;
  const total =
    destinationCounts.approved +
    destinationCounts.disapproved +
    destinationCounts.pending;
  const truncated = truncatedNote(gmcGroundTruth);
  const issues = topIssues.slice(0, 3).map(publicSafeIssue);

  return (
    <section
      aria-label="Google Merchant Center ground truth"
      className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
    >
      {/* Funnel step 4 (ADR 0023 §measurement, spec 2026-06-07): the payoff —
          real ground truth painted. Renders nothing, no layout change. */}
      <TrackOnMount event="ground_truth_rendered" props={{ surface }} />
      <div className="mx-auto max-w-[1280px] px-8 py-20 md:py-24">
        <p className="eyebrow mb-6 text-[color:var(--color-ink-2)]">
          {GMC_PANEL_EYEBROW}
        </p>
        <h2 className="max-w-[24ch] mb-12">
          <Bracket>{GMC_PANEL_HEADING}</Bracket>
        </h2>

        <div className="grid md:grid-cols-3 gap-10 md:gap-16">
          <Stat
            label="Disapproved"
            value={destinationCounts.disapproved}
            total={total}
            accent
          />
          <Stat
            label="Approved"
            value={destinationCounts.approved}
            total={total}
          />
          <Stat
            label="Pending"
            value={destinationCounts.pending}
            total={total}
          />
        </div>

        {issues.length > 0 ? (
          <div className="mt-16">
            <p className="eyebrow mb-6 text-[color:var(--color-ink-2)]">
              {GMC_TOP_ISSUES_LABEL}
            </p>
            <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
              {issues.map((issue) => (
                <li
                  key={issue.code}
                  className="grid grid-cols-[1fr_120px] gap-6 py-7 items-baseline max-md:grid-cols-1 max-md:gap-2"
                >
                  <div>
                    <p
                      style={{
                        fontSize: 18,
                        lineHeight: 1.45,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {issue.description}
                    </p>
                    <p
                      className="mt-2"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        color: 'var(--color-mute)',
                        textTransform: 'uppercase',
                      }}
                    >
                      code: {issue.code} · {issue.severity}
                    </p>
                  </div>
                  <span
                    className="eyebrow text-right max-md:text-left"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                    }}
                  >
                    {issue.productCount.toLocaleString()} products
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <p
          className="mt-10 text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.55, maxWidth: '72ch' }}
        >
          {GMC_PUBLIC_FOOTNOTE} Scanned {formatFetchedAt(fetchedAt)}.
          {truncated ? ` ${truncated}` : ''}
        </p>
      </div>
    </section>
  );
}

interface StatProps {
  label: string;
  value: number;
  total: number;
  accent?: boolean;
}

function Stat({ label, value, total, accent }: StatProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <p
        style={{
          fontSize: 'clamp(48px, 7vw, 96px)',
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 0.95,
          color: 'var(--color-ink)',
        }}
      >
        {value.toLocaleString()}
        {accent ? (
          <span
            aria-hidden="true"
            className="inline-block align-baseline ml-2"
            style={{
              width: '0.22em',
              height: '2px',
              background: 'var(--color-accent)',
              transform: 'translateY(-0.22em)',
            }}
          />
        ) : null}
      </p>
      <p
        className="eyebrow mt-3 text-[color:var(--color-mute)]"
        style={{ fontSize: 12 }}
      >
        {label} · {pct}%
      </p>
    </div>
  );
}
